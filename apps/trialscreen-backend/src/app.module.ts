import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { TrialModule } from './trial/trial.module';
import { TrpcModule } from './trpc/trpc.module';
import { AuthModule } from './auth/auth.module';
import { DocumentIngestionModule } from './document-ingestion/document-ingestion.module';
import { SqsModule } from './sqs/sqs.module';
import { ConfigModule } from '@nestjs/config';
import { EligibilityModule } from './eligibility/eligibility.module';
import { SqsConsumerModule } from './sqs/sqs-consumer/sqs-consumer.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    UserModule,
    TrialModule,
    TrpcModule,
    AuthModule,
    DocumentIngestionModule,
    SqsModule,
    EligibilityModule,
    SqsConsumerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
