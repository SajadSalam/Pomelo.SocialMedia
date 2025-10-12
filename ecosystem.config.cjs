module.exports = {
  apps: [
    {
      name: 'social-media-manager',
      script: '.output/server/index.mjs',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: 'logs/error.log',
      out_file: 'logs/output.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Wait for app to be ready before considering it online
      wait_ready: true,
      listen_timeout: 10000,
      // Graceful shutdown
      kill_timeout: 5000,
      // Restart delay
      restart_delay: 4000,
      // Max restarts in 1 min
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
}
