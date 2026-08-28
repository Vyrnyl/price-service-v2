import { priceRecordRepository } from './price-record.repository';
import type { ListPriceRecordsQuery, UpdatePriceRecordInput } from './price-record.schema';
import type { AuthUser } from '../../shared/types/express';
import type { CreatePriceRecordWithUserInput } from './price-record.types';

export const priceRecordService = {
  createPriceRecord: (data: CreatePriceRecordWithUserInput) => priceRecordRepository.create(data),
  getPriceRecords: (authUser: AuthUser | undefined, query: ListPriceRecordsQuery) =>
    priceRecordRepository.findAll(authUser, query),
  getPriceRecordById: (id: string) => priceRecordRepository.findById(id),
  updatePriceRecord: (id: string, data: UpdatePriceRecordInput) => priceRecordRepository.update(id, data),
  deletePriceRecord: (id: string) => priceRecordRepository.delete(id),
};
