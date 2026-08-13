import { priceRecordRepository } from './price-record.repository';
import type { CreatePriceRecordInput, UpdatePriceRecordInput } from './price-record.schema';
import type { AuthUser } from '../../shared/types/express';

export type CreatePriceRecordWithUserInput = CreatePriceRecordInput & {
  userId: string;
};

export const priceRecordService = {
  createPriceRecord: (data: CreatePriceRecordWithUserInput) => priceRecordRepository.create(data),
  getPriceRecords: (authUser?: AuthUser) => priceRecordRepository.findAll(authUser),
  getPriceRecordById: (id: string) => priceRecordRepository.findById(id),
  updatePriceRecord: (id: string, data: UpdatePriceRecordInput) => priceRecordRepository.update(id, data),
  deletePriceRecord: (id: string) => priceRecordRepository.delete(id),
};
