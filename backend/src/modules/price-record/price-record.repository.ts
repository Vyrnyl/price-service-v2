import { prisma } from '../../prisma';
import AppError from '../../shared/utils/AppError';
import type { Prisma } from '@prisma/client';
import type { ListPriceRecordsQuery, UpdatePriceRecordInput } from './price-record.schema';
import type { AuthUser } from '../../shared/types/express';
import { resolvePriceRecordScope } from './price-record.scope';
import { toSkipTake } from '../../shared/schema/pagination.schema';
import type { CreatePriceRecordWithUserInput } from './price-record.types';

type PriceStatus = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';

/**
 * 2026-11-14 client revision: a price can only be recorded for a commodity
 * that has an SRP in force on the record's (start) date. `false` restores the
 * old rule — such a record saves as COMPLIANT. The frontend's
 * PRICE_RECORD_REQUIRE_SRP_ENABLED (price-record-form.config.ts) is the
 * matching UI flag; roll back both together.
 */
export const REQUIRE_SRP_FOR_PRICE_RECORDS = false; // rolled back 2026-11-14 at the user's request

/**
 * Status of a price against the SRP in force (`srpPrice`, null when none).
 * With `requireSrp`, a missing SRP is refused instead of saved as COMPLIANT.
 */
export function resolvePriceStatus(
  price: number,
  srpPrice: number | null,
  dateAndTime: Date,
  requireSrp: boolean,
): PriceStatus {
  if (srpPrice === null) {
    if (requireSrp) {
      const day = dateAndTime.toLocaleDateString('en-US', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      throw new AppError(
        `No SRP in force on ${day} yet. Add the SRP on Commodities first.`,
        400,
      );
    }
    return 'COMPLIANT';
  }
  if (price > srpPrice) return 'OVERPRICE';
  if (price < srpPrice) return 'UNDERPRICE';
  return 'COMPLIANT';
}

async function calculatePriceStatus(
  commodityId: string,
  price: number,
  dateAndTime: Date,
  requireSrp: boolean,
): Promise<PriceStatus> {
  // The SRP in force on that date: the most recent one already effective.
  const srp = await prisma.sRP.findFirst({
    where: {
      commodityId,
      effectiveDate: { lte: dateAndTime },
    },
    orderBy: { effectiveDate: 'desc' },
  });

  return resolvePriceStatus(
    price,
    srp ? parseFloat(srp.price.toString()) : null,
    dateAndTime,
    requireSrp,
  );
}

export const priceRecordRepository = {
  create: async (data: CreatePriceRecordWithUserInput) => {
    const { commodityId, storeId, userId, status, price, dateAndTime, ...rest } = data;

    // Always look up the SRP so the "SRP required" rule can't be skipped by
    // sending a status; a sent status still wins, as before.
    const computedStatus = await calculatePriceStatus(
      commodityId,
      price,
      dateAndTime,
      REQUIRE_SRP_FOR_PRICE_RECORDS,
    );
    const finalStatus = status ?? computedStatus;

    return prisma.priceRecord.create({
      data: {
        ...rest,
        status: finalStatus,
        price,
        dateAndTime,
        commodity: { connect: { id: commodityId } },
        store: { connect: { id: storeId } },
        user: { connect: { id: userId } },
      } as Prisma.PriceRecordCreateInput,
      include: { commodity: true, store: true, user: true },
    });
  },

  findAll: async (authUser: AuthUser | undefined, query: ListPriceRecordsQuery) => {
    const scope = resolvePriceRecordScope(authUser);
    const { page, pageSize, search, storeId, commodityId, categoryId, status } = query;
    const { skip, take } = toSkipTake({ page, pageSize });

    const where: Prisma.PriceRecordWhereInput = {
      ...scope,
      ...(storeId ? { storeId } : {}),
      ...(commodityId ? { commodityId } : {}),
      ...(categoryId ? { commodity: { categoryId } } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { store: { name: { contains: search, mode: 'insensitive' } } },
              { commodity: { name: { contains: search, mode: 'insensitive' } } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    // Independent reads, not a $transaction — see commodity.repository.ts findAll.
    const [data, total] = await Promise.all([
      prisma.priceRecord.findMany({
        where,
        include: { commodity: true, store: true, user: true },
        orderBy: { dateAndTime: 'desc' },
        skip,
        take,
      }),
      prisma.priceRecord.count({ where }),
    ]);

    return { data, total, page, pageSize };
  },

  findById: (id: string) =>
    prisma.priceRecord.findUnique({
      where: { id },
      include: { commodity: true, store: true, user: true },
    }),

  update: async (id: string, data: UpdatePriceRecordInput) => {
    const { commodityId, storeId, status, price, dateAndTime, ...rest } = data;

    // Get the current record to use existing values if not updating them
    const currentRecord = await prisma.priceRecord.findUnique({ where: { id } });
    
    if (!currentRecord) {
      throw new Error('Price record not found');
    }

    // Determine the final price and dateAndTime for status calculation
    const finalPrice = price !== undefined ? price : currentRecord.price.toNumber();
    const finalDateAndTime = dateAndTime !== undefined ? dateAndTime : currentRecord.dateAndTime;
    const finalCommodityId = commodityId || currentRecord.commodityId;

    // The schema compares the range ends only when both are sent; when one
    // side is omitted, compare against what is stored.
    const finalPeriodEnd = rest.periodEnd !== undefined ? rest.periodEnd : currentRecord.periodEnd;
    if (finalPeriodEnd && finalPeriodEnd.getTime() < finalDateAndTime.getTime()) {
      throw new AppError("End date can't be before the start date", 400);
    }

    // The SRP rule applies when an edit moves the record to another commodity
    // or start date. A price-only edit of an older record that never had an SRP
    // (e.g. the 2025 import) stays allowed and keeps saving as COMPLIANT.
    const commodityChanged = Boolean(commodityId) && commodityId !== currentRecord.commodityId;
    const dateChanged =
      dateAndTime !== undefined && dateAndTime.getTime() !== currentRecord.dateAndTime.getTime();
    const requireSrp = REQUIRE_SRP_FOR_PRICE_RECORDS && (commodityChanged || dateChanged);

    // Recalculate status when price, date or commodity changes, unless one was sent.
    let finalStatus = status;
    if (requireSrp || (finalStatus === undefined && (price !== undefined || dateChanged || commodityChanged))) {
      const computedStatus = await calculatePriceStatus(
        finalCommodityId,
        finalPrice,
        finalDateAndTime,
        requireSrp,
      );
      finalStatus = finalStatus ?? computedStatus;
    }

    const updateData: Prisma.PriceRecordUpdateInput = {
      ...rest,
      ...(commodityId ? { commodity: { connect: { id: commodityId } } } : {}),
      ...(storeId ? { store: { connect: { id: storeId } } } : {}),
      ...(price !== undefined ? { price } : {}),
      ...(dateAndTime !== undefined ? { dateAndTime } : {}),
      ...(finalStatus !== undefined ? { status: finalStatus } : {}),
    };

    return prisma.priceRecord.update({
      where: { id },
      data: updateData,
      include: { commodity: true, store: true, user: true },
    });
  },

  delete: (id: string) =>
    prisma.priceRecord.delete({ where: { id } }),
};
