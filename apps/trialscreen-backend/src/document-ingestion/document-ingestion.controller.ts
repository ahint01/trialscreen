import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Body,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { EligibilityCheckDto } from './dto/eligibility-check.dto';

@Controller('document-ingestion')
export class DocumentIngestionController {
  @Post('eligibility-check')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async eligibilityCheck(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: EligibilityCheckDto,
  ) {
    await Promise.resolve();

    if (!file) {
      throw new HttpException('No file provided.', HttpStatus.BAD_REQUEST);
    }

    // The data we'll send to the SQS queue.
    const queueMessage = {
      fileBuffer: file.buffer,
      fileName: file.originalname,
      inclusionCriteria: body.inclusionCriteria,
      exclusionCriteria: body.exclusionCriteria,
    };

    console.log('Sending message to SQS:', queueMessage);
    return {
      message: 'Eligibility check request received and is being processed.',
      fileName: file.originalname,
    };
  }
}
