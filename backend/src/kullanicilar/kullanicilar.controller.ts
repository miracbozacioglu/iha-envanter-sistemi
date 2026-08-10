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
import { Rol } from '../../generated/prisma/enums';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { CreateKullaniciDto } from './dto/create-kullanici.dto';
import { UpdateKullaniciDto } from './dto/update-kullanici.dto';
import { KullanicilarService } from './kullanicilar.service';

@ApiTags('kullanicilar')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
@ApiResponse({
  status: 403,
  description: 'Bu islem icin YONETICI olmalisiniz.',
})
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Rol.YONETICI)
@Controller('kullanicilar')
export class KullanicilarController {
  constructor(private readonly kullanicilarService: KullanicilarService) {}

  @Get()
  @ApiOperation({
    summary: 'Kullanicilari listele',
    description:
      'Tum kullanicilari id sirasiyla doner. Sifre hash i dahil edilmez.',
  })
  findAll(): Promise<AuthUser[]> {
    return this.kullanicilarService.findAll();
  }

  @Post()
  @ApiOperation({
    summary: 'Yeni kullanici olustur',
    description:
      'Sifre bcrypt ile hash lenerek kaydedilir. E-posta zaten kayitliysa 409 doner.',
  })
  @ApiResponse({ status: 409, description: 'E-posta zaten kullanimda.' })
  create(@Body() dto: CreateKullaniciDto): Promise<AuthUser> {
    return this.kullanicilarService.create(dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek kullanici getir',
    description: 'Verilen id ye ait kullaniciyi doner; bulunamazsa 404 doner.',
  })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<AuthUser> {
    return this.kullanicilarService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Kullanici guncelle',
    description:
      'Yalnizca gonderilen alanlar guncellenir. sifre gonderilirse yeniden hash lenir. ' +
      'Hesabi pasife almak icin aktif: false gonderin.',
  })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi.' })
  @ApiResponse({
    status: 409,
    description: 'E-posta baska bir kullanicida kayitli.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateKullaniciDto,
  ): Promise<AuthUser> {
    return this.kullanicilarService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Kullanici sil',
    description:
      'Kalici silme yapar. Kullanicinin talep/hareket/bakim kaydi varsa silinemez; ' +
      'bu durumda 400 doner ve pasife alma onerilir.',
  })
  @ApiResponse({ status: 404, description: 'Kullanici bulunamadi.' })
  @ApiResponse({
    status: 400,
    description: 'Iliskili kayitlar nedeniyle silinemiyor.',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<AuthUser> {
    return this.kullanicilarService.remove(id);
  }
}
