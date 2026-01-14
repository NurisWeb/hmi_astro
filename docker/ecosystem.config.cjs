// ============================================
// PM2 Ecosystem Configuration
// Prüfstand Dashboard
// ============================================

module.exports = {
  apps: [
    {
      name: 'astro-server',
      script: './dist/server/entry.mjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 4321,
      },
      max_memory_restart: '500M',
      error_file: '/var/log/pm2/astro-error.log',
      out_file: '/var/log/pm2/astro-out.log',
      merge_logs: true,
      time: true,
    },
    {
      name: 'nginx',
      script: 'nginx',
      args: '-g "daemon off;"',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      error_file: '/var/log/pm2/nginx-error.log',
      out_file: '/var/log/pm2/nginx-out.log',
    },
  ],
};
