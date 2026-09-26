/* ==========================================================================
   Puppentheater Wunderlich – Werkstatt (Oberfläche)
   Zeigt jeden Text aus inhalt.yaml als Feld, Listen als Karten zum
   Hinzufügen, Verschieben und Löschen, und daneben die fertige Seite.

   Welche Felder es gibt, steht unten in ABSCHNITTE. Kommt in vorlage.html
   ein neues Feld dazu, gehört es auch dorthin – sonst lässt es sich hier
   nicht bearbeiten (in inhalt.yaml bleibt es trotzdem erhalten).
   Das Lesen, Schreiben und Ausfüllen macht bearbeiten-kern.js.
   ========================================================================== */
(function () {
  'use strict';

  var K = window.WerkstattKern;
  var ENTWURF_SCHLUESSEL = 'puppentheater-inhalt-entwurf';

  /* ========================================================================
     1. Welche Felder es gibt
     ======================================================================== */

  var MIT_AUSZEICHNUNG = 'Neue Zeile mit Enter · *Wort* kursiv · **Wort** fett · [Text](https://…) wird ein Link';
  var FUER_UEBERSCHRIFT = 'Neue Zeile mit Enter · *Wort* wird rot und kursiv';
  var FUER_BILDTEXT = 'Beschreibt das Bild für Menschen, die es nicht sehen können, und für Suchmaschinen';
  var FUER_ZIEL = '„#termine“ springt zu einem Abschnitt der Seite; eine Internetadresse beginnt mit https://';

  function text(name, titel, hilfe, halb) { return { name: name, art: 'text', titel: titel, hilfe: hilfe, halb: halb }; }
  function lang(name, titel, hilfe) { return { name: name, art: 'lang', titel: titel, hilfe: hilfe }; }
  function reich(name, titel) { return { name: name, art: 'lang', titel: titel, hilfe: MIT_AUSZEICHNUNG }; }
  function ueberschrift(name, titel) { return { name: name, art: 'lang', titel: titel, hilfe: FUER_UEBERSCHRIFT, klein: true }; }
  function schalter(name, titel) { return { name: name, art: 'schalter', titel: titel }; }
  function bild(name, titel, hilfe) { return { name: name, art: 'bild', titel: titel, hilfe: hilfe }; }
  function gruppe(name, titel, felder, hilfe) { return { name: name, art: 'gruppe', titel: titel, felder: felder, hilfe: hilfe }; }
  function liste(name, titel, einzahl, felder, kurz, hilfe) {
    return { name: name, art: 'liste', titel: titel, einzahl: einzahl, felder: felder, kurz: kurz, hilfe: hilfe };
  }
  function textliste(name, titel, einzahl, reichhaltig, hilfe) {
    return { name: name, art: 'textliste', titel: titel, einzahl: einzahl, reich: reichhaltig, hilfe: hilfe };
  }

  function kopf() {
    return [
      text('vorspann', 'Kleine Zeile über der Überschrift'),
      ueberschrift('titel', 'Überschrift'),
      reich('einleitung', 'Einleitung')
    ];
  }
  function verweis() {
    return [text('beschriftung', 'Beschriftung', null, true), text('ziel', 'Ziel', FUER_ZIEL, true)];
  }
  function anfrage(titel) {
    return gruppe('anfrage', titel || 'Link „anfragen“', [
      text('beschriftung', 'Beschriftung', null, true),
      text('betreff', 'Betreff der E-Mail', null, true)
    ], 'Öffnet beim Klick eine E-Mail an das Theater mit diesem Betreff.');
  }
  function video() {
    return gruppe('video', 'Video', [
      { name: 'datei', art: 'video', titel: 'Video-Datei' },
      bild('vorschau_bild', 'Vorschaubild'),
      text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
      text('knopf', 'Text auf dem Vorschaubild', 'z. B. „Ausschnitt ansehen · 26 Sekunden“'),
      text('unterschrift', 'Unterschrift unter dem Video', 'nur bei den Bühnenprojekten sichtbar')
    ], 'Leer lassen, wenn es kein Video gibt.');
  }
  function kurzname() {
    return text('kennung', 'Kurzname', 'ohne Leerzeichen, z. B. „der-stern“ – damit führt ein Link mit #der-stern direkt hierher');
  }

  var ABSCHNITTE = [
    { name: 'seite', titel: 'Kopf & Menü', sprung: 'oben', felder: [
      text('titel', 'Titel im Browser-Tab'),
      lang('beschreibung', 'Beschreibung für Suchmaschinen', 'erscheint bei Google unter dem Titel'),
      text('teilen_titel', 'Titel beim Teilen', 'z. B. wenn jemand die Seite per WhatsApp verschickt'),
      lang('teilen_text', 'Text beim Teilen'),
      bild('teilen_bild', 'Bild beim Teilen'),
      liste('navigation', 'Menü', 'Menüpunkt', verweis(), ['beschriftung']),
      gruppe('navigation_knopf', 'Knopf rechts im Menü', verweis())
    ] },
    { name: 'buehne', titel: 'Begrüßung', sprung: 'oben', felder: [
      text('vorspann', 'Kleine Zeile über der Überschrift'),
      ueberschrift('titel', 'Große Überschrift'),
      reich('einleitung', 'Einleitung'),
      gruppe('knopf', 'Knopf', verweis()),
      gruppe('link', 'Link neben dem Knopf', verweis()),
      reich('hinweis', 'Zeile darunter'),
      bild('bild', 'Foto'),
      text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
      reich('bildunterschrift', 'Schriftzug auf dem Foto')
    ] },
    { name: 'band', titel: 'Band', sprung: 'oben', ganz: textliste('band', 'Stichworte im Band', 'Stichwort', false,
      'Das farbige Band unter der Begrüßung. Zwischen die Stichworte kommt automatisch ein ✦.') },
    { name: 'termine', titel: 'Termine', sprung: 'termine', felder: kopf().concat([
      liste('liste', 'Vorstellungen', 'Termin', [
        text('etikett', 'Etikett', 'kleine Zeile über dem Datum, z. B. „Premiere“', true),
        text('wochentag', 'Wochentag', 'z. B. „Samstag“', true),
        text('datum', 'Datum', 'z. B. „7. November 2026“', true),
        text('uhrzeit', 'Uhrzeit', 'z. B. „16:00 Uhr“', true),
        text('besetzung', 'Besetzung', 'z. B. „Mit dem Bürgersinfonie-Orchester“'),
        text('zusatz', 'Zusätzliche Zeile', 'kann leer bleiben'),
        text('eintritt', 'Eintritt', 'z. B. „15 € · Kinder 7–12 Jahre 7 €“'),
        text('ort', 'Ort', 'Name des Hauses', true),
        text('ort_link', 'Internetseite des Hauses', 'kann leer bleiben', true),
        text('adresse', 'Adresse'),
        schalter('hervorheben', 'Diese Karte farbig hervorheben')
      ], ['datum', 'etikett'], 'Die oberste Karte steht auf der Website links.'),
      reich('hinweis_karten', 'Hinweis unter den Terminen, erste Zeile'),
      gruppe('programm_link', 'Link am Ende der ersten Zeile', verweis()),
      reich('hinweis_fragen', 'Hinweis, zweite Zeile'),
      anfrage('E-Mail-Link am Ende der zweiten Zeile')
    ]) },
    { name: 'projekte', titel: 'Bühnenprojekte', sprung: 'projekte', felder: kopf().concat([
      liste('liste', 'Projekte', 'Projekt', [
        kurzname(),
        schalter('plakat', 'Das Bild ist ein Plakat (Hochformat)'),
        bild('bild', 'Bild'),
        text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
        liste('weitere_bilder', 'Weitere Bilder', 'Bild', [bild('bild', 'Bild'), text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT)],
          ['bildtext', 'bild'], 'Kleine Bilder unter dem großen – nicht beim Plakat.'),
        text('vorspann', 'Kleine Zeile über dem Titel'),
        text('titel', 'Titel'),
        text('untertitel', 'Untertitel'),
        textliste('absaetze', 'Text', 'Absatz', true),
        liste('mitwirkende', 'Mitwirkende', 'Person', [
          text('wer', 'Wer', 'Name oder Aufgabe, z. B. „Klavier“', true),
          text('was', 'Was', null, true)
        ], ['wer']),
        textliste('hinweise', 'Kleine Hinweise', 'Hinweis', true),
        video(),
        anfrage()
      ], ['titel'])
    ]) },
    { name: 'stuecke', titel: 'Stücke', sprung: 'stuecke', felder: kopf().concat([
      liste('liste', 'Stücke', 'Stück', [
        kurzname(),
        textliste('etiketten', 'Etiketten', 'Etikett', false, 'kleine Kästchen über dem Titel, z. B. „Ab 3 Jahren“'),
        text('titel', 'Titel'),
        bild('titel_bild', 'Schriftzug statt Titel', 'nur, wenn es für das Stück einen gezeichneten Schriftzug gibt'),
        bild('bild', 'Foto', 'Hat das Stück ein Video, erscheint stattdessen das Video.'),
        { name: 'bild_ausschnitt', art: 'auswahl', titel: 'Welcher Teil des Fotos ist zu sehen?', optionen: [
          ['', 'die Mitte'], ['focus-stage', 'etwas oberhalb der Mitte'], ['focus-face', 'das obere Viertel'],
          ['focus-top', 'fast ganz oben'], ['focus-high', 'ganz oben']
        ] },
        text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
        video(),
        reich('einleitung', 'Einleitung'),
        schalter('gedicht', 'Einleitung Zeile für Zeile setzen, wie ein Gedicht'),
        textliste('mehr', '„Mehr zum Stück“', 'Absatz', true, 'Erscheint erst nach einem Klick auf „Mehr zum Stück“.'),
        reich('technik', 'Technik und Aufbau'),
        anfrage()
      ], ['titel'])
    ]) },
    { name: 'ueber_uns', titel: 'Wer wir sind', sprung: 'ueber-uns', felder: [
      bild('bild', 'Foto'),
      text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
      text('vorspann', 'Kleine Zeile über der Überschrift'),
      ueberschrift('titel', 'Überschrift'),
      textliste('absaetze', 'Text', 'Absatz', true),
      reich('mitgliedschaft', 'Mitgliedschaften'),
      text('team_titel', 'Überschrift über dem Team'),
      liste('team', 'Team', 'Person', [
        text('name', 'Name', null, true),
        text('aufgabe', 'Aufgabe', null, true)
      ], ['name']),
      gruppe('link', 'Link am Ende', verweis())
    ] },
    { name: 'stimmen', titel: 'Stimmen', sprung: 'stimmen', felder: kopf().concat([
      liste('liste', 'Stimmen', 'Stimme', [
        reich('zitat', 'Zitat'),
        text('quelle', 'Von wem?', 'z. B. „Kindergarten München · „Glücklich im Park““')
      ], ['quelle'], 'Die Anführungszeichen „…“ gehören mit ins Zitat.')
    ]) },
    { name: 'galerie', titel: 'Galerie', sprung: 'galerie', felder: kopf().concat([
      liste('bilder', 'Fotos', 'Foto', [
        bild('bild', 'Bild'),
        text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT),
        text('unterschrift', 'Bildunterschrift')
      ], ['unterschrift', 'bild']),
      liste('plakate', 'Plakate', 'Plakat', [
        bild('bild', 'Bild'),
        text('bildtext', 'Bildbeschreibung', FUER_BILDTEXT)
      ], ['bildtext', 'bild'])
    ]) },
    { name: 'ablauf', titel: 'Gut zu wissen', sprung: 'ablauf', felder: kopf().concat([
      liste('schritte', 'Schritte', 'Schritt', [
        text('titel', 'Titel'),
        reich('text', 'Text')
      ], ['titel'], 'Die Nummern 01, 02, 03 … entstehen von selbst.'),
      liste('fragen', 'Fragen', 'Frage', [
        text('frage', 'Frage'),
        reich('antwort', 'Antwort')
      ], ['frage'])
    ]) },
    { name: 'kontakt', titel: 'Kontakt', sprung: 'kontakt', felder: [
      text('vorspann', 'Kleine Zeile über der Überschrift'),
      ueberschrift('titel', 'Überschrift'),
      reich('einleitung', 'Einleitung'),
      gruppe('knopf', 'Knopf „Anfrage per E-Mail“', [
        text('beschriftung', 'Beschriftung', null, true),
        text('betreff', 'Betreff der E-Mail', null, true),
        lang('text', 'Anfang der E-Mail', 'Dieser Text steht schon in der E-Mail, wenn sie sich öffnet.')
      ]),
      text('ansprechpartner_vorspann', 'Kleine Zeile über dem Namen'),
      text('name', 'Name'),
      text('telefon', 'Telefon', 'so, wie es auf der Seite stehen soll', true),
      text('email', 'E-Mail-Adresse', 'erscheint als „name (at) domain“, gegen Spam', true),
      text('adresse', 'Adresse'),
      reich('hinweis', 'Hinweis darunter')
    ] },
    { name: 'fuss', titel: 'Fußzeile', sprung: 'unten', felder: [
      text('spruch', 'Spruch'),
      liste('links', 'Links', 'Link', verweis(), ['beschriftung'])
    ] },
    { name: 'beschriftungen', titel: 'Kleine Wörter', sprung: 'oben', felder: [
      text('mitwirkende', 'Über der Liste der Mitwirkenden', null, true),
      text('mehr_zum_stueck', 'Zum Aufklappen bei den Stücken', null, true),
      text('eintritt', 'Vor dem Eintrittspreis', null, true),
      text('video_herunterladen', 'Link zum Herunterladen eines Videos', null, true),
      text('video_fehlt', 'Wenn ein Browser kein Video abspielen kann')
    ] }
  ];

  /* ========================================================================
     2. Zustand
     ======================================================================== */

  var daten = null;
  var kommentare = {};
  var vorlage = '';
  var medien = { bilder: {}, videos: {} };
  var aktiv = ABSCHNITTE[3];      /* Termine – ändert sich am häufigsten */
  var offen = new WeakSet();      /* aufgeklappte Karten, gemerkt am Eintrag selbst */
  var vorschauUhr = null;

  var statusZeile = document.getElementById('status');
  var yamlFeld = document.getElementById('yaml');
  var bereich = document.getElementById('abschnitt');

  function meldung(inhalt, fehler) {
    statusZeile.textContent = inhalt;
    statusZeile.classList.toggle('fehler', !!fehler);
  }

  function element(art, klasse, inhalt) {
    var knoten = document.createElement(art);
    if (klasse) knoten.className = klasse;
    if (inhalt !== undefined) knoten.textContent = inhalt;
    return knoten;
  }

  function knopf(beschriftung, klasse, titel, aktion) {
    var k = element('button', 'knopf klein ' + klasse, beschriftung);
    k.type = 'button';
    if (titel) { k.title = titel; k.setAttribute('aria-label', titel); }
    k.addEventListener('click', function (ereignis) {
      ereignis.preventDefault();   /* sonst klappt der Klick die Karte auf oder zu */
      ereignis.stopPropagation();
      aktion();
    });
    return k;
  }

  /* Ein neuer, leerer Eintrag mit allen Feldern – in der Reihenfolge von oben. */
  function leer(felder) {
    var neu = {};
    felder.forEach(function (feld) {
      if (feld.art === 'schalter') neu[feld.name] = false;
      else if (feld.art === 'gruppe') neu[feld.name] = leer(feld.felder);
      else if (feld.art === 'liste' || feld.art === 'textliste') neu[feld.name] = [];
      else neu[feld.name] = '';
    });
    return neu;
  }

  /* ========================================================================
     3. Felder bauen
     ======================================================================== */

  var zaehler = 0;

  function beschriftung(feld, fuer) {
    var etikett = element('label', null);
    if (fuer) etikett.setAttribute('for', fuer);
    etikett.appendChild(document.createTextNode(feld.titel));
    if (feld.hilfe) etikett.appendChild(element('span', 'erklaerung', feld.hilfe));
    return etikett;
  }

  function eingabeBauen(feld, eltern, schluessel, beiAenderung) {
    var huelle = element('div', 'feld' + (feld.art === 'schalter' ? ' schalter' : ''));
    var kennung = 'feld-' + (++zaehler);
    var wert = eltern[schluessel];
    var eingabe;

    if (feld.art === 'lang') {
      eingabe = element('textarea');
      eingabe.value = wert || '';
      eingabe.rows = feld.klein ? 2 : Math.min(8, Math.max(3, Math.ceil(String(wert || '').length / 70) + 1));
    } else if (feld.art === 'schalter') {
      eingabe = element('input');
      eingabe.type = 'checkbox';
      eingabe.checked = wert === true;
    } else if (feld.art === 'bild' || feld.art === 'video' || feld.art === 'auswahl') {
      eingabe = element('select');
      var optionen = feld.optionen;
      if (feld.art === 'bild') {
        optionen = [['', '– kein Bild –']].concat(Object.keys(medien.bilder).sort().map(function (n) { return [n, n]; }));
      } else if (feld.art === 'video') {
        optionen = [['', '– kein Video –']].concat(Object.keys(medien.videos).sort().map(function (n) { return [n, n]; }));
      }
      var bekannt = false;
      optionen.forEach(function (paar) {
        var option = element('option', null, paar[1]);
        option.value = paar[0];
        if (paar[0] === (wert || '')) { option.selected = true; bekannt = true; }
        eingabe.appendChild(option);
      });
      if (!bekannt && wert) {   /* ein Name, den es in assets/ (noch) nicht gibt */
        var fremd = element('option', null, wert + ' (nicht gefunden)');
        fremd.value = wert;
        fremd.selected = true;
        eingabe.insertBefore(fremd, eingabe.firstChild);
      }
    } else {
      eingabe = element('input');
      eingabe.type = 'text';
      eingabe.value = wert || '';
    }
    eingabe.id = kennung;

    var vorschaubild = null;
    function bildZeigen() {
      if (!vorschaubild) return;
      var info = medien.bilder[eingabe.value];
      vorschaubild.hidden = !info;
      if (info) vorschaubild.src = info.srcset ? info.srcset.split(' ')[0] : info.quelle;
    }

    var uebernehmen = function () {
      eltern[schluessel] = feld.art === 'schalter' ? eingabe.checked : eingabe.value;
      bildZeigen();
      if (beiAenderung) beiAenderung();
      nachTippen();
    };
    eingabe.addEventListener('input', uebernehmen);
    eingabe.addEventListener('change', function () { uebernehmen(); vorschauZeigen(); });

    if (feld.art === 'schalter') {
      huelle.appendChild(eingabe);
      huelle.appendChild(beschriftung(feld, kennung));
    } else if (feld.art === 'bild') {
      huelle.appendChild(beschriftung(feld, kennung));
      var zeile = element('div', 'bildwahl');
      zeile.appendChild(eingabe);
      vorschaubild = element('img');
      vorschaubild.alt = '';
      zeile.appendChild(vorschaubild);
      huelle.appendChild(zeile);
      bildZeigen();
    } else {
      huelle.appendChild(beschriftung(feld, kennung));
      huelle.appendChild(eingabe);
    }
    return huelle;
  }

  function verschieben(liste, nummer, richtung) {
    var ziel = nummer + richtung;
    if (ziel < 0 || ziel >= liste.length) return;
    var zwischen = liste[nummer];
    liste[nummer] = liste[ziel];
    liste[ziel] = zwischen;
    geaendert();
  }

  function listenKnoepfe(liste, nummer, name) {
    var leiste = element('span', 'karte-knoepfe');
    var hoch = knopf('↑', 'still', 'nach oben', function () { verschieben(liste, nummer, -1); });
    hoch.disabled = nummer === 0;
    var runter = knopf('↓', 'still', 'nach unten', function () { verschieben(liste, nummer, 1); });
    runter.disabled = nummer === liste.length - 1;
    var weg = knopf('löschen', 'gefahr', null, function () {
      if (!window.confirm('„' + name + '“ wirklich löschen?')) return;
      liste.splice(nummer, 1);
      geaendert();
    });
    leiste.appendChild(hoch);
    leiste.appendChild(runter);
    leiste.appendChild(weg);
    return leiste;
  }

  function kartenTitel(feld, eintrag, nummer) {
    var teile = (feld.kurz || []).map(function (name) {
      var wert = eintrag[name];
      return typeof wert === 'string' ? wert.replace(/\s+/g, ' ').replace(/\*/g, '').trim() : '';
    }).filter(function (teil) { return !!teil; });
    var haupt = teile.shift() || (feld.einzahl + ' ' + nummer);
    return { haupt: haupt.length > 70 ? haupt.slice(0, 70) + ' …' : haupt, neben: teile.join(' · ') };
  }

  function listeBauen(ziel, feld, eltern, schluessel) {
    if (!K.istListe(eltern[schluessel])) eltern[schluessel] = [];
    var eintraege = eltern[schluessel];
    var huelle = element('div', 'liste');
    /* Der Pfad bleibt beim Neuzeichnen gleich – so findet „hinzufügen“ den neuen Eintrag wieder. */
    var listenPfad = ziel.dataset.pfad + '.' + schluessel;
    huelle.dataset.liste = listenPfad;
    huelle.appendChild(element('h3', null, feld.titel));
    if (feld.hilfe) huelle.appendChild(element('span', 'erklaerung', feld.hilfe));

    eintraege.forEach(function (eintrag, nummer) {
      if (feld.art === 'textliste') {
        var zeile = element('div', 'textzeile');
        var textfeld = { name: nummer, art: feld.reich ? 'lang' : 'text', titel: feld.einzahl + ' ' + (nummer + 1),
          hilfe: feld.reich && nummer === 0 ? MIT_AUSZEICHNUNG : null };
        zeile.appendChild(eingabeBauen(textfeld, eintraege, nummer));
        zeile.appendChild(listenKnoepfe(eintraege, nummer, feld.einzahl + ' ' + (nummer + 1)));
        huelle.appendChild(zeile);
        return;
      }
      if (!K.istAbbildung(eintrag)) eintraege[nummer] = eintrag = leer(feld.felder);
      var karte = element('details', 'karte');
      karte.open = offen.has(eintrag);
      karte.addEventListener('toggle', function () {
        if (karte.open) offen.add(eintrag); else offen.delete(eintrag);
      });
      var kopfzeile = element('summary', 'karte-kopf');
      var titel = element('p', 'karte-titel');
      var name = kartenTitel(feld, eintrag, nummer + 1);
      titel.appendChild(document.createTextNode((nummer + 1) + '. ' + name.haupt));
      titel.appendChild(element('span', null, name.neben));
      kopfzeile.appendChild(titel);
      kopfzeile.appendChild(listenKnoepfe(eintraege, nummer, name.haupt));
      karte.appendChild(kopfzeile);

      var inhalt = element('div', 'karte-inhalt');
      inhalt.dataset.pfad = listenPfad + '.' + nummer;
      felderBauen(inhalt, feld.felder, eintrag, function () {
        var frisch = kartenTitel(feld, eintrag, nummer + 1);
        titel.firstChild.nodeValue = (nummer + 1) + '. ' + frisch.haupt;
        titel.lastChild.textContent = frisch.neben;
      });
      karte.appendChild(inhalt);
      huelle.appendChild(karte);
    });

    if (!eintraege.length) huelle.appendChild(element('p', 'gruppe-text', 'Noch nichts eingetragen.'));

    huelle.appendChild(knopf('+ ' + feld.einzahl + ' hinzufügen', 'still', null, function () {
      var neu = feld.art === 'textliste' ? '' : leer(feld.felder);
      if (feld.art !== 'textliste') offen.add(neu);
      eintraege.push(neu);
      geaendert();
      /* das erste Feld des neuen Eintrags in den Blick holen */
      var alle = bereich.querySelectorAll('[data-liste="' + listenPfad + '"] > .karte, ' +
        '[data-liste="' + listenPfad + '"] > .textzeile');
      var letzte = alle[alle.length - 1];
      if (letzte) {
        letzte.scrollIntoView({ block: 'center' });
        var erstes = letzte.querySelector('input, textarea, select');
        if (erstes) erstes.focus();
      }
    }));
    ziel.appendChild(huelle);
  }

  function felderBauen(ziel, felder, objekt, beiAenderung) {
    if (!ziel.dataset.pfad) ziel.dataset.pfad = 'x' + (++zaehler);
    var paar = null;
    felder.forEach(function (feld) {
      if (feld.art === 'gruppe') {
        paar = null;
        if (!K.istAbbildung(objekt[feld.name])) objekt[feld.name] = leer(feld.felder);
        var rahmen = element('fieldset', 'untergruppe');
        rahmen.appendChild(element('legend', null, feld.titel));
        if (feld.hilfe) rahmen.appendChild(element('span', 'erklaerung', feld.hilfe));
        rahmen.dataset.pfad = ziel.dataset.pfad + '.' + feld.name;
        felderBauen(rahmen, feld.felder, objekt[feld.name], beiAenderung);
        ziel.appendChild(rahmen);
      } else if (feld.art === 'liste' || feld.art === 'textliste') {
        paar = null;
        listeBauen(ziel, feld, objekt, feld.name);
      } else {
        var gebaut = eingabeBauen(feld, objekt, feld.name, beiAenderung);
        if (feld.halb) {
          if (!paar) { paar = element('div', 'felder-paar'); ziel.appendChild(paar); }
          paar.appendChild(gebaut);
          if (paar.childNodes.length === 2) paar = null;
        } else {
          paar = null;
          ziel.appendChild(gebaut);
        }
      }
    });
  }

  /* ========================================================================
     4. Abschnitte und Reiter
     ======================================================================== */

  function abschnittZeigen() {
    bereich.innerHTML = '';
    bereich.appendChild(element('h2', null, aktiv.titel));
    var inhalt = element('div');
    inhalt.dataset.pfad = aktiv.name;
    if (aktiv.ganz) {
      listeBauen(inhalt, aktiv.ganz, daten, aktiv.name);
    } else {
      if (!K.istAbbildung(daten[aktiv.name])) daten[aktiv.name] = leer(aktiv.felder);
      felderBauen(inhalt, aktiv.felder, daten[aktiv.name]);
    }
    bereich.appendChild(inhalt);
    Array.prototype.forEach.call(document.querySelectorAll('#reiter button'), function (k) {
      k.setAttribute('aria-current', String(k.dataset.name === aktiv.name));
    });
  }

  function reiterBauen() {
    var leiste = document.getElementById('reiter');
    ABSCHNITTE.forEach(function (abschnitt) {
      var k = element('button', null, abschnitt.titel);
      k.type = 'button';
      k.dataset.name = abschnitt.name;
      k.addEventListener('click', function () {
        aktiv = abschnitt;
        abschnittZeigen();
        vorschauZeigen();
        var oben = document.querySelector('.werkstatt').getBoundingClientRect().top + window.pageYOffset - 60;
        if (window.pageYOffset > oben) window.scrollTo(0, oben);
      });
      leiste.appendChild(k);
    });
  }

  /* Nach Hinzufügen, Löschen, Verschieben: Abschnitt neu zeichnen. */
  function geaendert() {
    abschnittZeigen();
    nachTippen();
    vorschauZeigen();
  }

  /* ========================================================================
     5. Vorschau
     ======================================================================== */

  var rahmen = document.getElementById('vorschau-rahmen');
  var buehne = document.getElementById('vorschau-buehne');
  var warnung = document.getElementById('vorschau-warnung');

  function vorschauZeigen() {
    window.clearTimeout(vorschauUhr);
    if (!vorlage || !daten) return;
    var meldungen = [];
    var seite;
    try {
      seite = K.seiteBauen(vorlage, daten, medien, meldungen);
    } catch (fehler) {
      meldungen.push(fehler.message);
      seite = '';
    }
    warnung.hidden = !meldungen.length;
    warnung.textContent = meldungen.join(' ');
    /* Der Sprung geschieht im Rahmen selbst – scrollIntoView() würde auch das
       Fenster ringsherum verschieben. */
    var ziel = JSON.stringify(aktiv.sprung);
    var springen = '<script>(function(){document.documentElement.style.scrollBehavior="auto";var z=' + ziel + ';' +
      'if(z==="oben")return;if(z==="unten"){window.scrollTo(0,document.body.scrollHeight);return;}' +
      'var e=document.getElementById(z);' +
      'if(e)window.scrollTo(0,Math.max(0,e.getBoundingClientRect().top+window.pageYOffset-70));})();<\/script>';
    rahmen.srcdoc = seite.replace('</body>', springen + '</body>');
  }

  function vorschauSpaeter() {
    window.clearTimeout(vorschauUhr);
    vorschauUhr = window.setTimeout(vorschauZeigen, 1200);
  }

  /* Im Zustand „Rechner“ wird die Seite 1240 Bildpunkte breit gebaut und so
     weit verkleinert, wie die Spalte Platz hat. */
  function faktorSetzen() {
    if (!buehne.classList.contains('rechner')) return;
    buehne.style.setProperty('--faktor', String(buehne.clientWidth / 1240));
  }

  function breiteWaehlen(art) {
    buehne.classList.toggle('rechner', art === 'rechner');
    buehne.style.removeProperty('--faktor');
    faktorSetzen();
    Array.prototype.forEach.call(document.querySelectorAll('[data-breite]'), function (k) {
      k.setAttribute('aria-pressed', String(k.getAttribute('data-breite') === art));
    });
  }

  /* ========================================================================
     6. Entwurf, Speichern, Start
     ======================================================================== */

  function yamlText() { return K.yamlSchreiben(daten, kommentare); }

  var entwurfUhr = null;
  function entwurfSpeichern() {
    window.clearTimeout(entwurfUhr);
    entwurfUhr = window.setTimeout(function () {
      try {
        window.localStorage.setItem(ENTWURF_SCHLUESSEL, JSON.stringify({ zeit: new Date().toISOString(), yaml: yamlFeld.value }));
      } catch (fehler) { /* kein Speicher, kein Beinbruch */ }
    }, 400);
  }

  function entwurfLoeschen() {
    try { window.localStorage.removeItem(ENTWURF_SCHLUESSEL); } catch (fehler) { /* siehe oben */ }
  }

  function nachTippen() {
    yamlFeld.value = yamlText();
    entwurfSpeichern();
    vorschauSpaeter();
  }

  function uebernehmen(text) {
    var gelesen = K.yamlLesen(text);
    daten = gelesen.daten;
    kommentare = gelesen.kommentare;
    abschnittZeigen();
    yamlFeld.value = yamlText();
  }

  function entwurfAnbieten(stand) {
    var gespeichert = null;
    try { gespeichert = window.localStorage.getItem(ENTWURF_SCHLUESSEL); } catch (fehler) { return; }
    if (!gespeichert) return;
    var entwurf;
    try { entwurf = JSON.parse(gespeichert); } catch (fehler) { return; }
    if (!entwurf || !entwurf.yaml || entwurf.yaml === stand) { entwurfLoeschen(); return; }

    var kasten = document.getElementById('entwurf');
    var zeitpunkt = new Date(entwurf.zeit);
    document.getElementById('entwurf-zeit').textContent = isNaN(zeitpunkt.getTime()) ? 'Vorher' :
      ('Am ' + zeitpunkt.toLocaleDateString('de-DE') + ' um ' +
        zeitpunkt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) + ' Uhr');
    kasten.hidden = false;
    document.getElementById('entwurf-weiter').addEventListener('click', function () {
      uebernehmen(entwurf.yaml);
      kasten.hidden = true;
      meldung('Entwurf geöffnet.');
      vorschauZeigen();
    });
    document.getElementById('entwurf-verwerfen').addEventListener('click', function () {
      entwurfLoeschen();
      kasten.hidden = true;
    });
  }

  function knoepfeVerdrahten() {
    document.getElementById('vorschau-neu').addEventListener('click', vorschauZeigen);
    Array.prototype.forEach.call(document.querySelectorAll('[data-breite]'), function (k) {
      k.addEventListener('click', function () { breiteWaehlen(k.getAttribute('data-breite')); });
    });
    window.addEventListener('resize', faktorSetzen);

    document.getElementById('kopieren').addEventListener('click', function () {
      var rueckmeldung = document.getElementById('kopiert');
      var fertig = function () {
        rueckmeldung.textContent = 'kopiert ✓';
        window.setTimeout(function () { rueckmeldung.textContent = ''; }, 4000);
      };
      var auswahlKopieren = function () {
        yamlFeld.closest('details').open = true;
        yamlFeld.focus();
        yamlFeld.select();
        try {
          document.execCommand('copy');
          fertig();
        } catch (fehler) {
          rueckmeldung.textContent = 'Bitte mit Strg + C kopieren.';
        }
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(yamlFeld.value).then(fertig, auswahlKopieren);
      } else {
        auswahlKopieren();
      }
    });

    document.getElementById('herunterladen').addEventListener('click', function () {
      var blob = new Blob([yamlFeld.value], { type: 'text/yaml;charset=utf-8' });
      var verweis = document.createElement('a');
      verweis.href = URL.createObjectURL(blob);
      verweis.download = 'inhalt.yaml';
      document.body.appendChild(verweis);
      verweis.click();
      document.body.removeChild(verweis);
      window.setTimeout(function () { URL.revokeObjectURL(verweis.href); }, 1000);
    });
  }

  function holen(adresse) {
    return window.fetch(adresse, { cache: 'no-store' }).then(function (antwort) {
      if (!antwort.ok) throw new Error(adresse + ': ' + antwort.status);
      return antwort.text();
    });
  }

  function starten() {
    if (!window.fetch || !K || !window.WeakSet) {
      meldung('Dieser Browser ist zu alt für die Werkstatt. Bitte einen aktuellen Browser verwenden.', true);
      return;
    }
    Promise.all([holen('inhalt.yaml'), holen('vorlage.html'), holen('assets/medien.json')]).then(function (dateien) {
      vorlage = dateien[1];
      medien = JSON.parse(dateien[2]);
      reiterBauen();
      uebernehmen(dateien[0]);
      knoepfeVerdrahten();
      meldung('Inhalte geladen. Nichts wird von allein gespeichert – die Schritte dazu stehen unten.');
      entwurfAnbieten(yamlFeld.value);
      vorschauZeigen();
    }).catch(function (fehler) {
      meldung('Die Inhalte konnten nicht geladen werden. Diese Seite bitte über die Website öffnen ' +
        '(…/bearbeiten.html), nicht als Datei vom Schreibtisch aus. (' + fehler.message + ')', true);
    });
  }

  starten();
})();
