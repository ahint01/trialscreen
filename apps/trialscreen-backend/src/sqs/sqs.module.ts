import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SqsService } from './sqs.service';
import { SqsConsumerService } from './sqs-consumer/sqs-consumer.service';

@Module({
  imports: [ConfigModule],
  providers: [SqsService, SqsConsumerService],
  exports: [SqsService],
})
export class SqsModule {}
