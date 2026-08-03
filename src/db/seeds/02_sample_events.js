/**
 * Sample events for local EJS / API development.
 * Prices are in paise: ₹499 = 49900.
 */
exports.seed = async function seed(knex) {
  // Clear dependent rows first (FKs), then events
  await knex('payments').del();
  await knex('bookings').del();
  await knex('webhook_events').del();
  await knex('events').del();

  const now = new Date();
  const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const inThreeWeeks = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000);
  const inOneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await knex('events').insert([
    {
      slug: 'intro-to-nodejs',
      title: 'Intro to Node.js Workshop',
      description:
        'A hands-on workshop covering Express, async patterns, and building your first API.',
      banner_key: null,
      price_paise: 49900,
      total_seats: 40,
      seats_sold: 0,
      starts_at: inTwoWeeks,
      status: 'published',
    },
    {
      slug: 'postgres-for-builders',
      title: 'PostgreSQL for Builders',
      description:
        'Transactions, indexes, and the FOR UPDATE lock pattern — with live demos.',
      banner_key: null,
      price_paise: 79900,
      total_seats: 30,
      seats_sold: 2,
      starts_at: inThreeWeeks,
      status: 'published',
    },
    {
      slug: 'aws-deploy-lab',
      title: 'AWS Deploy Lab (Draft)',
      description: 'EC2, nginx, PM2, and SSL — not published yet.',
      banner_key: null,
      price_paise: 99900,
      total_seats: 25,
      seats_sold: 0,
      starts_at: inOneMonth,
      status: 'draft',
    },
  ]);
};
