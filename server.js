const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

// Hostinger'da DEV modunda açılmasını (sonsuz yüklenmeyi) kesin olarak engelliyoruz
const dev = false;
// Hostinger'ın atadığı portu alır, yoksa 3000 kullanır
const port = process.env.PORT || 3000;
const hostname = '127.0.0.1';

const app = next({ dev, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Sunucu hatası:', req.url, err);
      res.statusCode = 500;
      res.end('Sunucu Hatası');
    }
  })
    .once('error', (err) => {
      console.error('Sunucu başlatılamadı:', err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Uygulama hazır: Port ${port} uzerinde dinleniyor`);
    });
}).catch((err) => {
  console.error('Next.js başlatılamadı (Build hatası veya Veritabanı bağlantısı):', err);
  process.exit(1);
});