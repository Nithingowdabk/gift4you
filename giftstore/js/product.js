/* ============================================
   GIFT STORE - Product & Shop Page JavaScript
   ============================================ */

let currentPage = 1;
const productsPerPage = 9;
let filteredProducts = [];

// Ensure productsData exists. If not present (server-driven), fetch from backend API.
async function ensureProductsData() {
    // Products intentionally cleared for storefront display.
    window.productsData = [];
    return;

    if (typeof productsData !== 'undefined' && Array.isArray(productsData)) {
        window.productsData = productsData;
        return;
    }

    try {
        const resp = await fetch('backend/get_products.php');
        const json = await resp.json();
        if (json && json.success && Array.isArray(json.products)) {
            // Normalize fields expected by the client
            window.productsData = json.products.map(p => ({
                id: parseInt(p.id),
                name: p.name,
                categoryId: parseInt(p.category_id || p.categoryId || 0),
                category: p.category_name || p.category || '',
                description: p.description || '',
                price: parseFloat(p.price) || 0,
                salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
                image: p.image || 'images/placeholder.png',
                rating: parseFloat(p.rating) || 0,
                reviews: parseInt(p.reviews) || 0,
                stock: parseInt(p.stock) || 0,
                featured: Boolean(p.featured)
            }));
        } else {
            window.productsData = [];
        }
    } catch (err) {
        console.error('Error loading productsData:', err);
        window.productsData = [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await ensureProductsData();
    filteredProducts = [...(window.productsData || [])];

    if (document.getElementById('shopProducts')) {
        initShopPage();
    }
    if (document.getElementById('detailName')) {
        initProductDetail();
    }
});

// ========== Shop Page ==========
function initShopPage() {
    // Check for category in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categorySlug = urlParams.get('category');

    if (categorySlug) {
        const categoryMap = {
            'wooden-gifts': 1,
            'mobile-photo-frames': 2
        };
        const catId = categoryMap[categorySlug];
        if (catId) {
            // Uncheck 'all' and check the appropriate category
            document.querySelectorAll('.cat-filter').forEach(cb => cb.checked = false);
            const cb = document.querySelector(`.cat-filter[value="${catId}"]`);
            if (cb) cb.checked = true;
            filteredProducts = (window.productsData || []).filter(p => p.categoryId === catId);
        }
    }

    renderProducts();
    initFilters();
    initSearch();
    initSort();
}

function renderProducts() {
    const container = document.getElementById('shopProducts');
    if (!container) return;

    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const pageProducts = filteredProducts.slice(start, end);

    if (pageProducts.length === 0) {
        container.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:60px 20px;">
                <i class="fas fa-search" style="font-size:3rem;color:var(--gray-lighter);margin-bottom:15px;display:block;"></i>
                <h3>No products found</h3>
                <p style="color:var(--gray);">Try adjusting your filters or search term.</p>
            </div>`;
    } else {
        container.innerHTML = pageProducts.map(createProductCard).join('');
    }

    // Update results count
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
        countEl.textContent = `Showing ${Math.min(start + 1, filteredProducts.length)}-${Math.min(end, filteredProducts.length)} of ${filteredProducts.length} products`;
    }

    renderPagination();
    initFadeAnimations();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    if (!container) return;

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    if (currentPage > 1) {
        html += `<a href="#" onclick="goToPage(${currentPage - 1}); return false;"><i class="fas fa-chevron-left"></i></a>`;
    }
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<span class="active">${i}</span>`;
        } else {
            html += `<a href="#" onclick="goToPage(${i}); return false;">${i}</a>`;
        }
    }
    if (currentPage < totalPages) {
        html += `<a href="#" onclick="goToPage(${currentPage + 1}); return false;"><i class="fas fa-chevron-right"></i></a>`;
    }
    container.innerHTML = html;
}

function goToPage(page) {
    currentPage = page;
    renderProducts();
    window.scrollTo({ top: 300, behavior: 'smooth' });
}

// ========== Filters ==========
function initFilters() {
    // Category filters
    document.querySelectorAll('.cat-filter').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });

    // Price filter
    const priceBtn = document.getElementById('applyPriceFilter');
    if (priceBtn) {
        priceBtn.addEventListener('click', applyFilters);
    }
}

function applyFilters() {
    const checkedCategories = [];
    let allChecked = false;

    document.querySelectorAll('.cat-filter').forEach(cb => {
        if (cb.value === 'all' && cb.checked) {
            allChecked = true;
        } else if (cb.checked) {
            checkedCategories.push(parseInt(cb.value));
        }
    });

    let result = [...(window.productsData || [])];

    // Category filter
    if (!allChecked && checkedCategories.length > 0) {
        result = result.filter(p => checkedCategories.includes(p.categoryId));
    }

    // Price filter
    const minPrice = parseFloat(document.getElementById('priceMin')?.value) || 0;
    const maxPrice = parseFloat(document.getElementById('priceMax')?.value) || Infinity;

    if (minPrice > 0 || maxPrice < Infinity) {
        result = result.filter(p => {
            const price = p.salePrice || p.price;
            return price >= minPrice && price <= maxPrice;
        });
    }

    filteredProducts = result;
    currentPage = 1;
    renderProducts();
}

