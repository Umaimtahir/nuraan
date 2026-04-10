/* =============================================
   NURAAN® Silver Jewellery — Main Application
   ============================================= */

const API_BASE = '';
const WHATSAPP_NUMBER = '923001234567';

// ============ STATE ============
const state = {
  config: null,
  products: [],
  cart: JSON.parse(localStorage.getItem('nuraan_cart') || '[]'),
  currentQuality: 'medium',
  currentRoute: '/',
  theme: localStorage.getItem('nuraan_theme') || 'dark',
};

// ============ HELPERS ============
function $(sel, ctx = document) { return ctx.querySelector(sel); }
function $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; }

function formatPrice(amount) {
  return 'Rs. ' + Number(amount).toLocaleString('en-PK');
}

function getProductPrice(product, quality = state.currentQuality) {
  if (product.prices) return product.prices[quality] || product.prices.medium;
  if (!state.config) return 0;
  const catCode = product.sku.split('-').slice(0, 2).join('-');
  const making = state.config.makingCharges[catCode] || 1000;
  const mult = state.config.qualityMultipliers[quality] || 1.25;
  return Math.round(state.config.silverRate * product.weight * mult + making);
}

function getProductImageSrc(product, idx = 0) {
  return '/assets/products/' + (product.images[idx] || 'placeholder.jpg');
}

function getHoverImageSrc(product) {
  const catCode = product.sku.split('-').slice(0, 2).join('-');
  const hoverMap = {
    'S-GR': '/assets/products/hover-mens-ring.jpg',
    'S-LR': '/assets/products/hover-womens-ring.jpg',
    'S-GC': '/assets/products/hover-mens-chain.jpg',
    'S-LC': '/assets/products/hover-womens-chain.jpg',
    'S-LS': '/assets/products/hover-locket-set.jpg',
    'S-MS': '/assets/products/hover-malla-set.jpg',
    'S-GS': '/assets/products/hover-gani-set.jpg',
    'S-GBR': '/assets/products/hover-mens-bracelet.jpg',
    'S-LBR': '/assets/products/hover-womens-bracelet.jpg',
    'S-ST': '/assets/products/hover-studs.jpg',
    'S-BT': '/assets/products/hover-buttons.jpg',
    'S-CL': '/assets/products/hover-cufflinks.jpg',
    'S-UT': '/assets/products/hover-utensils.jpg',
  };
  return hoverMap[catCode] || getProductImageSrc(product, 1);
}

function getCategorySlug(code) {
  const map = {
    'S-GR': 'gents-rings', 'S-LR': 'ladies-rings', 'S-GC': 'gents-chains',
    'S-LC': 'ladies-chains', 'S-LS': 'locket-sets', 'S-MS': 'malla-sets',
    'S-GS': 'gani-sets', 'S-GBR': 'gents-bracelet', 'S-LBR': 'ladies-bracelet',
    'S-ST': 'studs', 'S-BT': 'buttons', 'S-CL': 'cufflinks', 'S-UT': 'utensils'
  };
  return map[code] || code.toLowerCase();
}
function getCategoryCode(slug) {
  const map = {
    'gents-rings': 'S-GR', 'ladies-rings': 'S-LR', 'gents-chains': 'S-GC',
    'ladies-chains': 'S-LC', 'locket-sets': 'S-LS', 'malla-sets': 'S-MS',
    'gani-sets': 'S-GS', 'gents-bracelet': 'S-GBR', 'ladies-bracelet': 'S-LBR',
    'studs': 'S-ST', 'buttons': 'S-BT', 'cufflinks': 'S-CL', 'utensils': 'S-UT'
  };
  return map[slug] || slug;
}
function getCategoryName(code) {
  const map = {
    'S-GR': 'Gents Rings', 'S-LR': 'Ladies Rings', 'S-GC': 'Gents Chains',
    'S-LC': 'Ladies Chains', 'S-LS': 'Locket Sets', 'S-MS': 'Malla Sets',
    'S-GS': 'Gani Sets', 'S-GBR': 'Gents Bracelet', 'S-LBR': 'Ladies Bracelet',
    'S-ST': 'Studs', 'S-BT': 'Buttons', 'S-CL': 'Cufflinks', 'S-UT': 'Utensils'
  };
  return map[code] || code;
}

const CATEGORIES = [
  { code: 'S-GR', name: 'Gents Rings', subTypes: ['Turkish', 'Irani', 'Wedding Bands'] },
  { code: 'S-LR', name: 'Ladies Rings', subTypes: [] },
  { code: 'S-GC', name: 'Gents Chains', subTypes: [] },
  { code: 'S-LC', name: 'Ladies Chains', subTypes: [] },
  { code: 'S-LS', name: 'Locket Sets', subTypes: [] },
  { code: 'S-MS', name: 'Malla Sets', subTypes: [] },
  { code: 'S-GS', name: 'Gani Sets', subTypes: [] },
  { code: 'S-GBR', name: 'Gents Bracelet', subTypes: [] },
  { code: 'S-LBR', name: 'Ladies Bracelet', subTypes: [] },
  { code: 'S-ST', name: 'Studs', subTypes: [] },
  { code: 'S-BT', name: 'Buttons', subTypes: [] },
  { code: 'S-CL', name: 'Cufflinks', subTypes: [] },
  { code: 'S-UT', name: 'Utensils', subTypes: [] },
];

