/**
 * Local auth and CRUD for users/products. Passwords are plain for the demo; replace with server-side hash/JWT when integrating Spring Boot.
 */
(function () {
    "use strict";

    var KEYS = window.LuddiesStorageKeys;
    if (!KEYS) {
        console.error("[LuddiesAuth] LuddiesStorageKeys missing");
    }

    var SEED_PASSWORD = "123456";
    var RESERVED_ADMIN = "admin@luddies.com.mx";

    function readJson(key, fallback) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return fallback;
            return JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }

    function ensureUsers() {
        var users = readJson(KEYS.USERS, null);
        if (users && users.length) return;
        // TODO: replace with /api/auth bootstrap from Spring
        var seed = [
            {
                id: "u-admin",
                fullName: "Luddies Admin",
                phone: "5550000000",
                email: RESERVED_ADMIN,
                role: "admin",
                password: SEED_PASSWORD
            },
            {
                id: "u-user",
                fullName: "Demo User",
                phone: "5550000001",
                email: "user@luddies.com.mx",
                role: "user",
                password: SEED_PASSWORD
            }
        ];
        writeJson(KEYS.USERS, seed);
    }

    function ensureCatalog() {
        var p = readJson(KEYS.PRODUCTS, null);
        if (p && p.length) return;
        var seed = window.LUDDIES_CATALOG_SEED;
        if (!seed || !seed.length) {
            console.error("[LuddiesAuth] LUDDIES_CATALOG_SEED missing; load catalog-seed.js first");
            return;
        }
        writeJson(
            KEYS.PRODUCTS,
            seed.map(function (row) {
                return Object.assign({ custom: false, purchasable: 1 }, row);
            })
        );
    }

    function init() {
        if (!KEYS) return;
        ensureUsers();
        ensureCatalog();
    }

    function getSession() {
        return readJson(KEYS.SESSION, null);
    }

    function setSession(user) {
        if (!user) {
            localStorage.removeItem(KEYS.SESSION);
            return;
        }
        writeJson(KEYS.SESSION, {
            userId: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName
        });
    }

    function getUsers() {
        return readJson(KEYS.USERS, []).slice();
    }

    function getUserByEmail(email) {
        var e = (email || "").trim().toLowerCase();
        return getUsers().find(function (u) {
            return u.email.toLowerCase() === e;
        });
    }

    function login(email, password) {
        var u = getUserByEmail(email);
        if (!u || u.password !== password) {
            return { ok: false, error: "invalid_credentials" };
        }
        setSession(u);
        return { ok: true, user: u };
    }

    function logout() {
        setSession(null);
    }

    function register(payload) {
        // payload: fullName, phone, email, password — TODO: match POST /api/users
        if (!payload || !payload.email) return { ok: false, error: "invalid_payload" };
        var email = payload.email.trim().toLowerCase();
        if (email === RESERVED_ADMIN) {
            return { ok: false, error: "reserved_email" };
        }
        if (getUserByEmail(email)) {
            return { ok: false, error: "email_taken" };
        }
        var users = getUsers();
        var id = "u-" + String(Date.now());
        users.push({
            id: id,
            fullName: (payload.fullName || "").trim(),
            phone: (payload.phone || "").trim(),
            email: email,
            role: "user",
            password: payload.password
        });
        writeJson(KEYS.USERS, users);
        return { ok: true, user: getUserByEmail(email) };
    }

    function deleteUser(userId, actingUserId) {
        var users = getUsers();
        var actor = users.find(function (u) {
            return u.id === actingUserId;
        });
        if (!actor || actor.role !== "admin") {
            return { ok: false, error: "forbidden" };
        }
        var target = users.find(function (u) {
            return u.id === userId;
        });
        if (!target) return { ok: false, error: "not_found" };
        if (target.role === "admin") {
            return { ok: false, error: "cannot_delete_admin" };
        }
        if (target.id === actor.id) {
            return { ok: false, error: "cannot_delete_self" };
        }
        writeJson(
            KEYS.USERS,
            users.filter(function (u) {
                return u.id !== userId;
            })
        );
        return { ok: true };
    }

    function getProducts() {
        return readJson(KEYS.PRODUCTS, window.LUDDIES_CATALOG_SEED ? window.LUDDIES_CATALOG_SEED.slice() : []);
    }

    function saveProducts(list) {
        writeJson(KEYS.PRODUCTS, list);
    }

    function nextProductId(list) {
        var max = 0;
        list.forEach(function (p) {
            var n = parseInt(p.id, 10);
            if (!isNaN(n) && n > max) max = n;
        });
        return String(max + 1);
    }

    function saveProduct(product) {
        var list = getProducts();
        var id = product.id;
        if (!id) {
            id = nextProductId(list);
        }
        var now = Date.now();
        var row = {
            id: String(id),
            custom: true,
            img: product.img || "",
            category: (product.category || "science").toLowerCase(),
            purchasable: product.purchasable === 0 || product.purchasable === "0" ? 0 : 1,
            labels: product.labels && product.labels.es && product.labels.en ? product.labels : null
        };
        if (!row.labels) {
            return { ok: false, error: "labels_required" };
        }
        var nameKey = "cat_dyn_" + id + "_name";
        var descKey = "cat_dyn_" + id + "_desc";
        var metaKey = "cat_dyn_" + id + "_meta";
        var priceKey = "cat_dyn_" + id + "_price";
        row.name = nameKey;
        row.description = descKey;
        row.meta = metaKey;
        row.price = priceKey;

        var idx = list.findIndex(function (p) {
            return String(p.id) === String(id);
        });
        if (idx === -1) {
            row.createdAt = now;
            row.updatedAt = now;
            list.push(row);
        } else {
            var prev = list[idx] || {};
            row.createdAt = prev.createdAt || now;
            row.updatedAt = now;
            list[idx] = row;
        }
        saveProducts(list);
        return { ok: true, product: row };
    }

    function deleteProduct(productId) {
        var list = getProducts();
        var next = list.filter(function (p) {
            return String(p.id) !== String(productId);
        });
        if (next.length === list.length) return { ok: false, error: "not_found" };
        saveProducts(next);
        return { ok: true };
    }

    function isAdmin() {
        var s = getSession();
        return s && s.role === "admin";
    }

    function syncProductLabelsToI18n() {
        if (!window.LuddiesI18n || !window.LuddiesI18n.translations) return;
        getProducts().forEach(function (product) {
            if (!product || !product.custom || !product.labels) return;
            if (!product.labels.es || !product.labels.en) return;
            var id = String(product.id);
            var keys = {
                n: "cat_dyn_" + id + "_name",
                d: "cat_dyn_" + id + "_desc",
                m: "cat_dyn_" + id + "_meta",
                p: "cat_dyn_" + id + "_price"
            };
            window.LuddiesI18n.translations.es[keys.n] = product.labels.es.name || "";
            window.LuddiesI18n.translations.en[keys.n] = product.labels.en.name || "";
            window.LuddiesI18n.translations.es[keys.d] = product.labels.es.description || "";
            window.LuddiesI18n.translations.en[keys.d] = product.labels.en.description || "";
            window.LuddiesI18n.translations.es[keys.m] = product.labels.es.meta || "";
            window.LuddiesI18n.translations.en[keys.m] = product.labels.en.meta || "";
            window.LuddiesI18n.translations.es[keys.p] = product.labels.es.price || "";
            window.LuddiesI18n.translations.en[keys.p] = product.labels.en.price || "";
        });
    }

    init();

    window.LuddiesAuth = {
        init: init,
        getSession: getSession,
        setSession: setSession,
        getUsers: getUsers,
        getUserByEmail: getUserByEmail,
        login: login,
        logout: logout,
        register: register,
        deleteUser: deleteUser,
        getProducts: getProducts,
        saveProduct: saveProduct,
        deleteProduct: deleteProduct,
        isAdmin: isAdmin,
        syncProductLabelsToI18n: syncProductLabelsToI18n,
        RESERVED_ADMIN_EMAIL: RESERVED_ADMIN
    };
})();
