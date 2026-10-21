import { scopeTenantArgs } from './tenant-scope';

describe('scopeTenantArgs', () => {
  const accountId = '0f6462cc-2e64-4f50-931b-4e379023ad14';

  it('adds the authenticated account to filters without losing caller conditions', () => {
    expect(
      scopeTenantArgs(
        { where: { phoneNumber: '0912345678' } },
        accountId,
      ),
    ).toEqual({ where: { phoneNumber: '0912345678', accountId } });
  });

  it('adds a tenant filter when a list query has no caller filter', () => {
    expect(scopeTenantArgs({}, accountId)).toEqual({
      where: { accountId },
    });
  });

  it('overrides a caller supplied account on reads and writes', () => {
    expect(
      scopeTenantArgs(
        {
          where: { id: 'sim-id', accountId: 'another-account' },
          data: { note: 'private', accountId: 'another-account' },
        },
        accountId,
      ),
    ).toEqual({
      where: { id: 'sim-id', accountId },
      data: { note: 'private', accountId },
    });
  });

  it('scopes nested connects without injecting accountId into nested creates', () => {
    expect(
      scopeTenantArgs(
        {
          data: {
            label: 'Alert',
            sim: { connect: { id: 'foreign-sim' } },
            checks: {
              create: [{ simId: 'sim-id', accountId: 'another-account' }],
            },
          },
        },
        accountId,
      ),
    ).toEqual({
      data: {
        label: 'Alert',
        accountId,
        sim: { connect: { id: 'foreign-sim', accountId } },
        checks: { create: [{ simId: 'sim-id' }] },
      },
    });
  });

  it('scopes create and update data in a top-level upsert', () => {
    expect(
      scopeTenantArgs(
        {
          where: { accountId_job: { accountId: 'another-account', job: 'syncSims' } },
          create: { job: 'syncSims', accountId: 'another-account' },
          update: { progress: 'done', accountId: 'another-account' },
        },
        accountId,
      ),
    ).toEqual({
      where: {
        accountId_job: { accountId, job: 'syncSims' },
        accountId,
      },
      create: { job: 'syncSims', accountId },
      update: { progress: 'done', accountId },
    });
  });
});
