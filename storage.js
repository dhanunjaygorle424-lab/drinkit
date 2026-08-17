(function () {
    const STORAGE_USERS = 'drinkit_users';
    const STORAGE_USER = 'drinkit_user';
    const STORAGE_CART = 'drinkit_cart';
    const STORAGE_TRANSACTIONS = 'drinkit_transactions';

    // Provide a safe storage object. Prefer window.localStorage when available.
    // If localStorage is unavailable (e.g. private mode or blocked), fall back to an in-memory
    // storage so the app still works for the current session instead of silently failing.
    function makeMemoryStorage() {
        const mem = Object.create(null);
        return {
            getItem(key) { return Object.prototype.hasOwnProperty.call(mem, key) ? mem[key] : null; },
            setItem(key, value) { mem[key] = String(value); },
            removeItem(key) { delete mem[key]; }
        };
    }

    function safeStorage() {
        try {
            if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
                return makeMemoryStorage();
            }
            // some browsers may throw when accessing localStorage (e.g. when disabled)
            const testKey = '__drinkit_storage_test__';
            window.localStorage.setItem(testKey, '1');
            window.localStorage.removeItem(testKey);
            return window.localStorage;
        } catch (error) {
            // fallback to in-memory storage (persists only for the session)
            return makeMemoryStorage();
        }
    }

    function readJSON(key, fallback) {
        const storage = safeStorage();
        if (!storage) return fallback;
        try {
            const raw = storage.getItem(key);
            if (raw === null || raw === undefined) return fallback;
            return JSON.parse(raw);
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        const storage = safeStorage();
        if (!storage) return;
        try {
            storage.setItem(key, JSON.stringify(value));
        } catch (error) {
            // ignore write errors (e.g. quota exceeded) — keep app usable in-memory
        }
    }

    function getUsers() {
        return readJSON(STORAGE_USERS, []);
    }

    function saveUsers(users) {
        writeJSON(STORAGE_USERS, users);
    }

    function getLogged() {
        const storage = safeStorage();
        const raw = storage ? storage.getItem(STORAGE_USER) : null;
        return raw ? String(raw) : null;
    }

    function setLogged(email) {
        const storage = safeStorage();
        if (!storage) return;
        storage.setItem(STORAGE_USER, String(email));
    }

    function clearLogged() {
        const storage = safeStorage();
        if (!storage) return;
        storage.removeItem(STORAGE_USER);
    }

    function getCart() {
        return readJSON(STORAGE_CART, []);
    }

    function saveCart(cart) {
        writeJSON(STORAGE_CART, cart);
    }

    function getTransactions() {
        return readJSON(STORAGE_TRANSACTIONS, []);
    }

    function saveTransactions(transactions) {
        writeJSON(STORAGE_TRANSACTIONS, transactions);
    }

    function addTransaction(transaction) {
        const transactions = getTransactions();
        transactions.unshift(transaction);
        saveTransactions(transactions);
        return transaction;
    }

    window.DrinkItStorage = {
        getUsers,
        saveUsers,
        getLogged,
        setLogged,
        clearLogged,
        getCart,
        saveCart,
        getTransactions,
        saveTransactions,
        addTransaction,
    };
})();
