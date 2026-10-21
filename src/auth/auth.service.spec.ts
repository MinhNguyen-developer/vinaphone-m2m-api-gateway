import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { encryptToken } from './token-crypto';

describe('AuthService Vinaphone login', () => {
  const expiry = Math.floor(Date.now() / 1000) + 3600;
  let service: AuthService;
  let jwt: { signAsync: jest.Mock };
  let config: { get: jest.Mock };
  let http: { post: jest.Mock };
  let prisma: { account: { findUnique: jest.Mock; upsert: jest.Mock } };

  beforeEach(() => {
    jwt = { signAsync: jest.fn().mockResolvedValue('internal-jwt') };
    config = {
      get: jest.fn((key: string) => {
        if (key === 'vinaphone.baseUrl') return 'https://vina.example/api';
        if (key === 'vinaphone.email') return 'account@example.com';
        if (key === 'vinaphone.timeoutMs') return 10_000;
        if (key === 'tokenEncryptionKey') return '11'.repeat(32);
        return undefined;
      }),
    };
    http = {
      post: jest.fn().mockReturnValue(
        of({ data: { id_token: 'upstream-token', exp: expiry } }),
      ),
    };
    prisma = {
      account: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({
          id: '0f6462cc-2e64-4f50-931b-4e379023ad14',
          email: 'account@example.com',
        }),
      },
    };
    service = new (AuthService as any)(jwt, config, http, prisma);
  });

  it('rejects invalid upstream responses without changing stored credentials', async () => {
    http.post.mockReturnValue(of({ data: { id_token: 'token', exp: 'later' } }));

    await expect(
      service.login({ email: 'account@example.com', password: 'wrong' } as any),
    ).rejects.toThrow();

    expect(prisma.account.upsert).not.toHaveBeenCalled();
  });

  it('does not change stored credentials when Vinaphone rejects the login', async () => {
    http.post.mockReturnValue(throwError(() => new Error('Unauthorized')));

    await expect(
      service.login({ email: 'account@example.com', password: 'wrong' } as any),
    ).rejects.toThrow();

    expect(prisma.account.upsert).not.toHaveBeenCalled();
  });

  it('stores an encrypted upstream token and signs the internal token to its expiry', async () => {
    const result = await service.login({
      email: ' Account@Example.com ',
      password: 'vina-password',
    } as any);

    expect(http.post).toHaveBeenCalledWith(
      'https://vina.example/api/auth/token',
      { email: 'account@example.com', password: 'vina-password', rememberMe: true },
      { timeout: 10_000 },
    );
    expect(prisma.account.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          passwordHash: expect.stringMatching(/^scrypt\$/),
          tokenExpiresAt: new Date(expiry * 1000),
        }),
      }),
    );
    const saved = prisma.account.upsert.mock.calls[0][0].update;
    expect(saved.vinaphoneTokenCiphertext).not.toBe('upstream-token');
    expect(saved.vinaphoneTokenIv).toBeTruthy();
    expect(saved.vinaphoneTokenTag).toBeTruthy();
    expect(jwt.signAsync).toHaveBeenCalledWith(
      expect.objectContaining({ sub: '0f6462cc-2e64-4f50-931b-4e379023ad14', exp: expiry }),
    );
    expect(result.access_token).toBe('internal-jwt');
    expect(JSON.stringify(result)).not.toContain('upstream-token');
  });

  it('decrypts only the token stored for the requested account and skips expired tokens', async () => {
    const encrypted = encryptToken('account-a-token', '11'.repeat(32));
    prisma.account.findUnique.mockResolvedValue({
      ...encrypted,
      tokenExpiresAt: new Date(Date.now() + 60_000),
    });

    await expect(
      service.getValidVinaphoneToken('account-a-id'),
    ).resolves.toBe('account-a-token');
    expect(prisma.account.findUnique).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: 'account-a-id' } }),
    );

    prisma.account.findUnique.mockResolvedValue({
      ...encrypted,
      tokenExpiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      service.getValidVinaphoneToken('account-a-id'),
    ).resolves.toBeNull();
  });
});
