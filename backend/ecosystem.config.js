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
      JWT_SECRET: process.env.JWT_SECRET || 'windowerp-2024-secure-jwt-secret-key-for-production',
      DATABASE_PATH: './database.db'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000,
      JWT_SECRET: process.env.JWT_SECRET || 'windowerp-2024-secure-jwt-secret-key-for-production',
      DATABASE_PATH: './database.db'
    },
    // 외부 접근을 위한 설정
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}; 