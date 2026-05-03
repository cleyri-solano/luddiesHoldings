/**
 * Builds team carousel cards from a single data list (about page only).
 * Must load before carousel.js so the marquee can duplicate the track HTML.
 */
(function () {
    "use strict";

    var TEAM_MEMBERS = [
        {
            slug: "antonio",
            name: "Jose Antonio Martinez Torres",
            role: "Product Owner",
            img: "../images/team/antonio.jpg",
        },
        {
            slug: "azul",
            name: "Azul Alcatraz Pineda Guereca",
            role: "Scrum Master",
            img: "../images/team/azul.png",
        },
        {
            slug: "julio",
            name: "Julio Alberto Sanchez Morfin",
            role: "Development",
            img: "../images/team/julio.png",
        },
        {
            slug: "cleyri",
            name: "Cleyri Solano Garcia",
            role: "Development",
            img: "../images/team/cleyri-solano.png",
        },
        {
            slug: "daniela",
            name: "Daniela Hernandez Santillan",
            role: "Development",
            img: "../images/team/daniela.png",
        },
        {
            slug: "diego",
            name: "Diego Gerardo Estrada Morales",
            role: "Development",
            img: "../images/team/dgem.jpg",
        },
        {
            slug: "edwin",
            name: "Edwin Eduardo Sanchez Aguilar",
            role: "Development",
            img: "../images/team/edwins.png",
        },
        {
            slug: "erick",
            name: "Erick Martinez Candelario",
            role: "Development",
            img: "../images/team/erik.jpg",
        },
    ];

    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function buildCard(m) {
        return (
            '<article class="brand-card h-100">' +
            '<img class="team-photo" src="' +
            escapeHtml(m.img) +
            '" alt="">' +
            '<div class="p-4">' +
            '<h3 class="h5 mb-1">' +
            escapeHtml(m.name) +
            "</h3>" +
            '<p class="mb-0">' +
            escapeHtml(m.role) +
            "</p>" +
            '<hr class="my-2">' +
            '<p class="mb-0 text-muted small" data-i18n="team_bio_' +
            m.slug +
            '"></p>' +
            "</div></article>"
        );
    }

    document.addEventListener("DOMContentLoaded", function () {
        var track = document.getElementById("track");
        if (!track || !document.getElementById("team")) return;

        track.innerHTML = TEAM_MEMBERS.map(buildCard).join("");

        if (window.LuddiesI18n && typeof window.LuddiesI18n.applyTranslations === "function") {
            window.LuddiesI18n.applyTranslations(window.LuddiesI18n.getLang());
        }
    });
})();
