/* ============================================
   GIFT STORE - Cart Page JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('cartBody')) {
        renderCart();
    }
    if (document.getElementById('checkoutItems')) {
        renderCheckout();
    }
});

// ========== Render Cart Page ==========
function renderCart() {
    const cart = getCart();
    const cartBody = document.getElementById('cartBody');
    const cartContent = document.getElementById('cartContent');
    const emptyCart = document.getElementById('emptyCart');

    if (cart.length === 0) {
        if (cartContent) cartContent.classList.add('hidden');
        if (emptyCart) emptyCart.classList.remove('hidden');
        return;
    }

    if (cartContent) cartContent.classList.remove('hidden');
    if (emptyCart) emptyCart.classList.add('hidden');

    cartBody.innerHTML = cart.map(item => `
        <tr>
            <td data-label="Product">
                <div class="cart-product">
                    <img src="${item.image}" alt="${item.name}" loading="lazy">
                    <div>
                        <h5>${item.name}</h5>
                        <span>${item.category}</span>
                    </div>
                </div>
            </td>
            <td data-label="Price">${formatPrice(item.price)}</td>
            <td data-label="Quantity">
                <div class="qty-control">
                    <button type="button" onclick="changeCartQty(${item.id}, -1)">-</button>
                    <input type="number" value="${item.qty}" min="1" readonly>
                    <button type="button" onclick="changeCartQty(${item.id}, 1)">+</button>
                </div>
            </td>
            <td data-label="Subtotal"><strong>${formatPrice(item.price * item.qty)}</strong></td>
            <td>
                <button class="remove-btn" onclick="removeAndRerender(${item.id})" title="Remove">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join('');

    updateCartTotals();
}

function changeCartQty(productId, change) {
    const cart = getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.qty = Math.max(1, item.qty + change);
        saveCart(cart);
        renderCart();
    }
}

function removeAndRerender(productId) {
    removeFromCart(productId);
    renderCart();
}

function updateCartTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const subtotalEl = document.getElementById('cartSubtotal');
    const shippingEl = document.getElementById('cartShipping');
    const taxEl = document.getElementById('cartTax');
    const totalEl = document.getElementById('cartTotal');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    if (taxEl) taxEl.textContent = formatPrice(tax);
    if (totalEl) totalEl.textContent = formatPrice(total);
}

// ========== Render Checkout Page ==========
function renderCheckout() {
    const cart = getCart();
    const container = document.getElementById('checkoutItems');

    if (cart.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:var(--gray);padding:20px;">Your cart is empty. <a href="shop.html" style="color:var(--primary);">Go shopping</a></p>';
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="order-item">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="order-item-info">
                <h5>${item.name}</h5>
                <span>Qty: ${item.qty}</span>
            </div>
            <span class="item-price">${formatPrice(item.price * item.qty)}</span>
        </div>
    `).join('');

    updateCheckoutTotals();
    initCheckoutForm();
}

function updateCheckoutTotals() {
    const cart = getCart();
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const shipping = subtotal >= 999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;

    const el = (id) => document.getElementById(id);
    if (el('checkSubtotal')) el('checkSubtotal').textContent = formatPrice(subtotal);
    if (el('checkShipping')) el('checkShipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    if (el('checkTax')) el('checkTax').textContent = formatPrice(tax);
    if (el('checkTotal')) el('checkTotal').textContent = formatPrice(total);
}

// ========== Payment Selection ==========
function selectPayment(element, method) {
    document.querySelectorAll('.payment-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;
}

// ========== Checkout Form ==========
function initCheckoutForm() {
    const form = document.getElementById('checkoutForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) {
            showToast('Your cart is empty!', 'error');
            return;
        }

        const fullName = document.getElementById('fullName').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const address = document.getElementById('address').value.trim();
        const city = document.getElementById('city').value.trim();
        const pincode = document.getElementById('pincode').value.trim();
        const payment = document.querySelector('input[name="payment"]:checked').value;

        if (!fullName || !phone || !email || !address || !city || !pincode) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        // Generate order number
        const orderNum = 'GFT-' + Date.now().toString(36).toUpperCase();

        // In production, this would call backend/place_order.php
        const orderData = {
            orderNumber: orderNum,
            customer: { fullName, phone, email, address, city, pincode },
            items: cart,
            subtotal: getCartTotal(),
            payment: payment,
            date: new Date().toISOString()
        };

        // Save to localStorage for demo
        const orders = JSON.parse(localStorage.getItem('giftstore_orders') || '[]');
        orders.push(orderData);
        localStorage.setItem('giftstore_orders', JSON.stringify(orders));

        // Clear cart
        localStorage.removeItem('giftstore_cart');
        updateCartCount();

        showToast(`Order ${orderNum} placed successfully!`);
        setTimeout(() => {
            document.querySelector('.checkout-section .container').innerHTML = `
                <div class="empty-cart" style="padding:60px;">
                    <i class="fas fa-check-circle" style="color:#25D366;font-size:5rem;margin-bottom:25px;"></i>
                    <h2 style="margin-bottom:10px;">Order Placed Successfully!</h2>
                    <p style="font-size:1.1rem;">Order Number: <strong>${orderNum}</strong></p>
                    <p>Thank you for your order, ${fullName}! We'll send a confirmation to ${email}.</p>
                    <a href="shop.html" class="btn btn-primary btn-lg" style="margin-top:25px;">
                        <i class="fas fa-shopping-bag"></i> Continue Shopping
                    </a>
                </div>
            `;
        }, 1000);
    });
}
