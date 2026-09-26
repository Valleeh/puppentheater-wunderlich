#!/usr/bin/env python3
"""Setzt die Inhalte aus inhalt.yaml in index.html ein.

Aufruf im Hauptverzeichnis des Projekts:

    python3 werkzeuge/seite_bauen.py            # index.html neu schreiben
    python3 werkzeuge/seite_bauen.py --pruefen  # nur prüfen, nichts schreiben

In index.html sind die erzeugten Stellen mit Kommentaren eingefasst:

    <!-- inhalt: termine-liste -->
    …
    <!-- /inhalt: termine-liste -->

Alles zwischen den beiden Markierungen stammt aus inhalt.yaml und wird bei
jedem Lauf ersetzt. Der ganze Rest von index.html bleibt unberührt und wird
weiterhin von Hand gepflegt.

Die Editor-Seite bearbeiten.html erzeugt dieselben Abschnitte im Browser für
die Vorschau – wer hier etwas an der Ausgabe ändert, ändert es bitte auch in
bearbeiten.js (Funktion abschnitte).
"""

import argparse
import re
import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    sys.exit('Es fehlt das Python-Paket PyYAML. Installieren mit:  pip install pyyaml')


class InhaltsFehler(Exception):
    """Etwas in inhalt.yaml passt nicht – mit einem Hinweis für Menschen."""


# ── Textbausteine ────────────────────────────────────────────────────────────

