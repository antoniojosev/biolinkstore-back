import { User as PrismaUser } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import { UserResponseDto } from '../dto/user-response.dto';

export class UserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      passwordHash: prismaUser.passwordHash,
      name: prismaUser.name,
      avatar: prismaUser.avatar,
      emailVerified: prismaUser.emailVerified,
      isDemo: prismaUser.isDemo,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
    });
  }

  static toResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      isDemo: user.isDemo,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
