import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { TrialModule } from './trial/trial.module';
import { TrpcModule } from './trpc/trpc.module';
import { RouterService } from './router/router.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [DatabaseModule, UserModule, TrialModule, TrpcModule, AuthModule],
  controllers: [AppController],
  providers: [AppService, RouterService],
})
export class AppModule {}
