/* ============================================
   GIFT STORE - Main JavaScript
   ============================================ */

// ========== Utility Functions ==========
function formatPrice(price) {
    return '₹' + price.toLocaleString('en-IN');
}

function generateStars(rating) {
    let stars = '';
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    for (let i = 0; i < full; i++) stars += '<i class="fas fa-star"></i>';
    if (half) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = 0; i < empty; i++) stars += '<i class="far fa-star"></i>';
    return stars;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function getProduct(id) {
    return (window.productsData || []).find(p => p.id === parseInt(id));
}

// ========== Cart Functions ==========
function getCart() {
    return JSON.parse(localStorage.getItem('giftstore_cart') || '[]');
}

function saveCart(cart) {
    localStorage.setItem('giftstore_cart', JSON.stringify(cart));
    updateCartCount();
}

function addToCart(productId, qty = 1) {
    const product = getProduct(productId);
    if (!product) return;
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.salePrice || product.price,
            image: product.image,
            qty: qty,
            category: product.category
        });
    }
    saveCart(cart);
    showToast(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    showToast('Item removed from cart', 'error');
}

function updateCartQty(productId, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty = Math.max(1, qty);
        saveCart(cart);
    }
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('#cartCount').forEach(el => el.textContent = count);
}

// ========== Wishlist ==========
function getWishlist() {
    return JSON.parse(localStorage.getItem('giftstore_wishlist') || '[]');
}

function toggleWishlist(productId) {
    let wishlist = getWishlist();
    const idx = wishlist.indexOf(productId);
    if (idx > -1) {
        wishlist.splice(idx, 1);
        showToast('Removed from wishlist', 'error');
    } else {
        wishlist.push(productId);
        showToast('Added to wishlist!');
    }
    localStorage.setItem('giftstore_wishlist', JSON.stringify(wishlist));
}

function isInWishlist(productId) {
    return getWishlist().includes(productId);
}

// ========== Product Card HTML ==========
function createProductCard(product) {
    const discount = product.salePrice ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
    const wishActive = isInWishlist(product.id) ? 'color:var(--primary)' : '';

    return `
        <div class="product-card fade-in">
            ${discount > 0 ? `<span class="product-badge">${discount}% OFF</span>` : ''}
            <div class="product-image">
                <a href="product.html?id=${product.id}">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                </a>
                <div class="product-actions">
                    <button onclick="toggleWishlist(${product.id})" title="Wishlist" style="${wishActive}">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button onclick="openQuickView(${product.id})" title="Quick View">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <p class="product-category">${product.category}</p>
                <h4><a href="product.html?id=${product.id}">${product.name}</a></h4>
                <div class="product-rating">
                    <div class="stars">${generateStars(product.rating)}</div>
                    <span>(${product.reviews})</span>
                </div>
                <div class="product-price">
                    <span class="current">${formatPrice(product.salePrice || product.price)}</span>
                    ${product.salePrice ? `<span class="original">${formatPrice(product.price)}</span>` : ''}
                </div>
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-bag"></i> Add to Cart
                </button>
            </div>
        </div>
    `;
}

// ========== Quick View Modal ==========
let currentQVProduct = null;

function openQuickView(productId) {
    const product = getProduct(productId);
    if (!product) return;
    currentQVProduct = product;

    document.getElementById('qvImage').src = product.image;
    document.getElementById('qvImage').alt = product.name;
    document.getElementById('qvCategory').textContent = product.category;
    document.getElementById('qvName').textContent = product.name;
    document.getElementById('qvStars').innerHTML = generateStars(product.rating);
    document.getElementById('qvReviews').textContent = `(${product.reviews} reviews)`;
    document.getElementById('qvPrice').textContent = formatPrice(product.salePrice || product.price);
    const oldPrice = document.getElementById('qvOldPrice');
    oldPrice.textContent = product.salePrice ? formatPrice(product.price) : '';
    oldPrice.style.display = product.salePrice ? 'inline' : 'none';
    document.getElementById('qvDesc').textContent = product.description;
    document.getElementById('qvQty').value = 1;
    document.getElementById('qvViewLink').href = `product.html?id=${product.id}`;

    document.getElementById('quickViewModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeQuickView() {
    document.getElementById('quickViewModal').classList.remove('active');
    document.body.style.overflow = '';
    currentQVProduct = null;
}

function updateQVQty(change) {
    const input = document.getElementById('qvQty');
    const newVal = Math.max(1, parseInt(input.value) + change);
    input.value = newVal;
}

function addToCartFromQV() {
    if (!currentQVProduct) return;
    const qty = parseInt(document.getElementById('qvQty').value);
    addToCart(currentQVProduct.id, qty);
    closeQuickView();
}

// ========== Featured Products (Homepage) ==========
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    const featured = (window.productsData || []).filter(p => p.featured);
    container.innerHTML = featured.map(createProductCard).join('');
    initFadeAnimations();
}

// ========== Navbar ==========
function initNavbar() {
    const toggle = document.getElementById('navToggle');
    const links = document.getElementById('navLinks');

    if (toggle && links) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            links.classList.toggle('active');
        });

        // Close on link click
        links.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                toggle.classList.remove('active');
                links.classList.remove('active');
            });
        });
    }

    // Scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            navbar.classList.toggle('scrolled', window.scrollY > 50);
        }
    });
}

// ========== Back to Top ==========
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ========== Countdown Timer ==========
function initCountdown() {
    const daysEl = document.getElementById('days');
    if (!daysEl) return;

    // Set end date to 7 days from now
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    function updateCountdown() {
        const now = new Date();
        const diff = endDate - now;

        if (diff <= 0) return;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ========== Fade In Animations ==========
function initFadeAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ========== Newsletter Form ==========
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Thank you for subscribing! Check your email for 10% off code.');
        form.reset();
    });
}

// ========== Login Form ==========
function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        // In production, this would call backend/login.php via fetch
        if (email && password.length >= 6) {
            showToast('Login successful! Redirecting...');
            setTimeout(() => window.location.href = 'index.html', 1500);
        } else {
            showToast('Invalid credentials. Please try again.', 'error');
        }
    });
}

// ========== Register Form ==========
function initRegisterForm() {
    const form = document.getElementById('registerForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        if (password !== confirm) {
            showToast('Passwords do not match!', 'error');
            return;
        }

        // In production, this would call backend/register.php via fetch
        showToast('Account created successfully! Redirecting to login...');
        setTimeout(() => window.location.href = 'login.html', 1500);
    });
}

// ========== Contact Form ==========
function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Message sent successfully! We\'ll get back to you soon.');
        form.reset();
    });
}

// ========== Review Form ==========
function initReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        showToast('Review submitted successfully! Thank you for your feedback.');
        form.reset();
    });
}

// ========== Quick View Modal Close ==========
function initModalClose() {
    const closeBtn = document.getElementById('closeQuickView');
    const overlay = document.getElementById('quickViewModal');

    if (closeBtn) closeBtn.addEventListener('click', closeQuickView);
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeQuickView();
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeQuickView();
    });
}

// ========== Initialize ==========
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initNavbar();
    initBackToTop();
    initCountdown();
    initFadeAnimations();
    initNewsletterForm();
    initLoginForm();
    initRegisterForm();
    initContactForm();
    initReviewForm();
    initModalClose();
    loadFeaturedProducts();
});
