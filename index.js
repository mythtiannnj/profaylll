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
//  Agriculture facts pool
// ============================================================
const AGRI_FACTS = [
  "Agriculture employs over 1 billion people worldwide — about 1 in 3 workers.",
  "Rice feeds more than half of the world's population, making it the most consumed staple grain.",
  "It takes about 2,500 liters of water to grow just 1 kilogram of rice.",
  "The Philippines is the 8th largest rice producer in the world.",
  "Soil contains more living organisms in a single teaspoon than there are people on Earth.",
  "Agriculture is the world's largest employer, especially in developing nations.",
  "Coffee was first discovered in Ethiopia by a goat herder named Kaldi.",
  "Corn (maize) is grown on every continent except Antarctica.",
  "Bananas are technically berries, but strawberries are not.",
  "Around 40% of the world's food is produced by small-scale farmers.",
  "The Philippines grows over 100 varieties of rice, from upland to lowland.",
  "Bees pollinate 1 in every 3 bites of food we eat.",
  "Vertical farming uses up to 95% less water than traditional farming.",
  "Coconut trees can produce fruit for up to 100 years.",
  "One cow can produce up to 200,000 glasses of milk in its lifetime.",
  "The Philippines is one of the world's top 5 producers of coconuts.",
  "A single grain of wheat can produce up to 20,000 more grains when planted.",
  "Over 2,000 plant species have been used by humans for food, but only 200 dominate global agriculture.",
  "Sugarcane is the world's largest crop by production volume.",
  "Leyte is one of the Philippines' top coconut-producing provinces.",
  "Soil erosion can destroy up to 75 billion tons of topsoil worldwide each year.",
  "Farming is one of the oldest professions — dating back over 10,000 years.",
  "The 'Green Revolution' of the 1960s doubled food production in developing countries.",
  "One hectare of healthy soil can store up to 2,000 tons of carbon.",
  "Hydroponics — growing plants without soil — is over 1,000 years old."
];

// ============================================================
//  Public config (safe subset)
// ============================================================
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(CONFIG);
});

// ============================================================
//  Random agriculture fact API
// ============================================================
app.get('/api/agriculture-fact', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const fact = AGRI_FACTS[Math.floor(Math.random() * AGRI_FACTS.length)];
  res.json({
    success: true,
    fact,
    total: AGRI_FACTS.length,
    fetchedAt: new Date().toISOString(),
  });
});

// ============================================================
//  Page routes
// ============================================================
const pages = {
  '/':          'index.html',
  '/profile':   'profile.html',
  '/hobbies':   'hobbies.html',
  '/education': 'education.html',
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
//  404 handler
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
//  500 handler
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