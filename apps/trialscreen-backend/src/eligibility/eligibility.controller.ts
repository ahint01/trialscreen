import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { EligibilityService, JobData } from './eligibility.service';

// Define the interface for the incoming request body from the frontend
interface FrontendPayload {
  fileBuffer: string;
  fileName: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
}

@Controller('eligibility')
export class EligibilityController {
  constructor(private readonly eligibilityService: EligibilityService) {}

  @Post('check')
  async startEligibilityCheck(@Body() payload: FrontendPayload) {
    try {
      const { jobId } =
        await this.eligibilityService.processEligibilityCheck(payload);
      return { jobId };
    } catch (error) {
      console.error('Error starting eligibility check:', error);
      throw new HttpException(
        'Failed to start eligibility check',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status/:jobId')
  getJobStatus(@Param('jobId') jobId: string): JobData | undefined {
    const jobStatus = this.eligibilityService.getJobStatus(jobId);
    if (!jobStatus) {
      throw new NotFoundException('Job ID not found');
    }
    return jobStatus;
  }
}
