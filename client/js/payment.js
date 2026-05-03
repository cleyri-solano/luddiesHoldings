/**
 * Simulación de Pago - Luddies
 */
(function () {
    "use strict";

    var STUB_KEY = "luddies.payment_stub";
    var CART_KEY = "luddies.catalog_cart";
    var RECEIPT_KEY = "luddies.payment_receipt";

    function t(key) {
        return window.LuddiesI18n && window.LuddiesI18n.t ? window.LuddiesI18n.t(key) : key;
    }

    function readCart() {
        try {
            if (window.LuddiesCatalogCart && window.LuddiesCatalogCart.readCart) {
                return window.LuddiesCatalogCart.readCart();
            }
            var raw = localStorage.getItem(CART_KEY);
            var data = raw ? JSON.parse(raw) : [];
            return Array.isArray(data) ? data : [];
        } catch (e) {
            return [];
        }
    }

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

    function computeCartSummary(items) {
        var total = 0;
        var validItems = 0;
        items.forEach(function (item) {
            var txt = item && item.priceKey ? t(item.priceKey) : "";
            var n = parseMXNAmountFromPriceText(txt);
            if (!isNaN(n)) {
                total += n;
                validItems += 1;
            }
        });
        return {
            itemCount: items.length,
            validItems: validItems,
            total: total,
            isValid: items.length > 0 && validItems === items.length && total > 0,
        };
    }

    function makeReference() {
        var stamp = Date.now().toString(36).toUpperCase();
        var rand = Math.random().toString(36).substring(2, 8).toUpperCase();
        return "LUD-" + stamp + "-" + rand;
    }

    function showBanner(el, message) {
        if (!el) return;
        el.textContent = message;
        el.hidden = false;
    }

    function hideBanner(el) {
        if (!el) return;
        el.hidden = true;
        el.textContent = "";
    }

    function validateCheckoutReadiness(summary, email) {
        if (!summary.itemCount) {
            return t("payment_error_empty_cart");
        }
        if (!summary.isValid) {
            return t("payment_error_invalid_total");
        }
        if (!email) {
            return t("payment_error_missing_email");
        }
        return "";
    }

    function setSubmitState(button, disabled, loading) {
        if (!button) return;
        button.disabled = !!disabled;
        button.classList.toggle("loading", !!loading);
        button.setAttribute("aria-busy", loading ? "true" : "false");
    }

    function clearCart() {
        if (window.LuddiesCatalogCart && window.LuddiesCatalogCart.clearCart) {
            window.LuddiesCatalogCart.clearCart();
            return;
        }
        try {
            localStorage.setItem(CART_KEY, JSON.stringify([]));
        } catch (e) {
            /* ignore */
        }
    }

    function countLabel(itemCount) {
        var template = t("payment_items_count");
        if (!template || template === "payment_items_count") {
            return itemCount + " items";
        }
        if (template.indexOf("{n}") >= 0) {
            return template.replace(/\{n\}/g, String(itemCount));
        }
        return itemCount + " " + template;
    }

    // Validador de Algoritmo de Luhn
    function isValidLuhn(val) {
        var sum = 0;
        var shouldDouble = false;
        for (var i = val.length - 1; i >= 0; i--) {
            var digit = parseInt(val.charAt(i), 10);
            if (shouldDouble) {
                if ((digit *= 2) > 9) digit -= 9;
            }
            sum += digit;
            shouldDouble = !shouldDouble;
        }
        return (sum % 10) === 0;
    }

    // Validador de Fecha de Vencimiento (MM/YY)
    function isValidExpiry(val) {
        var parts = val.split("/");
        if (parts.length !== 2) return false;
        var month = parseInt(parts[0], 10);
        var year = parseInt(parts[1], 10);
        if (month < 1 || month > 12) return false;
        var now = new Date();
        var currentYear = parseInt(now.getFullYear().toString().substring(2, 4), 10);
        var currentMonth = now.getMonth() + 1;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        return true;
    }

    document.addEventListener("DOMContentLoaded", function () {
        var elEmail = document.getElementById("payment-stub-email");
        var elTotal = document.getElementById("payment-total");
        var form = document.getElementById("payment-simulation-form");
        var viewCheckout = document.getElementById("payment-checkout-view");
        var viewSuccess = document.getElementById("payment-success-view");
        var btnPay = document.getElementById("btn-simulate-pay");
        var errorBanner = document.getElementById("payment-error-banner");
        var cartCountEl = document.getElementById("payment-cart-count");
        var referenceEl = document.getElementById("payment-confirmation-ref");

        var ccInput = document.getElementById("cc-number");
        var expInput = document.getElementById("cc-exp");
        var cvcInput = document.getElementById("cc-cvc");
        var checkoutData = null;
        var cartSummary = null;
        var paymentReference = "";

        function renderEmail() {
            if (!elEmail) return;
            if (checkoutData && checkoutData.email) {
                elEmail.textContent = checkoutData.email;
                return;
            }
            elEmail.textContent = t("payment_email_missing");
        }

        function readStoredReference() {
            try {
                var rawReceipt = sessionStorage.getItem(RECEIPT_KEY);
                if (!rawReceipt) return "";
                var receipt = JSON.parse(rawReceipt);
                return receipt && receipt.reference ? String(receipt.reference) : "";
            } catch (e) {
                return "";
            }
        }

        function renderReference() {
            if (!referenceEl || viewSuccess.hidden) return;
            if (!paymentReference) {
                paymentReference = readStoredReference();
            }
            referenceEl.textContent = paymentReference
                ? t("payment_reference_prefix") + " " + paymentReference
                : t("payment_reference_prefix") + " --";
        }

        // 1. Mostrar email guardado desde checkout
        try {
            var rawStub = sessionStorage.getItem(STUB_KEY);
            if (rawStub) {
                var d = JSON.parse(rawStub);
                if (d && d.email) {
                    checkoutData = d;
                }
            }
        } catch (e) {
            /* ignorar */
        }
        renderEmail();

        // 2. Mostrar total calculado del carrito
        function renderTotal() {
            var items = readCart();
            cartSummary = computeCartSummary(items);
            if (elTotal && cartSummary) {
                elTotal.textContent = cartSummary.isValid ? formatMXNTotal(cartSummary.total) : "$0 MXN";
            }
            if (cartCountEl && cartSummary) {
                cartCountEl.textContent = countLabel(cartSummary.itemCount);
            }
        }
        renderTotal();
        var readinessError = validateCheckoutReadiness(cartSummary || { itemCount: 0, isValid: false }, checkoutData && checkoutData.email);
        if (readinessError) {
            showBanner(errorBanner, readinessError);
            setSubmitState(btnPay, true, false);
        } else {
            hideBanner(errorBanner);
            setSubmitState(btnPay, false, false);
        }

        document.addEventListener("luddies:catalog-cart-changed", function () {
            renderTotal();
            var validationMessage = validateCheckoutReadiness(cartSummary || { itemCount: 0, isValid: false }, checkoutData && checkoutData.email);
            if (validationMessage) {
                showBanner(errorBanner, validationMessage);
                setSubmitState(btnPay, true, false);
                return;
            }
            hideBanner(errorBanner);
            setSubmitState(btnPay, false, false);
        });

        // 3. Formateo dinámico de campos
        if (ccInput && expInput && cvcInput) {
            ccInput.addEventListener("input", function (e) {
                var value = e.target.value.replace(/\D/g, "");
                var formattedValue = "";
                for (var i = 0; i < value.length; i++) {
                    if (i > 0 && i % 4 === 0) formattedValue += " ";
                    formattedValue += value[i];
                }
                e.target.value = formattedValue;
                ccInput.setCustomValidity(""); // Limpiar mensaje de error al escribir
            });

            expInput.addEventListener("input", function (e) {
                var value = e.target.value.replace(/\D/g, "");
                if (value.length > 2) {
                    e.target.value = value.substring(0, 2) + "/" + value.substring(2, 4);
                } else {
                    e.target.value = value;
                }
                expInput.setCustomValidity("");
            });

            cvcInput.addEventListener("input", function (e) {
                e.target.value = e.target.value.replace(/\D/g, "").substring(0, 4);
                cvcInput.setCustomValidity("");
            });
        }

        // 4. Validar y simular el proceso de pago
        if (form) {
            form.addEventListener("submit", function (e) {
                e.preventDefault();
                hideBanner(errorBanner);

                renderTotal();
                var guardedError = validateCheckoutReadiness(cartSummary || { itemCount: 0, isValid: false }, checkoutData && checkoutData.email);
                if (guardedError) {
                    showBanner(errorBanner, guardedError);
                    return;
                }

                // Comprobaciones antes de procesar pago
                if (ccInput && expInput && cvcInput) {
                    var ccVal = ccInput.value.replace(/\s/g, "");
                    if (ccVal.length < 13 || !isValidLuhn(ccVal)) {
                        ccInput.setCustomValidity(t("payment_error_card_invalid"));
                        ccInput.reportValidity();
                        return;
                    }
                    if (!isValidExpiry(expInput.value)) {
                        expInput.setCustomValidity(t("payment_error_exp_invalid"));
                        expInput.reportValidity();
                        return;
                    }
                    if (cvcInput.value.length < 3) {
                        cvcInput.setCustomValidity(t("payment_error_cvc_invalid"));
                        cvcInput.reportValidity();
                        return;
                    }
                }

                setSubmitState(btnPay, true, true);

                setTimeout(function () {
                    setSubmitState(btnPay, false, false);
                    if (viewCheckout) viewCheckout.hidden = true;
                    if (viewSuccess) viewSuccess.hidden = false;
                    var reference = makeReference();
                    paymentReference = reference;
                    try {
                        sessionStorage.setItem(
                            RECEIPT_KEY,
                            JSON.stringify({
                                reference: reference,
                                total: cartSummary ? cartSummary.total : 0,
                                email: checkoutData ? checkoutData.email : "",
                                at: Date.now(),
                            })
                        );
                    } catch (err) {
                        /* ignore */
                    }
                    renderReference();
                    clearCart();
                }, 2000); // 2 segundos de simulación
            });
        }

        document.addEventListener("luddies:lang-changed", function () {
            renderTotal();
            renderEmail();
            renderReference();
            var message = validateCheckoutReadiness(cartSummary || { itemCount: 0, isValid: false }, checkoutData && checkoutData.email);
            if (message) {
                showBanner(errorBanner, message);
            }
        });

        document.addEventListener("luddies:layout-ready", function () {
            renderTotal();
            renderEmail();
        });
    });
})();