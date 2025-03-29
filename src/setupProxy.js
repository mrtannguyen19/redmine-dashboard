const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/redmine-api', // Đường dẫn proxy cục bộ
    createProxyMiddleware({
      target: 'http://localhost:3000', // Giá trị mặc định, sẽ thay đổi động
      changeOrigin: true,
      pathRewrite: {
        '^/redmine-api': '', // Loại bỏ prefix khi chuyển tiếp
      },
      router: (req) => {
        const targetUrl = req.headers['x-target-url']; // Lấy URL từ header
        if (!targetUrl) {
          throw new Error('No target URL specified in X-Target-URL header');
        }
        return targetUrl; // Chuyển tiếp đến URL đích
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).send('Proxy error occurred');
      },
    })
  );
};