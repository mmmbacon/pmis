import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { env } from '../../config/env';
import { User } from '../users/user.entity';
import { PublicUser, UsersService } from '../users/users.service';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: PublicUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toPublicUser(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthResponse> {
    const decoded = await this.verifyRefreshToken(refreshToken);
    const user = await this.usersService.findById(decoded.sub);
    if (!user.refreshTokenHash || !(await bcrypt.compare(refreshToken, user.refreshTokenHash))) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.usersService.toPublicUser(user), ...tokens };
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.saveRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const roles = user.roles.map((role) => role.name);
    const payload = { sub: user.id, email: user.email, name: user.name, roles };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: env.jwt.accessSecret,
      expiresIn: env.jwt.accessExpiresIn,
    });
    const refreshTokenId = randomBytes(16).toString('hex');
    const refreshToken = await this.jwtService.signAsync({ sub: user.id, jti: refreshTokenId }, {
      secret: env.jwt.refreshSecret,
      expiresIn: env.jwt.refreshExpiresIn,
    });
    await this.usersService.saveRefreshTokenHash(user.id, await bcrypt.hash(refreshToken, 12));
    return { accessToken, refreshToken };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<{ sub: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string }>(refreshToken, {
        secret: env.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
