module.exports = {
  apps: [{
    name: 'windowerp-backend',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_PATH: './database.db',
      JWT_SECRET: 'windowerp-2024-secure-jwt-secret-key-for-production'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      DATABASE_PATH: './database.db',
      JWT_SECRET: 'windowerp-2024-secure-jwt-secret-key-for-production'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
}; 