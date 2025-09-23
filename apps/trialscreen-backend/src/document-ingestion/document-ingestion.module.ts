import { Module } from '@nestjs/common';
import { DocumentIngestionService } from './document-ingestion.service';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentIngestionController } from './document-ingestion.controller';
import { SqsModule } from '../sqs/sqs.module';

@Module({
  imports: [
    MulterModule.register({
      storage: null,
    }),
    SqsModule,
  ],
  controllers: [DocumentIngestionController],
  providers: [DocumentIngestionService],
  exports: [DocumentIngestionService],
})
export class DocumentIngestionModule {}
