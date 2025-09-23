import { Inject, Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import { Trial } from './trial.interface';

@Injectable()
export class TrialService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  async create(trial: {
    title: string;
    description: string;
    inclusion_criteria: string[];
    exclusion_criteria: string[];
  }): Promise<Trial> {
    const [createdTrial] = (await this.knex('trial')
      .insert(trial)
      .returning('*')) as Trial[];
    return createdTrial;
  }

  async getAll(): Promise<Trial[]> {
    return (await this.knex('trial').select('*')) as Trial[];
  }
}
