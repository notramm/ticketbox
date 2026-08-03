/**
 * webhook_events — UNIQUE(gateway_event_id) is the idempotency mechanism
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('webhook_events', (table) => {
    table.increments('id').primary();
    table.string('gateway_event_id', 255).notNullable().unique();
    table.string('event_type', 128).notNullable();
    table.boolean('signature_valid').notNullable().defaultTo(false);
    table.jsonb('payload').notNullable();
    table.timestamp('processed_at', { useTz: true }).nullable();
    table.text('error').nullable();
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('webhook_events');
};
