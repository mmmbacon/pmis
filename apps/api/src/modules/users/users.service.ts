import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleName } from './role.entity';
import { User } from './user.entity';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.users.findOne({ where: { email }, relations: { roles: true } });
  }

  async findById(id: string): Promise<User> {
    const user = await this.users.findOne({ where: { id }, relations: { roles: true } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async saveRefreshTokenHash(userId: string, refreshTokenHash: string | null): Promise<void> {
    await this.users.update({ id: userId }, { refreshTokenHash });
  }

  toPublicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map((role) => role.name),
    };
  }
}
