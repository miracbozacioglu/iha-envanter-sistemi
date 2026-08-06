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
import type { IhaModeli } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIhaModeliDto } from './dto/create-iha-modeli.dto';
import { UpdateIhaModeliDto } from './dto/update-iha-modeli.dto';
import {
  IhaModelleriService,
  type IhaModeliDetay,
} from './iha-modelleri.service';

@ApiTags('iha-modelleri')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iha-modelleri')
export class IhaModelleriController {
  constructor(private readonly ihaModelleriService: IhaModelleriService) {}

  @Get()
  @ApiOperation({
    summary: 'IHA modellerini listele',
    description: 'Tum modelleri ada gore sirali doner. Her oturuma aciktir.',
  })
  findAll(): Promise<IhaModeli[]> {
    return this.ihaModelleriService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek IHA modeli getir',
    description:
      'Modeli, o modele ait araclar (kuyruk no sirali) ile birlikte doner.',
  })
  @ApiResponse({ status: 404, description: 'IHA modeli bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<IhaModeliDetay> {
    return this.ihaModelleriService.findOne(id);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Yeni IHA modeli olustur',
    description: 'Yalnizca YONETICI.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  create(@Body() dto: CreateIhaModeliDto): Promise<IhaModeli> {
    return this.ihaModelleriService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'IHA modeli guncelle',
    description: 'Yalnizca YONETICI. Sadece gonderilen alanlar guncellenir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'IHA modeli bulunamadi.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIhaModeliDto,
  ): Promise<IhaModeli> {
    return this.ihaModelleriService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'IHA modeli sil',
    description:
      'Yalnizca YONETICI. Modele bagli arac veya uyumluluk kaydi varsa silinemez, 400 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'IHA modeli bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Bagli kayitlar nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<IhaModeli> {
    return this.ihaModelleriService.remove(id);
  }
}
