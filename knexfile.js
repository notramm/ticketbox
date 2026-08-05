require('./src/config/env');

/**
 * Knex config — DATABASE_URL is the single source of truth.
 * Migrations and seeds live under src/db/ as defined in the PRD.
 */
const shared = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  migrations: {
    directory: './src/db/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './src/db/seeds',
  },
  pool: {
    min: 0,
    max: 10,
  },
};

module.exports = {
  development: { ...shared },
  production: { ...shared },
};
