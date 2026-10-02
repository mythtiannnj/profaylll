const express = require('express');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

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
//  Image API config
// ============================================================
const IMAGE_API = {
  url: 'https://api-library-kohi.onrender.com/api/freeimage',
  timeout: 60000,          // Render free tier can be slow on cold start
  maxSizeMB: 10,
};

// ============================================================
//  Agriculture facts pool — 75 facts
// ============================================================
const AGRI_FACTS = [
  // Global & General
  "Agriculture employs over 1 billion people worldwide — about 1 in 3 workers.",
  "Farming is one of the oldest professions — dating back over 10,000 years.",
  "Around 40% of the world's food is produced by small-scale farmers.",
  "Over 2,000 plant species have been used by humans for food, but only 200 dominate global agriculture.",
  "Agriculture is the world's largest employer, especially in developing nations.",
  "The 'Green Revolution' of the 1960s doubled food production in developing countries.",
  "About 1 in 9 people worldwide still experience food insecurity.",
  "Only 3% of the world's water is freshwater, and 70% of that is used for agriculture.",

  // Rice
  "Rice feeds more than half of the world's population, making it the most consumed staple grain.",
  "It takes about 2,500 liters of water to grow just 1 kilogram of rice.",
  "The Philippines grows over 100 varieties of rice, from upland to lowland.",
  "The Philippines is the 8th largest rice producer in the world.",
  "Rice paddies create artificial wetlands that support frogs, fish, and birds.",
  "Rice was first domesticated in the Yangtze River basin of China around 9,000 years ago.",
  "A single rice plant can produce up to 3,000 grains.",

  // Corn / Maize
  "Corn (maize) is grown on every continent except Antarctica.",
  "Corn was first domesticated in southern Mexico about 9,000 years ago.",
  "Every ear of corn has an even number of rows — usually 16.",
  "A single corn plant produces about 1 million pollen grains.",

  // Coconut
  "Coconut trees can produce fruit for up to 100 years.",
  "The Philippines is one of the world's top 5 producers of coconuts.",
  "Leyte is one of the Philippines' top coconut-producing provinces.",
  "A single coconut palm can yield up to 75 coconuts per year.",
  "Coconut water is naturally sterile and was used as an IV drip during WWII.",

  // Coffee
  "Coffee was first discovered in Ethiopia by a goat herder named Kaldi.",
  "Coffee is the second most traded commodity in the world after oil.",
  "It takes about 4,000 coffee beans to make 1 kilogram of roasted coffee.",
  "Coffee trees take 3 to 4 years before they produce their first harvest.",
  "Brazil has been the world's largest coffee producer for over 150 years.",
  "The Philippines is one of the few countries producing all 4 commercial coffee varieties.",

  // Fruits & Vegetables
  "Bananas are technically berries, but strawberries are not.",
  "Tomatoes are botanically fruits but legally classified as vegetables in the US.",
  "Avocados are fruits, and they contain more potassium than bananas.",
  "Mangoes are the most consumed fruit in the world.",
  "The Philippines is the world's 3rd largest banana producer.",
  "One pili nut tree can produce fruit for over 100 years.",
  "A single strawberry has about 200 seeds on its outer surface.",
  "Pineapples take 2 years to grow and each plant produces only one fruit.",

  // Soil
  "Soil contains more living organisms in a single teaspoon than there are people on Earth.",
  "One hectare of healthy soil can store up to 2,000 tons of carbon.",
  "Soil erosion can destroy up to 75 billion tons of topsoil worldwide each year.",
  "It takes 500 years to form just 1 inch of topsoil naturally.",
  "Earthworms can eat their own body weight in soil every day.",
  "Healthy soil can hold up to 3,750 gallons of water per acre.",

  // Bees & Pollination
  "Bees pollinate 1 in every 3 bites of food we eat.",
  "A single honeybee visits 50 to 100 flowers per trip.",
  "One bee colony can pollinate 300 million flowers in a day.",
  "Bees communicate by dancing — the 'waggle dance' tells others where nectar is.",

  // Livestock
  "One cow can produce up to 200,000 glasses of milk in its lifetime.",
  "Cows have almost panoramic vision — nearly 360 degrees.",
  "Chickens are the most numerous birds on Earth, with over 25 billion worldwide.",
  "A dairy cow drinks about 30 to 50 gallons of water per day.",
  "Goats were the first animals domesticated by humans, about 10,000 years ago.",

  // Sustainable & Modern Farming
  "Vertical farming uses up to 95% less water than traditional farming.",
  "Hydroponics — growing plants without soil — is over 1,000 years old.",
  "Aquaponics combines fish farming and hydroponics in a closed loop.",
  "Regenerative farming can sequester carbon and improve soil health at the same time.",
  "Precision agriculture uses GPS and drones to optimize water and fertilizer use.",
  "Agroforestry integrates trees with crops to boost biodiversity and yields.",

  // Grains & Others
  "A single grain of wheat can produce up to 20,000 more grains when planted.",
  "Sugarcane is the world's largest crop by production volume.",
  "Wheat was first cultivated around 9,000 years ago in the Fertile Crescent.",
  "Barley is one of the oldest cultivated grains — used in beer, bread, and soup.",
  "Cassava is the third-largest source of carbohydrates in the tropics.",
  "Soybeans are the most widely grown oilseed in the world.",
  "The Philippines produces about 8 million tons of sugarcane annually.",

  // Pests & Disease
  "Plant diseases cost the global economy over $220 billion each year.",
  "Invasive pests destroy up to 40% of global food crops annually.",
  "Integrated Pest Management (IPM) reduces pesticides by up to 50%.",
  "Crop rotation is one of the oldest methods to prevent soil-borne diseases.",

  // Agricultural Extension
  "Agricultural extension workers help farmers adopt new technology and improve yields.",
  "The first formal agricultural extension program began in Ireland in 1847.",
  "Extension services reach over 500 million farmers worldwide.",
  "Agricultural extension is credited with boosting rice yields in Asia during the Green Revolution.",
  "The 4 pillars of extension are: teaching, research, demonstration, and adoption.",

  // Philippines specific
  "Agriculture contributes about 10% of the Philippines' GDP.",
  "The Philippines has over 5.5 million hectares of rice paddies.",
  "One-third of Filipino workers are employed in agriculture.",
  "The average Filipino farmer is around 57 years old — the sector faces an aging crisis.",
  "The Philippines is a top exporter of coconut products, bananas, and pineapple.",
  "Palay (unmilled rice) is the Philippines' most important crop.",
  "Burauen, Leyte is known for its rich volcanic soil and rice terraces.",
];

