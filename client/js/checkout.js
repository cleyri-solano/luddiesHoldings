/**
 * Checkout: carrito + bloque pago/envío (correo obligatorio, nombre opcional).
 * Validación alineada a contacto; handoff provisional a pago.html (stub Stripe).
 */
(function () {
    "use strict";

    var PROFILE_KEY = "luddies.checkout_profile";
    var PAYMENT_STUB_KEY = "luddies.payment_stub";

    function t(key) {
        return window.LuddiesI18n && window.LuddiesI18n.t ? window.LuddiesI18n.t(key) : key;
    }

    function readProfile() {
        try {
            var raw = sessionStorage.getItem(PROFILE_KEY);
            var d = raw ? JSON.parse(raw) : {};
            return d && typeof d === "object" ? d : {};
        } catch (e) {
            return {};
        }
    }

    function writeProfile(data) {
        try {
            sessionStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        } catch (e) {
            /* ignore */
        }
    }

    function getCart() {
        return window.LuddiesCatalogCart && window.LuddiesCatalogCart.readCart
            ? window.LuddiesCatalogCart.readCart()
            : [];
    }

    /** Extrae el primer importe numérico tras $ en textos tipo "Desde $249 MXN" / "From $249 MXN". */
    function parseMXNAmountFromPriceText(priceText) {
        if (!priceText || typeof priceText !== "string") return NaN;
        var m = priceText.match(/\$\s*([\d,.]+)/);
        if (!m) return NaN;
        var raw = m[1].replace(/,/g, "");
        var n = parseFloat(raw);
        return isFinite(n) ? n : NaN;
    }

    function formatMXNTotal(amount) {
        var lang = window.LuddiesI18n && window.LuddiesI18n.getLang ? window.LuddiesI18n.getLang() : "es";
        try {
            return (
                "$" +
                amount.toLocaleString(lang === "en" ? "en-US" : "es-MX", {
                    maximumFractionDigits: 0,
                }) +
                " MXN"
            );
        } catch (e) {
            return "$" + Math.round(amount) + " MXN";
        }
    }

    function renderCartTotal(wrapEl, valEl, items) {
        if (!wrapEl || !valEl) return;
        if (!items.length) {
            wrapEl.hidden = true;
            return;
        }
        var sum = 0;
        var ok = 0;
        items.forEach(function (item) {
            var txt = item.priceKey ? t(item.priceKey) : "";
            var n = parseMXNAmountFromPriceText(txt);
            if (!isNaN(n)) {
                sum += n;
                ok += 1;
            }
        });
        if (ok !== items.length || sum <= 0) {
            wrapEl.hidden = true;
            return;
        }
        wrapEl.hidden = false;
        valEl.textContent = formatMXNTotal(sum);
    }

    function cfgFor(mapKey) {
        var validation = window.LuddiesI18n && window.LuddiesI18n.getContactValidation
            ? window.LuddiesI18n.getContactValidation()
            : {};
        return (validation && validation[mapKey]) || {};
    }

    function getMessage(field, mapKey) {
        var cfg = cfgFor(mapKey);
        if (field.validity.valueMissing) {
            return cfg.valueMissing || "Required.";
        }
        if (field.validity.typeMismatch) {
            return cfg.typeMismatch || "Invalid format.";
        }
        if (field.validity.tooShort) {
            return cfg.tooShort || "Too short.";
        }
        if (field.validity.patternMismatch) {
            return cfg.patternMismatch || "Invalid format.";
        }
        return "";
    }

    function setFieldError(fieldId, textId, containerId, show, message) {
        var field = document.getElementById(fieldId);
        var text = document.getElementById(textId);
        var container = document.getElementById(containerId);
        if (!field) return;
        field.classList.toggle("is-invalid", show);
        field.classList.toggle("is-valid", !show && field.value.trim() !== "");
        if (container) {
            container.classList.toggle("visible", show);
        }
        if (text) {
            text.textContent = show ? message : "";
        }
    }

    function clearFieldError(fieldId, textId, containerId) {
        var field = document.getElementById(fieldId);
        if (field) {
            field.classList.remove("is-invalid", "is-valid");
        }
        setFieldError(fieldId, textId, containerId, false, "");
    }

    function validateCheckoutCorreo() {
        var field = document.getElementById("checkoutCorreo");
        if (!field) return false;
        var ok = field.checkValidity();
        if (!ok) {
            setFieldError(
                "checkoutCorreo",
                "errorCheckoutCorreoText",
                "errorCheckoutCorreo",
                true,
                getMessage(field, "inputCorreo")
            );
        } else {
            clearFieldError("checkoutCorreo", "errorCheckoutCorreoText", "errorCheckoutCorreo");
        }
        return ok;
    }

    function validateCheckoutNombre() {
        var field = document.getElementById("checkoutNombre");
        if (!field) return true;
        var v = field.value.trim();
        if (!v) {
            clearFieldError("checkoutNombre", "errorCheckoutNombreText", "errorCheckoutNombre");
            return true;
        }
        var ok = field.checkValidity();
        if (!ok) {
            setFieldError(
                "checkoutNombre",
                "errorCheckoutNombreText",
                "errorCheckoutNombre",
                true,
                getMessage(field, "inputNombre")
            );
        } else {
            clearFieldError("checkoutNombre", "errorCheckoutNombreText", "errorCheckoutNombre");
        }
        return ok;
    }

    function renderCartLines(listEl, countEl, totalWrapEl, totalValEl) {
        if (!listEl) return;
        var items = getCart();
        listEl.innerHTML = "";

        if (countEl) {
            countEl.textContent = t("checkout_items_count").replace(/\{n\}/g, String(items.length));
        }

        items.forEach(function (item) {
            var title = item.titleKey ? t(item.titleKey) : "";
            var price = item.priceKey ? t(item.priceKey) : "";

            var li = document.createElement("li");
            li.className = "checkout-line";
            li.setAttribute("data-cart-id", item.id);

            var body = document.createElement("div");
            body.className = "checkout-line__body";
            var h = document.createElement("p");
            h.className = "checkout-line__title";
            h.textContent = title;
            var p = document.createElement("p");
            p.className = "checkout-line__price";
            p.textContent = price;
            body.appendChild(h);
            body.appendChild(p);

            var rm = document.createElement("button");
            rm.type = "button";
            rm.className = "checkout-line__remove js-checkout-remove";
            rm.setAttribute("data-remove-id", item.id);
            rm.textContent = t("checkout_remove");

            li.appendChild(body);
            li.appendChild(rm);
            listEl.appendChild(li);
        });

        renderCartTotal(totalWrapEl, totalValEl, items);
    }

    function syncVisibility(emptyEl, flowEl) {
        var items = getCart();
        var has = items.length > 0;
        if (emptyEl) {
            emptyEl.hidden = has;
        }
        if (flowEl) {
            flowEl.hidden = !has;
        }
    }

    function fillPaymentForm() {
        var d = readProfile();
        var email = document.getElementById("checkoutCorreo");
        var name = document.getElementById("checkoutNombre");
        if (email && d.email) email.value = d.email;
        if (name && d.name) name.value = d.name;
    }

    function readPaymentForm() {
        var email = document.getElementById("checkoutCorreo");
        var name = document.getElementById("checkoutNombre");
        return {
            email: email ? email.value.trim() : "",
            name: name ? name.value.trim() : "",
        };
    }

    function displayNameForContact(form) {
        if (form.name && form.name.length >= 2) {
            return form.name;
        }
        return t("checkout_anonymous_name");
    }

    function init() {
        if (window.LuddiesAuth && window.LuddiesAuth.syncProductLabelsToI18n) {
            window.LuddiesAuth.syncProductLabelsToI18n();
        }
        var emptyEl = document.getElementById("checkout-empty-state");
        var flowEl = document.getElementById("checkout-main-flow");
        var listEl = document.getElementById("checkout-cart-lines");
        var countEl = document.getElementById("checkout-cart-count");
        var totalRowEl = document.getElementById("checkout-cart-total-row");
        var totalValEl = document.getElementById("checkout-cart-total-value");
        var form = document.getElementById("checkout-payment-form");
        var btnSubmit = document.getElementById("checkout-submit-purchase");
        var correo = document.getElementById("checkoutCorreo");
        var nombre = document.getElementById("checkoutNombre");
        var btnClear = document.getElementById("checkout-clear-cart");

        function refresh() {
            syncVisibility(emptyEl, flowEl);
            renderCartLines(listEl, countEl, totalRowEl, totalValEl);
        }

        refresh();
        fillPaymentForm();

        document.addEventListener("click", function (e) {
            var rm = e.target.closest(".js-checkout-remove");
            if (!rm) return;
            var id = rm.getAttribute("data-remove-id");
            if (!id || !window.LuddiesCatalogCart || !window.LuddiesCatalogCart.removeProduct) return;
            window.LuddiesCatalogCart.removeProduct(id);
            refresh();
        });

        document.addEventListener("luddies:catalog-cart-changed", refresh);
        document.addEventListener("luddies:lang-changed", function () {
            refresh();
            validateCheckoutCorreo();
            validateCheckoutNombre();
        });

        var saveTimer;
        function scheduleSave() {
            clearTimeout(saveTimer);
            saveTimer = setTimeout(function () {
                var data = readPaymentForm();
                writeProfile({ email: data.email, name: data.name });
            }, 320);
        }

        if (correo) {
            correo.addEventListener("blur", validateCheckoutCorreo);
            correo.addEventListener("input", function () {
                if (correo.classList.contains("is-invalid")) {
                    validateCheckoutCorreo();
                }
                scheduleSave();
            });
        }
        if (nombre) {
            nombre.addEventListener("blur", validateCheckoutNombre);
            nombre.addEventListener("input", function () {
                if (nombre.classList.contains("is-invalid")) {
                    validateCheckoutNombre();
                }
                scheduleSave();
            });
        }

        if (btnSubmit && form) {
            btnSubmit.addEventListener("click", function (e) {
                e.preventDefault();
                var okEmail = validateCheckoutCorreo();
                var okName = validateCheckoutNombre();
                if (!okEmail || !okName) {
                    var first = form.querySelector(".is-invalid");
                    if (first) {
                        first.focus();
                    }
                    return;
                }

                var data = readPaymentForm();
                writeProfile({ email: data.email, name: data.name });

                try {
                    sessionStorage.setItem(
                        PAYMENT_STUB_KEY,
                        JSON.stringify({
                            email: data.email,
                            name: displayNameForContact(data),
                            at: Date.now(),
                        })
                    );
                } catch (err) {
                    /* ignore */
                }

                window.location.href = "pago.html";
            });
        }

        if (btnClear) {
            btnClear.addEventListener("click", function () {
            if (!window.LuddiesCatalogCart || !window.LuddiesCatalogCart.clearCart) return;
            window.LuddiesCatalogCart.clearCart();
            refresh();
        });
       }
}

    document.addEventListener("DOMContentLoaded", init);
})();
