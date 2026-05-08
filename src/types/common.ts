export enum SimStatus {
  NEW = 1,
  ACTIVE = 2,
  CONFIRMED = 3,
  CANCELLED = 4,
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