// ============================================================
//  Helpers
// ============================================================
function formatBytes(bytes) {
  if (!bytes || typeof bytes !== 'number') return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
}

function normalizeUpload(data) {
  if (!data) {
    return { success: false, error: 'Empty response from upstream' };
  }

  // ---- api-library-kohi shape: { status, data: {...} } ----
  if (data.status === true && data.data && typeof data.data === 'object') {
    const d = data.data;
    const ext = d.filename ? d.filename.split('.').pop().toLowerCase() : null;
    return {
      success: true,
      url: d.url || '',
      displayUrl: d.display_url || d.url || '',
      mediumUrl: d.display_url || d.url || '',
      thumbUrl: d.display_url || d.url || '',
      viewerUrl: d.url || '',
      filename: d.filename || '',
      extension: ext,
      mime: ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : null,
      size: d.size || null,
      sizeFormatted: formatBytes(d.size),
      width: d.width || null,
      height: d.height || null,
      md5: d.md5 || null,
      date: new Date().toISOString(),
      raw: data,
    };
  }

  // ---- api-library-kohi error ----
  if (data.status === false) {
    return {
      success: false,
      error: data.message || data.error || 'Upload failed',
      raw: data,
    };
  }

  // ---- Generic { success: true, data: {...} } ----
  if (data.success === true && data.data && typeof data.data === 'object') {
    return normalizeUpload({ status: true, data: data.data });
  }

  // ---- Flat shape ----
  if (data.url) {
    const ext = data.filename ? data.filename.split('.').pop().toLowerCase() : null;
    return {
      success: true,
      url: data.url,
      displayUrl: data.display_url || data.url,
      mediumUrl: data.display_url || data.url,
      thumbUrl: data.display_url || data.url,
      viewerUrl: data.url,
      filename: data.filename || '',
      extension: ext,
      mime: data.mime || (ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : null),
      size: data.size || null,
      sizeFormatted: formatBytes(data.size),
      width: data.width || null,
      height: data.height || null,
      md5: data.md5 || null,
      date: data.date || new Date().toISOString(),
      raw: data,
    };
  }

  return {
    success: false,
    error: data.error?.message || data.error || data.message || 'Unknown response format',
    raw: data,
  };
}

