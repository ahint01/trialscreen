import { Module } from '@nestjs/common';
import { DocumentIngestionService } from './document-ingestion.service';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    // MulterModule is Nest.js's built-in module for handling file uploads
    MulterModule.register(),
  ],
  providers: [DocumentIngestionService],
  // We'll export the service so other modules (like our future controller) can use it.
  exports: [DocumentIngestionService],
})
export class DocumentIngestionModule {}
