import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { INJECTION_TOKENS } from '@/common/constants/injection-tokens';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { PasswordService } from '@/modules/auth/domain/services/password.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(INJECTION_TOKENS.USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await this.passwordService.hash(dto.password);
    }

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });

    return UserMapper.toResponse(user);
  }
}
