// DrinkIt - client-side auth, cart, checkout, and transaction storage (mock)
(function () {
    const storage = window.DrinkItStorage || {
        getUsers() {
            return JSON.parse(localStorage.getItem('drinkit_users') || '[]');
        },
        saveUsers(users) {
            localStorage.setItem('drinkit_users', JSON.stringify(users));
        },
        getLogged() {
            return localStorage.getItem('drinkit_user');
        },
        setLogged(email) {
            localStorage.setItem('drinkit_user', email);
        },
        clearLogged() {
            localStorage.removeItem('drinkit_user');
        },
        getCart() {
            return JSON.parse(localStorage.getItem('drinkit_cart') || '[]');
        },
        saveCart(cart) {
            localStorage.setItem('drinkit_cart', JSON.stringify(cart));
        },
        getTransactions() {
            return JSON.parse(localStorage.getItem('drinkit_transactions') || '[]');
        },
        saveTransactions(transactions) {
            localStorage.setItem('drinkit_transactions', JSON.stringify(transactions));
        },
        addTransaction(transaction) {
            const transactions = this.getTransactions();
            transactions.unshift(transaction);
            this.saveTransactions(transactions);
            return transaction;
        }
    };

    const DEFAULT_ADMIN = {
        name: 'Admin',
        email: 'admin@drinkit.com',
        password: 'admin123',
        role: 'admin'
    };

    function getUsers() {
        return storage.getUsers();
    }

    function saveUsers(users) {
        storage.saveUsers(users);
    }

    function ensureDefaultAdmin() {
        const users = getUsers();
        const hasAdmin = users.some(u => u.email?.toLowerCase() === DEFAULT_ADMIN.email);
        if (!hasAdmin) {
            users.unshift(DEFAULT_ADMIN);
            saveUsers(users);
        }
    }

    ensureDefaultAdmin();

    function getLogged() {
        return storage.getLogged();
    }

    function setLogged(email) {
        storage.setLogged(email);
    }

    function logout() {
        storage.clearLogged();
        location.href = 'index.html';
    }

    function getCart() {
        return storage.getCart();
    }

    function saveCart(cart) {
        storage.saveCart(cart);
    }

    function addTransaction(transaction) {
        storage.addTransaction(transaction);
    }

    function addToCart(item) {
        const cart = getCart();
        const existing = cart.find(i => i.name === item.name && i.price === item.price);
        if (existing) existing.qty += 1;
        else cart.push({ ...item, qty: 1 });
        saveCart(cart);
    }

    function formatMoney(amount) {
        return '₹' + amount.toFixed(2);
    }

    function currentPage() {
        return window.location.pathname.toLowerCase().split('/').pop();
    }

    function updateNavigation() {
        const logged = getLogged();
        const nav = document.getElementById('main-nav');
        const status = document.getElementById('login-status');
        if (!nav) return;
        nav.innerHTML = '';
        nav.insertAdjacentHTML('beforeend', '<a href="index.html">Home</a>');
        nav.insertAdjacentHTML('beforeend', '<a href="drinkit-cart.html">Cart</a>');
        if (isAdminUser()) {
            nav.insertAdjacentHTML('beforeend', '<a href="transaction-portal.html">Transactions</a>');
            nav.insertAdjacentHTML('beforeend', '<a href="admin-portal.html">Admin</a>');
        }
        if (logged) {
            nav.insertAdjacentHTML('beforeend', `<a href="#" id="logout-link">Logout</a>`);
            if (status) status.textContent = 'Logged in as ' + logged;
            setTimeout(() => {
                const logoutLink = document.getElementById('logout-link');
                if (logoutLink) logoutLink.addEventListener('click', function (event) {
                    event.preventDefault();
                    logout();
                });
            }, 0);
        } else {
            nav.insertAdjacentHTML('beforeend', '<a href="drinkit-login.html">Login</a>');
            nav.insertAdjacentHTML('beforeend', '<a href="drinkitR.html">Register</a>');
            if (status) status.textContent = 'Not signed in';
        }
    }

    function isAdminUser() {
        const logged = getLogged();
        if (!logged) return false;
        if (logged.toLowerCase() === 'admin@drinkit.com') return true;
        const users = getUsers();
        const user = users.find(u => u.email === logged);
        return user && user.role === 'admin';
    }

    function requireLogin(onSuccess) {
        if (!getLogged()) {
            if (confirm('Please login to continue. Go to Login page?')) {
                location.href = 'drinkit-login.html';
            }
            return false;
        }
        onSuccess();
        return true;
    }

    function requireAdmin() {
        if (!getLogged()) {
            location.href = 'drinkit-login.html';
            return false;
        }
        if (!isAdminUser()) {
            alert('Access denied. Admins only.');
            location.href = 'index.html';
            return false;
        }
        return true;
    }

    document.addEventListener('DOMContentLoaded', function () {
        const page = currentPage();
        updateNavigation();

        if (page === 'transaction-portal.html' || page === 'admin-portal.html') {
            requireAdmin();
        }

        if (page === 'drinkit.html' || page === 'index.html' || page === '' || page === 'drinkitbeer.html') {
            const cartButtons = Array.from(document.querySelectorAll('.cart-btn'));
            const orderButtons = Array.from(document.querySelectorAll('.order-btn'));
            const searchInput = document.getElementById('productSearch');
            const categoryButtons = Array.from(document.querySelectorAll('[data-category-button]'));
            const productCards = Array.from(document.querySelectorAll('.product-card'));
            let activeCategory = 'all';

            function filterProducts() {
                const query = searchInput?.value.trim().toLowerCase() || '';
                productCards.forEach(card => {
                    const matchesCategory = activeCategory === 'all' || card.dataset.category === activeCategory;
                    const matchesSearch = !query || card.dataset.name.toLowerCase().includes(query);
                    card.style.display = matchesCategory && matchesSearch ? '' : 'none';
                });
            }

            categoryButtons.forEach(button => {
                button.addEventListener('click', function () {
                    categoryButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    activeCategory = button.dataset.categoryButton;
                    filterProducts();
                });
            });

            if (searchInput) {
                searchInput.addEventListener('input', filterProducts);
            }

            cartButtons.forEach(button => {
                button.addEventListener('click', function () {
                    requireLogin(() => {
                        const card = button.closest('.product-card');
                        const item = {
                            name: card.dataset.name,
                            price: Number(card.dataset.price),
                        };
                        addToCart(item);
                        button.textContent = 'Added ✓';
                        setTimeout(() => button.textContent = 'Add to Cart', 1200);
                    });
                });
            });

            orderButtons.forEach(button => {
                button.addEventListener('click', function () {
                    requireLogin(() => {
                        const card = button.closest('.product-card');
                        const item = {
                            name: card.dataset.name,
                            price: Number(card.dataset.price),
                        };
                        addToCart(item);
                        location.href = 'drinkit-cart.html';
                    });
                });
            });
        }

        if (page === 'drinkit-login.html') {
            const form = document.getElementById('loginForm');
            if (!form) return;
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                const email = document.getElementById('email').value.trim().toLowerCase();
                const password = document.getElementById('password').value;
                const users = getUsers();
                const user = users.find(u => u.email === email && u.password === password);
                if (!user) {
                    alert('Invalid email or password.');
                    return;
                }
                setLogged(email);
                alert('Login successful.');
                location.href = 'index.html';
            });
        }

        if (page === 'drinkitr.html') {
            const form = document.getElementById('registerForm');
            if (!form) return;
            form.addEventListener('submit', function (event) {
                event.preventDefault();
                const name = document.getElementById('name').value.trim();
                const email = document.getElementById('email').value.trim().toLowerCase();
                const password = document.getElementById('password').value;
                const confirm = document.getElementById('confirm-password').value;
                if (!name || !email || !password || !confirm) {
                    alert('Please complete all fields.');
                    return;
                }
                if (password !== confirm) {
                    alert('Passwords do not match.');
                    return;
                }
                const users = getUsers();
                if (users.find(u => u.email === email)) {
                    alert('Email already registered. Please login.');
                    return;
                }
                users.push({ name, email, password, role: 'user' });
                saveUsers(users);
                alert('Registration successful. Please login.');
                location.href = 'drinkit-login.html';
            });
        }

        if (page === 'drinkit-cart.html') {
            const cartItems = document.getElementById('cart-items');
            const cartSummary = document.getElementById('cart-summary');
            const checkoutButton = document.getElementById('checkout-btn');
            const clearButton = document.getElementById('clear-cart');

            function renderCart() {
                const cart = getCart();
                cartItems.innerHTML = '';
                if (!cart.length) {
                    cartItems.innerHTML = '<div class="empty-cart">Your cart is empty. Add beers from the shop and return here to checkout.</div>';
                    cartSummary.textContent = '';
                    checkoutButton.disabled = true;
                    return;
                }
                checkoutButton.disabled = false;
                let subtotal = 0;
                cart.forEach(item => {
                    subtotal += item.qty * item.price;
                    const itemCard = document.createElement('div');
                    itemCard.className = 'cart-item';
                    itemCard.innerHTML = `
                        <div>
                            <strong>${item.name}</strong>
                            <div class="item-meta">${formatMoney(item.price)} × ${item.qty}</div>
                        </div>
                        <div class="item-actions">
                            <button class="qty-btn" data-action="decrease" data-name="${item.name}">−</button>
                            <button class="qty-btn" data-action="increase" data-name="${item.name}">+</button>
                            <button class="remove-btn" data-name="${item.name}">Remove</button>
                        </div>
                    `;
                    cartItems.appendChild(itemCard);
                });
                cartSummary.innerHTML = `
                    <div class="summary-line"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
                    <div class="summary-line"><span>Delivery</span><strong>${formatMoney(0)}</strong></div>
                    <div class="summary-line total"><span>Total</span><strong>${formatMoney(subtotal)}</strong></div>
                `;
            }

            function updateCartQuantity(name, delta) {
                const cart = getCart();
                const item = cart.find(i => i.name === name);
                if (!item) return;
                item.qty = Math.max(1, item.qty + delta);
                saveCart(cart.filter(i => i.qty > 0));
                renderCart();
            }

            function removeCartItem(name) {
                const cart = getCart().filter(i => i.name !== name);
                saveCart(cart);
                renderCart();
            }

            cartItems.addEventListener('click', function (event) {
                const button = event.target.closest('button');
                if (!button) return;
                const name = button.dataset.name;
                if (button.dataset.action === 'increase') updateCartQuantity(name, 1);
                if (button.dataset.action === 'decrease') updateCartQuantity(name, -1);
                if (button.classList.contains('remove-btn')) removeCartItem(name);
            });

            checkoutButton.addEventListener('click', function () {
                if (!getCart().length) {
                    alert('Add beers to cart before checkout.');
                    return;
                }
                location.href = 'drinkit-payment.html';
            });

            clearButton.addEventListener('click', function () {
                saveCart([]);
                renderCart();
            });

            renderCart();
        }

        if (page === 'drinkit-payment.html') {
            const cart = getCart();
            const summary = document.getElementById('payment-summary');
            const form = document.getElementById('payment-form');
            const message = document.getElementById('payment-message');
            const amountField = document.getElementById('payAmount');

            if (!cart.length) {
                summary.innerHTML = '<div class="empty-cart">Your cart is empty. Add items in the shop first.</div>';
                form.style.display = 'none';
                return;
            }

            const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            const delivery = 0;
            const total = subtotal + delivery;
            amountField.textContent = formatMoney(total);
            summary.innerHTML = `
                <div class="checkout-items">
                    ${cart.map(item => `<div class="checkout-line"><span>${item.qty}× ${item.name}</span><strong>${formatMoney(item.price * item.qty)}</strong></div>`).join('')}
                </div>
                <div class="checkout-line"><span>Delivery</span><strong>${formatMoney(delivery)}</strong></div>
                <div class="checkout-line total"><span>Total</span><strong>${formatMoney(total)}</strong></div>
            `;

            function setLocationStatus(text, isError) {
                const status = document.getElementById('location-status');
                if (!status) return;
                status.textContent = text;
                status.className = isError ? 'message error' : 'message success';
            }

            function detectCurrentLocation() {
                const locationInput = document.getElementById('location');
                if (!navigator.geolocation) {
                    setLocationStatus('Geolocation is not supported by your browser.', true);
                    return;
                }
                setLocationStatus('Detecting your current location…', false);
                navigator.geolocation.getCurrentPosition(
                    function (position) {
                        const { latitude, longitude } = position.coords;
                        if (locationInput) {
                            locationInput.value = `Lat ${latitude.toFixed(5)}, Lng ${longitude.toFixed(5)}`;
                        }
                        const mapFrame = document.getElementById('location-map');
                        if (mapFrame) {
                            mapFrame.src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;
                        }
                        setLocationStatus('Current location detected. Edit the address if needed.', false);
                    },
                    function (error) {
                        setLocationStatus('Unable to get current location: ' + error.message, true);
                    },
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
                );
            }

            const detectButton = document.getElementById('detect-location');
            if (detectButton) {
                detectButton.addEventListener('click', detectCurrentLocation);
            }
            detectCurrentLocation();

            form.addEventListener('submit', function (event) {
                event.preventDefault();
                const fullName = document.getElementById('fullName').value.trim();
                const cardNumber = document.getElementById('cardNumber').value.trim();
                const expiry = document.getElementById('expiry').value.trim();
                const cvv = document.getElementById('cvv').value.trim();
                const email = document.getElementById('email').value.trim();

                const locationInput = document.getElementById('location');
                const deliveryLocation = locationInput ? locationInput.value.trim() : '';

                if (!fullName || !cardNumber || !expiry || !cvv || !email || !deliveryLocation) {
                    message.textContent = 'Please complete all payment fields.';
                    message.className = 'message error';
                    return;
                }
                if (!/^[0-9]{16}$/.test(cardNumber.replace(/\s/g, '')) || !/^[0-9]{3,4}$/.test(cvv)) {
                    message.textContent = 'Enter valid card number and CVV.';
                    message.className = 'message error';
                    return;
                }
                const transaction = {
                    id: Date.now(),
                    customerName: fullName,
                    email,
                    amount: formatMoney(total),
                    items: cart.map(item => ({ qty: item.qty, name: item.name })),
                    location: deliveryLocation,
                    date: new Date().toLocaleString()
                };
                addTransaction(transaction);
                saveCart([]);
                message.textContent = `Payment complete! Your order for ${formatMoney(total)} is confirmed. Delivery in 30 minutes to ${fullName} at ${deliveryLocation}.`;
                message.className = 'message success';
                form.reset();
            });
        }
    });
})(); 