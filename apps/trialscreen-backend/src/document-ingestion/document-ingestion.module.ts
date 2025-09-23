import { Module } from '@nestjs/common';
import { DocumentIngestionService } from './document-ingestion.service';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentIngestionController } from './document-ingestion.controller';

@Module({
  imports: [
    MulterModule.register({
      storage: null,
    }),
  ],
  controllers: [DocumentIngestionController],
  providers: [DocumentIngestionService],
  exports: [DocumentIngestionService],
})
export class DocumentIngestionModule {}
