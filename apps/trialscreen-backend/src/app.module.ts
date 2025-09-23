import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { TrialModule } from './trial/trial.module';
import { TrpcModule } from './trpc/trpc.module';
import { AuthModule } from './auth/auth.module';
import { DataingestionModule } from './dataingestion/dataingestion.module';
import { DocumentIngestionModule } from './document-ingestion/document-ingestion.module';

@Module({
  imports: [DatabaseModule, UserModule, TrialModule, TrpcModule, AuthModule, DataingestionModule, DocumentIngestionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
