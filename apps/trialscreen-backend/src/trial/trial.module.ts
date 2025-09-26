import { Module } from '@nestjs/common';
import { TrialService } from './trial.service';
import { DatabaseModule } from 'src/database/database.module';
import { TrialController } from './trial.controller';

@Module({
  imports: [DatabaseModule],
  providers: [TrialService],
  exports: [TrialService],
  controllers: [TrialController],
})
export class TrialModule {}
