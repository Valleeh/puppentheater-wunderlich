/* ==========================================================================
   Puppentheater Wunderlich – Kern der Werkstatt
   Alles, was keine Knöpfe braucht: inhalt.yaml lesen und schreiben, die
   Inhalte ergänzen und vorlage.html ausfüllen.

   Das Ausfüllen macht werkzeuge/seite_bauen.py genauso; beide müssen
   Zeichen für Zeichen dasselbe liefern. Nachprüfen mit
     node werkzeuge/gleichlauf_pruefen.js
   Läuft im Browser (window.WerkstattKern) und in Node (module.exports).
   ========================================================================== */
(function (wurzel) {
  'use strict';

  function istListe(wert) { return Object.prototype.toString.call(wert) === '[object Array]'; }
  function istAbbildung(wert) { return wert !== null && typeof wert === 'object' && !istListe(wert); }
  function hat(objekt, schluessel) { return Object.prototype.hasOwnProperty.call(objekt, schluessel); }

  /* ========================================================================
     1. YAML lesen – die Form, die in inhalt.yaml vorkommt
     ======================================================================== */

  function einzugVon(zeile) {
    var i = 0;
    while (i < zeile.length && zeile.charAt(i) === ' ') i++;
    return i;
  }

  function istKommentar(zeile) { return zeile.replace(/^\s+/, '').charAt(0) === '#'; }
  function istUebergehbar(zeile) { return zeile.trim() === '' || istKommentar(zeile); }

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
          wert += folgt === 'n' ? '\n' : folgt === 't' ? '\t' : folgt;
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
    if (roh === '[]') return [];
    if (roh === '{}') return {};
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

  function wertLesen(roh, zeilen, stelle, einzug, pfad, lesen) {
    if (roh === '') {
      var unten = blockLesen(zeilen, stelle, einzug + 1, pfad, lesen);
      return unten === null ? '' : unten;
    }
    if (/^[|>][-+]?$/.test(roh)) return blockSkalar(zeilen, stelle, einzug + 1, roh);
    return skalar(roh);
  }

  function blockLesen(zeilen, stelle, mindestEinzug, pfad, lesen) {
    var i = naechsteZeile(zeilen, stelle.i);
    if (i < 0 || einzugVon(zeilen[i]) < mindestEinzug) return null;
    stelle.i = i;
    var text = zeilen[i].trim();
    if (text === '-' || text.slice(0, 2) === '- ') return listeLesen(zeilen, stelle, einzugVon(zeilen[i]), lesen);
    return abbildungLesen(zeilen, stelle, einzugVon(zeilen[i]), pfad, lesen);
  }

  function listeLesen(zeilen, stelle, einzug, lesen) {
    var liste = [];
    while (true) {
      var i = naechsteZeile(zeilen, stelle.i);
      if (i < 0) break;
      var zeile = zeilen[i];
      var text = zeile.trim();
      if (einzugVon(zeile) !== einzug || (text !== '-' && text.slice(0, 2) !== '- ')) break;
      var innen = zeile.indexOf('-') + 2;
      var rest = text.slice(1).trim();
      stelle.i = i + 1;
      if (rest === '') {
        var unten = blockLesen(zeilen, stelle, innen, null, lesen);
        liste.push(unten === null ? '' : unten);
      } else if (/^[A-Za-z0-9_-]+:(\s|$)/.test(rest)) {
        /* "- feld: wert" beginnt eine Abbildung; die Zeile wird so umgeschrieben,
           als stünde das Feld eingerückt in einer eigenen Zeile. */
        zeilen[i] = new Array(innen + 1).join(' ') + rest;
        stelle.i = i;
        liste.push(abbildungLesen(zeilen, stelle, innen, null, lesen));
      } else {
        liste.push(wertLesen(rest, zeilen, stelle, einzug + 1, null, lesen));
      }
    }
    return liste;
  }

  function abbildungLesen(zeilen, stelle, einzug, pfad, lesen) {
    var karte = {};
    while (true) {
      var i = naechsteZeile(zeilen, stelle.i);
      if (i < 0 || einzugVon(zeilen[i]) !== einzug) break;
      var treffer = /^([A-Za-z0-9_-]+):(.*)$/.exec(zeilen[i].trim());
      if (!treffer) break;
      var schluessel = treffer[1];
      var unterpfad = pfad === null ? null : pfad.concat([schluessel]);
      if (unterpfad) kommentarMerken(zeilen, i, unterpfad.join('.'), lesen);
      stelle.i = i + 1;
      karte[schluessel] = wertLesen(treffer[2].trim(), zeilen, stelle, einzug, unterpfad, lesen);
    }
    return karte;
  }

  /* Kommentarzeilen direkt über einem Feld gehören zu diesem Feld. */
  function kommentarMerken(zeilen, i, pfad, lesen) {
    var block = [];
    for (var j = i - 1; j >= lesen.kopfEnde && istKommentar(zeilen[j]); j--) block.unshift(zeilen[j].trim());
    if (block.length) lesen.kommentare[pfad] = block;
  }

  /* Liefert { daten, kommentare }. kommentare.kopf ist der Block am Dateianfang. */
  function yamlLesen(text) {
    var zeilen = text.replace(/\t/g, '  ').replace(/\r/g, '').split('\n');
    var kopf = [];
    while (kopf.length < zeilen.length && istKommentar(zeilen[kopf.length])) kopf.push(zeilen[kopf.length].trim());
    var lesen = { kommentare: { kopf: kopf }, kopfEnde: kopf.length };
    var daten = blockLesen(zeilen, { i: 0 }, 0, [], lesen);
    return { daten: istAbbildung(daten) ? daten : {}, kommentare: lesen.kommentare };
  }

  /* ========================================================================
     2. YAML schreiben
     ======================================================================== */

  function zeichenkette(wert) {
    return '"' + String(wert).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
  }

  /* Ein einfacher Wert nach "schluessel:" oder "- ". Mehrzeilige Texte
     werden als Block geschrieben, damit sie lesbar bleiben. */
  function einfacherWert(wert, einzug) {
    if (wert === true) return [' true'];
    if (wert === false) return [' false'];
    if (typeof wert === 'number') return [' ' + String(wert)];
    var text = wert === null || wert === undefined ? '' : String(wert);
    if (text.indexOf('\n') < 0) return [' ' + zeichenkette(text)];
    var zeilen = [' |-'];
    text.split('\n').forEach(function (zeile) { zeilen.push(zeile ? einzug + '  ' + zeile : ''); });
    return zeilen;
  }

  function mitLeerzeilen(liste) {
    for (var i = 0; i < liste.length; i++) {
      if (istAbbildung(liste[i]) && Object.keys(liste[i]).length > 2) return true;
    }
    return false;
  }

  function kommentareSchreiben(zeilen, kommentare, pfad, einzug) {
    var block = pfad !== null && kommentare[pfad];
    if (!block) return;
    block.forEach(function (zeile) { zeilen.push(einzug + zeile); });
  }

  function abbildungSchreiben(zeilen, karte, einzug, pfad, kommentare, ersteZeilePraefix) {
    var schluessel = Object.keys(karte);
    schluessel.forEach(function (name, nummer) {
      var unterpfad = pfad === null ? null : (pfad ? pfad + '.' + name : name);
      var anfang = nummer === 0 && ersteZeilePraefix !== undefined ? ersteZeilePraefix : einzug;
      if (!(nummer === 0 && ersteZeilePraefix !== undefined)) kommentareSchreiben(zeilen, kommentare, unterpfad, einzug);
      wertSchreiben(zeilen, anfang + name + ':', karte[name], einzug, unterpfad, kommentare);
    });
  }

  function wertSchreiben(zeilen, kopf, wert, einzug, pfad, kommentare) {
    if (istListe(wert)) {
      if (!wert.length) { zeilen.push(kopf + ' []'); return; }
      zeilen.push(kopf);
      listeSchreiben(zeilen, wert, einzug + '  ', kommentare);
    } else if (istAbbildung(wert)) {
      if (!Object.keys(wert).length) { zeilen.push(kopf + ' {}'); return; }
      zeilen.push(kopf);
      abbildungSchreiben(zeilen, wert, einzug + '  ', pfad, kommentare);
    } else {
      var teile = einfacherWert(wert, einzug);
      zeilen.push(kopf + teile[0]);
      for (var i = 1; i < teile.length; i++) zeilen.push(teile[i]);
    }
  }

  function listeSchreiben(zeilen, liste, einzug, kommentare) {
    var luft = mitLeerzeilen(liste);
    liste.forEach(function (eintrag, nummer) {
      if (luft && nummer) zeilen.push('');
      if (istAbbildung(eintrag) && Object.keys(eintrag).length) {
        abbildungSchreiben(zeilen, eintrag, einzug + '  ', null, kommentare, einzug + '- ');
      } else {
        wertSchreiben(zeilen, einzug + '-', eintrag, einzug, null, kommentare);
      }
    });
  }

  function yamlSchreiben(daten, kommentare) {
    kommentare = kommentare || {};
    var zeilen = (kommentare.kopf || []).slice();
    Object.keys(daten).forEach(function (name) {
      if (zeilen.length) zeilen.push('');
      kommentareSchreiben(zeilen, kommentare, name, '');
      wertSchreiben(zeilen, name + ':', daten[name], '', name, kommentare);
    });
    return zeilen.join('\n') + '\n';
  }

  /* ========================================================================
     3. Inhalte ergänzen – Zwilling von ergaenzen() in seite_bauen.py
     ======================================================================== */

  function ergaenzen(wert, medien, meldungen, pfad) {
    pfad = pfad || 'inhalt';
    if (istListe(wert)) {
      return wert.map(function (eintrag, nummer) { return ergaenzen(eintrag, medien, meldungen, pfad + '.' + (nummer + 1)); });
    }
    if (!istAbbildung(wert)) return wert;
    var ergebnis = {};
    Object.keys(wert).forEach(function (schluessel) {
      var inhalt = wert[schluessel];
      ergebnis[schluessel] = ergaenzen(inhalt, medien, meldungen, pfad + '.' + schluessel);
      var text = typeof inhalt === 'string' ? inhalt.trim() : '';
      if (!text) return;
      if (schluessel === 'bild' || /_bild$/.test(schluessel)) {
        if (hat(medien.bilder, text)) ergebnis[schluessel + '_info'] = medien.bilder[text];
        else if (meldungen) meldungen.push('Das Bild „' + text + '“ gibt es nicht im Ordner assets/.');
      } else if (schluessel === 'datei') {
        if (hat(medien.videos, text)) ergebnis.datei_info = medien.videos[text];
        else if (meldungen) meldungen.push('Das Video „' + text + '“ gibt es nicht im Ordner assets/.');
      } else if (schluessel === 'ziel') {
        ergebnis.ziel_extern = text.indexOf('http') === 0;
      } else if (schluessel === 'telefon') {
        var ziffern = text.replace(/[^\d+]/g, '');
        ergebnis.telefon_link = ziffern.charAt(0) === '0' ? '+49' + ziffern.slice(1) : ziffern;
      } else if (schluessel === 'email') {
        var at = text.indexOf('@');
        ergebnis.email_name = at < 0 ? text : text.slice(0, at);
        ergebnis.email_domain = at < 0 ? '' : text.slice(at + 1);
      }
    });
    return ergebnis;
  }

  /* ========================================================================
     4. Die Vorlagensprache – Zwilling von zerlegen()/ausgeben()
     ======================================================================== */

  function zerlegen(vorlage) {
    vorlage = vorlage.replace(/^[ \t]*(\{\{[#^\/!][^}]*\}\})[ \t]*\n/gm, '$1');
    var marke = /\{\{([#^\/&!]?)\s*([\s\S]*?)\s*\}\}/g;
    var baum = [];
    var stapel = [{ name: '', kinder: baum }];
    var stelle = 0;
    var treffer;
    while ((treffer = marke.exec(vorlage)) !== null) {
      if (treffer.index > stelle) stapel[stapel.length - 1].kinder.push(vorlage.slice(stelle, treffer.index));
      stelle = marke.lastIndex;
      var art = treffer[1];
      var name = treffer[2];
      if (art === '#' || art === '^') {
        var knoten = { art: art, name: name, kinder: [] };
        stapel[stapel.length - 1].kinder.push(knoten);
        stapel.push(knoten);
      } else if (art === '/') {
        if (stapel.length === 1 || stapel[stapel.length - 1].name !== name) {
          throw new Error('In vorlage.html passt {{/' + name + '}} zu keinem offenen Abschnitt.');
        }
        stapel.pop();
      } else if (art !== '!') {
        stapel[stapel.length - 1].kinder.push({ art: art || 'text', name: name });
      }
    }
    if (stelle < vorlage.length) stapel[stapel.length - 1].kinder.push(vorlage.slice(stelle));
    if (stapel.length > 1) throw new Error('In vorlage.html fehlt {{/' + stapel[stapel.length - 1].name + '}}.');
    return baum;
  }

  function nachschlagen(kontexte, name) {
    if (name === '.') return kontexte[kontexte.length - 1];
    var teile = name.split('.');
    for (var i = kontexte.length - 1; i >= 0; i--) {
      var kontext = kontexte[i];
      if (istAbbildung(kontext) && hat(kontext, teile[0])) {
        var wert = kontext[teile[0]];
        for (var t = 1; t < teile.length; t++) wert = istAbbildung(wert) && hat(wert, teile[t]) ? wert[teile[t]] : null;
        return wert;
      }
    }
    return null;
  }

  function ohneInhalt(wert) {
    if (wert === null || wert === undefined || wert === true || wert === false) return true;
    if (istListe(wert)) return wert.every(ohneInhalt);
    if (istAbbildung(wert)) return Object.keys(wert).every(function (k) { return ohneInhalt(wert[k]); });
    return String(wert).trim() === '';
  }

  function gilt(wert) {
    if (wert === true || wert === false) return wert;
    return !ohneInhalt(wert);
  }

  function alsText(wert) {
    if (wert === null || wert === undefined || wert === true || wert === false) return '';
    return String(wert).trim();
  }

  function html(wert) {
    return alsText(wert).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/ /g, '&nbsp;');
  }

  function ausgezeichnet(wert) {
    return html(wert)
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (ganz, beschriftung, adresse) {
        var zusatz = adresse.indexOf('http') === 0 ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<a href="' + adresse + '"' + zusatz + '>' + beschriftung + '</a>';
      })
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  function ausgeben(baum, kontexte) {
    var teile = [];
    baum.forEach(function (knoten) {
      if (typeof knoten === 'string') { teile.push(knoten); return; }
      var name = knoten.name;
      var nurPruefen = name.slice(-1) === '?';
      var wert = nachschlagen(kontexte, nurPruefen ? name.slice(0, -1) : name);
      if (knoten.art === 'text') {
        teile.push(html(wert));
      } else if (knoten.art === '&') {
        teile.push(ausgezeichnet(wert));
      } else if (knoten.art === '#') {
        if (nurPruefen) {
          if (gilt(wert)) teile.push(ausgeben(knoten.kinder, kontexte));
        } else if (istListe(wert)) {
          var eintraege = wert.filter(function (e) { return !ohneInhalt(e); });
          eintraege.forEach(function (eintrag, nummer) {
            var zaehler = { _letzter: nummer === eintraege.length - 1, _gerade: nummer % 2 === 1,
              _nummer: (nummer + 1 < 10 ? '0' : '') + (nummer + 1) };
            teile.push(ausgeben(knoten.kinder, kontexte.concat([zaehler, eintrag])));
          });
        } else if (gilt(wert)) {
          teile.push(ausgeben(knoten.kinder, istAbbildung(wert) ? kontexte.concat([wert]) : kontexte));
        }
      } else if (knoten.art === '^') {
        if (!gilt(wert)) teile.push(ausgeben(knoten.kinder, kontexte));
      }
    });
    return teile.join('');
  }

  /* Die ganze Seite: Vorlage + Inhalt + Medienverzeichnis. */
  function seiteBauen(vorlage, daten, medien, meldungen) {
    return ausgeben(zerlegen(vorlage), [ergaenzen(daten, medien, meldungen)]);
  }

  var kern = {
    yamlLesen: yamlLesen,
    yamlSchreiben: yamlSchreiben,
    ergaenzen: ergaenzen,
    seiteBauen: seiteBauen,
    ohneInhalt: ohneInhalt,
    istListe: istListe,
    istAbbildung: istAbbildung
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = kern;
  else wurzel.WerkstattKern = kern;
}(this));
