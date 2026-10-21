export const LEGACY_ACCOUNT_ID = '0f6462cc-2e64-4f50-931b-4e379023ad14';

const TENANT_MODELS = new Set([
  'Sim',
  'UsageHistory',
  'SimCode',
  'MasterSim',
  'Group',
  'GroupSim',
  'SimGroup',
  'AlertConfig',
  'AlertCheck',
  'SimGroupMember',
  'RatingPlan',
  'Customer',
  'Contract',
  'MonthlyDataUsage',
  'SyncJobState',
]);

export function isTenantModel(model: string): boolean {
  return TENANT_MODELS.has(model);
}

export function scopeTenantArgs<T>(args: T, accountId: string): T {
  const result = transform(args, accountId) as Record<string, unknown>;
  const input = args as Record<string, unknown>;

  if (Object.hasOwn(input, 'data')) {
    result.data = addAccountId(result.data, accountId);
  }
  if (
    Object.hasOwn(input, 'where') &&
    Object.hasOwn(input, 'create') &&
    Object.hasOwn(input, 'update')
  ) {
    result.create = addAccountId(result.create, accountId);
    result.update = addAccountId(result.update, accountId);
  }

  if (!Object.hasOwn(input, 'data') || Object.hasOwn(input, 'where')) {
    result.where = scopeWhere(input.where ?? {}, accountId);
  }
  return result as T;
}

function transform(value: unknown, accountId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => transform(entry, accountId));
  }
  if (!value || typeof value !== 'object' || value instanceof Date) return value;

  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === 'accountId') {
      continue;
    } else if (key === 'where' || key === 'connect') {
      result[key] = scopeWhere(entry, accountId);
    } else {
      result[key] = transform(entry, accountId);
    }
  }

  return result;
}

function addAccountId(value: unknown, accountId: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => addAccountId(entry, accountId));
  }
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  return { ...(value as Record<string, unknown>), accountId };
}

function scopeWhere(value: unknown, accountId: string): unknown {
  if (Array.isArray(value)) return value.map((entry) => scopeWhere(entry, accountId));
  if (!value || typeof value !== 'object' || value instanceof Date) return value;

  const scoped = { ...(value as Record<string, unknown>), accountId };
  for (const [key, entry] of Object.entries(scoped)) {
    if (key.startsWith('accountId_') && isRecord(entry)) {
      scoped[key] = {
        ...(entry as Record<string, unknown>),
        accountId,
      };
    }
  }
  return scoped;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  );
}
