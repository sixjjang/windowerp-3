const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:4000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '', // /api 경로를 제거하고 백엔드로 전달
      },
    })
  );

  // 정적 파일들 (sounds, images 등)은 프록시하지 않음
  // 이들은 public 폴더에서 직접 서빙됨
}; 