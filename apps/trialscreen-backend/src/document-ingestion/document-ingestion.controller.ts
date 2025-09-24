import {
  Controller,
  Post,
  Body,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EligibilityCheckDto } from './dto/eligibility-check.dto';
import { SqsService } from '../sqs/sqs.service';

@Controller('document-ingestion')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class DocumentIngestionController {
  // Inject the SqsService into the controller
  constructor(private readonly sqsService: SqsService) {}

  @Post('eligibility-check')
  async eligibilityCheck(@Body() eligibilityCheckDto: EligibilityCheckDto) {
    const { fileBuffer, fileName, inclusionCriteria, exclusionCriteria } =
      eligibilityCheckDto;

    const queueMessage = {
      fileBuffer,
      fileName,
      inclusionCriteria,
      exclusionCriteria,
    };

    console.log('Sending message to SQS:', queueMessage);

    try {
      await this.sqsService.sendMessage(queueMessage);
    } catch (error) {
      console.error('Failed to send message to SQS:', error);
      // Safely access the error message.
      if (error instanceof Error) {
        throw new HttpException(
          `Failed to offload task to SQS. Details: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Failed to offload task to SQS due to an unknown error.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    // The controller returns immediately with a 201 Created status.
    return {
      message: 'Eligibility check request received and is being processed.',
      fileName,
    };
  }
}
