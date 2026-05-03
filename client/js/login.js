(function () {
    "use strict";

    function getReturnUrl() {
        var params = new URLSearchParams(window.location.search);
        var r = params.get("return");
        if (r) { try { return decodeURIComponent(r); } catch(e) { return "index.html"; } }
        return "index.html";
    }

    function showAlert(id, key) {
        var el = document.getElementById(id);
        if (!el) return;
        if (key && window.LuddiesI18n && window.LuddiesI18n.t) el.textContent = window.LuddiesI18n.t(key);
        el.classList.remove("d-none");
    }

    function hideAlert(id) {
        var el = document.getElementById(id);
        if (el) el.classList.add("d-none");
    }

    function setFieldError(input, show) {
        if (!input) return;
        input.classList.toggle("is-invalid", show);
        input.classList.toggle("is-valid", !show && input.value.trim() !== "");
    }

    document.addEventListener("DOMContentLoaded", function () {
        var reg = new URLSearchParams(window.location.search).get("registered");
        if (reg === "1") {
            var ok = document.getElementById("login-success-alert");
            if (ok) {
                if (window.LuddiesI18n && window.LuddiesI18n.t) ok.textContent = window.LuddiesI18n.t("auth_register_success");
                ok.classList.remove("d-none");
            }
        }

        var form = document.getElementById("login-form");
        if (!form) return;

        var emailInput = document.getElementById("login-email");
        var passInput  = document.getElementById("login-password");

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            hideAlert("login-error-alert");

            var email = (emailInput && emailInput.value) || "";
            var pass  = (passInput  && passInput.value)  || "";

            var emailOk = email.trim().length > 0;
            var passOk  = pass.length > 0;

            setFieldError(emailInput, !emailOk);
            setFieldError(passInput,  !passOk);

            if (!emailOk || !passOk) {
                showAlert("login-error-alert", "auth_error_required");
                return;
            }

            if (!window.LuddiesAuth) { showAlert("login-error-alert", "auth_error_generic"); return; }

            var res = window.LuddiesAuth.login(email.trim(), pass);
            if (res && res.ok) { window.location.href = getReturnUrl(); return; }

            setFieldError(emailInput, true);
            setFieldError(passInput,  true);
            showAlert("login-error-alert", "auth_error_invalid");
        });

        // Limpiar error al escribir
        [emailInput, passInput].forEach(function(inp) {
            if (!inp) return;
            inp.addEventListener("input", function() {
                setFieldError(inp, false);
                hideAlert("login-error-alert");
            });
        });
    });
})();
