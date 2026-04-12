import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';

/**
 * In production, replace this with a real user store (DB table).
 * Passwords should be hashed with bcrypt.
 */
const STATIC_USERS: Record<string, string> = {
  admin: 'admin123',
};

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<{ access_token: string; expires_in: string }> {
    const storedPassword = STATIC_USERS[dto.username];
    if (!storedPassword || storedPassword !== dto.password) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không đúng');
    }

    const payload = { sub: dto.username, username: dto.username };
    const expiresIn = this.configService.get<string>('jwt.expiresIn') ?? '8h';

    return {
      access_token: await this.jwtService.signAsync(payload),
      expires_in: expiresIn,
    };
  }
}
