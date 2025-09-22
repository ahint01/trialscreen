import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { RouterService } from './router.service';
import { TrpcController } from './trpc.controller';

@Module({
  imports: [],
  providers: [TrpcService, RouterService],
  controllers: [TrpcController],
  exports: [TrpcService, RouterService],
})
export class TrpcModule {}
