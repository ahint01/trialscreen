import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

@Injectable()
export class SqsService implements OnModuleInit {
  private sqsClient: SQSClient;
  private queueUrl: string;

  constructor(private configService: ConfigService) {}

  // We are removing the 'async' keyword as there are no 'await' expressions in this method.
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
  }

  /**
   * Sends a message to the SQS queue.
   *
   * @param messageBody The content to send to the queue.
   */
  async sendMessage(messageBody: any): Promise<void> {
    if (!this.sqsClient) {
      throw new Error('SQS client is not initialized.');
    }

    console.log('Attempting to send message to SQS...');
    const command = new SendMessageCommand({
      QueueUrl: this.queueUrl,
      MessageBody: JSON.stringify(messageBody),
    });

    try {
      await this.sqsClient.send(command);
      console.log('Message sent to SQS queue successfully.');
    } catch (error) {
      let errorMessage =
        'An unknown error occurred while sending a message to SQS.';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      console.error('Failed to send message to SQS:', errorMessage);
      console.error('Full Error Object:', error);
      throw new Error(errorMessage);
    }
  }
}
