(function () {
    "use strict";

    var KEY = "luddies.payment_stub";

    document.addEventListener("DOMContentLoaded", function () {
        var el = document.getElementById("payment-stub-email");
        if (!el) return;
        try {
            var raw = sessionStorage.getItem(KEY);
            if (!raw) return;
            var d = JSON.parse(raw);
            if (d && d.email) {
                el.textContent = d.email;
            }
        } catch (e) {
            /* ignore */
        }
    });
})();
