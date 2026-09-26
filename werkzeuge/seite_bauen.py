#!/usr/bin/env python3
"""Baut index.html aus vorlage.html und inhalt.yaml.

Aufruf im Hauptverzeichnis des Projekts:

    python3 werkzeuge/seite_bauen.py            # index.html neu schreiben
    python3 werkzeuge/seite_bauen.py --pruefen  # nur prüfen, nichts schreiben

vorlage.html enthält den Aufbau der Seite, inhalt.yaml sämtliche Texte. Die
Vorlagensprache ist bewusst klein (angelehnt an „Mustache“):

    {{feld}}              Text, sicher für HTML
    {{&feld}}             Text mit Auszeichnung: [Wort](Adresse) wird ein Link,
                          *Wort* kursiv, **Wort** fett, ein Zeilenumbruch <br>
    {{#feld}} … {{/feld}} bei einer Liste einmal je Eintrag, sonst nur, wenn
                          das Feld etwas enthält (bzw. true ist)
    {{#feld?}} … {{/feld?}} nur, wenn das Feld etwas enthält – auch bei einer
                          Liste nur einmal (z. B. für <ol> um eine Liste herum)
    {{^feld}} … {{/feld}} nur, wenn das Feld leer ist
    {{!…}}                Kommentar, erscheint nicht in der Seite
    a.b                   geht eine Ebene tiefer, {{.}} ist der Eintrag selbst

In einer Liste gibt es zusätzlich _letzter (true beim letzten Eintrag),
_gerade (true beim 2., 4., … Eintrag) und _nummer ("01", "02", …).
Steht ein {{#…}}, {{^…}}, {{/…}} oder {{!…}} allein in einer Zeile,
verschwindet die ganze Zeile.

Vor dem Einsetzen werden die Inhalte ergänzt (siehe ergaenzen()): Zu jedem
Bild kommen Maße und Größenvarianten aus assets/, zu jedem Video die
Dateien, zu Links, Telefonnummer und E-Mail-Adresse die technische Form.
Dafür entsteht nebenbei assets/medien.json, die auch die Editor-Seite liest.

Die Editor-Seite bearbeiten.html macht im Browser genau dasselbe
(bearbeiten-kern.js). Wer hier etwas an der Ausgabe ändert, ändert es bitte
auch dort – node werkzeuge/gleichlauf_pruefen.js vergleicht beide.
"""

import argparse
import hashlib
import json
import re
import struct
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit('Es fehlt das Python-Paket PyYAML. Installieren mit:  pip install pyyaml')


class InhaltsFehler(Exception):
    """Etwas passt nicht – mit einem Hinweis für Menschen."""


# ── Bilder und Videos ────────────────────────────────────────────────────────

def bildmasse(datei):
    """Breite und Höhe eines JPEG- oder PNG-Bildes, ohne Zusatzpakete."""
    with open(datei, 'rb') as f:
        kopf = f.read(26)
        if kopf[:8] == b'\x89PNG\r\n\x1a\n':
            return struct.unpack('>II', kopf[16:24])
        if kopf[:2] != b'\xff\xd8':
            return None
        f.seek(2)
        while True:
            marke = f.read(2)
            if len(marke) < 2 or marke[0] != 0xFF:
                return None
            art = marke[1]
            if art in (0xD8, 0x01) or 0xD0 <= art <= 0xD7:
                continue
            laenge = struct.unpack('>H', f.read(2))[0]
            if art in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                hoehe, breite = struct.unpack('>xHH', f.read(5))
                return breite, hoehe
            f.seek(laenge - 2, 1)


