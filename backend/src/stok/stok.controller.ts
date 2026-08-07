import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
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
import { HareketSorguDto } from './dto/hareket-sorgu.dto';
import { StokCikisDto } from './dto/stok-cikis.dto';
import { StokGirisDto } from './dto/stok-giris.dto';
import { StokSorguDto } from './dto/stok-sorgu.dto';
import {
  StokService,
  type HareketDetay,
  type SayfaliSonuc,
  type StokKalemDetay,
} from './stok.service';

@ApiTags('stok')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
// Stok modulunun tamami yoneticiye ozel: teknisyenin parca dusumu Gun 5'te
// bakim modulu uzerinden gelecek.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.YONETICI)
@Controller('stok')
export class StokController {
  constructor(private readonly stokService: StokService) {}

  @Get()
  @ApiOperation({
    summary: 'Stok kalemlerini listele',
    description:
      'Parca (kod, ad, kritikSeviye) ve depo bilgisiyle birlikte tum stok kalemlerini doner. ' +
      'depoId verilirse yalnizca o deponun kalemleri gelir.',
  })
  findAll(@Query() sorgu: StokSorguDto): Promise<StokKalemDetay[]> {
    return this.stokService.findAll(sorgu);
  }

  @Get('hareketler')
  @ApiOperation({
    summary: 'Stok hareketi gecmisi',
    description:
      'En yeniden eskiye sirali, sayfalanmis hareket listesi. parcaId, depoId ve tip (GIRIS/CIKIS) ile filtrelenebilir. ' +
      'Her kayit parca, depo ve islemi yapan kullanici bilgisiyle doner.',
  })
  findHareketler(
    @Query() sorgu: HareketSorguDto,
  ): Promise<SayfaliSonuc<HareketDetay>> {
    return this.stokService.findHareketler(sorgu);
  }

  @Post('giris')
  @ApiOperation({
    summary: 'Stok girisi yap',
    description:
      'Yalnizca YONETICI. Parca+depo satiri varsa miktari artirir, yoksa olusturur; ayni transaction icinde ' +
      'GIRIS hareketi kaydeder ve guncel stok kalemini doner.',
  })
  @ApiResponse({
    status: 201,
    description: 'Giris islendi, guncel stok dondu.',
  })
  @ApiResponse({ status: 400, description: 'Belirtilen parca veya depo yok.' })
  giris(
    @Body() dto: StokGirisDto,
    @CurrentUser() user: AuthUser,
  ): Promise<StokKalemDetay> {
    return this.stokService.giris(dto, user.id);
  }

  @Post('cikis')
  @ApiOperation({
    summary: 'Stok cikisi yap',
    description:
      'Yalnizca YONETICI. Stoktan duser ve ayni transaction icinde CIKIS hareketi kaydeder. ' +
      'Stok yetersizse hicbir sey degismez.',
  })
  @ApiResponse({
    status: 201,
    description: 'Cikis islendi, guncel stok dondu.',
  })
  @ApiResponse({
    status: 400,
    description: 'Parca bu depoda yok veya stok yetersiz.',
  })
  @ApiResponse({
    status: 409,
    description: 'Stok es zamanli baska bir hareketle degisti.',
  })
  cikis(
    @Body() dto: StokCikisDto,
    @CurrentUser() user: AuthUser,
  ): Promise<StokKalemDetay> {
    return this.stokService.cikis(dto, user.id);
  }
}
