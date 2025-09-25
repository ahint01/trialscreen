import { Inject, Injectable } from '@nestjs/common';
import type { Knex } from 'knex';
import { Trial } from './trial.interface';

// Define a type for the raw data as it comes from the database,
// where the criteria are stored as JSON strings.
interface RawTrial {
  id: string;
  user_id: string;
  title: string;
  description: string;
  inclusion_criteria: string; // Stored as a JSON string
  exclusion_criteria: string; // Stored as a JSON string
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TrialService {
  constructor(@Inject('KNEX_CONNECTION') private readonly knex: Knex) {}

  /**
   * Creates a new trial in the database, owned by a specific user.
   * @param trial The trial data to save.
   * @returns A promise that resolves to the newly created Trial object.
   */
  async create(trial: {
    user_id: string;
    title: string;
    description: string;
    inclusion_criteria: string[];
    exclusion_criteria: string[];
  }): Promise<Trial> {
    const [createdTrial] = await this.knex<RawTrial>('trial')
      .insert({
        ...trial,
        inclusion_criteria: JSON.stringify(trial.inclusion_criteria),
        exclusion_criteria: JSON.stringify(trial.exclusion_criteria),
      })
      .returning('*');
    // Convert the raw data back to the expected Trial type
    return {
      ...createdTrial,
      inclusion_criteria: JSON.parse(
        createdTrial.inclusion_criteria,
      ) as string[],
      exclusion_criteria: JSON.parse(
        createdTrial.exclusion_criteria,
      ) as string[],
    };
  }

  /**
   * Retrieves all trials for a specific user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of Trial objects.
   */
  async findAll(userId: string): Promise<Trial[]> {
    const rawTrials = await this.knex<RawTrial>('trial')
      .where({ user_id: userId })
      .select('*');

    // Convert the raw data to the expected Trial type
    return rawTrials.map((t) => ({
      ...t,
      inclusion_criteria: JSON.parse(t.inclusion_criteria) as string[],
      exclusion_criteria: JSON.parse(t.exclusion_criteria) as string[],
    }));
  }

  /**
   * Finds a single trial by its ID and user ID.
   * @param id The ID of the trial.
   * @param userId The ID of the user who owns the trial.
   * @returns A promise that resolves to the Trial object, or null if not found.
   */
  async findOne(id: string, userId: string): Promise<Trial | null> {
    const rawTrial = await this.knex<RawTrial>('trial')
      .where({ id, user_id: userId })
      .first();

    if (!rawTrial) {
      return null;
    }

    // Convert the raw data to the expected Trial type
    return {
      ...rawTrial,
      inclusion_criteria: JSON.parse(rawTrial.inclusion_criteria) as string[],
      exclusion_criteria: JSON.parse(rawTrial.exclusion_criteria) as string[],
    };
  }
}