// ============ API ============
async function fetchConfig() {
  try {
    const res = await fetch(API_BASE + '/api/config');
    state.config = await res.json();
  } catch (e) { console.error('Failed to load config', e); }
}

async function fetchProducts() {
  try {
    const res = await fetch(API_BASE + '/api/products');
    state.products = await res.json();
  } catch (e) { console.error('Failed to load products', e); }
}

// ============ CART ============
function saveCart() {
  localStorage.setItem('nuraan_cart', JSON.stringify(state.cart));
  updateCartCount();
}

function addToCart(item) {
  state.cart.push(item);
  saveCart();
  openCartDrawer();
}

function removeFromCart(index) {
  state.cart.splice(index, 1);
  saveCart();
  renderCartItems();
}

function getCartTotal() {
  return state.cart.reduce((sum, item) => sum + (item.price || 0), 0);
}

function updateCartCount() {
  const el = $('#cart-count');
  if (state.cart.length > 0) {
    el.style.display = 'flex';
    el.textContent = state.cart.length;
  } else {
    el.style.display = 'none';
  }
}

function openCartDrawer() {
  $('#cart-drawer').classList.add('active');
  $('#cart-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
  renderCartItems();
}

function closeCartDrawer() {
  $('#cart-drawer').classList.remove('active');
  $('#cart-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

function renderCartItems() {
  const container = $('#cart-items');
  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <p>Your cart is empty</p>
      </div>`;
    $('#cart-total-price').textContent = 'Rs. 0';
    return;
  }
  container.innerHTML = state.cart.map((item, i) => {
    const itemProduct = state.products.find(p => p.sku === item.sku);
    const imgSrc = itemProduct ? getProductImageSrc(itemProduct) : '';
    return `
    <div class="cart-item">
      <img src="${imgSrc}" alt="${item.name}" class="cart-item-img" style="width:80px;height:80px;min-width:80px;object-fit:cover;" onerror="this.style.background='#f0f0f0'">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-details">
          ${item.size ? 'Size: ' + item.size : ''} ${item.quality ? '• ' + item.quality.toUpperCase() : ''}
          ${item.engraving ? '<br>Engraving: "' + item.engraving + '"' : ''}
        </div>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
        <div class="cart-item-remove" onclick="window.nuraan.removeFromCart(${i})">Remove</div>
      </div>
    </div>
  `;}).join('');
  $('#cart-total-price').textContent = formatPrice(getCartTotal());
}

// ============ NAVIGATION ============
function buildNav() {
  const navList = $('#nav-list');
  const mobileList = $('#mobile-nav-list');

  navList.innerHTML = CATEGORIES.map(cat => {
    const hasDropdown = cat.subTypes.length > 0;
    const dropdownHTML = hasDropdown ? `
      <div class="nav-dropdown">
        <a href="#" data-nav-cat="${getCategorySlug(cat.code)}">View All</a>
        ${cat.subTypes.map(st => `<a href="#" data-nav-cat="${getCategorySlug(cat.code)}" data-subtype="${st}">${st}</a>`).join('')}
      </div>
    ` : '';
    return `<li><a href="#" data-nav-cat="${getCategorySlug(cat.code)}">${cat.name}</a>${dropdownHTML}</li>`;
  }).join('');

  mobileList.innerHTML = CATEGORIES.map(cat => 
    `<li><a href="#" data-nav-cat="${getCategorySlug(cat.code)}">${cat.name}</a></li>`
  ).join('');

  // Click handlers
  $$('[data-nav-cat]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const slug = el.dataset.navCat;
      closeMobileMenu();
      navigate('/category/' + slug);
    });
  });

  // Footer nav
  $$('[data-nav]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate('/category/' + getCategorySlug(el.dataset.nav));
    });
  });
}

// ============ MOBILE MENU ============
function openMobileMenu() {
  $('#mobile-menu').classList.add('active');
  $('#mobile-menu-overlay').classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeMobileMenu() {
  $('#mobile-menu').classList.remove('active');
  $('#mobile-menu-overlay').classList.remove('active');
  document.body.style.overflow = '';
}

// ============ SEARCH ============
function openSearch() {
  $('#search-overlay').classList.add('active');
  setTimeout(() => $('#search-input').focus(), 100);
}
function closeSearch() {
  $('#search-overlay').classList.remove('active');
  $('#search-input').value = '';
  $('#search-results').innerHTML = '';
}
function performSearch(query) {
  if (!query.trim()) { $('#search-results').innerHTML = ''; return; }
  const q = query.toLowerCase();
  const results = state.products.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q) ||
    (p.subType && p.subType.toLowerCase().includes(q))
  ).slice(0, 10);

  $('#search-results').innerHTML = results.length ? results.map(p => `
    <div class="search-result-item" onclick="window.nuraan.navigate('/product/${p.sku}');window.nuraan.closeSearch();">
      <img src="${getProductImageSrc(p)}" alt="${p.name}" class="search-result-img" onerror="this.style.background='#f0f0f0';this.alt='${p.name.charAt(0)}'">
      <div class="search-result-info">
        <h4>${p.name}</h4>
        <p>${p.category} • ${p.sku} • ${formatPrice(getProductPrice(p))}</p>
      </div>
    </div>
  `).join('') : '<p style="text-align:center;color:#999;padding:40px 0;letter-spacing:1px;">No products found</p>';
}

// ============ ROUTER ============
function navigate(path) {
  history.pushState(null, '', path);
  handleRoute();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleRoute() {
  const path = window.location.pathname;
  state.currentRoute = path;
  const app = $('#app');

  if (path === '/' || path === '') {
    renderHomePage(app);
  } else if (path.startsWith('/category/')) {
    const slug = path.split('/category/')[1];
    renderCategoryPage(app, slug);
  } else if (path.startsWith('/product/')) {
    const sku = path.split('/product/')[1];
    renderProductPage(app, sku);
  } else if (path === '/admin') {
    renderAdminPage(app);
  } else {
    renderHomePage(app);
  }

  // Re-observe fade-ins
  setTimeout(observeFadeIns, 100);
}

// ============ HOME PAGE ============
function renderHomePage(container) {
  document.title = 'NURAAN® — Silver Jewellery | Handcrafted in Pakistan';

  const featuredProducts = state.products.filter(p => p.featured);

  container.innerHTML = `
    <!-- Hero -->
    <section class="hero-section" id="hero">
      <div class="hero-slide active">
        <img src="/assets/hero-1.jpg" alt="NURAAN Silver Jewellery" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #0d0d0d)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>Crafted To Become<br>Part of Your Story</h1>
          <p>Premium 925 Silver Jewellery — Handcrafted in Pakistan</p>
          <button class="btn" onclick="window.nuraan.navigate('/category/gents-rings')"><span>Explore Collection</span></button>
        </div>
      </div>
      <div class="hero-slide">
        <img src="/assets/hero-2.jpg" alt="NURAAN Rings" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #2a2a2a, #1a1a1a)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>A Promise, A Memory,<br>A Story That Stays</h1>
          <p>Explore our signature silver collection</p>
          <button class="btn" onclick="window.nuraan.navigate('/category/ladies-rings')"><span>Shop Now</span></button>
        </div>
      </div>
      <div class="hero-slide">
        <img src="/assets/hero-3.jpg" alt="NURAAN Bracelets" class="hero-slide-bg" onerror="this.style.background='linear-gradient(135deg, #0d0d0d, #2a2a2a)';this.style.width='100%';this.style.height='100%'">
        <div class="hero-content">
          <h1>The Mark of<br>True Craftsmanship</h1>
          <p>Made to order — because perfection can't be mass-produced</p>
          <button class="btn" onclick="window.nuraan.navigate('/category/gents-chains')"><span>Discover More</span></button>
        </div>
      </div>
      <div class="hero-dots">
        <button class="hero-dot active" data-slide="0"></button>
        <button class="hero-dot" data-slide="1"></button>
        <button class="hero-dot" data-slide="2"></button>
      </div>
    </section>

    <!-- Featured Collection -->
    <section class="section-block fade-in">
      <div class="section-header">
        <h2 class="section-title">Featured Collection</h2>
        <p class="section-subtitle">Handpicked pieces for the discerning</p>
      </div>
      <div class="product-grid">
        ${featuredProducts.slice(0, 8).map(p => renderProductCard(p)).join('')}
      </div>
      <div style="text-align:center;margin-top:48px;">
        <button class="btn" onclick="window.nuraan.navigate('/category/gents-rings')"><span>View All</span></button>
      </div>
    </section>

    <!-- Lifestyle Banner 1 -->
    <section class="lifestyle-banner fade-in">
      <img src="/assets/hero-2.jpg" alt="Rings" class="lifestyle-banner-bg" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #2a2a2a)';this.style.width='100%';this.style.height='100%'">
      <div class="lifestyle-banner-content">
        <h2>Rings That Reflect You</h2>
        <p>Explore our exclusive ring collection</p>
        <button class="btn" onclick="window.nuraan.navigate('/category/ladies-rings')"><span>Learn More</span></button>
      </div>
    </section>

    <!-- Category Tiles -->
    <section class="section-block fade-in">
      <div class="section-header">
        <h2 class="section-title">Shop By Category</h2>
        <p class="section-subtitle">Find the perfect piece for every occasion</p>
      </div>
      <div class="category-grid">
        ${CATEGORIES.map(cat => {
          const catProducts = state.products.filter(p => p.sku.startsWith(cat.code));
          const catImg = catProducts.length > 0 ? getProductImageSrc(catProducts[0]) : '/assets/cat-rings.jpg';
          return `
          <div class="category-tile" onclick="window.nuraan.navigate('/category/${getCategorySlug(cat.code)}')">
            <img src="${catImg}" alt="${cat.name}" class="category-tile-img" onerror="this.parentElement.querySelector('.category-tile-overlay').style.background='linear-gradient(135deg, #333, #111)'">
            <div class="category-tile-overlay">
              <span class="category-tile-name">${cat.name}</span>
              <span class="category-tile-count">${state.products.filter(p => p.sku.startsWith(cat.code)).length} Products</span>
            </div>
          </div>
        `;}).join('')}
      </div>
    </section>

    <!-- Lifestyle Banner 2 -->
    <section class="lifestyle-banner fade-in">
      <img src="/assets/hero-3.jpg" alt="Men's Collection" class="lifestyle-banner-bg" onerror="this.style.background='linear-gradient(135deg, #0d0d0d, #1a1a1a)';this.style.width='100%';this.style.height='100%'">
      <div class="lifestyle-banner-content">
        <h2>The Mark of a Man</h2>
        <p>Bold silver pieces for the modern gentleman</p>
        <button class="btn" onclick="window.nuraan.navigate('/category/gents-bracelet')"><span>Explore Men's</span></button>
      </div>
    </section>

    <!-- More Featured -->
    <section class="section-block fade-in">
      <div class="section-header">
        <h2 class="section-title">Always In Demand</h2>
        <p class="section-subtitle">Our most loved pieces</p>
      </div>
      <div class="product-grid">
        ${featuredProducts.slice(8, 16).map(p => renderProductCard(p)).join('')}
      </div>
    </section>

    <!-- Trust Badges -->
    <section class="trust-badges fade-in">
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        <span class="trust-badge-title">925 Silver Excellence</span>
        <span class="trust-badge-text">Certified Premium Silver</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <span class="trust-badge-title">Handcrafted</span>
        <span class="trust-badge-text">To Perfection</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
        <span class="trust-badge-title">Free & Secure</span>
        <span class="trust-badge-text">Delivery Nationwide</span>
      </div>
      <div class="trust-badge">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        <span class="trust-badge-title">Lifetime Plating</span>
        <span class="trust-badge-text">Service Available</span>
      </div>
    </section>

    <!-- Brand Story -->
    <section class="brand-story fade-in">
      <h2>NURAAN: Not Just a Brand, But a Philosophy</h2>
      <p>A belief that every piece of jewelry should echo the deep, multifaceted, and often unseen dimensions of a person's essence. Jewelry isn't just about adornment; it's about telling stories, embodying strength, embracing vulnerability, and reflecting the legacy of its wearer. Each NURAAN piece is handcrafted in 925 sterling silver with the utmost attention to detail, ensuring that you receive nothing less than perfection.</p>
    </section>
  `;

  // Hero slider auto-advance
  initHeroSlider();
}

function initHeroSlider() {
  let currentSlide = 0;
  const slides = $$('.hero-slide');
  const dots = $$('.hero-dot');
  if (slides.length === 0) return;

  function goToSlide(n) {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = n % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
  }

  dots.forEach(dot => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide)));
  });

  setInterval(() => goToSlide(currentSlide + 1), 6000);
}

// ============ PRODUCT CARD ============
function renderProductCard(product) {
  const price = getProductPrice(product);
  return `
    <div class="product-card" onclick="window.nuraan.navigate('/product/${product.sku}')">
      <div class="product-card-img-wrap">
        <img src="${getProductImageSrc(product, 0)}" alt="${product.name}" class="product-card-img" onerror="this.style.background='#f0f0f0'">
        <img src="${getHoverImageSrc(product)}" alt="${product.name} on hand" class="product-card-img-hover" onerror="this.style.background='linear-gradient(135deg, #2a2a2a, #1a1a1a)'">
        ${product.featured ? '<div class="product-card-badge">Featured</div>' : ''}
        <div class="product-card-quick">Quick View</div>
      </div>
      <div class="product-card-info">
        <div class="product-card-name">${product.name}</div>
        <div class="product-card-sku">${product.sku}</div>
        <div class="product-card-price">${formatPrice(price)}</div>
      </div>
    </div>
  `;
}

// ============ CATEGORY PAGE ============
function renderCategoryPage(container, slug) {
  const code = getCategoryCode(slug);
  const name = getCategoryName(code);
  const products = state.products.filter(p => p.sku.startsWith(code));
  document.title = `${name} — NURAAN® Silver Jewellery`;

  container.innerHTML = `
    <div class="category-header">
      <h1>${name}</h1>
      <p>${products.length} Products</p>
    </div>
    <div class="category-filters">
      <span class="filter-count">${products.length} products</span>
      <div class="filter-sort">
        <label>Sort by:</label>
        <select id="sort-select">
          <option value="featured">Featured</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name">Name: A-Z</option>
        </select>
      </div>
    </div>
    <section class="section-block">
      <div class="product-grid" id="category-products">
        ${products.map(p => renderProductCard(p)).join('')}
      </div>
    </section>
  `;

  // Sort handler
  const sortSelect = $('#sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      let sorted = [...products];
      switch (sortSelect.value) {
        case 'price-low': sorted.sort((a, b) => getProductPrice(a) - getProductPrice(b)); break;
        case 'price-high': sorted.sort((a, b) => getProductPrice(b) - getProductPrice(a)); break;
        case 'name': sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
        default: sorted.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
      }
      $('#category-products').innerHTML = sorted.map(p => renderProductCard(p)).join('');
    });
  }
}

// ============ PRODUCT DETAIL PAGE ============
function renderProductPage(container, sku) {
  const product = state.products.find(p => p.sku === sku);
  if (!product) {
    container.innerHTML = '<div style="text-align:center;padding:80px;"><h2>Product Not Found</h2></div>';
    return;
  }

  document.title = `${product.name} — NURAAN® Silver Jewellery`;

  const defaultQuality = 'medium';
  const price = getProductPrice(product, defaultQuality);
  const hasStones = product.stones && product.stones.length > 0;
  const hasTopWidths = product.topWidths && product.topWidths.length > 0;

  container.innerHTML = `
    <div class="product-detail">
      <!-- Gallery -->
      <div class="product-gallery">
        <div class="product-gallery-badge">
          <span>Made To Order</span>
          <small>Crafted Exclusively For You.</small>
        </div>
        <img id="pd-main-image" src="${getProductImageSrc(product, 0)}" alt="${product.name}" class="product-gallery-main" onerror="this.style.background='linear-gradient(135deg, #1a1a1a, #0d0d0d)'">
        <div class="product-thumbs">
          ${product.images.map((img, i) => `
            <img src="${getProductImageSrc(product, i)}" alt="${product.name} view ${i+1}" class="product-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" onerror="this.style.background='#333'">
          `).join('')}
        </div>
      </div>

      <!-- Info -->
      <div class="product-info">
        <h1 class="product-title">${product.name}</h1>
        <div class="product-price" id="pd-price">${formatPrice(price)}</div>

        <div class="product-customize-title">Customize Your ${product.category.includes('Ring') ? 'Ring' : 'Piece'}</div>
        <div class="product-customize-subtitle">Make it uniquely yours.</div>

        <!-- Size -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Size *</span>
            <a href="#" class="option-group-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
              Size Guide
            </a>
          </div>
          <div class="option-pills" id="pd-sizes">
            ${product.sizes.map((s, i) => `
              <button class="option-pill ${i === 2 ? 'active' : ''}" data-size="${s}">${s}</button>
            `).join('')}
          </div>
          <div class="custom-size-wrap">
            <input type="number" class="custom-size-input" id="pd-custom-size" placeholder="Custom">
            <span class="custom-size-label">Enter custom size (mm/inches)</span>
          </div>
        </div>

        ${hasStones ? `
        <!-- Stone -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Choose Stone *</span>
          </div>
          <div class="stone-options">
            ${product.stones.map((s, i) => `
              <div class="stone-card ${i === 0 ? 'active' : ''}" data-stone="${s}">
                <img src="/assets/stones/${s.toLowerCase()}.png" class="stone-img" alt="${s}">
                <div class="stone-info">
                  <div class="stone-name">${s}</div>
                  <div class="stone-desc">${s.toLowerCase() === 'moissanite' ? 'Exceptional Brilliance' : 'Classic Elegance'}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        ${product.rhodiumOption ? `
        <!-- Rhodium Plating -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Rhodium Plating *</span>
            <span class="option-group-link" title="Adds a protective layer for extra shine">ⓘ</span>
          </div>
          <div class="option-pills" id="pd-rhodium">
            <button class="option-pill active" data-rhodium="yes">Yes, Add Rhodium</button>
            <button class="option-pill" data-rhodium="no">No, Thanks</button>
          </div>
        </div>
        ` : ''}

        ${hasTopWidths ? `
        <!-- Top Width -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Top Width *</span>
          </div>
          <div class="option-pills" id="pd-widths">
            ${product.topWidths.map((w, i) => `
              <button class="option-pill ${i === 1 ? 'active' : ''}" data-width="${w}">${w}</button>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <!-- Weight/Feel (Quality) -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Weight / Feel *</span>
          </div>
          <div class="option-pills" id="pd-quality">
            <button class="option-pill" data-quality="low">Light</button>
            <button class="option-pill active" data-quality="medium">Medium</button>
            <button class="option-pill" data-quality="high">Heavy</button>
          </div>
          <p style="font-size:11px;color:#999;margin-top:8px;">Affects thickness and final feel of the piece.</p>
        </div>

        ${product.engravable ? `
        <!-- Engraving -->
        <div class="option-group">
          <div class="option-group-header">
            <span class="option-group-label">Engraving (Inside)</span>
            <span style="font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;">Optional</span>
          </div>
          <div class="engrave-input-wrap">
            <input type="text" class="engrave-input" id="pd-engraving" maxlength="15" placeholder="Enter text (up to 15 characters)">
            <span class="engrave-counter" id="pd-engrave-count">0/15</span>
          </div>
        </div>
        ` : ''}

        <!-- Actions -->
        <div class="product-actions">
          <button class="btn btn-full" id="pd-add-cart" style="border-color:#000;"><span>Add To Cart</span></button>
          <button class="btn btn-primary btn-full" id="pd-buy-now"><span>Buy It Now</span></button>
        </div>

        <!-- Trust Badges Mini -->
        <div class="trust-badges" style="margin-top:32px;border:none;">
          <div class="trust-badge" style="padding:20px 8px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <span class="trust-badge-title" style="font-size:9px;">925 Silver<br>Excellence</span>
          </div>
          <div class="trust-badge" style="padding:20px 8px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
            <span class="trust-badge-title" style="font-size:9px;">Handcrafted<br>To Perfection</span>
          </div>
          <div class="trust-badge" style="padding:20px 8px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span class="trust-badge-title" style="font-size:9px;">Free & Secure<br>Delivery</span>
          </div>
          <div class="trust-badge" style="padding:20px 8px;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <span class="trust-badge-title" style="font-size:9px;">Lifetime<br>Plating Service</span>
          </div>
        </div>

        <!-- Accordions -->
        <div class="accordion-list">
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Product Details</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>${product.description}</p>
                <br>
                <p><strong>SKU:</strong> ${product.sku}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                ${product.subType ? `<p><strong>Type:</strong> ${product.subType}</p>` : ''}
                <p><strong>Weight:</strong> ~${product.weight}g (varies by size)</p>
                <p><strong>Material:</strong> 925 Sterling Silver</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Shipping Information</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>Free shipping across Pakistan. Orders are handcrafted and dispatched within 7-10 business days. Tracking information will be provided via WhatsApp.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Easy Return & Exchange</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>We offer a 30-day exchange policy. Items must be returned in original packaging and condition. Custom engraved items are non-returnable.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Personalize It, Make It Yours</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>Add a personal touch with custom engraving. Up to 15 characters can be engraved on the inside of rings and bracelets. Custom sizes are also available — just specify your exact measurements.</p>
              </div>
            </div>
          </div>
          <div class="accordion-item">
            <div class="accordion-header">
              <span>Lifetime Plating Services</span>
              <span class="accordion-icon">+</span>
            </div>
            <div class="accordion-body">
              <div class="accordion-body-inner">
                <p>All NURAAN silver pieces come with lifetime rhodium plating service. Visit our workshop anytime for a fresh re-plating to maintain the brilliance of your jewelry.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // --- Product page interactions ---
  initProductDetailInteractions(product);
}

function initProductDetailInteractions(product) {
  // Option pills (size, width, quality, rhodium)
  $$('.option-pills').forEach(group => {
    const pills = $$('.option-pill', group);
    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        // Update price if quality changed
        if (pill.dataset.quality) {
          const newPrice = getProductPrice(product, pill.dataset.quality);
          $('#pd-price').textContent = formatPrice(newPrice);
        }
      });
    });
  });

  // Stone cards
  $$('.stone-card').forEach(card => {
    card.addEventListener('click', () => {
      $$('.stone-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });

  // Engraving counter
  const engInput = $('#pd-engraving');
  const engCount = $('#pd-engrave-count');
  if (engInput && engCount) {
    engInput.addEventListener('input', () => {
      engCount.textContent = engInput.value.length + '/15';
    });
  }

  // Accordions
  $$('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');
      // Close all
      $$('.accordion-item').forEach(ai => {
        ai.classList.remove('open');
        ai.querySelector('.accordion-body').style.maxHeight = '0';
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Add to cart
  const addCartBtn = $('#pd-add-cart');
  if (addCartBtn) {
    addCartBtn.addEventListener('click', () => {
      const quality = $('.option-pill.active[data-quality]')?.dataset.quality || 'medium';
      const size = $('.option-pill.active[data-size]')?.dataset.size || $('#pd-custom-size')?.value || '';
      const engraving = $('#pd-engraving')?.value || '';

      addToCart({
        sku: product.sku,
        name: product.name,
        quality,
        size,
        engraving,
        price: getProductPrice(product, quality),
      });
    });
  }

  // Buy now
  const buyBtn = $('#pd-buy-now');
  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      const quality = $('.option-pill.active[data-quality]')?.dataset.quality || 'medium';
      const size = $('.option-pill.active[data-size]')?.dataset.size || '';
      const engraving = $('#pd-engraving')?.value || '';
      const price = getProductPrice(product, quality);

      const msg = `Hi! I'd like to order:\n\n*${product.name}*\nSKU: ${product.sku}\nSize: ${size}\nQuality: ${quality}\n${engraving ? 'Engraving: ' + engraving + '\n' : ''}Price: ${formatPrice(price)}\n\nPlease confirm availability.`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, '_blank');
    });
  }

  // Thumbnail click
  $$('.product-thumb').forEach(thumb => {
    thumb.addEventListener('click', () => {
      $$('.product-thumb').forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      const idx = parseInt(thumb.dataset.idx);
      const mainImg = $('#pd-main-image');
      if (mainImg) mainImg.src = getProductImageSrc(product, idx);
    });
  });
}

// ============ ADMIN PAGE ============
function renderAdminPage(container) {
  document.title = 'Admin Panel — NURAAN®';

  container.innerHTML = `
    <div class="admin-page">
      <div class="admin-header">
        <h1>Admin Panel</h1>
        <p style="color:#999;margin-top:8px;font-size:13px;">Manage silver rates, quality multipliers, and making charges</p>
      </div>

      <div id="admin-login-section" class="admin-login">
        <h3 style="margin-bottom:20px;font-family:var(--font-heading);font-size:24px;letter-spacing:2px;">Enter Admin Password</h3>
        <input type="password" id="admin-password" placeholder="••••••••">
        <button class="btn btn-primary btn-full" id="admin-login-btn"><span>Login</span></button>
      </div>

      <div id="admin-content" style="display:none;">
        <!-- Silver Rate -->
        <div class="admin-section">
          <h3>Silver Rate Configuration</h3>
          <div class="admin-row">
            <label>Silver Rate (Rs/gram)</label>
            <input type="number" id="admin-silver-rate" value="${state.config?.silverRate || 280}">
          </div>
          <div class="admin-row">
            <label>High Quality Multiplier</label>
            <input type="number" step="0.01" id="admin-mult-high" value="${state.config?.qualityMultipliers?.high || 1.5}">
          </div>
          <div class="admin-row">
            <label>Medium Quality Multiplier</label>
            <input type="number" step="0.01" id="admin-mult-medium" value="${state.config?.qualityMultipliers?.medium || 1.25}">
          </div>
          <div class="admin-row">
            <label>Low Quality Multiplier</label>
            <input type="number" step="0.01" id="admin-mult-low" value="${state.config?.qualityMultipliers?.low || 1.0}">
          </div>
          <button class="btn btn-primary" id="admin-save-config"><span>Save Configuration</span></button>
          <div id="admin-config-status"></div>
        </div>

        <!-- Making Charges -->
        <div class="admin-section">
          <h3>Making Charges by Category</h3>
          <table class="admin-products-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Code</th>
                <th>Making Charge (Rs)</th>
              </tr>
            </thead>
            <tbody>
              ${CATEGORIES.map(cat => `
                <tr>
                  <td>${cat.name}</td>
                  <td>${cat.code}</td>
                  <td><input type="number" class="admin-making-charge" data-code="${cat.code}" value="${state.config?.makingCharges?.[cat.code] || 1000}"></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="admin-save-making"><span>Save Making Charges</span></button>
          </div>
          <div id="admin-making-status"></div>
        </div>

        <!-- Products Table -->
        <div class="admin-section">
          <h3>Product Weights</h3>
          <table class="admin-products-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Category</th>
                <th>Weight (g)</th>
                <th>Low Price</th>
                <th>Med Price</th>
                <th>High Price</th>
              </tr>
            </thead>
            <tbody>
              ${state.products.map(p => `
                <tr>
                  <td>${p.sku}</td>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td><input type="number" class="admin-product-weight" data-sku="${p.sku}" value="${p.weight}"></td>
                  <td>${formatPrice(getProductPrice(p, 'low'))}</td>
                  <td>${formatPrice(getProductPrice(p, 'medium'))}</td>
                  <td>${formatPrice(getProductPrice(p, 'high'))}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top:16px;">
            <button class="btn btn-primary" id="admin-save-products"><span>Save Product Weights</span></button>
          </div>
          <div id="admin-products-status"></div>
        </div>

        <p style="text-align:center;color:#999;font-size:12px;margin-top:20px;">Last updated: ${state.config?.lastUpdated ? new Date(state.config.lastUpdated).toLocaleString() : 'N/A'}</p>
      </div>
    </div>
  `;

  // Admin login
  const loginBtn = $('#admin-login-btn');
  const pwInput = $('#admin-password');
  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (pwInput.value === 'nuraan2026') {
        $('#admin-login-section').style.display = 'none';
        $('#admin-content').style.display = 'block';
      } else {
        alert('Incorrect password');
      }
    });
  }

  // Save config
  const saveConfigBtn = $('#admin-save-config');
  if (saveConfigBtn) {
    saveConfigBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(API_BASE + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: 'nuraan2026',
            silverRate: parseFloat($('#admin-silver-rate').value),
            qualityMultipliers: {
              high: parseFloat($('#admin-mult-high').value),
              medium: parseFloat($('#admin-mult-medium').value),
              low: parseFloat($('#admin-mult-low').value),
            }
          })
        });
        const data = await res.json();
        state.config = data;
        await fetchProducts();
        showStatus('admin-config-status', 'Configuration saved successfully!', 'success');
        // Refresh admin page to show new prices
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-config-status', 'Failed to save: ' + e.message, 'error');
      }
    });
  }

  // Save making charges
  const saveMakingBtn = $('#admin-save-making');
  if (saveMakingBtn) {
    saveMakingBtn.addEventListener('click', async () => {
      const makingCharges = {};
      $$('.admin-making-charge').forEach(input => {
        makingCharges[input.dataset.code] = parseFloat(input.value);
      });
      try {
        const res = await fetch(API_BASE + '/api/config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: 'nuraan2026', makingCharges })
        });
        const data = await res.json();
        state.config = data;
        await fetchProducts();
        showStatus('admin-making-status', 'Making charges saved!', 'success');
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-making-status', 'Failed: ' + e.message, 'error');
      }
    });
  }

  // Save product weights
  const saveProductsBtn = $('#admin-save-products');
  if (saveProductsBtn) {
    saveProductsBtn.addEventListener('click', async () => {
      const updates = [];
      $$('.admin-product-weight').forEach(input => {
        updates.push(
          fetch(API_BASE + '/api/products/' + input.dataset.sku, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: 'nuraan2026', weight: parseFloat(input.value) })
          })
        );
      });
      try {
        await Promise.all(updates);
        await fetchProducts();
        showStatus('admin-products-status', 'Product weights saved!', 'success');
        setTimeout(() => renderAdminPage(container), 1000);
      } catch (e) {
        showStatus('admin-products-status', 'Failed: ' + e.message, 'error');
      }
    });
  }
}

