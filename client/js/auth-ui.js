/**
 * Injects session-aware header actions after layout partials are loaded.
 */
(function () {
    "use strict";

    function run() {
        if (!window.LuddiesAuth) return;
        var session = window.LuddiesAuth.getSession();
        var adminItem = document.getElementById("nav-item-admin");
        var outItem = document.getElementById("nav-item-logout");
        var checkoutItem = document.getElementById("nav-item-checkout");
        var loginItem = document.getElementById("nav-item-login");
        var outLink = document.getElementById("luddies-logout-link");
        var loginLink = document.getElementById("nav-login-link");

        if (checkoutItem) {
            checkoutItem.hidden = !session;
        }
        if (loginItem) {
            loginItem.hidden = !!session;
        }
        if (outItem) {
            outItem.hidden = !session;
        }
        if (adminItem) {
            adminItem.hidden = !session || !window.LuddiesAuth.isAdmin();
        }
        if (loginLink && !session) {
            loginLink.href = "login.html?return=" + encodeURIComponent(window.location.href);
        }
        if (outLink) {
            outLink.onclick = function (e) {
                e.preventDefault();
                window.LuddiesAuth.logout();
                window.location.href = "index.html";
            };
        }
        if (window.LuddiesI18n && window.LuddiesI18n.applyTranslations) {
            window.LuddiesI18n.applyTranslations(window.LuddiesI18n.getLang());
        }
    }

    document.addEventListener("luddies:layout-ready", run);
})();
