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

@Injectable()
export class SqsConsumerService implements OnModuleInit {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const awsRegion = this.configService.get<string>('AWS_REGION');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );
    const queueUrl = this.configService.get<string>('AWS_SQS_QUEUE_URL');

    if (!awsRegion || !accessKeyId || !secretAccessKey || !queueUrl) {
      throw new Error(
        'Missing one or more AWS SQS environment variables. Please check your .env file.',
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
      // Perform the eligibility checks
      const eligibilityReport = this.checkEligibility(
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

  private checkEligibility(
    text: string,
    inclusionCriteria: string[],
    exclusionCriteria: string[],
  ): { status: string; details: string[] } {
    const details: string[] = [];
    const lowerCaseText = text.toLowerCase();

    // Check inclusion criteria
    for (const criterion of inclusionCriteria) {
      const lowerCaseCriterion = criterion.toLowerCase();
      if (!lowerCaseText.includes(lowerCaseCriterion)) {
        details.push(`❌ MISMATCH: Missing inclusion criterion "${criterion}"`);
        return { status: 'INELIGIBLE', details };
      } else {
        details.push(`✅ MATCH: Found inclusion criterion "${criterion}"`);
      }
    }

    // Check exclusion criteria
    for (const criterion of exclusionCriteria) {
      const lowerCaseCriterion = criterion.toLowerCase();
      if (lowerCaseText.includes(lowerCaseCriterion)) {
        details.push(`❌ EXCLUSION: Found exclusion criterion "${criterion}"`);
        return { status: 'INELIGIBLE', details };
      } else {
        details.push(
          `✅ NO EXCLUSION: Did not find exclusion criterion "${criterion}"`,
        );
      }
    }

    details.push('🎉 ELIGIBLE: All criteria met.');
    return { status: 'ELIGIBLE', details };
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
