import { prisma } from '../../prisma';
import type { Prisma } from '@prisma/client';
import type { UpdatePriceRecordInput } from './price-record.schema';
import type { AuthUser } from '../../shared/types/express';
import { resolvePriceRecordScope } from './price-record.scope';
import type { CreatePriceRecordWithUserInput } from './price-record.types';

type PriceStatus = 'COMPLIANT' | 'OVERPRICE' | 'UNDERPRICE';

async function calculatePriceStatus(
  commodityId: string,
  price: number,
  dateAndTime: Date,
): Promise<PriceStatus> {
  // Fetch the most recent effective SRP for the commodity
  const srp = await prisma.sRP.findFirst({
    where: {
      commodityId,
      effectiveDate: { lte: dateAndTime },
    },
    orderBy: { effectiveDate: 'desc' },
  });

  // If no SRP is found, default to COMPLIANT
  if (!srp) {
    return 'COMPLIANT';
  }

  const srpPrice = parseFloat(srp.price.toString());

  if (price > srpPrice) {
    return 'OVERPRICE';
  } else if (price < srpPrice) {
    return 'UNDERPRICE';
  } else {
    return 'COMPLIANT';
  }
}

export const priceRecordRepository = {
  create: async (data: CreatePriceRecordWithUserInput) => {
    const { commodityId, storeId, userId, status, price, dateAndTime, ...rest } = data;

    // Calculate status if not provided
    const finalStatus = status ?? (await calculatePriceStatus(commodityId, price, dateAndTime));

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

  findAll: (authUser?: AuthUser) => {
    const scope = resolvePriceRecordScope(authUser);

    return prisma.priceRecord.findMany({
      where: scope,
      include: { commodity: true, store: true, user: true },
    });
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

    // Calculate status if not explicitly provided and price or dateAndTime is being updated
    let finalStatus = status;
    if (finalStatus === undefined && (price !== undefined || dateAndTime !== undefined)) {
      finalStatus = await calculatePriceStatus(finalCommodityId, finalPrice, finalDateAndTime);
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
