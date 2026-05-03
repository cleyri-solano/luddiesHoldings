/**
 * Loads header and footer partials into placeholder elements.
 * Expects <header id="site-header"></header> and <footer id="site-footer"></footer>.
 */
(function () {
    "use strict";

    const PARTIALS = {
        header: "partials/header.html",
        footer: "partials/footer.html",
    };

    function getScrollY() {
        return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    }

    function initNavbarScroll() {
        const nav = document.querySelector("#site-header .navbar-glass");
        if (!nav) return;

        function onScroll() {
            nav.classList.toggle("navbar-glass--scrolled", getScrollY() > 16);
        }

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll, { passive: true });
    }

    function setActiveNav() {
        const page = document.body.getAttribute("data-site-page") || "";
        const header = document.getElementById("site-header");
        if (!header) return;

        header.querySelectorAll("[data-nav]").forEach(function (el) {
            el.classList.remove("nav-link-active");
            el.removeAttribute("aria-current");
        });

        const active = header.querySelector('[data-nav="' + page + '"]');
        if (active) {
            active.classList.add("nav-link-active");
            if (active.tagName === "A") {
                active.setAttribute("aria-current", "page");
            }
        }
    }

    function initGoTopButton() {
        const goTopContainer = document.querySelector('.lh-gotop-container');
        if (!goTopContainer) return;

        function onScrollGoTop() {
            if (getScrollY() > 200) {
                goTopContainer.classList.add('lh-show');
            } else {
                goTopContainer.classList.remove('lh-show');
            }
        }
        onScrollGoTop();
        window.addEventListener("scroll", onScrollGoTop, { passive: true });
        goTopContainer.addEventListener('click', function () {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

    function fragmentFromHtmlFile(text) {
        var m = text.match(/<body[^>]*>([\s\S]*)<\/body>/i);
        return m ? m[1].trim() : text;
    }

    async function injectPartial(url, targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;
        const res = await fetch(url, { cache: "no-cache" });
        if (!res.ok) throw new Error("Failed to load " + url);
        target.innerHTML = fragmentFromHtmlFile(await res.text());
    }

    document.addEventListener("DOMContentLoaded", async function () {
        const headerEl = document.getElementById("site-header");
        const footerEl = document.getElementById("site-footer");
        if (!headerEl && !footerEl) return;

        try {
            await Promise.all([
                headerEl ? injectPartial(PARTIALS.header, "site-header") : Promise.resolve(),
                footerEl ? injectPartial(PARTIALS.footer, "site-footer") : Promise.resolve(),
            ]);
            setActiveNav();
            initNavbarScroll();
            initGoTopButton(); 
            document.dispatchEvent(new CustomEvent("luddies:layout-ready"));           
            requestAnimationFrame(function () {
                const nav = document.querySelector("#site-header .navbar-glass");
                if (nav) {
                    nav.classList.toggle("navbar-glass--scrolled", getScrollY() > 16);
                }
            });
        } catch (err) {
            console.error("[Luddies layout]", err);
        }
    });
})();