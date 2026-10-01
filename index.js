const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

// ---- Load config ----
const CONFIG_PATH = path.join(__dirname, 'config.json');
let CONFIG = {};
try {
  CONFIG = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  console.log('✓ Loaded config.json');
} catch (e) {
  console.error('✗ config.json error:', e.message);
  process.exit(1);
}

app.use(express.json({ limit: '128kb' }));

// ---- Static files ----
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  immutable: true,
  setHeaders(res, filePath) {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// ============================================================
//  Public config (safe subset)
// ============================================================
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(CONFIG);
});

// ============================================================
//  Page routes
// ============================================================
const pages = {
  '/':          'index.html',
  '/profile':   'profile.html',
  '/hobbies':   'hobbies.html',
  '/contact':   'contact.html',
  '/gallery':   'gallery.html',
};

Object.entries(pages).forEach(([route, file]) => {
  app.get(route, (req, res, next) => {
    res.sendFile(path.join(__dirname, 'public', file), (err) => {
      if (err) next(err);
    });
  });
});

// ============================================================
//  404 handler — MUST be after all routes
// ============================================================
app.use((req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      error: 'API endpoint not found',
      path: req.path,
    });
  }
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'), (err) => {
    if (err) {
      res.status(404).type('html').send('<h1>404 — Not Found</h1>');
    }
  });
});

// ============================================================
//  500 handler — MUST be last with 4 args
// ============================================================
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: err.message,
    });
  }
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'), (sendErr) => {
    if (sendErr) {
      res.status(500).type('html').send('<h1>500 — Server Error</h1>');
    }
  });
});

// ============================================================
//  Export + local listen
// ============================================================
module.exports = app;
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`👤 Personal website at http://localhost:${PORT}`));
}