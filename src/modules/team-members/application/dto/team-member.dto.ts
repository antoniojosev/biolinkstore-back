import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString } from 'class-validator';
import { StoreMemberRole } from '@prisma/client';

export class InviteMemberDto {
  @ApiProperty({ example: 'colaborador@bylink.app' })
  @IsEmail()
  email: string;

  @ApiProperty({ enum: StoreMemberRole, example: 'STAFF' })
  @IsEnum(StoreMemberRole)
  role: StoreMemberRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: StoreMemberRole, example: 'ADMIN' })
  @IsEnum(StoreMemberRole)
  role: StoreMemberRole;
}

export class StoreMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: StoreMemberRole })
  role: StoreMemberRole;

  @ApiProperty({ required: false, nullable: true })
  invitedBy: string | null;

  @ApiProperty()
  joinedAt: Date;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string', nullable: true },
      avatar: { type: 'string', nullable: true },
    },
    required: false,
  })
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export class StoreInvitationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  storeId: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: StoreMemberRole })
  role: StoreMemberRole;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty({ required: false, nullable: true })
  acceptedAt: Date | null;

  @ApiProperty({ required: false, nullable: true })
  declinedAt: Date | null;

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      slug: { type: 'string' },
      logo: { type: 'string', nullable: true },
    },
    required: false,
  })
  store?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };

  @ApiProperty({
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string', nullable: true },
      email: { type: 'string' },
    },
    required: false,
  })
  inviter?: {
    id: string;
    name: string | null;
    email: string;
  };

  @ApiProperty()
  createdAt: Date;
}

export class AcceptInvitationResponseDto {
  @ApiProperty()
  invitation: StoreInvitationResponseDto;

  @ApiProperty()
  member: StoreMemberResponseDto;
}

export class IdParamDto {
  @ApiProperty()
  @IsString()
  token: string;
}
