/**
 * audit_logs — every admin action (create/publish/unpublish, etc.)
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary();
    table
      .integer('actor_id')
      .unsigned()
      .nullable()
      .references('id')
      .inTable('users')
      .onDelete('SET NULL');
    table.string('action', 128).notNullable();
    table.string('entity', 64).notNullable();
    table.string('entity_id', 64).nullable();
    table.jsonb('meta').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['actor_id']);
    table.index(['entity', 'entity_id']);
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('audit_logs');
};
