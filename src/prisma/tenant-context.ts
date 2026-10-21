import { AsyncLocalStorage } from 'node:async_hooks';
import { InternalServerErrorException } from '@nestjs/common';

const accountContext = new AsyncLocalStorage<string>();

export function runWithTenant<T>(accountId: string, work: () => T): T {
  return accountContext.run(accountId, work);
}

export function getCurrentAccountId(): string {
  const accountId = accountContext.getStore();
  if (!accountId) {
    throw new InternalServerErrorException(
      'A tenant account context is required for business data access',
    );
  }
  return accountId;
}
