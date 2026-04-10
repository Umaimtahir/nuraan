const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

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
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NURAAN Server running at http://localhost:${PORT}`);
});