// ============================================================
//  API: public config
// ============================================================
app.get('/api/config', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.json(CONFIG);
});

// ============================================================
//  API: random agriculture fact
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
//  API: image upload
//  POST /api/upload
//  Body (JSON):
//    { image: "data:image/png;base64,..." }  → file upload
//    { url:   "https://example.com/pic.jpg" } → URL upload
//  Proxies to: https://api-library-kohi.onrender.com/api/freeimage
// ============================================================
app.post('/api/upload', express.json({ limit: '15mb' }), async (req, res) => {
  const { image, url } = req.body || {};

  if (!image && !url) {
    return res.status(400).json({
      success: false,
      error: 'Provide either "image" (base64) or "url" (remote image URL)',
    });
  }

  try {
    let upstream;

    // ----------------------------------------
    // Case A: URL upload
    // ----------------------------------------
    if (url) {
      if (!/^https?:\/\//i.test(url)) {
        return res.status(400).json({ success: false, error: 'Invalid URL' });
      }

      // Try multipart with `source` field
      const form = new FormData();
      form.append('source', url);

      upstream = await axios.post(IMAGE_API.url, form, {
        headers: form.getHeaders(),
        timeout: IMAGE_API.timeout,
        validateStatus: () => true,
      });

      // Fallback to JSON body if multipart fails
      if (upstream.status >= 400) {
        upstream = await axios.post(
          IMAGE_API.url,
          { source: url, url },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: IMAGE_API.timeout,
            validateStatus: () => true,
          }
        );
      }
    }

    // ----------------------------------------
    // Case B: Base64 file upload
    // ----------------------------------------
    else {
      const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image format. Expected a base64 data URL.',
        });
      }

      const mimeType = match[1];
      const base64Data = match[2];
      const buffer = Buffer.from(base64Data, 'base64');

      if (buffer.length > IMAGE_API.maxSizeMB * 1024 * 1024) {
        return res.status(413).json({
          success: false,
          error: `Image too large (max ${IMAGE_API.maxSizeMB} MB)`,
        });
      }

      const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
      const filename = `upload-${Date.now()}.${ext}`;

      const form = new FormData();
      form.append('source', buffer, { filename, contentType: mimeType });
      form.append('image', buffer, { filename, contentType: mimeType });

      upstream = await axios.post(IMAGE_API.url, form, {
        headers: form.getHeaders(),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: IMAGE_API.timeout,
        validateStatus: () => true,
      });

      // Fallback to JSON body
      if (upstream.status >= 400) {
        upstream = await axios.post(
          IMAGE_API.url,
          { image, source: base64Data, filename, mime: mimeType },
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: IMAGE_API.timeout,
            validateStatus: () => true,
            maxBodyLength: Infinity,
          }
        );
      }
    }

    // ----------------------------------------
    // Normalize and return
    // ----------------------------------------
    const normalized = normalizeUpload(upstream.data);

    if (!normalized.success) {
      return res.status(502).json(normalized);
    }

    return res.json(normalized);

  } catch (error) {
    console.error('Upload error:', error.message);
    const upstream = error.response?.data;

    return res.status(error.response?.status || 500).json({
      success: false,
      error:
        upstream?.message ||
        upstream?.error?.message ||
        upstream?.error ||
        error.message ||
        'Upload failed',
      details: upstream || null,
    });
  }
});

// ============================================================
//  Page routes
// ============================================================
const pages = {
  '/':            'index.html',
  '/profile':     'profile.html',
  '/hobbies':     'hobbies.html',
  '/education':   'education.html',
  '/contact':     'contact.html',
  '/gallery':     'gallery.html',
  '/imguploader': 'imguploader.html',
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