import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
// FIX 1: Change problematic default import to standard CJS require
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse');
import {
  EligibilityService,
  EligibilityReport,
} from '../../eligibility/eligibility.service';

// Define the interface for the message body we are expecting from the queue.
interface QueueMessage {
  jobId: string;
  fileBuffer: string;
  fileName: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
}

// Define the interface for the Gemini API response structure.
interface GeminiApiResponse {
  candidates?: {
    content?: {
      parts?: {
        text?: string;
      }[];
    };
  }[];
}

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private sqsClient: SQSClient;
  private queueUrl: string;
  private geminiApiUrl: string =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=';

  constructor(
    private configService: ConfigService,
    private eligibilityService: EligibilityService,
  ) {}

  onModuleInit() {
    // ... (Initialization code omitted for brevity)
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (
      !awsRegion ||
      !accessKeyId ||
      !secretAccessKey ||
      !queueUrl ||
      !geminiApiKey
    ) {
      throw new Error(
        'Missing one or more environment variables. Please check your .env file.',
      );
    }

    this.queueUrl = queueUrl;
    this.sqsClient = new SQSClient({
      region: awsRegion,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log(
      'SQS Consumer initialized. Polling for messages every 5 seconds...',
    );
    setInterval(() => {
      this.pollMessages().catch((error) =>
        console.error('Error during poll interval:', error),
      );
    }, 5000);
  }

  // ... (pollMessages and processMessage methods are omitted for brevity, no changes needed)
  private async pollMessages() {
    try {
      console.log(
        `[SQS POLL] Checking queue: ${new Date().toLocaleTimeString()}`,
      );
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      });

      const { Messages } = await this.sqsClient.send(command);

      if (Messages && Messages.length > 0) {
        console.log(
          `[SQS POLL] SUCCESS: Received ${Messages.length} message(s).`,
        );
        for (const message of Messages) {
          await this.processMessage(message);
        }
      } else {
        console.log('[SQS POLL] Queue is empty. Waiting...');
      }
    } catch (error) {
      console.error('CRITICAL: Error polling SQS queue:', error);
    }
  }

  private async processMessage(message: Message) {
    console.log('---');
    console.log('Processing message:', message.MessageId);

    if (!message.Body) {
      console.error('Message body is empty. Skipping.');
      return;
    }

    const messageBody: QueueMessage = JSON.parse(message.Body) as QueueMessage;
    console.log('Message Content:', messageBody);
    const { jobId } = messageBody;

    try {
      const buffer = Buffer.from(messageBody.fileBuffer, 'base64');
      console.log(
        `Converted base64 string to buffer. Buffer size: ${buffer.length} bytes`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const data = await pdfParse(buffer);
      console.log(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `PDF parsing completed successfully. Extracted text length: ${data.text.length}`,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const extractedText: string = data.text;
      const eligibilityReport: EligibilityReport =
        await this.checkEligibilityWithLLM(
          extractedText,
          messageBody.inclusionCriteria,
          messageBody.exclusionCriteria,
        );

      console.log('--- Eligibility Report ---');
      console.log(eligibilityReport);
      console.log('--------------------------');

      this.eligibilityService.updateJobStatus(
        jobId,
        'completed',
        eligibilityReport,
      );

      await this.deleteMessage(message);

      console.log(
        'Message processed and deleted. Job status updated to completed.',
      );
    } catch (error) {
      console.error('--- CRITICAL FAILURE ---');
      console.error(`Failed to process job ${jobId}. Error:`, error);

      this.eligibilityService.updateJobStatus(jobId, 'failed');

      await this.deleteMessage(message);
    }

    console.log('---');
  }

  // FIX: Logic is correct, but we've removed the warnings by making minor adjustments
  // and ensuring all variables are used properly in the prompt string.
  private async checkEligibilityWithLLM(
    // The warnings were here, but the usage in the prompt below is correct.
    // The warnings are suppressed by the TypeScript compiler once it sees the variables used.
    text: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[],
  ): Promise<EligibilityReport> {
    // A simple sanity check log to confirm the arguments were successfully passed.
    console.log(
      `Building prompt for analysis (Inclusion Count: ${inclusionCriteria.length})`,
    );

    // The variables are correctly used here:
    const prompt = `
      You are a clinical trial screening assistant. Given a patient's medical record and a set of inclusion and exclusion criteria, your task is to determine the patient's eligibility for a clinical trial.

      Perform the following checks:
      1. Go through each item in the inclusion criteria. If the patient record matches the criterion, it's a "MATCH". If not, it's a "MISMATCH".
      2. If all inclusion criteria are matched, go through each item in the exclusion criteria. If the patient record contains an exclusion criterion, it's an "EXCLUSION". If not, it's a "NO EXCLUSION".

      You must provide a final status and a detailed breakdown of each check.

      Patient Medical Record:
      ${text}

      Inclusion Criteria:
      ${inclusionCriteria.join(', ')}

      Exclusion Criteria:
      ${exclusionCriteria.join(', ')}

      Provide your response as a JSON object with the following structure:
      {
        "status": "ELIGIBLE" or "INELIGIBLE",
        "details": [
          "string detailing each check (e.g., 'MATCH: Found inclusion criterion...')"
        ]
      }
    `;

    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    try {
      const response: Response = await fetch(this.geminiApiUrl + apiKey, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response || !response.ok) {
        const errorText = await response.text();
        console.error('Gemini API Non-200 Response:', errorText);
        throw new Error(
          `HTTP error! status: ${response ? response.status : 'unknown'}. Details: ${errorText.substring(0, 100)}`,
        );
      }

      const jsonResponse: GeminiApiResponse =
        (await response.json()) as GeminiApiResponse;
      const rawJsonString =
        jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJsonString) {
        return {
          status: 'ERROR',
          details: ['LLM response was empty or malformed.'],
        } as EligibilityReport;
      }
      const cleanedJsonString = rawJsonString
        .replace(/```json\n|```/g, '')
        .trim();
      const parsedResponse: EligibilityReport = JSON.parse(
        cleanedJsonString,
      ) as EligibilityReport;
      return parsedResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        status: 'ERROR',
        details: [
          `Failed to check eligibility using LLM. Error: ${error instanceof Error ? error.message : 'Unknown API error'}`,
        ],
      } as EligibilityReport;
    }
  }

  private async deleteMessage(message: Message) {
    try {
      const command = new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
      });

      await this.sqsClient.send(command);
    } catch (error) {
      console.error('Error deleting message from SQS:', error);
    }
  }
}
