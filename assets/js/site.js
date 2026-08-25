// ── Shared chrome: footer year + mobile menu ───────────────────
// Kept in a file (rather than inline) so pages can ship a CSP
// without allowing inline scripts.

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const navHamburger = document.getElementById('nav-hamburger');
const navMobileMenu = document.getElementById('mobile-menu');

if (navHamburger && navMobileMenu) {
  navHamburger.addEventListener('click', () => navMobileMenu.classList.toggle('open'));
  navMobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navMobileMenu.classList.remove('open'));
  });
}
