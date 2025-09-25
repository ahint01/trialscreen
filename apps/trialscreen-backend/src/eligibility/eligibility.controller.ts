import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
// IMPORTANT: Ensure you are importing all necessary types from the service
import { EligibilityService, EligibilityReport } from './eligibility.service';

// We define JobStatusResponse here to include 'not_found' for the API contract.
// This interface now stands alone and does not incorrectly extend JobData.
interface JobStatusResponse {
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  report?: EligibilityReport;
}

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
  @HttpCode(HttpStatus.OK)
  async startEligibilityCheck(
    @Body() payload: FrontendPayload,
  ): Promise<{ jobId: string }> {
    try {
      const { jobId } =
        await this.eligibilityService.processEligibilityCheck(payload);
      return { jobId };
    } catch (error) {
      console.error('Error starting eligibility check:', error);
      throw error;
    }
  }

  @Get('status/:jobId')
  // Fix: Removed 'async' keyword as the method is synchronous
  getJobStatus(@Param('jobId') jobId: string): JobStatusResponse {
    const jobStatus = this.eligibilityService.getJobStatus(jobId);

    if (!jobStatus) {
      // Return 200 OK with the expected 'not_found' status in the JSON body
      return { status: 'not_found' };
    }

    // The service returns JobData, which is structurally compatible
    return jobStatus as JobStatusResponse;
  }
}
