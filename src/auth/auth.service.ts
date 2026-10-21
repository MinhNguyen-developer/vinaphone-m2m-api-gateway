import { Injectable, UnauthorizedException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';
import { LEGACY_ACCOUNT_ID } from '../prisma/tenant-scope';
import { LoginDto } from './dto/login.dto';
import { decryptToken, encryptToken, hashPassword } from './token-crypto';

interface VinaphoneTokenResponse {
  id_token?: unknown;
  exp?: unknown;
}

const INVALID_CREDENTIALS = 'Email hoặc mật khẩu Vinaphone không đúng';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {}

  async login(dto: LoginDto): Promise<{
    access_token: string;
    expires_in: number;
    expires_at: string;
  }> {
    const email = normalizeEmail(dto.email);
    const baseUrl = this.configService.get<string>('vinaphone.baseUrl');
    if (!baseUrl) throw new UnauthorizedException(INVALID_CREDENTIALS);

    let data: VinaphoneTokenResponse;
    try {
      ({ data } = await firstValueFrom(
        this.httpService.post<VinaphoneTokenResponse>(
          `${baseUrl.replace(/\/$/, '')}/auth/token`,
          { email, password: dto.password, rememberMe: true },
          {
            timeout:
              this.configService.get<number>('vinaphone.timeoutMs') ?? 10_000,
          },
        ),
      ));
    } catch {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const expiresAt = Number(data?.exp);
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof data?.id_token !== 'string' ||
      !data.id_token.trim() ||
      !Number.isSafeInteger(expiresAt) ||
      expiresAt <= now
    ) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const encryptionKey =
      this.configService.get<string>('tokenEncryptionKey') ?? '';
    const authData = {
      email,
      passwordHash: await hashPassword(dto.password),
      ...encryptToken(data.id_token, encryptionKey),
      tokenExpiresAt: new Date(expiresAt * 1000),
    };

    const configuredEmail = normalizeEmail(
      this.configService.get<string>('vinaphone.email') ?? '',
    );
    const account =
      configuredEmail && configuredEmail === email
        ? await this.prisma.account.upsert({
            where: { id: LEGACY_ACCOUNT_ID },
            create: { id: LEGACY_ACCOUNT_ID, ...authData },
            update: authData,
            select: { id: true },
          })
        : await this.prisma.account.upsert({
            where: { email },
            create: authData,
            update: authData,
            select: { id: true },
          });

    const payload = { sub: account.id, email, exp: expiresAt };
    const accessToken = await this.jwtService.signAsync(payload);
    return {
      access_token: accessToken,
      expires_in: expiresAt - now,
      expires_at: new Date(expiresAt * 1000).toISOString(),
    };
  }

  async getValidVinaphoneToken(accountId: string): Promise<string | null> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      select: {
        vinaphoneTokenCiphertext: true,
        vinaphoneTokenIv: true,
        vinaphoneTokenTag: true,
        tokenExpiresAt: true,
      },
    });
    if (
      !account?.vinaphoneTokenCiphertext ||
      !account.vinaphoneTokenIv ||
      !account.vinaphoneTokenTag ||
      !account.tokenExpiresAt ||
      account.tokenExpiresAt.getTime() <= Date.now()
    ) {
      return null;
    }

    return decryptToken(
      account.vinaphoneTokenCiphertext,
      account.vinaphoneTokenIv,
      account.vinaphoneTokenTag,
      this.configService.get<string>('tokenEncryptionKey') ?? '',
    );
  }

  async getEligibleAccountIds(): Promise<string[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        tokenExpiresAt: { gt: new Date() },
        vinaphoneTokenCiphertext: { not: null },
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    return accounts.map(({ id }) => id);
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
