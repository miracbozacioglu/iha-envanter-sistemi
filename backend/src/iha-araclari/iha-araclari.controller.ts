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
import type { IhaAraci } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateIhaAraciDto } from './dto/create-iha-araci.dto';
import { UpdateIhaAraciDto } from './dto/update-iha-araci.dto';
import { IhaAraclariService, type IhaAraciDetay } from './iha-araclari.service';

@ApiTags('iha-araclari')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('iha-araclari')
export class IhaAraclariController {
  constructor(private readonly ihaAraclariService: IhaAraclariService) {}

  @Get()
  @ApiOperation({
    summary: 'IHA araclarini listele',
    description:
      'Tum araclari kuyruk no sirali, bagli olduklari model bilgisiyle birlikte doner.',
  })
  findAll(): Promise<IhaAraciDetay[]> {
    return this.ihaAraclariService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek IHA araci getir',
    description:
      'Araci model bilgisiyle birlikte doner; bulunamazsa 404 doner.',
  })
  @ApiResponse({ status: 404, description: 'IHA araci bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<IhaAraciDetay> {
    return this.ihaAraclariService.findOne(id);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'Yeni IHA araci olustur',
    description:
      'Yalnizca YONETICI. Kuyruk no benzersiz olmali; ihaModeliId gecerli bir modele isaret etmeli.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 409, description: 'Bu kuyruk no zaten kayitli.' })
  @ApiResponse({ status: 400, description: 'Belirtilen IHA modeli yok.' })
  create(@Body() dto: CreateIhaAraciDto): Promise<IhaAraciDetay> {
    return this.ihaAraclariService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'IHA araci guncelle',
    description:
      'Yalnizca YONETICI. Kuyruk no degisiyorsa benzersizlik, model degisiyorsa varlik kontrolu yapilir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'IHA araci bulunamadi.' })
  @ApiResponse({
    status: 409,
    description: 'Bu kuyruk no baska bir araca ait.',
  })
  @ApiResponse({ status: 400, description: 'Belirtilen IHA modeli yok.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateIhaAraciDto,
  ): Promise<IhaAraciDetay> {
    return this.ihaAraclariService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Rol.YONETICI)
  @ApiOperation({
    summary: 'IHA araci sil',
    description:
      'Yalnizca YONETICI. Araca ait bakim kaydi varsa silinemez, 400 doner.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'IHA araci bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Bagli bakim kayitlari nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<IhaAraci> {
    return this.ihaAraclariService.remove(id);
  }
}
