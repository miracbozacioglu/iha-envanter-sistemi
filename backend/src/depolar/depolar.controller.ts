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
import type { Depo } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DepolarService } from './depolar.service';
import { CreateDepoDto } from './dto/create-depo.dto';
import { UpdateDepoDto } from './dto/update-depo.dto';

@ApiTags('depolar')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
// RolesGuard, @Roles tasimayan endpoint'leri serbest birakir:
// okuma uclari her oturuma acik, yazma uclari @Roles(YONETICI) ile kisitli.
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('depolar')
export class DepolarController {
  constructor(private readonly depolarService: DepolarService) {}

  @Get()
  @ApiOperation({
    summary: 'Depolari listele',
    description:
      'Tum depolari ada gore sirali doner. Hic stok kaydi olmayan depolar da listede yer alir. ' +
      'Her oturuma aciktir.',
  })
  findAll(): Promise<Depo[]> {
    return this.depolarService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek depo getir',
    description: 'Verilen id ye ait depoyu doner; bulunamazsa 404 doner.',
  })
  @ApiResponse({ status: 404, description: 'Depo bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Depo> {
    return this.depolarService.findOne(id);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Yeni depo olustur',
    description: 'Yalnizca YONETICI. Ayni ad zaten kayitliysa 409 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 409, description: 'Bu ad zaten kullanimda.' })
  create(@Body() dto: CreateDepoDto): Promise<Depo> {
    return this.depolarService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Depo guncelle',
    description: 'Yalnizca YONETICI. Sadece gonderilen alanlar guncellenir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Depo bulunamadi.' })
  @ApiResponse({ status: 409, description: 'Bu ad baska bir depoda.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepoDto,
  ): Promise<Depo> {
    return this.depolarService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Depo sil',
    description:
      'Yalnizca YONETICI. Depoya bagli stok kalemi veya stok hareketi varsa silinemez, 400 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Depo bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Bagli stok kayitlari nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<Depo> {
    return this.depolarService.remove(id);
  }
}
