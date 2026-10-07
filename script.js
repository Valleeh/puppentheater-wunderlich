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
  var teil = function (auswahl, ersatz) {
    var knoten = document.querySelector(auswahl);
    return (knoten && knoten.textContent.trim()) || ersatz;
  };
  /* Die Adresse steht als „info (at) …“ im Kontakt-Abschnitt (aus inhalt.yaml) */
  var user = teil('.mail-user', 'info');
  var domain = teil('.mail-domain', ['puppentheater-wunderlich', 'de'].join('.'));
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
    /* Die Kopfzeile sitzt oben in der Seite: schrumpft sie, rutscht alles
       darunter nach oben – und mit ihm der Scrollstand, der die Kopfzeile
       gleich wieder umschaltet, immer hin und her. Damit dieses Flackern gar
       nicht erst entsteht, gibt die Kopfzeile den gesparten Platz als Abstand
       nach unten wieder her: Höhe plus Abstand bleiben konstant, der Rest der
       Seite steht still. */
    var tall = 0;
    var compensate = function () {
      header.style.marginBottom = Math.max(0, tall - header.offsetHeight) + 'px';
    };

    /* Der Ausgleich folgt der tatsächlichen Höhe, auch während sie sich
       zusammenzieht. Beobachtet wird die Rahmenbox, denn die letzten
       Bildpunkte des Übergangs sind reiner Innenabstand. */
    if (window.ResizeObserver) {
      try {
        new ResizeObserver(compensate).observe(header, { box: 'border-box' });
      } catch (e) {
        new ResizeObserver(compensate).observe(header);
      }
    }
    header.addEventListener('transitionend', compensate);

    /* Die Maße beider Zustände: gemessen ohne Übergänge, sonst sind es noch
       die des alten Zustands. --header-shrink ist der Rückfall für Browser
       ohne ResizeObserver. */
    var measure = function () {
      var wasCompact = header.classList.contains('compact');
      header.classList.add('measuring');
      header.style.marginBottom = '0px';
      header.classList.remove('compact');
      tall = header.offsetHeight;
      header.classList.add('compact');
      var short = header.offsetHeight;
      header.classList.toggle('compact', wasCompact);
      header.offsetHeight; /* erzwingt die Neuberechnung, bevor die Übergänge zurückkommen */
      header.classList.remove('measuring');
      document.documentElement.style.setProperty('--header-shrink', Math.max(0, tall - short) + 'px');
      compensate();
    };

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

    /* Neu messen, wenn sich die Maße ändern können: andere Fensterbreite,
       oder die Hausschrift ist nachgeladen und der Schriftzug wird größer. */
    var remeasure = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(remeasure);
      remeasure = window.setTimeout(measure, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    measure();
    apply();
  }

  /* Video: Erst auf Klick laden. Bis dahin liegt nur das Vorschaubild auf der Seite,
     und auch das erst, wenn man in die Nähe scrollt. Gilt für jedes Video auf der Seite;
     die Maße übernimmt der Player vom Vorschaubild. */
  var shells = document.querySelectorAll('.video-shell');
  Array.prototype.forEach.call(shells, function (shell) {
    shell.addEventListener('click', function () {
      var poster = shell.querySelector('img');
      var video = document.createElement('video');
      [['data-video-webm', 'video/webm'], ['data-video-mp4', 'video/mp4']].forEach(function (pair) {
        var url = shell.getAttribute(pair[0]);
        if (!url) return;
        var source = document.createElement('source');
        source.src = url;
        source.type = pair[1];
        video.appendChild(source);
      });
      video.controls = true;
      video.autoplay = true;
      video.setAttribute('playsinline', '');
      /* Maße: erst die des Videos, sonst die des Vorschaubildes.
         Sie legen das Seitenverhältnis fest, damit die Seite beim Start nicht springt. */
      var vw = shell.getAttribute('data-video-width') || (poster && poster.getAttribute('width'));
      var vh = shell.getAttribute('data-video-height') || (poster && poster.getAttribute('height'));
      if (vw && vh) {
        video.setAttribute('width', vw);
        video.setAttribute('height', vh);
      }
      shell.innerHTML = '';
      shell.appendChild(video);
      var started = video.play();
      if (started && started.catch) started.catch(function () {});
    });
  });
})();
