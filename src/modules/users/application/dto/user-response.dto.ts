import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string | null;

  @ApiProperty()
  avatar: string | null;

  @ApiProperty()
  emailVerified: Date | null;

  @ApiProperty()
  isDemo: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
