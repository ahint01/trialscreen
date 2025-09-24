import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import SQS from 'aws-sdk/clients/sqs';
import { v4 as uuidv4 } from 'uuid';

// Define the shape of the data we'll store in the cache
export interface EligibilityReport {
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'ERROR';
  details?: string[];
}

// IMPORTANT: We must export this interface so the controller can use it.
export interface JobData {
  status: 'processing' | 'completed' | 'failed';
  report?: EligibilityReport;
}

// Define the interface for the payload coming from the frontend
interface FrontendPayload {
  fileBuffer: string;
  fileName: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
}

@Injectable()
export class EligibilityService {
  private readonly sqs: SQS;
  private readonly eligibilityJobs = new Map<string, JobData>();
  private readonly SQS_QUEUE_URL: string;

  constructor(private readonly configService: ConfigService) {
    const queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const region = this.configService.get<string>('AWS_REGION');

    if (!queueUrl || !accessKeyId || !secretAccessKey || !region) {
      throw new Error('Missing one or more AWS environment variables.');
    }

    this.SQS_QUEUE_URL = queueUrl;
    this.sqs = new SQS({
      region: region,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });
  }

  // Initial request handler
  async processEligibilityCheck(
    payload: FrontendPayload,
  ): Promise<{ jobId: string }> {
    const jobId: string = uuidv4();

    this.eligibilityJobs.set(jobId, { status: 'processing' });

    // By typing the input payload, we can now safely use the spread operator
    const sqsPayload = {
      ...payload,
      jobId,
    };

    const params: SQS.SendMessageRequest = {
      MessageBody: JSON.stringify(sqsPayload),
      QueueUrl: this.SQS_QUEUE_URL,
    };

    try {
      await this.sqs.sendMessage(params).promise();
      return { jobId };
    } catch (error: any) {
      console.error('Error sending message to SQS:', error);
      this.eligibilityJobs.delete(jobId);
      throw new Error('Failed to start eligibility check.');
    }
  }

  // New method to check the status of a job
  getJobStatus(jobId: string): JobData | undefined {
    return this.eligibilityJobs.get(jobId);
  }

  // This method needs to be called by your SQS consumer
  // to update the status of the job once it's complete.
  updateJobStatus(
    jobId: string,
    status: 'completed' | 'failed',
    report?: EligibilityReport,
  ) {
    if (this.eligibilityJobs.has(jobId)) {
      this.eligibilityJobs.set(jobId, { status, report });
    }
  }
}
