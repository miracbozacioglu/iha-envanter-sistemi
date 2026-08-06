import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import type { IhaModeli, ParcaUyumluluk } from '../../generated/prisma/client';
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateParcaDto } from './dto/create-parca.dto';
import { ParcaSorguDto } from './dto/parca-sorgu.dto';
import { SayfalamaDto } from './dto/sayfalama.dto';
import { UpdateParcaDto } from './dto/update-parca.dto';
import { UyumlulukEkleDto } from './dto/uyumluluk-ekle.dto';
import {
  ParcalarService,
  type ParcaDetay,
  type ParcaOzet,
  type SayfaliSonuc,
} from './parcalar.service';

@ApiTags('parcalar')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
// Okuma uclari icin sadece oturum yeterli; yazma uclari kendi uzerinde
// RolesGuard + @Roles(YONETICI) tasir.
@UseGuards(JwtAuthGuard)
@Controller('parcalar')
export class ParcalarController {
  constructor(private readonly parcalarService: ParcalarService) {}

  @Get()
  @ApiOperation({
    summary: 'Parcalari listele',
    description:
      'Kod/ad aramasi, kategori ve IHA modeli uyumlulugu filtreleriyle sayfalanmis liste doner. ' +
      'Her parca kategorisiyle birlikte gelir.',
  })
  findAll(@Query() sorgu: ParcaSorguDto): Promise<SayfaliSonuc<ParcaOzet>> {
    return this.parcalarService.findAll(sorgu);
  }

  // Dikkat: bu rota ':id' den once tanimli olmali, yoksa "kritik" id sanilir.
  @Get('kritik')
  @ApiOperation({
    summary: 'Kritik seviyedeki parcalar',
    description:
      'Tum depolardaki toplam stogu kendi kritikSeviye degerinin altinda kalan ' +
      'parcalari kategorisi ve toplamStok bilgisiyle doner.',
  })
  findKritik(): Promise<(ParcaOzet & { toplamStok: number })[]> {
    return this.parcalarService.findKritik();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek parca getir',
    description:
      'Parcayi kategorisi, uyumlu IHA modelleri ve depo bazli stok kalemleriyle birlikte doner.',
  })
  @ApiResponse({ status: 404, description: 'Parca bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ParcaDetay> {
    return this.parcalarService.findOne(id);
  }

  @Get(':id/hareketler')
  @ApiOperation({
    summary: 'Parcanin stok hareketi gecmisi',
    description:
      'Tarihe gore azalan sirali, sayfalanmis stok hareketi listesi doner.',
  })
  @ApiResponse({ status: 404, description: 'Parca bulunamadi.' })
  findHareketler(
    @Param('id', ParseIntPipe) id: number,
    @Query() sorgu: SayfalamaDto,
  ) {
    return this.parcalarService.findHareketler(id, sorgu);
  }

  @Post()
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Yeni parca olustur',
    description:
      'Yalnizca YONETICI. Kod benzersiz olmali; kategoriId gecerli bir kategoriye isaret etmeli.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 409, description: 'Bu kod zaten kayitli.' })
  @ApiResponse({ status: 400, description: 'Belirtilen kategori yok.' })
  create(@Body() dto: CreateParcaDto): Promise<ParcaOzet> {
    return this.parcalarService.create(dto);
  }

  @Patch(':id')
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Parca guncelle',
    description:
      'Yalnizca YONETICI. Kod degisiyorsa benzersizlik, kategori degisiyorsa varlik kontrolu yapilir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Parca bulunamadi.' })
  @ApiResponse({ status: 409, description: 'Bu kod baska bir parcaya ait.' })
  @ApiResponse({ status: 400, description: 'Belirtilen kategori yok.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateParcaDto,
  ): Promise<ParcaOzet> {
    return this.parcalarService.update(id, dto);
  }

  @Post(':id/uyumluluk')
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Parcaya uyumlu IHA modeli ekle',
    description:
      'Yalnizca YONETICI. Parca ile model arasinda uyumluluk kaydi olusturur.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Parca bulunamadi.' })
  @ApiResponse({ status: 400, description: 'Belirtilen IHA modeli yok.' })
  @ApiResponse({ status: 409, description: 'Uyumluluk kaydi zaten var.' })
  uyumlulukEkle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UyumlulukEkleDto,
  ): Promise<ParcaUyumluluk & { ihaModeli: IhaModeli }> {
    return this.parcalarService.uyumlulukEkle(id, dto.ihaModeliId);
  }

  @Delete(':id/uyumluluk/:ihaModeliId')
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Parcadan uyumlu IHA modelini kaldir',
    description: 'Yalnizca YONETICI. Ilgili uyumluluk kaydini siler.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Uyumluluk kaydi bulunamadi.' })
  uyumlulukKaldir(
    @Param('id', ParseIntPipe) id: number,
    @Param('ihaModeliId', ParseIntPipe) ihaModeliId: number,
  ): Promise<ParcaUyumluluk> {
    return this.parcalarService.uyumlulukKaldir(id, ihaModeliId);
  }
}
