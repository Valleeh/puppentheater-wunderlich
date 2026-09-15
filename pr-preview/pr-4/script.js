/* Puppentheater Wunderlich – kleine Helfer ohne Abhängigkeiten */
(function () {
  'use strict';

  /* Mobiles Menü */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('nav#navigation');
  if (menu && nav) {
    var close = function () {
      menu.setAttribute('aria-expanded', 'false');
      nav.classList.remove('open');
    };
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) {
        close();
        menu.focus();
      }
    });
  }

  /* E-Mail-Adresse: wird erst im Browser zusammengesetzt, damit sie
     nicht als Klartext im Quelltext steht (Schutz vor Spam-Bots).
     Im Text bleibt sie als "info (at) puppentheater-wunderlich.de" lesbar. */
  var user = 'info';
  var domain = ['puppentheater-wunderlich', 'de'].join('.');
  var address = user + '@' + domain;

  var links = document.querySelectorAll('a.mail');
  Array.prototype.forEach.call(links, function (a) {
    var params = [];
    if (a.dataset.subject) params.push('subject=' + encodeURIComponent(a.dataset.subject));
    if (a.dataset.body) params.push('body=' + encodeURIComponent(a.dataset.body));
    a.href = 'mailto:' + address + (params.length ? '?' + params.join('&') : '');
    /* Der sichtbare Text bleibt bewusst "info (at) …" – nur der Link enthält die echte Adresse. */
  });

  /* Kopfzeile: ganz oben der große Auftritt, beim Scrollen eine schmale Leiste */
  var header = document.querySelector('header');
  if (header) {
    var ticking = false;
    var apply = function () {
      var y = window.scrollY;
      header.classList.toggle('scrolled', y > 8);
      /* Zwei Schwellen, damit die Kopfzeile am Umschaltpunkt nicht flattert */
      if (y > 90) header.classList.add('compact');
      else if (y < 40) header.classList.remove('compact');
      ticking = false;
    };
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(apply);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
  }
})();
