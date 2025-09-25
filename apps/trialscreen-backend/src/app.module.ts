import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TrialModule } from './trial/trial.module';
import { TrpcModule } from './trpc/trpc.module';
import { RouterService } from './router/router.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TrpcModule,
    UserModule,
    AuthModule,
    TrialModule,
  ],
  providers: [RouterService],
})
export class AppModule {}
