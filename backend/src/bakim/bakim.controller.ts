import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import type { SayfaliSonuc } from '../stok/stok.service';
import {
  BakimService,
  type BakimDetay,
  type BakimGecmisi,
} from './bakim.service';
import { BakimSorguDto } from './dto/bakim-sorgu.dto';
import { DegistirDto } from './dto/degistir.dto';
import { TamirDto } from './dto/tamir.dto';

@ApiTags('bakim')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@ApiResponse({ status: 403, description: 'Bu islem icin yetkiniz yok.' })
// Bakim sahada yapilan is: teknisyen de yonetici de kayit acabilir ve gorebilir.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.TEKNISYEN, Rol.YONETICI)
@Controller('bakim')
export class BakimController {
  constructor(private readonly bakimService: BakimService) {}

  @Get()
  @ApiOperation({
    summary: 'Bakim kayitlarini listele',
    description:
      'En yeniden eskiye sirali, sayfalanmis bakim listesi. ihaAraciId ve tip (DEGISTIRILDI/TAMIR_EDILDI) ' +
      'ile filtrelenebilir. Her kayit arac, parca ve islemi yapan kullanici bilgisiyle doner.',
  })
  findAll(@Query() sorgu: BakimSorguDto): Promise<SayfaliSonuc<BakimDetay>> {
    return this.bakimService.findAll(sorgu);
  }

  @Get('arac/:ihaAraciId')
  @ApiOperation({
    summary: 'Bir aracin bakim gecmisi',
    description:
      'Araca ait tum bakim kayitlarini en yeniden eskiye, parca ve kullanici bilgisiyle doner. ' +
      'Listenin ilk satiri araca en son yapilan islemdir.',
  })
  @ApiResponse({ status: 404, description: 'IHA araci bulunamadi.' })
  findByArac(
    @Param('ihaAraciId', ParseIntPipe) ihaAraciId: number,
  ): Promise<BakimGecmisi[]> {
    return this.bakimService.findByArac(ihaAraciId);
  }

  @Post('degistir')
  @ApiOperation({
    summary: 'Araca parca tak (stoktan duserek)',
    description:
      'Tek transaction icinde stoktan duser, CIKIS hareketi yazar ve DEGISTIRILDI bakim kaydi olusturur. ' +
      'Stok yetersizse hicbir sey degismez. depoId gonderilmezse sistemdeki tek depo kullanilir.',
  })
  @ApiResponse({ status: 201, description: 'Degisim islendi.' })
  @ApiResponse({
    status: 400,
    description:
      'Arac/parca yok, parca depoda yok, stok yetersiz veya depo secilemedi.',
  })
  @ApiResponse({
    status: 409,
    description: 'Stok es zamanli baska bir hareketle degisti.',
  })
  degistir(
    @Body() dto: DegistirDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BakimDetay> {
    return this.bakimService.degistir(dto, user.id);
  }

  @Post('tamir')
  @ApiOperation({
    summary: 'Parcayi yerinde tamir et',
    description:
      'Yalnizca TAMIR_EDILDI bakim kaydi olusturur. Parca degistirilmedigi icin stok ve ' +
      'stok hareketi etkilenmez.',
  })
  @ApiResponse({ status: 201, description: 'Tamir kaydi olusturuldu.' })
  @ApiResponse({ status: 400, description: 'Belirtilen arac veya parca yok.' })
  tamir(
    @Body() dto: TamirDto,
    @CurrentUser() user: AuthUser,
  ): Promise<BakimDetay> {
    return this.bakimService.tamir(dto, user.id);
  }
}
