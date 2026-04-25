import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { ListPalettesUseCase } from '../../application/use-cases/list-palettes.use-case';
import { PaletteResponseDto } from '../../application/dto/palette-response.dto';

@ApiTags('Page Builder — Palettes')
@Public()
@Controller('palettes')
export class PalettesController {
  constructor(private readonly listPalettesUseCase: ListPalettesUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar palette presets activos (público, sin auth)',
    description: 'Devuelve todas las paletas activas ordenadas por sortOrder.',
  })
  @ApiResponse({ status: 200, type: [PaletteResponseDto] })
  async listPalettes(): Promise<PaletteResponseDto[]> {
    return this.listPalettesUseCase.execute();
  }
}
