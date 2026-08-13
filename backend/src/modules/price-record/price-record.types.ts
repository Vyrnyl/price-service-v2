import type { CreatePriceRecordInput } from './price-record.schema';

export type CreatePriceRecordWithUserInput = CreatePriceRecordInput & {
  userId: string;
};
