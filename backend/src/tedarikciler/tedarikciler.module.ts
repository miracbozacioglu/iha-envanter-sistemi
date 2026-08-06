import { Module } from '@nestjs/common';
import { TedarikcilerController } from './tedarikciler.controller';
import { TedarikcilerService } from './tedarikciler.service';

@Module({
  controllers: [TedarikcilerController],
  providers: [TedarikcilerService],
  exports: [TedarikcilerService],
})
export class TedarikcilerModule {}
