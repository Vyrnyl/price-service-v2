export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