def text(wert):
    """Macht aus einem Text sicheres HTML."""
    return (str(wert).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def attribut(wert):
    """Wie text(), zusätzlich für Anführungszeichen in Attributen."""
    return text(wert).replace('"', '&quot;')


def verlinkt(wert):
    """[Text](Adresse) wird zum Link; äußere Adressen öffnen ein neues Fenster."""
    def ersetzen(treffer):
        beschriftung, adresse = treffer.group(1), treffer.group(2)
        extern = adresse.startswith('http')
        zusatz = ' target="_blank" rel="noopener noreferrer"' if extern else ''
        return '<a href="%s"%s>%s</a>' % (attribut(adresse), zusatz, beschriftung)

    return re.sub(r'\[([^\]]+)\]\(([^)\s]+)\)', ersetzen, text(wert))


def feld(eintrag, name):
    """Holt ein Feld aus einem Eintrag."""
    wert = eintrag.get(name, '')
    if wert is None:
        return ''
    if isinstance(wert, bool):
        return wert
    return str(wert).strip()


def ist_leer(eintrag):
    """Ein Eintrag, in dem nirgends Text steht, erscheint nicht auf der Website.

    So stört eine versehentlich leere Karte aus der Werkstatt niemanden."""
    for wert in eintrag.values():
        if isinstance(wert, bool) or wert is None:
            continue
        if str(wert).strip():
            return False
    return True


# ── Die einzelnen Abschnitte ─────────────────────────────────────────────────

def termine_kopf(termine):
    titel = feld(termine, 'titel')
    betont = feld(termine, 'titel_betont')
    ueberschrift = text(titel)
    if betont:
        ueberschrift += '<br><em>%s</em>' % text(betont)

    zeilen = ['<div>']
    vorspann = feld(termine, 'vorspann')
    if vorspann:
        zeilen.append('  <p class="eyebrow">%s</p>' % text(vorspann))
    zeilen.append('  <h2>%s</h2>' % ueberschrift)
    zeilen.append('</div>')
    einleitung = feld(termine, 'einleitung')
    if einleitung:
        zeilen.append('<p>%s</p>' % verlinkt(einleitung))
    return zeilen


def gefuellte(liste, was):
    """Aus einer Liste nur die Einträge, in denen etwas steht."""
    if not isinstance(liste, list):
        raise InhaltsFehler('In inhalt.yaml muss „%s“ eine Aufzählung sein.' % was)
    ergebnis = []
    for nummer, eintrag in enumerate(liste, start=1):
        if not isinstance(eintrag, dict):
            raise InhaltsFehler('Der %d. Eintrag unter „%s“ ist kein Block mit Feldern.' % (nummer, was))
        if not ist_leer(eintrag):
            ergebnis.append(eintrag)
    return ergebnis


def termine_liste(termine):
    liste = gefuellte(termine.get('liste') or [], 'termine: liste')
    if not liste:
        return ['<!-- keine Termine eingetragen -->']

    zeilen = ['<ol class="date-list">']
    for eintrag in liste:
        klasse = 'date-card premiere' if feld(eintrag, 'hervorheben') else 'date-card'
        zeilen.append('  <li class="%s">' % klasse)

        etikett = feld(eintrag, 'etikett')
        if etikett:
            zeilen.append('    <p class="date-tag">%s</p>' % text(etikett))

        datum = feld(eintrag, 'datum')
        wochentag = feld(eintrag, 'wochentag')
        tag = ('<span>%s</span>' % text(wochentag)) if wochentag else ''
        zeilen.append('    <p class="date-day">%s<strong>%s</strong></p>' % (tag, text(datum)))

        for name, klasse_zeile in (('uhrzeit', 'date-time'), ('besetzung', 'date-cast'), ('zusatz', 'date-extra')):
            wert = feld(eintrag, name)
            if wert:
                zeilen.append('    <p class="%s">%s</p>' % (klasse_zeile, verlinkt(wert)))

        zeilen.append('    <div class="date-foot">')
        eintritt = feld(eintrag, 'eintritt')
        if eintritt:
            zeilen.append('      <p class="date-price"><span>Eintritt</span>%s</p>' % verlinkt(eintritt))

        ort = feld(eintrag, 'ort')
        ort_link = feld(eintrag, 'ort_link')
        adresse = feld(eintrag, 'adresse')
        if ort or adresse:
            if ort and ort_link:
                haus = '<strong><a href="%s" target="_blank" rel="noopener noreferrer">%s ↗</a></strong>' % (
                    attribut(ort_link), text(ort))
            elif ort:
                haus = '<strong>%s</strong>' % text(ort)
            else:
                haus = ''
            strasse = ('<span>%s</span>' % text(adresse)) if adresse else ''
            zeilen.append('      <p class="date-place">%s%s</p>' % (haus, strasse))
        zeilen.append('    </div>')
        zeilen.append('  </li>')
    zeilen.append('</ol>')
    return zeilen


def stimmen_liste(stimmen):
    zeilen = ['<div class="quotes">']
    for eintrag in gefuellte(stimmen, 'stimmen'):
        zeilen.append('  <blockquote>')
        zeilen.append('    <p>%s</p>' % text(feld(eintrag, 'zitat')))
        quelle = feld(eintrag, 'quelle')
        if quelle:
            zeilen.append('    <footer>%s</footer>' % text(quelle))
        zeilen.append('  </blockquote>')
    zeilen.append('</div>')
    return zeilen


def team_liste(team):
    zeilen = ['<ul class="team">']
    for eintrag in gefuellte(team, 'team'):
        name = text(feld(eintrag, 'name'))
        aufgabe = feld(eintrag, 'aufgabe')
        rolle = ('<span>%s</span>' % text(aufgabe)) if aufgabe else ''
        zeilen.append('  <li><strong>%s</strong>%s</li>' % (name, rolle))
    zeilen.append('</ul>')
    return zeilen


def abschnitte(inhalt):
    """Alle erzeugten Abschnitte, benannt wie die Markierungen in index.html."""
    termine = inhalt.get('termine') or {}
    if not isinstance(termine, dict):
        raise InhaltsFehler('In inhalt.yaml muss „termine:“ ein Block mit Feldern sein.')
    return {
        'termine-kopf': termine_kopf(termine),
        'termine-liste': termine_liste(termine),
        'stimmen-liste': stimmen_liste(inhalt.get('stimmen') or []),
        'team-liste': team_liste(inhalt.get('team') or []),
    }


# ── Einsetzen in die Seite ───────────────────────────────────────────────────

def einsetzen(seite, name, zeilen):
    """Ersetzt in der Seite alles zwischen den Markierungen zu „name“."""
    muster = re.compile(
        r'([ \t]*)<!-- inhalt: %s -->\n.*?^([ \t]*)<!-- /inhalt: %s -->' % (re.escape(name), re.escape(name)),
        re.S | re.M)
    treffer = muster.search(seite)
    if not treffer:
        raise InhaltsFehler('In index.html fehlt die Markierung <!-- inhalt: %s -->.' % name)
    einzug = treffer.group(1)
    block = '\n'.join((einzug + zeile) if zeile else '' for zeile in zeilen)
    neu = '%s<!-- inhalt: %s -->\n%s\n%s<!-- /inhalt: %s -->' % (einzug, name, block, einzug, name)
    return seite[:treffer.start()] + neu + seite[treffer.end():]


def bauen(verzeichnis):
    inhalt_datei = verzeichnis / 'inhalt.yaml'
    seiten_datei = verzeichnis / 'index.html'
    try:
        inhalt = yaml.safe_load(inhalt_datei.read_text(encoding='utf-8'))
    except FileNotFoundError:
        raise InhaltsFehler('Die Datei inhalt.yaml wurde nicht gefunden.')
    except yaml.YAMLError as fehler:
        raise InhaltsFehler('inhalt.yaml lässt sich nicht lesen:\n%s' % fehler)
    if not isinstance(inhalt, dict):
        raise InhaltsFehler('inhalt.yaml ist leer oder hat nicht die erwartete Form.')

    seite = seiten_datei.read_text(encoding='utf-8')
    for name, zeilen in abschnitte(inhalt).items():
        seite = einsetzen(seite, name, zeilen)
    return seiten_datei, seite


def main():
    argumente = argparse.ArgumentParser(description='index.html aus inhalt.yaml erzeugen')
    argumente.add_argument('--pruefen', action='store_true',
                           help='nichts schreiben, nur melden, ob index.html aktuell ist')
    argumente.add_argument('--verzeichnis', default='.', help='Projektverzeichnis (Standard: .)')
    optionen = argumente.parse_args()

    try:
        datei, neu = bauen(Path(optionen.verzeichnis))
    except InhaltsFehler as fehler:
        sys.exit('Fehler: %s' % fehler)

    alt = datei.read_text(encoding='utf-8')
    if alt == neu:
        print('index.html ist auf dem Stand von inhalt.yaml.')
        return
    if optionen.pruefen:
        sys.exit('index.html passt nicht zu inhalt.yaml. Bitte „python3 werkzeuge/seite_bauen.py“ ausführen.')
    datei.write_text(neu, encoding='utf-8')
    print('index.html neu geschrieben.')


if __name__ == '__main__':
    main()
