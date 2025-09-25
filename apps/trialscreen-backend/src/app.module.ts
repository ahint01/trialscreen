import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TrialModule } from './trial/trial.module';
import { TrpcModule } from './trpc/trpc.module';
import { RouterService } from './router/router.service';
import { EligibilityModule } from './eligibility/eligibility.module';
import { SqsModule } from './sqs/sqs.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TrpcModule,
    UserModule,
    AuthModule,
    TrialModule,
    EligibilityModule,
    SqsModule,
  ],
  providers: [RouterService],
})
export class AppModule {}
