import { Controller, Get, Patch, Post, Param, Body, UseGuards, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { ListMyStoresUseCase, MyStoreListItem } from '../../application/use-cases/list-my-stores.use-case';
import { ActivateUserStoreUseCase } from '../../application/use-cases/activate-user-store.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly listMyStoresUseCase: ListMyStoresUseCase,
    private readonly activateUserStoreUseCase: ActivateUserStoreUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserResponseDto })
  async getMe(@CurrentUser() user: { userId: string }): Promise<UserResponseDto> {
    return this.getUserUseCase.execute(user.userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated', type: UserResponseDto })
  async updateMe(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.updateUserUseCase.execute(user.userId, dto);
  }

  @Get('me/stores')
  @ApiOperation({ summary: 'List stores for current user with active flag (BE-118)' })
  @ApiResponse({ status: 200, description: 'User stores' })
  async listMyStores(
    @CurrentUser() user: { userId: string },
  ): Promise<MyStoreListItem[]> {
    return this.listMyStoresUseCase.execute(user.userId);
  }

  @Post('me/stores/:storeId/activate')
  @ApiOperation({ summary: 'Mark a store as active for the current user (BE-118)' })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Active store updated' })
  async activateStore(
    @CurrentUser() user: { userId: string },
    @Param('storeId') storeId: string,
  ): Promise<{ activeStoreId: string }> {
    return this.activateUserStoreUseCase.execute(user.userId, storeId);
  }
}
