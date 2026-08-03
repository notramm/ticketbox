/**
 * bookings — ticket_code issued only on payment.captured webhook
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('bookings', (table) => {
    table.increments('id').primary();
    table
      .integer('event_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('events')
      .onDelete('RESTRICT');
    table.string('customer_name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 32).notNullable();
    table.integer('qty').notNullable();
    table.integer('amount_paise').notNullable();
    table.string('status', 32).notNullable().defaultTo('created'); // created|paid|failed|expired
    table.string('ticket_code', 64).nullable().unique();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['event_id']);
    table.index(['email']);
    table.check('qty > 0');
    table.check('amount_paise >= 0');
    table.check("status IN ('created', 'paid', 'failed', 'expired')");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('bookings');
};
