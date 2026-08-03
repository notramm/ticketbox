/**
 * payments — store full Razorpay response in raw jsonb
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table
      .integer('booking_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('bookings')
      .onDelete('RESTRICT');
    table.string('gateway_order_id', 255).notNullable().unique();
    table.string('gateway_payment_id', 255).nullable();
    table.integer('amount_paise').notNullable();
    table.string('status', 64).notNullable();
    table.string('method', 64).nullable();
    table.jsonb('raw').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['booking_id']);
    table.check('amount_paise >= 0');
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('payments');
};
