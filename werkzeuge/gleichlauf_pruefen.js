#!/usr/bin/env node
/* Prüft, ob die Editor-Seite dieselbe Seite baut wie werkzeuge/seite_bauen.py.

   Aufruf im Hauptverzeichnis, nachdem index.html gebaut wurde:
     python3 werkzeuge/seite_bauen.py && node werkzeuge/gleichlauf_pruefen.js

   Liest inhalt.yaml mit dem Browser-Kern (bearbeiten-kern.js), füllt damit
   vorlage.html aus und vergleicht das Ergebnis Zeichen für Zeichen mit
   index.html. Weicht etwas ab, zeigt die Vorschau im Editor etwas anderes,
   als später online steht – dann gehören beide Seiten angeglichen. */
'use strict';
var fs = require('fs');
var path = require('path');
var kern = require(path.join(__dirname, '..', 'bearbeiten-kern.js'));

function lesen(datei) { return fs.readFileSync(path.join(__dirname, '..', datei), 'utf8'); }

var meldungen = [];
var gelesen = kern.yamlLesen(lesen('inhalt.yaml'));
var js = kern.seiteBauen(lesen('vorlage.html'), gelesen.daten, JSON.parse(lesen('assets/medien.json')), meldungen);
var python = lesen('index.html');

meldungen.forEach(function (m) { console.log('Hinweis: ' + m); });
if (js === python) {
  console.log('Gleichlauf: Editor und seite_bauen.py erzeugen dieselbe Seite.');
  process.exit(0);
}
var a = js.split('\n');
var b = python.split('\n');
for (var i = 0; i < Math.max(a.length, b.length); i++) {
  if (a[i] !== b[i]) {
    console.log('Abweichung in Zeile ' + (i + 1) + ':\n  Editor: ' + JSON.stringify(a[i]) +
      '\n  Python: ' + JSON.stringify(b[i]));
    break;
  }
}
process.exit(1);
