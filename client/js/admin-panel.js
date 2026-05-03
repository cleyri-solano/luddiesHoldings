/**
 * Admin UI: product CRUD and user list (delete user for admin role only).
 */
(function () {
    "use strict";

    var pendingDeleteProductId = null;
    var pendingDeleteUserId = null;
    var currentProductPage = 1;
    var PRODUCTS_PER_PAGE = 10;
    var currentProductSort = "created_desc";

    var CANONICAL_CATEGORIES = [
        "science",
        "technology",
        "engineering",
        "mathematics",
        "neurodiversity",
        "certification",
        "physical",
        "dissidents"
    ];

    function t(key) {
        return window.LuddiesI18n && window.LuddiesI18n.t ? window.LuddiesI18n.t(key) : key;
    }

    function tr(es, en) {
        if (window.LuddiesI18n && window.LuddiesI18n.getLang() === "en") return en;
        return es;
    }

    function showError(msgKey) {
        var el = document.getElementById("admin-form-error");
        if (el) {
            el.textContent = t(msgKey);
            el.classList.remove("d-none");
        }
    }

    function showPageError(msgKey) {
        var el = document.getElementById("admin-page-error");
        if (el) {
            el.textContent = t(msgKey);
            el.classList.remove("d-none");
        }
    }

    function hideError() {
        var el = document.getElementById("admin-form-error");
        if (el) el.classList.add("d-none");
    }

    function getTranslationsDict(lang) {
        if (!window.LuddiesI18n || !window.LuddiesI18n.translations) return {};
        return window.LuddiesI18n.translations[lang] || {};
    }

    function setCategoryChipsFromString(cat) {
        var tokens = (cat || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
        var grid = document.getElementById("cat-grid");
        var extra = document.getElementById("product-category-extra");
        var canon = {};
        CANONICAL_CATEGORIES.forEach(function (c) {
            canon[c] = true;
        });
        var extraToks = [];
        if (grid) {
            grid.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                var on = tokens.indexOf(cb.value) !== -1;
                cb.checked = on;
                var lab = cb.closest(".cat-chip");
                if (lab) lab.classList.toggle("checked", on);
            });
        }
        tokens.forEach(function (tok) {
            if (!canon[tok]) extraToks.push(tok);
        });
        if (extra) extra.value = extraToks.join(" ");
    }

    function readCategoryFromForm() {
        var parts = [];
        var grid = document.getElementById("cat-grid");
        if (grid) {
            grid.querySelectorAll('input[type="checkbox"]:checked').forEach(function (cb) {
                parts.push(cb.value);
            });
        }
        var extra = document.getElementById("product-category-extra");
        if (extra && extra.value.trim()) {
            extra.value
                .toLowerCase()
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .forEach(function (tok) {
                    if (parts.indexOf(tok) === -1) parts.push(tok);
                });
        }
        return parts.join(" ");
    }

    function isValidHttpUrl(s) {
        if (!s) return false;
        try {
            var u = new URL(s);
            return u.protocol === "http:" || u.protocol === "https:";
        } catch (e) {
            return false;
        }
    }

    function updateImageUi(url) {
        var strip = document.getElementById("img-preview-strip");
        var imgEl = document.getElementById("img-preview-img");
        var prevWrap = document.getElementById("prev-img");
        var ok = isValidHttpUrl(url);
        if (strip) strip.classList.toggle("has-img", ok);
        if (imgEl) {
            if (ok) {
                imgEl.src = url;
                imgEl.classList.add("visible");
            } else {
                imgEl.removeAttribute("src");
                imgEl.classList.remove("visible");
            }
        }
        if (prevWrap) {
            if (ok) {
                prevWrap.style.backgroundImage = "url(" + JSON.stringify(String(url)) + ")";
                prevWrap.classList.add("has-bg");
            } else {
                prevWrap.style.backgroundImage = "";
                prevWrap.classList.remove("has-bg");
            }
        }
    }

    function labelForCategorySlug(slug) {
        if (CANONICAL_CATEGORIES.indexOf(slug) !== -1) return t("cat_filter_" + slug);
        return slug;
    }

    function updatePreview() {
        var lang = window.LuddiesI18n && window.LuddiesI18n.getLang() === "en" ? "en" : "es";
        var titleEl = document.getElementById("product-name-" + lang);
        var metaEl = document.getElementById("product-meta-" + lang);
        var descEl = document.getElementById("product-desc-" + lang);
        var priceEl = document.getElementById("product-price-" + lang);
        var pt = document.getElementById("prev-title");
        var pm = document.getElementById("prev-meta");
        var pd = document.getElementById("prev-desc");
        var pp = document.getElementById("prev-price");
        var pc = document.getElementById("prev-cats");
        if (pt) pt.textContent = (titleEl && titleEl.value.trim()) || tr("Título del producto", "Product title");
        if (pm) pm.textContent = (metaEl && metaEl.value.trim()) || "—";
        if (pd) pd.textContent = (descEl && descEl.value.trim()) || tr("La descripción aparecerá aquí.", "Description appears here.");
        if (pp) pp.textContent = (priceEl && priceEl.value.trim()) || "—";
        if (pc) {
            pc.innerHTML = "";
            readCategoryFromForm()
                .split(/\s+/)
                .filter(Boolean)
                .forEach(function (slug) {
                    var span = document.createElement("span");
                    span.className = "preview-card__cat-tag";
                    span.textContent = labelForCategorySlug(slug);
                    pc.appendChild(span);
                });
        }
        var imgIn = document.getElementById("f-img");
        updateImageUi(imgIn ? imgIn.value.trim() : "");
    }

    function prefillFormFromProduct(p) {
        document.getElementById("product-id").value = p.id || "";
        var fImg = document.getElementById("f-img");
        if (fImg) fImg.value = p.img || "";
        setCategoryChipsFromString(p.category || "");
        var purch = p.purchasable !== 0 && p.purchasable !== "0";
        document.getElementById("product-purchasable").value = purch ? "1" : "0";

        if (p.custom && p.labels && p.labels.es && p.labels.en) {
            document.getElementById("product-name-es").value = p.labels.es.name || "";
            document.getElementById("product-name-en").value = p.labels.en.name || "";
            document.getElementById("product-desc-es").value = p.labels.es.description || "";
            document.getElementById("product-desc-en").value = p.labels.en.description || "";
            document.getElementById("product-meta-es").value = p.labels.es.meta || "";
            document.getElementById("product-meta-en").value = p.labels.en.meta || "";
            document.getElementById("product-price-es").value = p.labels.es.price || "";
            document.getElementById("product-price-en").value = p.labels.en.price || "";
        } else {
            var dEs = getTranslationsDict("es");
            var dEn = getTranslationsDict("en");
            document.getElementById("product-name-es").value = dEs[p.name] != null ? dEs[p.name] : "";
            document.getElementById("product-name-en").value = dEn[p.name] != null ? dEn[p.name] : "";
            document.getElementById("product-desc-es").value = dEs[p.description] != null ? dEs[p.description] : "";
            document.getElementById("product-desc-en").value = dEn[p.description] != null ? dEn[p.description] : "";
            document.getElementById("product-meta-es").value = dEs[p.meta] != null ? dEs[p.meta] : "";
            document.getElementById("product-meta-en").value = dEn[p.meta] != null ? dEn[p.meta] : "";
            document.getElementById("product-price-es").value = dEs[p.price] != null ? dEs[p.price] : "";
            document.getElementById("product-price-en").value = dEn[p.price] != null ? dEn[p.price] : "";
        }
        updatePreview();
    }

    function readForm() {
        var fImg = document.getElementById("f-img");
        return {
            id: document.getElementById("product-id").value.trim(),
            img: fImg ? fImg.value.trim() : "",
            category: readCategoryFromForm() || "science",
            purchasable: document.getElementById("product-purchasable").value === "0" ? 0 : 1,
            labels: {
                es: {
                    name: document.getElementById("product-name-es").value.trim(),
                    description: document.getElementById("product-desc-es").value.trim(),
                    meta: document.getElementById("product-meta-es").value.trim(),
                    price: document.getElementById("product-price-es").value.trim()
                },
                en: {
                    name: document.getElementById("product-name-en").value.trim(),
                    description: document.getElementById("product-desc-en").value.trim(),
                    meta: document.getElementById("product-meta-en").value.trim(),
                    price: document.getElementById("product-price-en").value.trim()
                }
            }
        };
    }

    function validateForm(data) {
        if (!data.img) return false;
        if (!isValidHttpUrl(data.img)) return false;
        if (!readCategoryFromForm()) return false;
        if (!data.labels.es.name || !data.labels.en.name) return false;
        if (!data.labels.es.description || !data.labels.en.description) return false;
        return true;
    }

    function displayName(p) {
        if (p.custom && p.labels) {
            return tr(p.labels.es.name, p.labels.en.name);
        }
        var d = getTranslationsDict(window.LuddiesI18n.getLang() || "es");
        return d[p.name] != null ? d[p.name] : p.name;
    }

    function syntheticTimestamp(p) {
        
        var n = parseInt(p && p.id, 10);
        if (isNaN(n)) return 0;
        return n * 1000;
    }

    function getCreatedAt(p) {
        return typeof p.createdAt === "number" ? p.createdAt : syntheticTimestamp(p);
    }

    function getUpdatedAt(p) {
        if (typeof p.updatedAt === "number") return p.updatedAt;
        if (typeof p.createdAt === "number") return p.createdAt;
        return syntheticTimestamp(p);
    }

    function sortProducts(list, mode) {
        var arr = list.slice();
        switch (mode) {
            case "name_asc":
                arr.sort(function (a, b) {
                    return displayName(a).localeCompare(displayName(b), undefined, { sensitivity: "base" });
                });
                break;
            case "name_desc":
                arr.sort(function (a, b) {
                    return displayName(b).localeCompare(displayName(a), undefined, { sensitivity: "base" });
                });
                break;
            case "created_asc":
                arr.sort(function (a, b) {
                    return getCreatedAt(a) - getCreatedAt(b);
                });
                break;
            case "created_desc":
                arr.sort(function (a, b) {
                    return getCreatedAt(b) - getCreatedAt(a);
                });
                break;
            case "updated_asc":
                arr.sort(function (a, b) {
                    return getUpdatedAt(a) - getUpdatedAt(b);
                });
                break;
            case "updated_desc":
                arr.sort(function (a, b) {
                    return getUpdatedAt(b) - getUpdatedAt(a);
                });
                break;
        }
        return arr;
    }

    function renderProductTable() {
        var body = document.getElementById("admin-products-tbody");
        if (!body || !window.LuddiesAuth) return;
        var products = sortProducts(window.LuddiesAuth.getProducts(), currentProductSort);
        var totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));

        // Si la página actual quedó fuera de rango (ej. tras borrar el último de una página)
        if (currentProductPage > totalPages) currentProductPage = totalPages;

        var start = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
        var pageProducts = products.slice(start, start + PRODUCTS_PER_PAGE);

        body.innerHTML = "";
        pageProducts.forEach(function (p) {
            var trEl = document.createElement("tr");
            trEl.innerHTML =
                "<td>" +
                escapeHtml(p.id) +
                "</td><td>" +
                escapeHtml(displayName(p)) +
                "</td><td>" +
                escapeHtml(p.category || "") +
                "</td><td class=\"text-nowrap\">" +
                "<div class=\"admin-table-actions\">" +
                "<button type=\"button\" class=\"btn btn-sm admin-table-action admin-table-action--edit js-admin-edit\" data-id=\"" +
                escapeAttr(p.id) +
                "\">" +
                "<i class=\"fa-solid fa-pen\" aria-hidden=\"true\"></i>" +
                "<span>" +
                escapeHtml(t("admin_btn_edit")) +
                "</span></button>" +
                "<button type=\"button\" class=\"btn btn-sm admin-table-action admin-table-action--delete js-admin-del-product\" data-id=\"" +
                escapeAttr(p.id) +
                "\" aria-label=\"" +
                escapeAttr(t("admin_btn_delete")) +
                "\" title=\"" +
                escapeAttr(t("admin_btn_delete")) +
                "\">" +
                "<i class=\"fa-solid fa-trash-can\" aria-hidden=\"true\"></i>" +
                "</button></div></td>";
            body.appendChild(trEl);
        });

        renderProductPagination(products.length);
    }

    function renderProductPagination(total) {
        var wrap = document.getElementById("admin-products-pagination");
        if (!wrap) return;
        wrap.innerHTML = "";
        var totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));
        if (totalPages <= 1) return;

        function makeBtn(label, page, isActive, isDisabled) {
            var btn = document.createElement("button");
            btn.type = "button";
            btn.className = "admin-pagination-btn" + (isActive ? " active" : "");
            btn.textContent = label;
            btn.disabled = !!isDisabled;
            if (!isActive && !isDisabled) {
                btn.addEventListener("click", function () {
                    currentProductPage = page;
                    renderProductTable();
                });
            }
            return btn;
        }

        // Anterior
        wrap.appendChild(makeBtn("‹", currentProductPage - 1, false, currentProductPage === 1));

        // Números de página (con elipsis si hay muchas)
        for (var i = 1; i <= totalPages; i++) {
            if (
                totalPages <= 7 ||
                i === 1 ||
                i === totalPages ||
                (i >= currentProductPage - 1 && i <= currentProductPage + 1)
            ) {
                wrap.appendChild(makeBtn(i, i, i === currentProductPage, false));
            } else if (
                i === currentProductPage - 2 ||
                i === currentProductPage + 2
            ) {
                var ellipsis = document.createElement("span");
                ellipsis.className = "admin-pagination-ellipsis";
                ellipsis.textContent = "…";
                wrap.appendChild(ellipsis);
            }
        }

        // Siguiente
        wrap.appendChild(makeBtn("›", currentProductPage + 1, false, currentProductPage === totalPages));
    }

    function renderUserTable() {
        var body = document.getElementById("admin-users-tbody");
        if (!body || !window.LuddiesAuth) return;
        var users = window.LuddiesAuth.getUsers();
        body.innerHTML = "";
        users.forEach(function (u) {
            var trEl = document.createElement("tr");
            var roleLabel = u.role === "admin" ? t("admin_role_admin") : t("admin_role_user");
            var delBtn =
                u.role === "user"
                    ? "<div class=\"admin-table-actions\">" +
                      "<button type=\"button\" class=\"btn btn-sm admin-table-action admin-table-action--delete js-admin-del-user\" data-id=\"" +
                      escapeAttr(u.id) +
                      "\" aria-label=\"" +
                      escapeAttr(t("admin_user_delete")) +
                      "\" title=\"" +
                      escapeAttr(t("admin_user_delete")) +
                      "\">" +
                      "<i class=\"fa-solid fa-trash-can\" aria-hidden=\"true\"></i>" +
                      "</button></div>"
                    : "<span class=\"text-secondary\">—</span>";
            trEl.innerHTML =
                "<td>" +
                escapeHtml(u.fullName || "") +
                "</td><td>" +
                escapeHtml(u.email) +
                "</td><td>" +
                escapeHtml(roleLabel) +
                "</td><td class=\"text-nowrap\">" +
                delBtn +
                "</td>";
            body.appendChild(trEl);
        });
    }

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function escapeAttr(s) {
        return String(s).replace(/"/g, "&quot;");
    }

    function openProductModal(product) {
        var modalEl = document.getElementById("product-form-modal");
        if (!modalEl) return;
        if (product) {
            prefillFormFromProduct(product);
        } else {
            document.getElementById("product-id").value = "";
            var fi = document.getElementById("f-img");
            if (fi) fi.value = "";
            setCategoryChipsFromString("");
            var extra = document.getElementById("product-category-extra");
            if (extra) extra.value = "";
            document.getElementById("product-purchasable").value = "1";
            document.getElementById("product-name-es").value = "";
            document.getElementById("product-name-en").value = "";
            document.getElementById("product-desc-es").value = "";
            document.getElementById("product-desc-en").value = "";
            document.getElementById("product-meta-es").value = "";
            document.getElementById("product-meta-en").value = "";
            document.getElementById("product-price-es").value = "";
            document.getElementById("product-price-en").value = "";
        }
        hideError();
        if (window.LuddiesI18n && window.LuddiesI18n.applyTranslations) {
            window.LuddiesI18n.applyTranslations(window.LuddiesI18n.getLang());
        }
        updatePreview();
        if (window.bootstrap && window.bootstrap.Modal) {
            window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
        }
    }

    function findProductById(id) {
        return window.LuddiesAuth.getProducts().find(function (p) {
            return String(p.id) === String(id);
        });
    }

    function saveProductForm(e) {
        e.preventDefault();
        hideError();
        var data = readForm();
        if (!validateForm(data)) {
            showError("admin_error_validation");
            return;
        }
        var asJson = JSON.stringify({
            id: data.id || null,
            img: data.img,
            category: data.category,
            purchasable: data.purchasable,
            labels: data.labels
        });
        if (window.console && console.debug) {
            console.debug("Product model (JSON string):", asJson);
        }
        var res = window.LuddiesAuth.saveProduct(data);
        if (res && res.ok) {
            if (window.LuddiesAuth.syncProductLabelsToI18n) {
                window.LuddiesAuth.syncProductLabelsToI18n();
            }
            var modalEl = document.getElementById("product-form-modal");
            if (modalEl && window.bootstrap) {
                var inst = window.bootstrap.Modal.getInstance(modalEl);
                if (inst) inst.hide();
            }
            renderProductTable();
        } else {
            showError("admin_error_validation");
        }
    }

    function init() {
        var sortSel = document.getElementById("admin-products-sort");
        if (sortSel) {
            sortSel.value = currentProductSort;
            sortSel.addEventListener("change", function () {
                currentProductSort = sortSel.value || "created_desc";
                currentProductPage = 1;
                renderProductTable();
            });
        }

        renderProductTable();
        renderUserTable();

        document.getElementById("admin-btn-new-product") &&
            document.getElementById("admin-btn-new-product").addEventListener("click", function () {
                openProductModal(null);
            });

        document.getElementById("admin-products-tbody") &&
            document.getElementById("admin-products-tbody").addEventListener("click", function (e) {
                var ed = e.target.closest(".js-admin-edit");
                if (ed) {
                    var p = findProductById(ed.getAttribute("data-id"));
                    if (p) openProductModal(p);
                    return;
                }
                var del = e.target.closest(".js-admin-del-product");
                if (del) {
                    pendingDeleteProductId = del.getAttribute("data-id");
                    var cfm = document.getElementById("confirm-delete-product-modal");
                    if (cfm && window.bootstrap) {
                        new window.bootstrap.Modal(cfm).show();
                    }
                }
            });

        document.getElementById("admin-users-tbody") &&
            document.getElementById("admin-users-tbody").addEventListener("click", function (e) {
                var del = e.target.closest(".js-admin-del-user");
                if (del) {
                    pendingDeleteUserId = del.getAttribute("data-id");
                    var cfm = document.getElementById("confirm-delete-user-modal");
                    if (cfm && window.bootstrap) {
                        new window.bootstrap.Modal(cfm).show();
                    }
                }
            });

        var catGrid = document.getElementById("cat-grid");
        if (catGrid) {
            catGrid.addEventListener("change", function (e) {
                var cb = e.target;
                if (!cb || cb.type !== "checkbox") return;
                var lab = cb.closest(".cat-chip");
                if (lab) lab.classList.toggle("checked", cb.checked);
                updatePreview();
            });
        }

        var previewIds = [
            "f-img",
            "product-name-es",
            "product-name-en",
            "product-desc-es",
            "product-desc-en",
            "product-meta-es",
            "product-meta-en",
            "product-price-es",
            "product-price-en",
            "product-category-extra"
        ];
        previewIds.forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener("input", updatePreview);
            el.addEventListener("change", updatePreview);
        });
        var purch = document.getElementById("product-purchasable");
        if (purch) purch.addEventListener("change", updatePreview);

        var prevImg = document.getElementById("img-preview-img");
        if (prevImg) {
            prevImg.addEventListener("error", function () {
                prevImg.classList.remove("visible");
            });
        }

        var modalEl = document.getElementById("product-form-modal");
        if (modalEl) {
            modalEl.addEventListener("shown.bs.modal", function () {
                updatePreview();
            });
        }

        document.getElementById("product-form") &&
            document.getElementById("product-form").addEventListener("submit", saveProductForm);

        document.getElementById("confirm-delete-product-ok") &&
            document.getElementById("confirm-delete-product-ok").addEventListener("click", function () {
                if (pendingDeleteProductId) {
                    window.LuddiesAuth.deleteProduct(pendingDeleteProductId);
                    pendingDeleteProductId = null;
                    var m = document.getElementById("confirm-delete-product-modal");
                    if (m && window.bootstrap) {
                        var i = window.bootstrap.Modal.getInstance(m);
                        if (i) i.hide();
                    }
                    renderProductTable();
                }
            });

        document.getElementById("confirm-delete-user-ok") &&
            document.getElementById("confirm-delete-user-ok").addEventListener("click", function () {
                if (!pendingDeleteUserId) return;
                var s = window.LuddiesAuth.getSession();
                var r = window.LuddiesAuth.deleteUser(pendingDeleteUserId, s && s.userId);
                pendingDeleteUserId = null;
                var m = document.getElementById("confirm-delete-user-modal");
                if (m && window.bootstrap) {
                    var i = window.bootstrap.Modal.getInstance(m);
                    if (i) i.hide();
                }
                if (r && r.ok) {
                    renderUserTable();
                } else if (r && r.error === "forbidden") {
                    showPageError("admin_error_forbidden");
                }
            });
    }

    document.addEventListener("DOMContentLoaded", init);
})();