def videomasse(datei):
    """Breite und Höhe eines MP4-Videos aus dem Kopf der Bildspur."""
    daten = Path(datei).read_bytes()

    def kaesten(anfang, ende):
        stelle = anfang
        while stelle + 8 <= ende:
            groesse, art = struct.unpack('>I4s', daten[stelle:stelle + 8])
            kopf = 8
            if groesse == 1:
                groesse = struct.unpack('>Q', daten[stelle + 8:stelle + 16])[0]
                kopf = 16
            elif groesse == 0:
                groesse = ende - stelle
            yield art, stelle + kopf, stelle + groesse
            stelle += groesse

    for art, anfang, ende in kaesten(0, len(daten)):
        if art != b'moov':
            continue
        for art2, anfang2, ende2 in kaesten(anfang, ende):
            if art2 != b'trak':
                continue
            for art3, anfang3, _ in kaesten(anfang2, ende2):
                if art3 == b'tkhd':
                    # Breite und Höhe stehen am Ende, als Festkommazahlen 16.16
                    versatz = anfang3 + (88 if daten[anfang3] == 1 else 76)
                    breite, hoehe = struct.unpack('>II', daten[versatz:versatz + 8])
                    if breite and hoehe:
                        return breite >> 16, hoehe >> 16
    return None


def fassung(datei):
    """Kurzer Fingerabdruck der Datei – ändert sich das Bild, ändert sich die
    Adresse, und kein Browser zeigt mehr die alte Fassung."""
    return hashlib.sha1(Path(datei).read_bytes()).hexdigest()[:8]


def medien_erfassen(verzeichnis):
    """Alle Bilder und Videos in assets/, mit Maßen und Varianten.

    Zu einem Bild name.jpg gehören name-480.jpg usw. als kleinere Fassungen."""
    ordner = verzeichnis / 'assets'
    dateien = sorted(p for p in ordner.iterdir() if p.is_file())
    namen = {p.name for p in dateien}
    bilder, videos = {}, {}

    for datei in dateien:
        endung = datei.suffix.lower()
        if endung in ('.jpg', '.jpeg', '.png'):
            teile = re.match(r'^(.*)-(\d{2,4})$', datei.stem)
            if teile and (teile.group(1) + datei.suffix) in namen:
                continue  # eine Größenvariante, gehört zum Hauptbild
            masse = bildmasse(datei)
            if not masse:
                continue
            breite, hoehe = masse
            varianten = []
            for andere in dateien:
                treffer = re.match(r'^%s-(\d{2,4})%s$' % (re.escape(datei.stem), re.escape(datei.suffix)),
                                   andere.name)
                if treffer:
                    varianten.append((int(treffer.group(1)), andere))
            varianten.sort()
            quelle = 'assets/%s?v=%s' % (datei.name, fassung(datei))
            srcset = ''
            if varianten:
                srcset = ', '.join(['assets/%s?v=%s %dw' % (d.name, fassung(d), w) for w, d in varianten] +
                                   ['%s %dw' % (quelle, breite)])
            bilder[datei.stem] = {'quelle': quelle, 'srcset': srcset, 'breite': breite, 'hoehe': hoehe}
        elif endung in ('.mp4', '.webm'):
            eintrag = videos.setdefault(datei.stem, {})
            eintrag[endung[1:]] = 'assets/%s?v=%s' % (datei.name, fassung(datei))
            if endung == '.mp4' or 'download' not in eintrag:
                eintrag['download'] = 'assets/%s' % datei.name
            if endung == '.mp4':
                masse = videomasse(datei)
                if masse:
                    eintrag['breite'], eintrag['hoehe'] = masse
    return {'bilder': bilder, 'videos': videos}


# ── Inhalte ergänzen ─────────────────────────────────────────────────────────

