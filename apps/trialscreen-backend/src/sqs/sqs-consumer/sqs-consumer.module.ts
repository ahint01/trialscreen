import { Module } from '@nestjs/common';
import { SqsConsumerService } from './sqs-consumer.service';
import { EligibilityModule } from '../../eligibility/eligibility.module';

@Module({
  imports: [EligibilityModule],
  providers: [SqsConsumerService],
})
export class SqsConsumerModule {}
