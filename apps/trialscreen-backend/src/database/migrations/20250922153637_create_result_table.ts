import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('result', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());

    table
      .uuid('document_id')
      .notNullable()
      .references('id')
      .inTable('document')
      .onDelete('CASCADE');

    table
      .uuid('trial_id')
      .notNullable()
      .references('id')
      .inTable('trial')
      .onDelete('CASCADE');

    table.jsonb('analysis_outcome').notNullable();

    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('result');
}
