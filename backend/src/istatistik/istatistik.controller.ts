import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IstatistikService, type OzetSonuc } from './istatistik.service';

@ApiTags('istatistik')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
// Ozet salt okunur ve kisiye ozel veri tasimaz; oturum acan herkes gorebilir.
@UseGuards(JwtAuthGuard)
@Controller('istatistik')
export class IstatistikController {
  constructor(private readonly istatistikService: IstatistikService) {}

  @Get('ozet')
  @ApiOperation({
    summary: 'Dashboard ozeti',
    description:
      'Tek istekte dashboard verisi doner: toplamParca, toplamArac, toplamKategori, ' +
      'bekleyenTalep, kritikStokSayisi, sonHareketler (en yeni 5 stok hareketi), ' +
      'kritikParcalar (kritik seviyenin altindaki ilk 5 parca) ve durumDagilimi ' +
      '(talep durumlarinin sayilari, kaydi olmayan durumlar 0). ' +
      'Tum sorgular paralel calisir.',
  })
  ozet(): Promise<OzetSonuc> {
    return this.istatistikService.ozet();
  }
}
