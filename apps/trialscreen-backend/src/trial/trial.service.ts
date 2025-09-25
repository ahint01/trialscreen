import { Injectable, Inject } from '@nestjs/common';
import type { Knex } from 'knex';
import { type Trial } from './trial.interface';

// Define a type for the raw data as it comes from the database.
// The criteria are actually native arrays, not JSON strings.
interface RawTrial {
  id: string;
  user_id: string;
  title: string;
  description: string;
  inclusion_criteria: string[]; // Corrected to reflect the database schema
  exclusion_criteria: string[]; // Corrected to reflect the database schema
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class TrialService {
  public readonly knex: Knex;

  constructor(@Inject('KNEX_CONNECTION') connection: Knex) {
    this.knex = connection;
  }

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
    try {
      // Knex will now correctly handle converting the JavaScript array
      // into a native PostgreSQL array.
      const [createdTrial] = await this.knex<RawTrial>('trial')
        .insert({
          user_id: trial.user_id,
          title: trial.title,
          description: trial.description,
          inclusion_criteria: trial.inclusion_criteria,
          exclusion_criteria: trial.exclusion_criteria,
        })
        .returning('*');
      return createdTrial;
    } catch (error) {
      // Log the specific database error to the console.
      console.error('Database insertion error in TrialService.create:', error);
      throw error;
    }
  }

  /**
   * Updates an existing trial.
   * @param id The ID of the trial to update.
   * @param updatedTrial The updated trial data.
   * @returns A promise that resolves to the updated Trial object, or null if not found.
   */
  async update(
    id: string,
    updatedTrial: Partial<Trial>,
  ): Promise<Trial | null> {
    const [result] = await this.knex<RawTrial>('trial')
      .where({ id })
      .update(updatedTrial)
      .returning('*');

    return result || null;
  }

  /**
   * Retrieves all trials for a specific user.
   * @param userId The ID of the user.
   * @returns A promise that resolves to an array of Trial objects.
   */
  async findAll(userId: string): Promise<Trial[]> {
    // Knex will now return the native array directly from the database.
    const rawTrials = await this.knex<RawTrial>('trial')
      .where({ user_id: userId })
      .select('*');

    return rawTrials;
  }

  /**
   * Finds a single trial by its ID and user ID.
   * @param id The ID of the trial.
   * @param userId The ID of the user who owns the trial.
   * @returns A promise that resolves to the Trial object, or null if not found.
   */
  async findOne(id: string, userId: string): Promise<Trial | null> {
    // Knex will now return the native array directly from the database.
    const rawTrial = await this.knex<RawTrial>('trial')
      .where({ id, user_id: userId })
      .first();

    if (!rawTrial) {
      return null;
    }
    return rawTrial;
  }
}
