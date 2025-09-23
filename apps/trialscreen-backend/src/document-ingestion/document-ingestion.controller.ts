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
import { SqsService } from '../sqs/sqs.service';

@Controller('document-ingestion')
export class DocumentIngestionController {
  // Inject the SqsService into the controller
  constructor(private readonly sqsService: SqsService) {}

  @Post('eligibility-check')
  @UseInterceptors(FileInterceptor('file'))
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  async eligibilityCheck(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: EligibilityCheckDto,
  ) {
    if (!file) {
      throw new HttpException('No file provided.', HttpStatus.BAD_REQUEST);
    }

    const queueMessage = {
      // Convert buffer to a base64 string to be sent in the JSON SQS message body.
      fileBuffer: file.buffer.toString('base64'),
      fileName: file.originalname,
      inclusionCriteria: body.inclusionCriteria,
      exclusionCriteria: body.exclusionCriteria,
    };

    console.log('Sending message to SQS:', queueMessage);

    try {
      // Send the message to SQS using our new service.
      await this.sqsService.sendMessage(queueMessage);
    } catch (error) {
      // If SQS fails, we'll log the error and return a 500 status.
      console.error('Failed to send message to SQS:', error);
      throw new HttpException(
        'Failed to offload task to SQS.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // The controller returns immediately with a 201 Created status.
    return {
      message: 'Eligibility check request received and is being processed.',
      fileName: file.originalname,
    };
  }
}
