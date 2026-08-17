(function () {
    const STORAGE_USERS = 'drinkit_users';
    const STORAGE_USER = 'drinkit_user';
    const STORAGE_CART = 'drinkit_cart';
    const STORAGE_TRANSACTIONS = 'drinkit_transactions';

    function safeStorage() {
        try {
            return window.localStorage;
        } catch (error) {
            return null;
        }
    }

    function readJSON(key, fallback) {
        const storage = safeStorage();
        if (!storage) return fallback;
        try {
            return JSON.parse(storage.getItem(key) || 'null') ?? fallback;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        const storage = safeStorage();
        if (!storage) return;
        storage.setItem(key, JSON.stringify(value));
    }

    function getUsers() {
        return readJSON(STORAGE_USERS, []);
    }

    function saveUsers(users) {
        writeJSON(STORAGE_USERS, users);
    }

    function getLogged() {
        const storage = safeStorage();
        return storage ? storage.getItem(STORAGE_USER) : null;
    }

    function setLogged(email) {
        const storage = safeStorage();
        if (!storage) return;
        storage.setItem(STORAGE_USER, email);
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
