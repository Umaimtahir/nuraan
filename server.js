const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'data', 'admin-config.json');
const PRODUCTS_PATH = path.join(__dirname, 'data', 'products.json');

// Helpers
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// --- Admin Config API ---
app.get('/api/config', (req, res) => {
  const config = readJSON(CONFIG_PATH);
  res.json(config);
});

app.put('/api/config', (req, res) => {
  const { password, ...updates } = req.body;
  if (password !== 'nuraan2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const config = readJSON(CONFIG_PATH);
  Object.assign(config, updates, { lastUpdated: new Date().toISOString() });
  writeJSON(CONFIG_PATH, config);
  res.json(config);
});

// --- Products API ---
app.get('/api/products', (req, res) => {
  const products = readJSON(PRODUCTS_PATH);
  const config = readJSON(CONFIG_PATH);
  // Calculate prices dynamically
  const enriched = products.map(p => {
    const catCode = p.sku.split('-').slice(0, 2).join('-');
    const makingCharge = config.makingCharges[catCode] || 1000;
    const prices = {};
    ['low', 'medium', 'high'].forEach(q => {
      prices[q] = Math.round(config.silverRate * p.weight * config.qualityMultipliers[q] + makingCharge);
    });
    return { ...p, prices, makingCharge };
  });
  res.json(enriched);
});

app.get('/api/products/:sku', (req, res) => {
  const products = readJSON(PRODUCTS_PATH);
  const config = readJSON(CONFIG_PATH);
  const product = products.find(p => p.sku === req.params.sku);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const catCode = product.sku.split('-').slice(0, 2).join('-');
  const makingCharge = config.makingCharges[catCode] || 1000;
  const prices = {};
  ['low', 'medium', 'high'].forEach(q => {
    prices[q] = Math.round(config.silverRate * product.weight * config.qualityMultipliers[q] + makingCharge);
  });
  res.json({ ...product, prices, makingCharge });
});

app.put('/api/products/:sku', (req, res) => {
  const { password, ...updates } = req.body;
  if (password !== 'nuraan2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const products = readJSON(PRODUCTS_PATH);
  const idx = products.findIndex(p => p.sku === req.params.sku);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  Object.assign(products[idx], updates);
  writeJSON(PRODUCTS_PATH, products);
  res.json(products[idx]);
});

// --- Add Product API ---
app.post('/api/products', (req, res) => {
  const { password, ...productData } = req.body;
  if (password !== 'nuraan2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!productData.sku || !productData.name || !productData.category || !productData.weight) {
    return res.status(400).json({ error: 'Missing required fields: sku, name, category, weight' });
  }
  const products = readJSON(PRODUCTS_PATH);
  // Check for duplicate SKU
  if (products.find(p => p.sku === productData.sku)) {
    return res.status(409).json({ error: 'A product with this SKU already exists' });
  }
  // Ensure proper defaults
  const newProduct = {
    sku: productData.sku,
    name: productData.name,
    category: productData.category,
    subType: productData.subType || '',
    weight: parseFloat(productData.weight),
    description: productData.description || '',
    stones: productData.stones || [],
    rhodiumOption: productData.rhodiumOption !== undefined ? productData.rhodiumOption : true,
    sizes: productData.sizes || [],
    topWidths: productData.topWidths || [],
    engravable: productData.engravable !== undefined ? productData.engravable : true,
    images: productData.images || [],
    featured: productData.featured || false,
  };
  products.push(newProduct);
  writeJSON(PRODUCTS_PATH, products);
  res.status(201).json(newProduct);
});

// --- Delete Product API ---
app.delete('/api/products/:sku', (req, res) => {
  const password = req.headers['x-admin-password'] || (req.body && req.body.password);
  if (password !== 'nuraan2026') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const products = readJSON(PRODUCTS_PATH);
  const idx = products.findIndex(p => p.sku === req.params.sku);
  if (idx === -1) return res.status(404).json({ error: 'Product not found' });
  const deleted = products.splice(idx, 1)[0];
  writeJSON(PRODUCTS_PATH, products);
  res.json({ message: 'Product deleted', product: deleted });
});

// --- Image Upload API ---
const UPLOAD_DIR = path.join(__dirname, 'public', 'assets', 'products');
// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Clean the original filename and add timestamp to avoid collisions
    const ext = path.extname(file.originalname).toLowerCase();
    const baseName = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .toLowerCase();
    const uniqueName = `${baseName}-${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
    }
  }
});

app.post('/api/upload', upload.array('images', 10), (req, res) => {
  // Password check via form field
  if (req.body.password !== 'nuraan2026') {
    // Delete any uploaded files if unauthorized
    if (req.files) {
      req.files.forEach(f => fs.unlinkSync(f.path));
    }
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images uploaded' });
  }
  const filenames = req.files.map(f => f.filename);
  res.json({ message: 'Images uploaded successfully', filenames });
});

// --- Categories API ---
app.get('/api/categories', (req, res) => {
  const products = readJSON(PRODUCTS_PATH);
  const categories = {};
  products.forEach(p => {
    const catCode = p.sku.split('-').slice(0, 2).join('-');
    if (!categories[catCode]) {
      categories[catCode] = { code: catCode, name: p.category, count: 0 };
    }
    categories[catCode].count++;
  });
  res.json(Object.values(categories));
});

// SPA fallback
app.get('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export for Vercel serverless functions
module.exports = app;

// Only listen locally, not on Vercel
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`NURAAN Server running at http://localhost:${PORT}`);
  });
}
