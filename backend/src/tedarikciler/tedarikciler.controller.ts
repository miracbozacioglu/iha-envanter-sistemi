import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Tedarikci } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTedarikciDto } from './dto/create-tedarikci.dto';
import { UpdateTedarikciDto } from './dto/update-tedarikci.dto';
import { TedarikcilerService } from './tedarikciler.service';

@ApiTags('tedarikciler')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tedarikciler')
export class TedarikcilerController {
  constructor(private readonly tedarikcilerService: TedarikcilerService) {}

  @Get()
  @ApiOperation({
    summary: 'Tedarikcileri listele',
    description:
      'Tum tedarikcileri ada gore sirali doner. Her oturuma aciktir.',
  })
  findAll(): Promise<Tedarikci[]> {
    return this.tedarikcilerService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek tedarikci getir',
    description: 'Verilen id ye ait tedarikciyi doner; bulunamazsa 404 doner.',
  })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Tedarikci> {
    return this.tedarikcilerService.findOne(id);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Yeni tedarikci olustur',
    description: 'Yalnizca YONETICI. Ayni ad zaten kayitliysa 409 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 409, description: 'Bu ad zaten kullanimda.' })
  create(@Body() dto: CreateTedarikciDto): Promise<Tedarikci> {
    return this.tedarikcilerService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Tedarikci guncelle',
    description: 'Yalnizca YONETICI. Sadece gonderilen alanlar guncellenir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi.' })
  @ApiResponse({ status: 409, description: 'Bu ad baska bir tedarikcide.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTedarikciDto,
  ): Promise<Tedarikci> {
    return this.tedarikcilerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Tedarikci sil',
    description:
      'Yalnizca YONETICI. Tedarikciye bagli siparis varsa silinemez, 400 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Tedarikci bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Bagli siparisler nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Tedarikci> {
    return this.tedarikcilerService.remove(id);
  }
}