function showStatus(id, message, type) {
  const el = document.getElementById(id);
  if (el) {
    el.className = 'admin-status ' + type;
    el.textContent = message;
    setTimeout(() => { el.textContent = ''; el.className = ''; }, 3000);
  }
}

// ============ SCROLL ANIMATIONS ============
function observeFadeIns() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  $$('.fade-in').forEach(el => observer.observe(el));
}

// ============ HEADER SCROLL ============
function initHeaderScroll() {
  const header = $('#site-header');
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const curr = window.scrollY;
    if (curr > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = curr;
  });
}

// ============ THEME TOGGLE ============
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('nuraan_theme', state.theme);
}

// ============ INIT ============
async function init() {
  // Apply saved theme immediately
  initTheme();

  // Load data
  await Promise.all([fetchConfig(), fetchProducts()]);

  // Build nav
  buildNav();

  // Cart
  updateCartCount();

  // Event listeners
  $('#mobile-menu-btn').addEventListener('click', openMobileMenu);
  $('#mobile-menu-close').addEventListener('click', closeMobileMenu);
  $('#mobile-menu-overlay').addEventListener('click', closeMobileMenu);
  $('#search-btn').addEventListener('click', openSearch);
  $('#search-close').addEventListener('click', closeSearch);
  $('#search-input').addEventListener('input', e => performSearch(e.target.value));
  $('#cart-btn').addEventListener('click', openCartDrawer);
  $('#cart-close').addEventListener('click', closeCartDrawer);
  $('#cart-overlay').addEventListener('click', closeCartDrawer);

  // Theme toggle
  $('#theme-toggle').addEventListener('click', toggleTheme);

  // Account -> Admin
  $('#account-btn').addEventListener('click', e => {
    e.preventDefault();
    navigate('/admin');
  });

  // Logo -> Home
  $('#header-logo').addEventListener('click', e => {
    e.preventDefault();
    navigate('/');
  });

  // Header scroll
  initHeaderScroll();

  // Handle initial route
  handleRoute();

  // Browser back/forward
  window.addEventListener('popstate', handleRoute);
}

// Expose globals for onclick handlers
window.nuraan = { navigate, removeFromCart, closeSearch };

// Start
init();
