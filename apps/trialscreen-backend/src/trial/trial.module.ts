import { Module } from '@nestjs/common';
import { TrialService } from './trial.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  providers: [TrialService],
  exports: [TrialService],
})
export class TrialModule {}
