const bcrypt = require('bcrypt');

/**
 * One admin user — password from ADMIN_PASSWORD env (dev only).
 */
exports.seed = async function seed(knex) {
  await knex('audit_logs').del();
  await knex('users').del();

  const email = process.env.ADMIN_EMAIL || 'admin@ticketbox.local';
  const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const password_hash = await bcrypt.hash(password, 10);

  await knex('users').insert({
    email,
    password_hash,
    role: 'admin',
  });
};