def ergaenzen(wert, medien, pfad='inhalt'):
    """Fügt technische Angaben hinzu, die niemand von Hand pflegen soll.

    bild, …_bild  →  …_info mit quelle, srcset, breite, hoehe
    datei (Video) →  datei_info mit mp4, webm, breite, hoehe, download
    ziel (Link)   →  ziel_extern, wenn die Adresse nach draußen führt
    telefon       →  telefon_link, z. B. +4917664280017
    email         →  email_name und email_domain"""
    if isinstance(wert, list):
        return [ergaenzen(eintrag, medien, '%s.%d' % (pfad, nummer + 1)) for nummer, eintrag in enumerate(wert)]
    if not isinstance(wert, dict):
        return wert
    ergebnis = {}
    for schluessel, inhalt in wert.items():
        ergebnis[schluessel] = ergaenzen(inhalt, medien, '%s.%s' % (pfad, schluessel))
        text = inhalt.strip() if isinstance(inhalt, str) else ''
        if not text:
            continue
        if schluessel == 'bild' or schluessel.endswith('_bild'):
            if text not in medien['bilder']:
                raise InhaltsFehler('Das Bild „%s“ (%s) gibt es nicht im Ordner assets/.' % (text, pfad))
            ergebnis[schluessel + '_info'] = medien['bilder'][text]
        elif schluessel == 'datei':
            if text not in medien['videos']:
                raise InhaltsFehler('Das Video „%s“ (%s) gibt es nicht im Ordner assets/.' % (text, pfad))
            ergebnis['datei_info'] = medien['videos'][text]
        elif schluessel == 'ziel':
            ergebnis['ziel_extern'] = text.startswith('http')
        elif schluessel == 'telefon':
            ziffern = re.sub(r'[^\d+]', '', text)
            ergebnis['telefon_link'] = '+49' + ziffern[1:] if ziffern.startswith('0') else ziffern
        elif schluessel == 'email':
            name, _, domain = text.partition('@')
            ergebnis['email_name'], ergebnis['email_domain'] = name, domain
    return ergebnis


# ── Die Vorlagensprache ──────────────────────────────────────────────────────

MARKE = re.compile(r'\{\{([#^/&!]?)\s*(.*?)\s*\}\}', re.S)
ALLEIN = re.compile(r'^[ \t]*(\{\{[#^/!][^}]*\}\})[ \t]*\n', re.M)


def zerlegen(vorlage):
    """Macht aus dem Vorlagentext einen Baum aus Text und Platzhaltern."""
    vorlage = ALLEIN.sub(r'\1', vorlage)
    wurzel = []
    stapel = [('', wurzel)]
    stelle = 0
    for marke in MARKE.finditer(vorlage):
        if marke.start() > stelle:
            stapel[-1][1].append(vorlage[stelle:marke.start()])
        stelle = marke.end()
        art, name = marke.group(1), marke.group(2)
        if art in ('#', '^'):
            knoten = {'art': art, 'name': name, 'kinder': []}
            stapel[-1][1].append(knoten)
            stapel.append((name, knoten['kinder']))
        elif art == '/':
            if len(stapel) == 1 or stapel[-1][0] != name:
                raise InhaltsFehler('In vorlage.html passt {{/%s}} zu keinem offenen Abschnitt.' % name)
            stapel.pop()
        elif art != '!':
            stapel[-1][1].append({'art': art or 'text', 'name': name})
    if stelle < len(vorlage):
        stapel[-1][1].append(vorlage[stelle:])
    if len(stapel) > 1:
        raise InhaltsFehler('In vorlage.html fehlt {{/%s}}.' % stapel[-1][0])
    return wurzel


def nachschlagen(kontexte, name):
    if name == '.':
        return kontexte[-1]
    teile = name.split('.')
    for kontext in reversed(kontexte):
        if isinstance(kontext, dict) and teile[0] in kontext:
            wert = kontext[teile[0]]
            for teil in teile[1:]:
                wert = wert.get(teil) if isinstance(wert, dict) else None
            return wert
    return None


def ohne_inhalt(wert):
    """Steht nirgends Text drin? Schalter (true/false) zählen dabei nicht."""
    if wert is None or isinstance(wert, bool):
        return True
    if isinstance(wert, dict):
        return all(ohne_inhalt(v) for v in wert.values())
    if isinstance(wert, list):
        return all(ohne_inhalt(v) for v in wert)
    return str(wert).strip() == ''


def gilt(wert):
    if isinstance(wert, bool):
        return wert
    return not ohne_inhalt(wert)


def als_text(wert):
    if wert is None or isinstance(wert, bool):
        return ''
    return str(wert).strip()


def html(wert):
    return (als_text(wert).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
            .replace('"', '&quot;').replace(' ', '&nbsp;'))


