import { Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';
import { RouterService } from '../router/router.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { TrialModule } from './../trial/trial.module';

@Module({
  imports: [AuthModule, UserModule, TrialModule],
  providers: [TrpcService, RouterService],
  exports: [TrpcService, RouterService],
})
export class TrpcModule {}
