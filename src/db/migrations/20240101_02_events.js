/**
 * events — soft delete via deleted_at; money in paise (integer)
 */
exports.up = async function up(knex) {
  await knex.schema.createTable('events', (table) => {
    table.increments('id').primary();
    table.string('slug', 255).notNullable().unique();
    table.string('title', 255).notNullable();
    table.text('description');
    table.string('banner_key', 512);
    table.integer('price_paise').notNullable();
    table.integer('total_seats').notNullable();
    table.integer('seats_sold').notNullable().defaultTo(0);
    table.timestamp('starts_at', { useTz: true }).notNullable();
    table.string('status', 32).notNullable().defaultTo('draft'); // draft | published
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();

    table.check('price_paise >= 0');
    table.check('total_seats > 0');
    table.check('seats_sold >= 0');
    table.check("status IN ('draft', 'published')");
  });
};

exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('events');
};
