/**
 * Fade-in sections when they enter the viewport.
 */
document.addEventListener("DOMContentLoaded", function () {
    const fadeElements = document.querySelectorAll(".fade-in");
    if (!fadeElements.length) return;

    const observer = new IntersectionObserver(
        function (entries, activeObserver) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add("active");
                activeObserver.unobserve(entry.target);
            });
        },
        { threshold: 0.2, rootMargin: "0px 0px -50px 0px" }
    );

    fadeElements.forEach(function (element) {
        observer.observe(element);
    });
});
