import { Module } from '@nestjs/common';
import { SqsConsumerModule } from './sqs-consumer/sqs-consumer.module';
import { EligibilityModule } from '../eligibility/eligibility.module';
import { SqsService } from './sqs.service';

@Module({
  imports: [EligibilityModule, SqsConsumerModule],
  providers: [SqsService],
  exports: [SqsService],
})
export class SqsModule {}