def ausgezeichnet(wert):
    """[Wort](Adresse) → Link, **fett**, *kursiv*, Zeilenumbruch → <br>."""
    def link(treffer):
        adresse = treffer.group(2)
        zusatz = ' target="_blank" rel="noopener noreferrer"' if adresse.startswith('http') else ''
        return '<a href="%s"%s>%s</a>' % (adresse, zusatz, treffer.group(1))

    text = html(wert)
    text = re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', link, text)
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*', r'<em>\1</em>', text)
    return text.replace('\n', '<br>')


def ausgeben(baum, kontexte):
    teile = []
    for knoten in baum:
        if isinstance(knoten, str):
            teile.append(knoten)
            continue
        name = knoten['name']
        nur_pruefen = name.endswith('?')
        wert = nachschlagen(kontexte, name[:-1] if nur_pruefen else name)
        if knoten['art'] == 'text':
            teile.append(html(wert))
        elif knoten['art'] == '&':
            teile.append(ausgezeichnet(wert))
        elif knoten['art'] == '#':
            if nur_pruefen:
                if gilt(wert):
                    teile.append(ausgeben(knoten['kinder'], kontexte))
            elif isinstance(wert, list):
                eintraege = [e for e in wert if not ohne_inhalt(e)]
                for nummer, eintrag in enumerate(eintraege):
                    zaehler = {'_letzter': nummer == len(eintraege) - 1, '_gerade': nummer % 2 == 1,
                               '_nummer': '%02d' % (nummer + 1)}
                    teile.append(ausgeben(knoten['kinder'], kontexte + [zaehler, eintrag]))
            elif gilt(wert):
                teile.append(ausgeben(knoten['kinder'], kontexte + ([wert] if isinstance(wert, dict) else [])))
        elif knoten['art'] == '^':
            if not gilt(wert):
                teile.append(ausgeben(knoten['kinder'], kontexte))
    return ''.join(teile)


# ── Zusammensetzen ───────────────────────────────────────────────────────────

def bauen(verzeichnis):
    try:
        inhalt = yaml.safe_load((verzeichnis / 'inhalt.yaml').read_text(encoding='utf-8'))
    except FileNotFoundError:
        raise InhaltsFehler('Die Datei inhalt.yaml wurde nicht gefunden.')
    except yaml.YAMLError as fehler:
        raise InhaltsFehler('inhalt.yaml lässt sich nicht lesen:\n%s' % fehler)
    if not isinstance(inhalt, dict):
        raise InhaltsFehler('inhalt.yaml ist leer oder hat nicht die erwartete Form.')

    medien = medien_erfassen(verzeichnis)
    vorlage = (verzeichnis / 'vorlage.html').read_text(encoding='utf-8')
    seite = ausgeben(zerlegen(vorlage), [ergaenzen(inhalt, medien)])
    medien_text = json.dumps(medien, ensure_ascii=False, indent=1, sort_keys=True) + '\n'
    return {verzeichnis / 'index.html': seite, verzeichnis / 'assets' / 'medien.json': medien_text}


def main():
    argumente = argparse.ArgumentParser(description='index.html aus vorlage.html und inhalt.yaml erzeugen')
    argumente.add_argument('--pruefen', action='store_true',
                           help='nichts schreiben, nur melden, ob index.html aktuell ist')
    argumente.add_argument('--verzeichnis', default='.', help='Projektverzeichnis (Standard: .)')
    optionen = argumente.parse_args()

    try:
        dateien = bauen(Path(optionen.verzeichnis))
    except InhaltsFehler as fehler:
        sys.exit('Fehler: %s' % fehler)

    veraltet = [d for d, neu in dateien.items() if not d.exists() or d.read_text(encoding='utf-8') != neu]
    if not veraltet:
        print('index.html ist auf dem Stand von vorlage.html und inhalt.yaml.')
        return
    if optionen.pruefen:
        sys.exit('Nicht aktuell: %s. Bitte „python3 werkzeuge/seite_bauen.py“ ausführen.'
                 % ', '.join(d.name for d in veraltet))
    for datei in veraltet:
        datei.write_text(dateien[datei], encoding='utf-8')
        print('%s neu geschrieben.' % datei.name)


if __name__ == '__main__':
    main()
