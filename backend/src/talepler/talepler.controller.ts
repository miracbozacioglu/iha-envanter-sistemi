import {
  Body,
  Controller,
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
import { Rol } from '../../generated/prisma/enums';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import type { AuthUser } from '../common/types/auth-user';
import { CreateTalepDto } from './dto/create-talep.dto';
import { RedTalepDto } from './dto/red-talep.dto';
import { TalepSorguDto } from './dto/talep-sorgu.dto';
import {
  TaleplerService,
  type TalepDetay,
  type TalepOzet,
} from './talepler.service';

@ApiTags('talepler')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
// Okuma uclari her iki role de acik; yazma uclari kendi uzerinde
// RolesGuard + @Roles tasir.
@UseGuards(JwtAuthGuard)
@Controller('talepler')
export class TaleplerController {
  constructor(private readonly taleplerService: TaleplerService) {}

  @Get()
  @ApiOperation({
    summary: 'Talepleri listele',
    description:
      'Teknisyen yalnizca kendi taleplerini, yonetici tum talepleri gorur. ' +
      'durum ile filtrelenebilir; liste en yeniden eskiye siralidir.',
  })
  findAll(
    @Query() sorgu: TalepSorguDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TalepOzet[]> {
    return this.taleplerService.findAll(sorgu, user);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Tek talep getir',
    description:
      'Talebi parca, teknisyen, onaylayan ve varsa bagli siparisiyle birlikte doner. ' +
      'Teknisyen baskasinin talebini goruntuleyemez.',
  })
  @ApiResponse({ status: 403, description: 'Bu talep size ait degil.' })
  @ApiResponse({ status: 404, description: 'Talep bulunamadi.' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<TalepDetay> {
    return this.taleplerService.findOne(id, user);
  }

  @Post()
  @Roles(Rol.TEKNISYEN)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Yeni parca talebi olustur',
    description:
      'Yalnizca TEKNISYEN. Talep BEKLIYOR durumunda acilir ve oturumdaki teknisyene baglanir.',
  })
  @ApiResponse({ status: 403, description: 'TEKNISYEN olmalisiniz.' })
  @ApiResponse({ status: 400, description: 'Belirtilen parca yok.' })
  create(
    @Body() dto: CreateTalepDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TalepOzet> {
    return this.taleplerService.create(dto, user.id);
  }

  @Patch(':id/onayla')
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Talebi onayla',
    description:
      'Yalnizca YONETICI. Sadece BEKLIYOR durumundaki talep onaylanabilir; ' +
      'durum ONAYLANDI olur ve onaylayan olarak oturumdaki yonetici yazilir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Talep bulunamadi.' })
  @ApiResponse({ status: 400, description: 'Talep BEKLIYOR durumunda degil.' })
  @ApiResponse({
    status: 409,
    description:
      'Talep es zamanli olarak baska bir yonetici tarafindan karara baglandi.',
  })
  onayla(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthUser,
  ): Promise<TalepOzet> {
    return this.taleplerService.onayla(id, user.id);
  }

  @Patch(':id/reddet')
  @Roles(Rol.YONETICI)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Talebi reddet',
    description:
      'Yalnizca YONETICI. Sadece BEKLIYOR durumundaki talep reddedilebilir; ' +
      'durum REDDEDILDI olur, red sebebi ve onaylayan kaydedilir.',
  })
  @ApiResponse({ status: 403, description: 'YONETICI olmalisiniz.' })
  @ApiResponse({ status: 404, description: 'Talep bulunamadi.' })
  @ApiResponse({ status: 400, description: 'Talep BEKLIYOR durumunda degil.' })
  @ApiResponse({
    status: 409,
    description:
      'Talep es zamanli olarak baska bir yonetici tarafindan karara baglandi.',
  })
  reddet(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RedTalepDto,
    @CurrentUser() user: AuthUser,
  ): Promise<TalepOzet> {
    return this.taleplerService.reddet(id, dto, user.id);
  }
}
