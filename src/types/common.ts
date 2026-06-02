export enum SimStatus {
  NEW = 1,
  ACTIVE = 2,
  CONFIRMED = 3,
  CANCELLED = 4,
  SUSPENDED = 5,
  PENDING_CANCEL = 6,
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface FindOneResult<T> {
  data: T | null;
}
