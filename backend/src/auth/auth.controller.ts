import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthUser } from '../common/types/auth-user';
import { AuthService, LoginSonucu } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Giris yap',
    description:
      'E-posta ve sifre ile kimlik dogrular; JWT access token ve sifre hash i haric kullanici bilgisini doner.',
  })
  @ApiResponse({ status: 200, description: 'Giris basarili, token uretildi.' })
  @ApiResponse({
    status: 401,
    description: 'E-posta/sifre hatali veya hesap pasif.',
  })
  async login(@Body() dto: LoginDto): Promise<LoginSonucu> {
    const kullanici = await this.authService.validateUser(dto.email, dto.sifre);
    return this.authService.login(kullanici);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Oturumdaki kullanici',
    description:
      'Authorization Bearer basligindaki token dan cozulen kullaniciyi doner. Token gecersizse veya hesap pasifse 401 doner.',
  })
  @ApiResponse({ status: 200, description: 'Oturum bilgisi dondu.' })
  @ApiResponse({ status: 401, description: 'Token gecersiz veya eksik.' })
  me(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}
