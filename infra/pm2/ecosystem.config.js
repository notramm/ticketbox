/**
 * PM2 — two processes, one Backend repo (PRD Day 7).
 *
 * On the EC2 box:
 *   cd /home/ubuntu/ticketbox/Backend
 *   pm2 start infra/pm2/ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 *   # run the printed sudo command, then: pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'web',
      script: './src/web.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        WEB_PORT: 3000,
        PORT: 3000,
      },
    },
    {
      name: 'api',
      script: './src/api.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        API_PORT: 4000,
        PORT: 4000,
      },
    },
  ],
};
