import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user', (table) => {
    table.string('password_hash').notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.alterTable('user', (table) => {
    table.dropColumn('password_hash');
  });
}
