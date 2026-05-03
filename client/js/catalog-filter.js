/**
 * Filter catalog grid by data-catalog-cats.
 * Desktop + mobile offcanvas; multi-select toggles. "all" clears selection.
 * Injects extra filter buttons for category tokens that appear in LuddiesAuth products
 * but are not in the static catalog (see CANONICAL).
 */
(function () {
    "use strict";

    var CANONICAL = [
        "science",
        "technology",
        "engineering",
        "mathematics",
        "neurodiversity",
        "certification",
        "physical",
        "dissidents"
    ];

    var activeFilters = new Set();
    var rootListenersBound = false;

    function getGridItems() {
        return document.querySelectorAll(".catalog-grid-item[data-catalog-cats]");
    }

    function allFilterButtons() {
        return document.querySelectorAll(".catalog-filter-root [data-catalog-filter]");
    }

    function removeDynamicFilterButtons() {
        document.querySelectorAll('.catalog-filter-btn[data-filter-dynamic="1"]').forEach(function (b) {
            b.remove();
        });
    }

    function injectDynamicFilterButtons() {
        if (!window.LuddiesAuth || !window.LuddiesAuth.getProducts) return;
        var products = window.LuddiesAuth.getProducts();
        var found = {};
        products.forEach(function (p) {
            var raw = (p && p.category) || "";
            raw = String(raw).toLowerCase();
            raw.split(/\s+/).forEach(function (t) {
                if (t && CANONICAL.indexOf(t) === -1) {
                    found[t] = true;
                }
            });
        });
        var extras = Object.keys(found);
        extras.sort();
        if (!extras.length) return;

        var stacks = document.querySelectorAll(".catalog-filter-stack");
        extras.forEach(function (token) {
            stacks.forEach(function (stack) {
                if (stack.querySelector('[data-catalog-filter="' + token + '"]')) {
                    return;
                }
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "catalog-filter-btn";
                btn.setAttribute("data-catalog-filter", token);
                btn.setAttribute("data-filter-dynamic", "1");
                btn.setAttribute("aria-pressed", "false");
                btn.textContent = token;
                stack.appendChild(btn);
            });
        });
    }

    function applyFilters() {
        var items = getGridItems();
        var isAll = activeFilters.size === 0;

        allFilterButtons().forEach(function (btn) {
            var val = btn.getAttribute("data-catalog-filter");
            var isActive;
            if (val === "all") {
                isActive = isAll;
            } else {
                isActive = activeFilters.has(val);
            }
            btn.classList.toggle("active", isActive);
            btn.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        items.forEach(function (item) {
            if (isAll) {
                item.hidden = false;
                return;
            }
            var raw = item.getAttribute("data-catalog-cats") || "";
            var cats = raw.split(/\s+/).filter(Boolean);
            var show = cats.some(function (cat) {
                return activeFilters.has(cat);
            });
            item.hidden = !show;
        });

        var mobileLabel = document.getElementById("catalog-active-filter-label");
        if (mobileLabel) {
            if (isAll) {
                var allBtn = document.querySelector('.catalog-filter-root [data-catalog-filter="all"]');
                if (allBtn) mobileLabel.textContent = allBtn.textContent.trim();
            } else {
                mobileLabel.textContent = activeFilters.size + " filtro(s) activo(s)";
            }
        }
    }

    function filterButtonForValue(val) {
        if (!val) return null;
        return document.querySelector('.catalog-filter-root [data-catalog-filter="' + val + '"]');
    }

    function initCatalogFilter() {
        var roots = document.querySelectorAll(".catalog-filter-root");
        if (!roots.length) return;

        var offcanvasEl = document.getElementById("catalogFiltersOffcanvas");

        removeDynamicFilterButtons();
        injectDynamicFilterButtons();

        var items = getGridItems();
        if (!items.length) {
            return;
        }

        if (!rootListenersBound) {
            rootListenersBound = true;
            roots.forEach(function (root) {
                root.addEventListener("click", function (e) {
                    var btn = e.target.closest("[data-catalog-filter]");
                    if (!btn || !root.contains(btn)) return;
                    e.preventDefault();
                    var filterValue = btn.getAttribute("data-catalog-filter");

                    if (filterValue === "all") {
                        activeFilters.clear();
                    } else {
                        if (activeFilters.has(filterValue)) {
                            activeFilters.delete(filterValue);
                        } else {
                            activeFilters.add(filterValue);
                        }
                    }

                    applyFilters();

                });
            });
        }

        activeFilters.clear();

        var q = null;
        try {
            q = new URLSearchParams(window.location.search).get("filter");
        } catch (e1) {
            q = null;
        }
        if (q && filterButtonForValue(q)) {
            activeFilters.add(q);
        }

        applyFilters();
    }

    document.addEventListener("luddies:catalog-items-mounted", initCatalogFilter);

    window.LuddiesCatalogFilter = {
        init: initCatalogFilter
    };

    (function initOffcanvasSwipe() {
    var el = document.getElementById("catalogFiltersOffcanvas");
    if (!el) return;
    var startX = 0;
    el.addEventListener("touchstart", function(e) {
        startX = e.touches[0].clientX;
    }, { passive: true });
    el.addEventListener("touchend", function(e) {
        var dx = e.changedTouches[0].clientX - startX;
        if (dx < -60 && window.bootstrap && window.bootstrap.Offcanvas) {
            window.bootstrap.Offcanvas.getOrCreateInstance(el).hide();
        }
    }, { passive: true });
})();

})();