// ========== Search ==========
function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            searchProducts(searchInput.value);
        }, 300));
    }

    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchProducts(searchInput?.value || '');
        });
    }
}

function searchProducts(query) {
    const q = query.toLowerCase().trim();
    if (!q) {
        filteredProducts = [...(window.productsData || [])];
    } else {
        filteredProducts = (window.productsData || []).filter(p =>
            p.name.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
    }
    currentPage = 1;
    renderProducts();
}

function debounce(fn, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ========== Sort ==========
function initSort() {
    const sortSelect = document.getElementById('sortSelect');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', () => {
        const value = sortSelect.value;
        switch (value) {
            case 'price-low':
                filteredProducts.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
                break;
            case 'rating':
                filteredProducts.sort((a, b) => b.rating - a.rating);
                break;
            case 'name':
                filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                filteredProducts = [...(window.productsData || [])];
                applyFilters();
                return;
        }
        currentPage = 1;
        renderProducts();
    });
}

// ========== Product Detail Page ==========
function initProductDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = parseInt(urlParams.get('id'));
    const product = productId ? getProduct(productId) : (window.productsData || [])[0];

    if (!product) {
        document.querySelector('.product-detail .container').innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-search" style="font-size:4rem;color:var(--gray-lighter);"></i>
                <h3>Product not found</h3>
                <p>The product you're looking for doesn't exist.</p>
                <a href="shop.html" class="btn btn-primary">Back to Shop</a>
            </div>`;
        return;
    }

    // Update page title
    document.title = `${product.name} - Gift4You`;

    // Update breadcrumb
    document.getElementById('breadcrumbProduct').textContent = product.name;

    // Update product info
    document.getElementById('detailName').textContent = product.name;
    document.getElementById('detailCategory').textContent = product.category;
    document.getElementById('detailStars').innerHTML = generateStars(product.rating);
    document.getElementById('detailReviews').textContent = `(${product.reviews} reviews)`;
    document.getElementById('detailDesc').textContent = product.description;

    // Price
    const currentPrice = product.salePrice || product.price;
    document.getElementById('detailPrice').textContent = formatPrice(currentPrice);

    const oldPriceEl = document.getElementById('detailOldPrice');
    const discountEl = document.getElementById('detailDiscount');
    if (product.salePrice) {
        oldPriceEl.textContent = formatPrice(product.price);
        oldPriceEl.style.display = 'inline';
        const disc = Math.round((1 - product.salePrice / product.price) * 100);
        discountEl.textContent = `${disc}% OFF`;
        discountEl.style.display = 'inline';
    } else {
        oldPriceEl.style.display = 'none';
        discountEl.style.display = 'none';
    }

    // Main image
    document.getElementById('mainImage').src = product.image;
    document.getElementById('mainImage').alt = product.name;

    // Stock info
    const stockEl = document.getElementById('stockInfo');
    if (product.stock > 0) {
        stockEl.textContent = `${product.stock} in stock`;
        stockEl.style.color = '#25D366';
    } else {
        stockEl.textContent = 'Out of stock';
        stockEl.style.color = 'var(--primary)';
    }

    // SKU
    document.getElementById('detailSku').textContent = `GFT-${String(product.id).padStart(3, '0')}`;
    document.getElementById('detailMetaCat').textContent = product.category;

    // WhatsApp button
    const waBtn = document.getElementById('whatsappBtn');
    const waText = encodeURIComponent(`Hi! I'm interested in "${product.name}" (${formatPrice(currentPrice)}) from Gift4You.`);
    waBtn.href = `https://wa.me/919876543210?text=${waText}`;

    // Quantity controls
    const qtyInput = document.getElementById('productQty');
    document.getElementById('qtyMinus').addEventListener('click', () => {
        qtyInput.value = Math.max(1, parseInt(qtyInput.value) - 1);
    });
    document.getElementById('qtyPlus').addEventListener('click', () => {
        qtyInput.value = Math.min(product.stock, parseInt(qtyInput.value) + 1);
    });

    // Add to Cart
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        const qty = parseInt(qtyInput.value);
        addToCart(product.id, qty);
    });

    // Buy Now
    document.getElementById('buyNowBtn').addEventListener('click', () => {
        const qty = parseInt(qtyInput.value);
        addToCart(product.id, qty);
        window.location.href = 'checkout.html';
    });
}

// ========== Image Gallery ==========
function changeImage(thumbEl) {
    const mainImg = document.getElementById('mainImage');
    const thumbImg = thumbEl.querySelector('img');
    mainImg.src = thumbImg.src.replace('w=200', 'w=800');
    mainImg.alt = thumbImg.alt;

    document.querySelectorAll('.product-thumbs .thumb').forEach(t => t.classList.remove('active'));
    thumbEl.classList.add('active');
}
