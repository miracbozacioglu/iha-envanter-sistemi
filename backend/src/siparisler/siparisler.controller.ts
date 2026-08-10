import {
  Body,
  Controller,
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
import { Rol } from '../../generated/prisma/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { CreateSiparisDto } from './dto/create-siparis.dto';
import { TeslimAlDto } from './dto/teslim-al.dto';
import { SiparislerService, type SiparisDetay } from './siparisler.service';

@ApiTags('siparisler')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
// Siparis sureci bastan sona yoneticiye ait.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.YONETICI)
@Controller('siparisler')
export class SiparislerController {
  constructor(private readonly siparislerService: SiparislerService) {}

  @Get()
  @ApiOperation({
    summary: 'Siparisleri listele',
    description:
      'Tum siparisleri dayandiklari talep (parcasiyla birlikte) ve tedarikci bilgisiyle, ' +
      'siparis tarihine gore en yeniden eskiye doner.',
  })
  findAll(): Promise<SiparisDetay[]> {
    return this.siparislerService.findAll();
  }

  @Post()
  @ApiOperation({
    summary: 'Onaylanmis talepten siparis olustur',
    description:
      'Yalnizca YONETICI. Talep ONAYLANDI durumunda olmali; ayni transaction icinde siparis ' +
      'acilir ve talep SIPARIS_VERILDI durumuna gecer.',
  })
  @ApiResponse({ status: 201, description: 'Siparis olusturuldu.' })
  @ApiResponse({ status: 404, description: 'Talep bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Talep ONAYLANDI durumunda degil veya tedarikci yok.',
  })
  @ApiResponse({
    status: 409,
    description: 'Bu talebin zaten bir siparisi var.',
  })
  create(@Body() dto: CreateSiparisDto): Promise<SiparisDetay> {
    return this.siparislerService.create(dto);
  }

  @Patch(':id/teslim-al')
  @ApiOperation({
    summary: 'Siparisi teslim al ve stoga isle',
    description:
      'Yalnizca YONETICI. Tek transaction icinde siparisi kapatir, parcayi depo stoguna ekler, ' +
      'GIRIS hareketi yazar ve talebi TESLIM_ALINDI durumuna gecirir. ' +
      'depoId gonderilmezse sistemdeki tek depo kullanilir.',
  })
  @ApiResponse({ status: 200, description: 'Teslimat islendi.' })
  @ApiResponse({ status: 404, description: 'Siparis bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Siparis zaten teslim alinmis veya depo secilemedi.',
  })
  @ApiResponse({
    status: 409,
    description: 'Siparis es zamanli baska bir istekle teslim alindi.',
  })
  teslimAl(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: TeslimAlDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SiparisDetay> {
    return this.siparislerService.teslimAl(id, dto, user.id);
  }
}
