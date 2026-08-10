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
import type { Kategori } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateKategoriDto } from './dto/create-kategori.dto';
import { UpdateKategoriDto } from './dto/update-kategori.dto';
import { KategorilerService } from './kategoriler.service';

@ApiTags('kategoriler')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
// RolesGuard, @Roles tasimayan endpoint'leri serbest birakir:
// okuma uclari her oturuma acik, yazma uclari @Roles(YONETICI) ile kisitli.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('kategoriler')
export class KategorilerController {
  constructor(private readonly kategorilerService: KategorilerService) {}

  @Get()
  @ApiOperation({
    summary: 'Kategorileri listele',
    description: 'Tum kategorileri ada gore sirali doner. Her oturuma aciktir.',
  })
  findAll(): Promise<Kategori[]> {
    return this.kategorilerService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek kategori getir',
    description: 'Verilen id ye ait kategoriyi doner; bulunamazsa 404 doner.',
  })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Kategori> {
    return this.kategorilerService.findOne(id);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Yeni kategori olustur',
    description: 'Yalnizca YONETICI. Ayni ad zaten kayitliysa 409 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 409, description: 'Bu ad zaten kullanimda.' })
  create(@Body() dto: CreateKategoriDto): Promise<Kategori> {
    return this.kategorilerService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Kategori guncelle',
    description: 'Yalnizca YONETICI. Sadece gonderilen alanlar guncellenir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadi.' })
  @ApiResponse({ status: 409, description: 'Bu ad baska bir kategoride.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKategoriDto,
  ): Promise<Kategori> {
    return this.kategorilerService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Kategori sil',
    description:
      'Yalnizca YONETICI. Kategoriye bagli parca varsa silinemez, 400 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Kategori bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Bagli parcalar nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Kategori> {
    return this.kategorilerService.remove(id);
  }
}
