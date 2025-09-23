import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message,
} from '@aws-sdk/client-sqs';
import pdf from 'pdf-parse';

// Define the interface for the message body we are expecting from the queue.
interface QueueMessage {
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

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

    console.log(
      'Gemini API Key loaded from .env:',
      geminiApiKey ? '✅ Key found' : '❌ Key not found',
    );
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

    console.log(`Gemini API Key starts with: ${geminiApiKey.substring(0, 5)}`);
    this.queueUrl = queueUrl;
    this.sqsClient = new SQSClient({
      region: awsRegion,
      credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
      },
    });

    console.log(
      'SQS Consumer started. Polling for messages every 5 seconds...',
    );
    setInterval(() => {
      this.pollMessages().catch((error) =>
        console.error('Error during poll interval:', error),
      );
    }, 5000);
  }

  private async pollMessages() {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20,
      });

      const { Messages } = await this.sqsClient.send(command);

      if (Messages && Messages.length > 0) {
        console.log(`✅ Received ${Messages.length} message(s) from SQS.`);
        for (const message of Messages) {
          await this.processMessage(message);
        }
      } else {
        console.log('No messages available in the queue.');
      }
    } catch (error) {
      console.error('❌ Error polling SQS queue:', error);
    }
  }

  private async processMessage(message: Message) {
    console.log('---');
    console.log('Processing message:', message.MessageId);

    if (!message.Body) {
      console.error('Message body is empty. Skipping.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const messageBody: QueueMessage = JSON.parse(message.Body);
    console.log('Message Content:', messageBody);

    try {
      const buffer = Buffer.from(messageBody.fileBuffer, 'base64');
      console.log('✅ Converted base64 string to buffer.');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const data = await pdf(buffer);
      console.log('✅ PDF parsing completed successfully.');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const extractedText: string = data.text;
      const eligibilityReport = await this.checkEligibilityWithLLM(
        extractedText,
        messageBody.inclusionCriteria,
        messageBody.exclusionCriteria,
      );

      console.log('--- Eligibility Report ---');
      console.log(eligibilityReport);
      console.log('--------------------------');
    } catch (error) {
      console.error('❌ Failed to process PDF:', error);
    }

    await this.deleteMessage(message);

    console.log('Message processed and deleted.');
    console.log('---');
  }

  private async checkEligibilityWithLLM(
    text: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[],
  ): Promise<{ status: string; details: string[] }> {
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
          "string detailing each check (e.g., '✅ MATCH: Found inclusion criterion...')"
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
        throw new Error(
          `HTTP error! status: ${response ? response.status : 'unknown'}`,
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const jsonResponse: GeminiApiResponse = await response.json();
      const rawJsonString =
        jsonResponse?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawJsonString) {
        return {
          status: 'ERROR',
          details: ['LLM response was empty or malformed.'],
        };
      }
      // The API may return JSON wrapped in a markdown code block, so we strip it.
      const cleanedJsonString = rawJsonString
        .replace(/```json\n|```/g, '')
        .trim();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsedResponse: { status: string; details: string[] } =
        JSON.parse(cleanedJsonString);
      return parsedResponse;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return {
        status: 'ERROR',
        details: [
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          `Failed to check eligibility using LLM. Error: ${error.message}`,
        ],
      };
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
      console.error('❌ Error deleting message from SQS:', error);
    }
  }
}
