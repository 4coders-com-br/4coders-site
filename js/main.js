// === Language Toggle ===
(function () {
  const STORAGE_KEY = '4coders-lang';
  let currentLang = localStorage.getItem(STORAGE_KEY) || 'pt';

  const toggle = document.getElementById('langToggle');

  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    toggle.textContent = lang === 'pt' ? 'EN' : 'PT';

    document.querySelectorAll('[data-pt][data-en]').forEach(function (el) {
      el.textContent = el.getAttribute('data-' + lang);
    });
  }

  toggle.addEventListener('click', function () {
    applyLang(currentLang === 'pt' ? 'en' : 'pt');
  });

  applyLang(currentLang);

  // === Mobile menu ===
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');

  hamburger.addEventListener('click', function () {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
  });

  // Close mobile menu on link click
  navLinks.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      navLinks.classList.remove('active');
      hamburger.classList.remove('active');
    });
  });

  // === Sticky nav shadow ===
  var nav = document.getElementById('nav');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 10) {
      nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });

  // === Smooth scroll offset for fixed nav ===
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offset = 80;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
      }
    });
  });
})();
