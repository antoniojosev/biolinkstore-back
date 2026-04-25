import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GetUserUseCase } from '../../application/use-cases/get-user.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { ListMyStoresUseCase } from '../../application/use-cases/list-my-stores.use-case';
import { ActivateUserStoreUseCase } from '../../application/use-cases/activate-user-store.use-case';
import { SwitchActiveStoreUseCase } from '../../application/use-cases/switch-active-store.use-case';
import { CreateAdditionalStoreUseCase } from '../../application/use-cases/create-additional-store.use-case';
import { UpdateUserDto } from '../../application/dto/update-user.dto';
import { UserResponseDto } from '../../application/dto/user-response.dto';
import { ListMyStoresResponseDto } from '../../application/dto/list-my-stores-response.dto';
import { SwitchStoreDto } from '../../application/dto/switch-store.dto';
import { SwitchStoreResponseDto } from '../../application/dto/switch-store-response.dto';
import { CreateStoreDto } from '@/modules/stores/application/dto/create-store.dto';
import { StoreResponseDto } from '@/modules/stores/application/dto/store-response.dto';
import { CreateAdditionalStoreResponse } from '../../application/use-cases/create-additional-store.use-case';

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
    private readonly switchActiveStoreUseCase: SwitchActiveStoreUseCase,
    private readonly createAdditionalStoreUseCase: CreateAdditionalStoreUseCase,
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
  @ApiOperation({
    summary: 'List stores for current user with active flag (BE-127)',
    description:
      'Devuelve todas las tiendas del user con flag `isActive` y el `activeStoreId`. ' +
      'Si el user tiene tiendas pero ninguna activa explicita, se promueve la primera por createdAt.',
  })
  @ApiResponse({ status: 200, description: 'User stores', type: ListMyStoresResponseDto })
  async listMyStores(
    @CurrentUser() user: { userId: string },
  ): Promise<ListMyStoresResponseDto> {
    return this.listMyStoresUseCase.execute(user.userId);
  }

  @Post('me/stores/switch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Switch active store for current user (BE-127)',
    description:
      'Cambia la tienda activa del user. 403 si la tienda no le pertenece, 404 si no existe.',
  })
  @ApiResponse({ status: 200, description: 'Active store switched', type: SwitchStoreResponseDto })
  @ApiResponse({ status: 403, description: 'Store does not belong to user' })
  @ApiResponse({ status: 404, description: 'Store not found' })
  async switchStore(
    @CurrentUser() user: { userId: string },
    @Body() dto: SwitchStoreDto,
  ): Promise<SwitchStoreResponseDto> {
    return this.switchActiveStoreUseCase.execute(user.userId, dto.storeId);
  }

  @Post('me/stores')
  @ApiOperation({
    summary: 'Create an additional store for current user (BE-127)',
    description:
      'Plan gating: FREE=1, PRO=3, BUSINESS=ilimitado. La tienda recien creada queda como activa.',
  })
  @ApiResponse({ status: 201, description: 'Store created and activated' })
  @ApiResponse({ status: 403, description: 'Plan store limit reached' })
  async createAdditionalStore(
    @CurrentUser() user: { userId: string },
    @Body() dto: CreateStoreDto,
  ): Promise<CreateAdditionalStoreResponse> {
    return this.createAdditionalStoreUseCase.execute(user.userId, dto);
  }

  // Legacy BE-118 endpoint: kept for backward compatibility while frontend migrates to /switch.
  @Post('me/stores/:storeId/activate')
  @ApiOperation({
    summary: '[Legacy] Mark a store as active (BE-118). Prefer POST /me/stores/switch.',
    deprecated: true,
  })
  @ApiParam({ name: 'storeId', type: 'string' })
  @ApiResponse({ status: 200, description: 'Active store updated' })
  async activateStore(
    @CurrentUser() user: { userId: string },
    @Param('storeId') storeId: string,
  ): Promise<{ activeStoreId: string }> {
    return this.activateUserStoreUseCase.execute(user.userId, storeId);
  }
}
