/* ==========================================================================
   Puppentheater Wunderlich – Werkstatt
   Liest inhalt.yaml, zeigt Felder dazu an, baut eine Vorschau der echten
   Seite und schreibt am Ende wieder inhalt.yaml.

   Ohne Abhängigkeiten, ohne Server: alles passiert im Browser. Gespeichert
   wird nichts von allein – der fertige Text wird kopiert oder heruntergeladen.

   Wichtig: Die Funktion abschnitte() erzeugt genau dasselbe HTML wie
   werkzeuge/seite_bauen.py. Wird hier etwas geändert, gehört es auch dorthin.
   ========================================================================== */
(function () {
  'use strict';

  var ENTWURF_SCHLUESSEL = 'puppentheater-inhalt-entwurf';

  /* Welche Felder eine Karte hat – Beschriftungen für die Werkstatt. */
  var FELDER = {
    'termine-kopf': [
      { name: 'vorspann', beschriftung: 'Kleine Zeile über der Überschrift', erklaerung: 'z. B. „Termine im November 2026“' },
      { name: 'titel', beschriftung: 'Überschrift, erste Zeile' },
      { name: 'titel_betont', beschriftung: 'Überschrift, zweite Zeile', erklaerung: 'Wird kursiv und rot gezeigt. Leer lassen für eine einzeilige Überschrift.' },
      { name: 'einleitung', art: 'lang', beschriftung: 'Einleitung', erklaerung: 'Ein Link entsteht so: [Bürgersinfonie-Orchester](http://buergersinfonie.de/)' }
    ],
    termine: [
      { name: 'etikett', beschriftung: 'Etikett', erklaerung: 'kleine Zeile über dem Datum, z. B. „Premiere“', halb: true },
      { name: 'wochentag', beschriftung: 'Wochentag', erklaerung: 'z. B. „Samstag“', halb: true },
      { name: 'datum', beschriftung: 'Datum', erklaerung: 'z. B. „7. November 2026“', halb: true },
      { name: 'uhrzeit', beschriftung: 'Uhrzeit', erklaerung: 'z. B. „16:00 Uhr“', halb: true },
      { name: 'besetzung', beschriftung: 'Besetzung', erklaerung: 'z. B. „Mit dem Bürgersinfonie-Orchester“' },
      { name: 'zusatz', beschriftung: 'Zusätzliche Zeile', erklaerung: 'z. B. „Kurzfassung für Kinder“ – kann leer bleiben' },
      { name: 'eintritt', beschriftung: 'Eintritt', erklaerung: 'z. B. „15 € · Kinder 7–12 Jahre 7 €“' },
      { name: 'ort', beschriftung: 'Ort', erklaerung: 'Name des Hauses', halb: true },
      { name: 'ort_link', beschriftung: 'Internetseite des Hauses', erklaerung: 'kann leer bleiben', halb: true },
      { name: 'adresse', beschriftung: 'Adresse', erklaerung: 'Straße, Postleitzahl und Ort' },
      { name: 'hervorheben', art: 'schalter', beschriftung: 'Diese Karte farbig hervorheben' }
    ],
    stimmen: [
      { name: 'zitat', art: 'lang', beschriftung: 'Zitat', erklaerung: 'mit Anführungszeichen „…“' },
      { name: 'quelle', beschriftung: 'Wer hat das gesagt?', erklaerung: 'z. B. „Kindergarten München · „Glücklich im Park““' }
    ],
    team: [
      { name: 'name', beschriftung: 'Name', halb: true },
      { name: 'aufgabe', beschriftung: 'Aufgabe', erklaerung: 'z. B. „Puppenspiel, Text, Kostüm“', halb: true }
    ]
  };

  /* Wie eine Liste heißt, wohin die Vorschau springt, wie eine leere Karte aussieht. */
  var LISTEN = {
    termine: { einzahl: 'Termin', sprungmarke: 'termine' },
    stimmen: { einzahl: 'Stimme', sprungmarke: 'stimmen' },
    team: { einzahl: 'Person', sprungmarke: 'ueber-uns' }
  };

  var daten = null;        /* der Inhalt als Objekt */
  var kommentare = {};     /* die Kommentarzeilen aus inhalt.yaml, damit sie erhalten bleiben */
  var seiteRoh = '';       /* index.html, wie sie im Projekt liegt */
  var sprungmarke = 'termine';
  var vorschauUhr = null;

  /* ========================================================================
     1. YAML lesen – nur die Form, die in inhalt.yaml vorkommt
     ======================================================================== */

  function einzugVon(zeile) {
    var i = 0;
    while (i < zeile.length && zeile.charAt(i) === ' ') i++;
    return i;
  }

  function istUebergehbar(zeile) {
    var text = zeile.trim();
    return text === '' || text.charAt(0) === '#';
  }

  function naechsteZeile(zeilen, i) {
    while (i < zeilen.length && istUebergehbar(zeilen[i])) i++;
    return i < zeilen.length ? i : -1;
  }

  function skalar(roh) {
    roh = roh.trim();
    if (roh === '') return '';
    var anfang = roh.charAt(0);
    if (anfang === '"' || anfang === "'") {
      var wert = '';
      var i = 1;
      while (i < roh.length) {
        var zeichen = roh.charAt(i);
        if (anfang === '"' && zeichen === '\\') {
          var folgt = roh.charAt(i + 1);
          wert += folgt === 'n' ? '\n' : folgt;
          i += 2;
          continue;
        }
        if (zeichen === anfang) {
          if (anfang === "'" && roh.charAt(i + 1) === "'") { wert += "'"; i += 2; continue; }
          break;
        }
        wert += zeichen;
        i++;
      }
      return wert;
    }
    roh = roh.replace(/\s+#.*$/, '').trim();
    if (roh === 'true') return true;
    if (roh === 'false') return false;
    if (roh === '~' || roh === 'null') return '';
    return roh;
  }

  function blockSkalar(zeilen, stelle, mindestEinzug, art) {
    var teile = [];
    var eigenerEinzug = -1;
    while (stelle.i < zeilen.length) {
      var zeile = zeilen[stelle.i];
      if (zeile.trim() === '') { teile.push(''); stelle.i++; continue; }
      var einzug = einzugVon(zeile);
      if (einzug < mindestEinzug) break;
      if (eigenerEinzug < 0) eigenerEinzug = einzug;
      teile.push(zeile.slice(eigenerEinzug));
      stelle.i++;
    }
    while (teile.length && teile[teile.length - 1] === '') teile.pop();
    if (art.charAt(0) === '>') return teile.join(' ').replace(/\s+/g, ' ').trim();
    return teile.join('\n');
  }

  function blockLesen(zeilen, stelle, mindestEinzug) {
    var i = naechsteZeile(zeilen, stelle.i);
    if (i < 0) return null;
    if (einzugVon(zeilen[i]) < mindestEinzug) return null;
    stelle.i = i;
    var text = zeilen[i].trim();
    if (text === '-' || text.slice(0, 2) === '- ') return listeLesen(zeilen, stelle, einzugVon(zeilen[i]));
    return abbildungLesen(zeilen, stelle, einzugVon(zeilen[i]));
  }

  function listeLesen(zeilen, stelle, einzug) {
    var liste = [];
    while (true) {
      var i = naechsteZeile(zeilen, stelle.i);
      if (i < 0) break;
      var zeile = zeilen[i];
      var text = zeile.trim();
      if (einzugVon(zeile) !== einzug || (text !== '-' && text.slice(0, 2) !== '- ')) break;
      /* Aus "- feld: wert" wird eine gewöhnliche Zeile, damit sie wie eine
         Abbildung gelesen werden kann. */
      var innen = zeile.indexOf('-') + 2;
      var rest = text.slice(1).trim();
      zeilen[i] = new Array(innen + 1).join(' ') + rest;
      stelle.i = i;
      var eintrag = blockLesen(zeilen, stelle, innen);
      liste.push(eintrag === null ? {} : eintrag);
    }
    return liste;
  }

  function abbildungLesen(zeilen, stelle, einzug) {
    var karte = {};
    while (true) {
      var i = naechsteZeile(zeilen, stelle.i);
      if (i < 0) break;
      if (einzugVon(zeilen[i]) !== einzug) break;
      var treffer = /^([A-Za-z0-9_-]+):(.*)$/.exec(zeilen[i].trim());
      if (!treffer) break;
      stelle.i = i + 1;
      var schluessel = treffer[1];
      var roh = treffer[2].trim();
      if (roh === '') {
        var unten = blockLesen(zeilen, stelle, einzug + 1);
        karte[schluessel] = unten === null ? '' : unten;
      } else if (roh === '|' || roh === '|-' || roh === '>' || roh === '>-') {
        karte[schluessel] = blockSkalar(zeilen, stelle, einzug + 1, roh);
      } else {
        karte[schluessel] = skalar(roh);
      }
    }
    return karte;
  }

  function yamlLesen(text) {
    var zeilen = text.replace(/\t/g, '  ').split(/\r?\n/);
    var wert = blockLesen(zeilen, { i: 0 }, 0);
    return wert && typeof wert === 'object' ? wert : {};
  }

  /* Die Kommentare aus der Datei einsammeln, damit sie beim Schreiben
     wieder an derselben Stelle stehen. */
  function kommentareLesen(text) {
    var zeilen = text.replace(/\r/g, '').split('\n');
    var gefunden = {};
    var kopf = [];
    var i;
    for (i = 0; i < zeilen.length; i++) {
      if (zeilen[i].trim().charAt(0) !== '#') break;
      kopf.push(zeilen[i]);
    }
    gefunden.kopf = kopf;
    for (i = 0; i < zeilen.length; i++) {
      var treffer = /^\s*(termine|liste|stimmen|team):\s*$/.exec(zeilen[i]);
      if (!treffer) continue;
      var block = [];
      var j = i - 1;
      while (j >= 0 && zeilen[j].trim().charAt(0) === '#') { block.unshift(zeilen[j]); j--; }
      if (j < 0 && kopf.length) block = [];   /* der Dateikopf ist kein Abschnittskommentar */
      gefunden[treffer[1]] = block;
    }
    return gefunden;
  }

  /* ========================================================================
     2. YAML schreiben
     ======================================================================== */

  function yamlWert(wert) {
    if (wert === true) return 'true';
    if (wert === false) return 'false';
    return '"' + String(wert === null || wert === undefined ? '' : wert)
      .replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
  }

  function yamlEintraege(liste, felder, einzug, leerzeileDazwischen) {
    var zeilen = [];
    for (var nummer = 0; nummer < liste.length; nummer++) {
      if (leerzeileDazwischen && nummer) zeilen.push('');
      for (var stelle = 0; stelle < felder.length; stelle++) {
        var name = felder[stelle].name;
        var wert = liste[nummer][name];
        if (wert === undefined) wert = felder[stelle].art === 'schalter' ? false : '';
        zeilen.push(einzug + (stelle === 0 ? '- ' : '  ') + name + ': ' + yamlWert(wert));
      }
    }
    return zeilen;
  }

  function yamlSchreiben() {
    var zeilen = [];
    var anhaengen = function (block) {
      for (var i = 0; i < block.length; i++) zeilen.push(block[i]);
    };

    anhaengen(kommentare.kopf || []);
    if (zeilen.length) zeilen.push('');

    anhaengen(kommentare.termine || []);
    zeilen.push('termine:');
    var kopffelder = FELDER['termine-kopf'];
    for (var i = 0; i < kopffelder.length; i++) {
      var name = kopffelder[i].name;
      zeilen.push('  ' + name + ': ' + yamlWert(daten.termine[name] || ''));
    }
    zeilen.push('');
    anhaengen(kommentare.liste || []);
    zeilen.push('  liste:');
    anhaengen(yamlEintraege(daten.termine.liste, FELDER.termine, '    ', true));

    zeilen.push('');
    anhaengen(kommentare.stimmen || []);
    zeilen.push('stimmen:');
    anhaengen(yamlEintraege(daten.stimmen, FELDER.stimmen, '  ', true));

    zeilen.push('');
    anhaengen(kommentare.team || []);
    zeilen.push('team:');
    anhaengen(yamlEintraege(daten.team, FELDER.team, '  ', false));

    return zeilen.join('\n') + '\n';
  }

  /* ========================================================================
     3. HTML-Abschnitte – Zwilling von werkzeuge/seite_bauen.py
     ======================================================================== */

  function html(wert) {
    return String(wert === null || wert === undefined ? '' : wert)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function attribut(wert) {
    return html(wert).replace(/"/g, '&quot;');
  }

  function verlinkt(wert) {
    return html(wert).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (ganz, beschriftung, adresse) {
      var zusatz = adresse.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '';
      return '<a href="' + attribut(adresse) + '"' + zusatz + '>' + beschriftung + '</a>';
    });
  }

  function feld(eintrag, name) {
    var wert = eintrag && eintrag[name];
    if (wert === true || wert === false) return wert;
    return wert === null || wert === undefined ? '' : String(wert).replace(/^\s+|\s+$/g, '');
  }

  /* Ein Eintrag ohne jeden Text erscheint nicht auf der Website – so stört
     eine versehentlich leere Karte niemanden. Genauso in seite_bauen.py. */
  function gefuellte(liste) {
    var ergebnis = [];
    for (var i = 0; i < liste.length; i++) {
      var eintrag = liste[i];
      var hatText = false;
      for (var name in eintrag) {
        if (!Object.prototype.hasOwnProperty.call(eintrag, name)) continue;
        var wert = eintrag[name];
        if (wert === true || wert === false || wert === null || wert === undefined) continue;
        if (String(wert).replace(/^\s+|\s+$/g, '')) { hatText = true; break; }
      }
      if (hatText) ergebnis.push(eintrag);
    }
    return ergebnis;
  }

  function termineKopf(termine) {
    var ueberschrift = html(feld(termine, 'titel'));
    var betont = feld(termine, 'titel_betont');
    if (betont) ueberschrift += '<br><em>' + html(betont) + '</em>';

    var zeilen = ['<div>'];
    var vorspann = feld(termine, 'vorspann');
    if (vorspann) zeilen.push('  <p class="eyebrow">' + html(vorspann) + '</p>');
    zeilen.push('  <h2>' + ueberschrift + '</h2>');
    zeilen.push('</div>');
    var einleitung = feld(termine, 'einleitung');
    if (einleitung) zeilen.push('<p>' + verlinkt(einleitung) + '</p>');
    return zeilen;
  }

  function termineListe(termine) {
    var liste = gefuellte(termine.liste || []);
    if (!liste.length) return ['<!-- keine Termine eingetragen -->'];

    var zeilen = ['<ol class="date-list">'];
    for (var i = 0; i < liste.length; i++) {
      var eintrag = liste[i];
      zeilen.push('  <li class="' + (feld(eintrag, 'hervorheben') ? 'date-card premiere' : 'date-card') + '">');

      var etikett = feld(eintrag, 'etikett');
      if (etikett) zeilen.push('    <p class="date-tag">' + html(etikett) + '</p>');

      var wochentag = feld(eintrag, 'wochentag');
      var tag = wochentag ? '<span>' + html(wochentag) + '</span>' : '';
      zeilen.push('    <p class="date-day">' + tag + '<strong>' + html(feld(eintrag, 'datum')) + '</strong></p>');

      var weitere = [['uhrzeit', 'date-time'], ['besetzung', 'date-cast'], ['zusatz', 'date-extra']];
      for (var w = 0; w < weitere.length; w++) {
        var wert = feld(eintrag, weitere[w][0]);
        if (wert) zeilen.push('    <p class="' + weitere[w][1] + '">' + verlinkt(wert) + '</p>');
      }

      zeilen.push('    <div class="date-foot">');
      var eintritt = feld(eintrag, 'eintritt');
      if (eintritt) zeilen.push('      <p class="date-price"><span>Eintritt</span>' + verlinkt(eintritt) + '</p>');

      var ort = feld(eintrag, 'ort');
      var ortLink = feld(eintrag, 'ort_link');
      var adresse = feld(eintrag, 'adresse');
      if (ort || adresse) {
        var haus = '';
        if (ort && ortLink) {
          haus = '<strong><a href="' + attribut(ortLink) + '" target="_blank" rel="noopener noreferrer">' +
            html(ort) + ' ↗</a></strong>';
        } else if (ort) {
          haus = '<strong>' + html(ort) + '</strong>';
        }
        var strasse = adresse ? '<span>' + html(adresse) + '</span>' : '';
        zeilen.push('      <p class="date-place">' + haus + strasse + '</p>');
      }
      zeilen.push('    </div>');
      zeilen.push('  </li>');
    }
    zeilen.push('</ol>');
    return zeilen;
  }

  function stimmenListe(alle) {
    var stimmen = gefuellte(alle);
    var zeilen = ['<div class="quotes">'];
    for (var i = 0; i < stimmen.length; i++) {
      zeilen.push('  <blockquote>');
      zeilen.push('    <p>' + html(feld(stimmen[i], 'zitat')) + '</p>');
      var quelle = feld(stimmen[i], 'quelle');
      if (quelle) zeilen.push('    <footer>' + html(quelle) + '</footer>');
      zeilen.push('  </blockquote>');
    }
    zeilen.push('</div>');
    return zeilen;
  }

  function teamListe(alle) {
    var team = gefuellte(alle);
    var zeilen = ['<ul class="team">'];
    for (var i = 0; i < team.length; i++) {
      var aufgabe = feld(team[i], 'aufgabe');
      zeilen.push('  <li><strong>' + html(feld(team[i], 'name')) + '</strong>' +
        (aufgabe ? '<span>' + html(aufgabe) + '</span>' : '') + '</li>');
    }
    zeilen.push('</ul>');
    return zeilen;
  }

  function abschnitte() {
    return {
      'termine-kopf': termineKopf(daten.termine),
      'termine-liste': termineListe(daten.termine),
      'stimmen-liste': stimmenListe(daten.stimmen),
      'team-liste': teamListe(daten.team)
    };
  }

  function einsetzen(seite, name, zeilen) {
    var muster = new RegExp('([ \\t]*)<!-- inhalt: ' + name + ' -->\\n[\\s\\S]*?\\n[ \\t]*<!-- /inhalt: ' +
      name + ' -->');
    var treffer = muster.exec(seite);
    if (!treffer) return seite;
    var einzug = treffer[1];
    var block = [];
    for (var i = 0; i < zeilen.length; i++) block.push(zeilen[i] ? einzug + zeilen[i] : '');
    var neu = einzug + '<!-- inhalt: ' + name + ' -->\n' + block.join('\n') + '\n' +
      einzug + '<!-- /inhalt: ' + name + ' -->';
    return seite.slice(0, treffer.index) + neu + seite.slice(treffer.index + treffer[0].length);
  }

  function seiteBauen() {
    var seite = seiteRoh;
    var teile = abschnitte();
    for (var name in teile) {
      if (Object.prototype.hasOwnProperty.call(teile, name)) seite = einsetzen(seite, name, teile[name]);
    }
    return seite;
  }

  /* ========================================================================
     4. Vorschau
     ======================================================================== */

  var rahmen = document.getElementById('vorschau-rahmen');
  var buehne = document.getElementById('vorschau-buehne');
  var vorschauHinweis = document.getElementById('vorschau-hinweis');

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
    Array.prototype.forEach.call(document.querySelectorAll('[data-breite]'), function (knopf) {
      knopf.setAttribute('aria-pressed', String(knopf.getAttribute('data-breite') === art));
    });
  }

  function vorschauZeigen() {
    if (!seiteRoh || !rahmen) return;
    var ziel = JSON.stringify(sprungmarke);
    /* Der Sprung geschieht im Rahmen selbst – scrollIntoView() würde auch das
       Fenster ringsherum verschieben. */
    var springen = '<script>(function(){document.documentElement.style.scrollBehavior="auto";' +
      'var z=document.getElementById(' + ziel + ');' +
      'if(z)window.scrollTo(0,Math.max(0,z.getBoundingClientRect().top+window.pageYOffset-70));})();<\/script>';
    rahmen.srcdoc = seiteBauen().replace('</body>', springen + '</body>');
  }

  function vorschauSpaeter() {
    window.clearTimeout(vorschauUhr);
    vorschauUhr = window.setTimeout(vorschauZeigen, 1200);
  }

  /* ========================================================================
     5. Formular
     ======================================================================== */

  var statusZeile = document.getElementById('status');
  var yamlFeld = document.getElementById('yaml');

  function meldung(text, fehler) {
    statusZeile.textContent = text;
    statusZeile.classList.toggle('fehler', !!fehler);
  }

  function element(art, klasse, text) {
    var knoten = document.createElement(art);
    if (klasse) knoten.className = klasse;
    if (text !== undefined) knoten.textContent = text;
    return knoten;
  }

  function feldBauen(beschreibung, eintrag, beiAenderung) {
    var huelle = element('div', 'feld' + (beschreibung.art === 'schalter' ? ' schalter' : ''));
    var kennung = 'feld-' + Math.random().toString(36).slice(2, 9);

    var beschriftung = element('label', null);
    beschriftung.setAttribute('for', kennung);
    beschriftung.appendChild(document.createTextNode(beschreibung.beschriftung));
    if (beschreibung.erklaerung) {
      beschriftung.appendChild(element('span', 'erklaerung', beschreibung.erklaerung));
    }

    var eingabe;
    if (beschreibung.art === 'lang') {
      eingabe = element('textarea');
      eingabe.value = eintrag[beschreibung.name] || '';
    } else if (beschreibung.art === 'schalter') {
      eingabe = element('input');
      eingabe.type = 'checkbox';
      eingabe.checked = eintrag[beschreibung.name] === true;
    } else {
      eingabe = element('input');
      eingabe.type = 'text';
      eingabe.value = eintrag[beschreibung.name] || '';
    }
    eingabe.id = kennung;

    var uebernehmen = function () {
      eintrag[beschreibung.name] = beschreibung.art === 'schalter' ? eingabe.checked : eingabe.value;
      if (beiAenderung) beiAenderung();
      nachTippen();
    };
    eingabe.addEventListener('input', uebernehmen);
    eingabe.addEventListener('change', function () { uebernehmen(); vorschauZeigen(); });

    if (beschreibung.art === 'schalter') {
      huelle.appendChild(eingabe);
      huelle.appendChild(beschriftung);
    } else {
      huelle.appendChild(beschriftung);
      huelle.appendChild(eingabe);
    }
    return huelle;
  }

  function felderEinbauen(ziel, felder, eintrag, beiAenderung) {
    var paar = null;
    for (var i = 0; i < felder.length; i++) {
      var gebaut = feldBauen(felder[i], eintrag, beiAenderung);
      if (felder[i].halb) {
        if (!paar) { paar = element('div', 'felder-paar'); ziel.appendChild(paar); }
        paar.appendChild(gebaut);
        if (paar.childNodes.length === 2) paar = null;
      } else {
        paar = null;
        ziel.appendChild(gebaut);
      }
    }
  }

  function karteTitel(art, eintrag, nummer) {
    if (art === 'termine') {
      return {
        haupt: feld(eintrag, 'datum') || 'Neuer Termin',
        neben: [feld(eintrag, 'etikett'), feld(eintrag, 'uhrzeit'), feld(eintrag, 'ort')]
          .filter(function (teil) { return !!teil; }).join(' · ')
      };
    }
    if (art === 'stimmen') {
      var zitat = feld(eintrag, 'zitat');
      return {
        haupt: feld(eintrag, 'quelle') || ('Stimme ' + nummer),
        neben: zitat.length > 70 ? zitat.slice(0, 70) + ' …' : zitat
      };
    }
    return { haupt: feld(eintrag, 'name') || ('Person ' + nummer), neben: feld(eintrag, 'aufgabe') };
  }

  function listeZeichnen(art) {
    var behaelter = document.querySelector('.karten[data-liste="' + art + '"]');
    var liste = art === 'termine' ? daten.termine.liste : daten[art];
    behaelter.innerHTML = '';

    for (var i = 0; i < liste.length; i++) {
      (function (nummer) {
        var eintrag = liste[nummer];
        var karte = element('div', 'karte');
        if (art === 'termine' && eintrag.hervorheben === true) karte.classList.add('hervor');

        var kopf = element('div', 'karte-kopf');
        var titel = element('p', 'karte-titel');
        var beschriftung = karteTitel(art, eintrag, nummer + 1);
        titel.appendChild(document.createTextNode((nummer + 1) + '. ' + beschriftung.haupt));
        titel.appendChild(element('span', null, beschriftung.neben));
        kopf.appendChild(titel);

        var knoepfe = element('div', 'karte-knoepfe');
        var hoch = element('button', 'knopf still klein', '↑');
        hoch.type = 'button';
        hoch.title = 'nach oben';
        hoch.disabled = nummer === 0;
        hoch.addEventListener('click', function () { schieben(art, nummer, -1); });
        var runter = element('button', 'knopf still klein', '↓');
        runter.type = 'button';
        runter.title = 'nach unten';
        runter.disabled = nummer === liste.length - 1;
        runter.addEventListener('click', function () { schieben(art, nummer, 1); });
        var weg = element('button', 'knopf gefahr klein', 'löschen');
        weg.type = 'button';
        weg.addEventListener('click', function () { loeschen(art, nummer); });
        knoepfe.appendChild(hoch);
        knoepfe.appendChild(runter);
        knoepfe.appendChild(weg);
        kopf.appendChild(knoepfe);
        karte.appendChild(kopf);

        felderEinbauen(karte, FELDER[art], eintrag, function () {
          var frisch = karteTitel(art, eintrag, nummer + 1);
          titel.firstChild.nodeValue = (nummer + 1) + '. ' + frisch.haupt;
          titel.lastChild.textContent = frisch.neben;
          if (art === 'termine') karte.classList.toggle('hervor', eintrag.hervorheben === true);
        });

        behaelter.appendChild(karte);
      }(i));
    }

    if (!liste.length) {
      behaelter.appendChild(element('p', 'gruppe-text', 'Noch nichts eingetragen.'));
    }
  }

  function alleszeichnen() {
    var kopffelder = document.querySelector('.einzelfelder[data-felder="termine"]');
    kopffelder.innerHTML = '';
    felderEinbauen(kopffelder, FELDER['termine-kopf'], daten.termine);
    listeZeichnen('termine');
    listeZeichnen('stimmen');
    listeZeichnen('team');
    yamlAktualisieren();
  }

  function listeVon(art) {
    return art === 'termine' ? daten.termine.liste : daten[art];
  }

  function schieben(art, nummer, richtung) {
    var liste = listeVon(art);
    var ziel = nummer + richtung;
    if (ziel < 0 || ziel >= liste.length) return;
    var zwischen = liste[nummer];
    liste[nummer] = liste[ziel];
    liste[ziel] = zwischen;
    listeZeichnen(art);
    nachTippen();
    vorschauZeigen();
  }

  function loeschen(art, nummer) {
    var liste = listeVon(art);
    var name = karteTitel(art, liste[nummer], nummer + 1).haupt;
    if (!window.confirm('„' + name + '“ wirklich löschen?')) return;
    liste.splice(nummer, 1);
    listeZeichnen(art);
    nachTippen();
    vorschauZeigen();
  }

  function hinzufuegen(art) {
    var neu = {};
    var felder = FELDER[art];
    for (var i = 0; i < felder.length; i++) {
      neu[felder[i].name] = felder[i].art === 'schalter' ? false : '';
    }
    listeVon(art).push(neu);
    listeZeichnen(art);
    nachTippen();
    var karten = document.querySelectorAll('.karten[data-liste="' + art + '"] .karte');
    var letzte = karten[karten.length - 1];
    if (letzte) {
      letzte.scrollIntoView({ block: 'center' });
      var erstes = letzte.querySelector('input, textarea');
      if (erstes) erstes.focus();
    }
  }

  /* ========================================================================
     6. Entwurf, Speichern, Start
     ======================================================================== */

  function yamlAktualisieren() {
    yamlFeld.value = yamlSchreiben();
  }

  function entwurfSpeichern() {
    try {
      window.localStorage.setItem(ENTWURF_SCHLUESSEL, JSON.stringify({
        zeit: new Date().toISOString(),
        yaml: yamlFeld.value
      }));
    } catch (fehler) { /* kein Speicher, kein Beinbruch */ }
  }

  function entwurfLoeschen() {
    try { window.localStorage.removeItem(ENTWURF_SCHLUESSEL); } catch (fehler) { /* siehe oben */ }
  }

  function nachTippen() {
    yamlAktualisieren();
    entwurfSpeichern();
    vorschauSpaeter();
  }

  function sprungmarkeSetzen() {
    var gruppen = document.querySelectorAll('.gruppe[data-abschnitt]');
    Array.prototype.forEach.call(gruppen, function (gruppe) {
      gruppe.addEventListener('focusin', function () {
        var art = gruppe.getAttribute('data-abschnitt');
        if (LISTEN[art]) sprungmarke = LISTEN[art].sprungmarke;
      });
    });
  }

  function knoepfeVerdrahten() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-hinzufuegen]'), function (knopf) {
      knopf.addEventListener('click', function () { hinzufuegen(knopf.getAttribute('data-hinzufuegen')); });
    });

    document.getElementById('vorschau-neu').addEventListener('click', vorschauZeigen);

    Array.prototype.forEach.call(document.querySelectorAll('[data-breite]'), function (knopf) {
      knopf.addEventListener('click', function () { breiteWaehlen(knopf.getAttribute('data-breite')); });
    });
    window.addEventListener('resize', faktorSetzen);

    document.getElementById('kopieren').addEventListener('click', function () {
      var rueckmeldung = document.getElementById('kopiert');
      var fertig = function () {
        rueckmeldung.textContent = 'kopiert ✓';
        window.setTimeout(function () { rueckmeldung.textContent = ''; }, 4000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(yamlFeld.value).then(fertig, auswahlKopieren);
      } else {
        auswahlKopieren();
      }
      function auswahlKopieren() {
        yamlFeld.closest('details').open = true;
        yamlFeld.focus();
        yamlFeld.select();
        try {
          document.execCommand('copy');
          fertig();
        } catch (fehler) {
          rueckmeldung.textContent = 'Bitte mit Strg + C kopieren.';
        }
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

  function isListe(wert) {
    return Object.prototype.toString.call(wert) === '[object Array]';
  }

  function uebernehmen(yamlText) {
    daten = yamlLesen(yamlText);
    if (!daten.termine || typeof daten.termine !== 'object') daten.termine = {};
    if (!isListe(daten.termine.liste)) daten.termine.liste = [];
    if (!isListe(daten.stimmen)) daten.stimmen = [];
    if (!isListe(daten.team)) daten.team = [];
    alleszeichnen();
  }

  function entwurfAnbieten(dateiYaml) {
    var gespeichert = null;
    try { gespeichert = window.localStorage.getItem(ENTWURF_SCHLUESSEL); } catch (fehler) { return; }
    if (!gespeichert) return;
    var entwurf;
    try { entwurf = JSON.parse(gespeichert); } catch (fehler) { return; }
    if (!entwurf || !entwurf.yaml || entwurf.yaml === dateiYaml) { entwurfLoeschen(); return; }

    var kasten = document.getElementById('entwurf');
    var zeitpunkt = new Date(entwurf.zeit);
    document.getElementById('entwurf-zeit').textContent = isNaN(zeitpunkt.getTime()) ? 'Vorher' :
      ('Am ' + zeitpunkt.toLocaleDateString('de-DE') + ' um ' + zeitpunkt.toLocaleTimeString('de-DE',
        { hour: '2-digit', minute: '2-digit' }) + ' Uhr');
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

  function holen(adresse) {
    return window.fetch(adresse, { cache: 'no-store' }).then(function (antwort) {
      if (!antwort.ok) throw new Error(adresse + ': ' + antwort.status);
      return antwort.text();
    });
  }

  function starten() {
    if (!window.fetch) {
      meldung('Dieser Browser ist zu alt für die Werkstatt. Bitte einen aktuellen Browser verwenden.', true);
      return;
    }
    holen('inhalt.yaml').then(function (yamlText) {
      kommentare = kommentareLesen(yamlText);
      uebernehmen(yamlText);
      knoepfeVerdrahten();
      sprungmarkeSetzen();
      meldung('Inhalte geladen. Nichts wird von allein gespeichert – die Schritte dazu stehen unten.');
      entwurfAnbieten(yamlFeld.value);
      return holen('index.html');
    }).then(function (seitenText) {
      seiteRoh = seitenText;
      vorschauZeigen();
    }).catch(function (fehler) {
      if (!daten) {
        meldung('Die Datei inhalt.yaml konnte nicht geladen werden. Diese Seite bitte über die Website öffnen ' +
          '(…/bearbeiten.html), nicht als Datei vom Schreibtisch aus. (' + fehler.message + ')', true);
      } else if (vorschauHinweis) {
        vorschauHinweis.textContent = 'Die Vorschau ist gerade nicht möglich: index.html wurde nicht gefunden. ' +
          'Die Felder oben funktionieren trotzdem.';
      }
    });
  }

  starten();
})();
