# Puppentheater Wunderlich – Website

Statische Website für das [Puppentheater Wunderlich](https://puppentheater-wunderlich.de) aus Steinfurth vor der Insel Usedom.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite – **wird erzeugt**, nicht von Hand ändern |
| `vorlage.html` | Aufbau der Startseite, mit Platzhaltern statt Text |
| `inhalt.yaml` | sämtliche Texte der Startseite, Bildnamen und Links |
| `impressum.html` | Impressum und Datenschutzerklärung |
| `style.css` | Gestaltung (Farben aus dem Blumen-Logo) |
| `script.js` | Mobiles Menü, Kopfzeile, Videos und Zusammensetzen der E-Mail-Adresse |
| `bearbeiten.html`, `bearbeiten.css`, `bearbeiten.js` | Editor-Seite: jeder Text als Feld, Listen zum Hinzufügen/Sortieren/Löschen, Vorschau der echten Website |
| `bearbeiten-kern.js` | YAML lesen/schreiben und Vorlage ausfüllen – im Browser und in Node |
| `werkzeuge/seite_bauen.py` | baut `index.html` aus `vorlage.html` und `inhalt.yaml`, schreibt dabei `assets/medien.json` |
| `werkzeuge/gleichlauf_pruefen.js` | prüft, dass Editor-Vorschau und `seite_bauen.py` dieselbe Seite bauen |
| `robots.txt` | hält Suchmaschinen von `/werkstatt/` und `/pr-preview/` fern |
| `ANLEITUNG.md` | Schritt-für-Schritt-Anleitung zum Ändern der Inhalte, ohne Vorkenntnisse |
| `assets/` | Logo, Favicons und optimierte Fotos |

Keine Build-Schritte im klassischen Sinn, keine Abhängigkeiten im Browser: Die Dateien können direkt auf jeden Webspace (z. B. Strato) hochgeladen werden.

## Inhalte ändern

`index.html` entsteht aus zwei Dateien:

* **`vorlage.html`** – der Aufbau, mit Platzhaltern. Hier ändert man HTML, Klassen und Reihenfolge der Abschnitte.
* **`inhalt.yaml`** – alle Texte, Listen, Bildnamen und Links. Das ist die Datei, die die Editor-Seite schreibt.

Neu bauen:

```sh
pip install pyyaml                           # einmalig
python3 werkzeuge/seite_bauen.py             # index.html und assets/medien.json neu schreiben
python3 werkzeuge/seite_bauen.py --pruefen   # nur prüfen, ob alles aktuell ist
node werkzeuge/gleichlauf_pruefen.js         # Editor und Python bauen dieselbe Seite?
```

Auf GitHub passiert das von selbst: Bei jedem Push auf `werkstatt` oder `main` wird gebaut, das Ergebnis in den Branch zurückgeschrieben und abgelegt (siehe „Werkstatt und Veröffentlichung“). Für Pull Requests wird nur für die Vorschau gebaut, dort muss auch der Gleichlauf-Check grün sein.

### Die Vorlagensprache

Bewusst klein, angelehnt an Mustache – die vollständige Beschreibung steht oben in `werkzeuge/seite_bauen.py`:

| Schreibweise | Bedeutung |
| --- | --- |
| `{{feld}}` | Text, HTML-sicher |
| `{{&feld}}` | Text mit Auszeichnung: `[Wort](Adresse)`, `*kursiv*`, `**fett**`, Zeilenumbruch → `<br>` |
| `{{#feld}}…{{/feld}}` | Liste: einmal je Eintrag; sonst nur, wenn das Feld etwas enthält |
| `{{#feld?}}…{{/feld?}}` | nur, wenn das Feld etwas enthält – auch bei Listen nur einmal |
| `{{^feld}}…{{/feld}}` | nur, wenn das Feld leer ist |
| `_letzter`, `_gerade`, `_nummer` | in Listen: letzter Eintrag, 2./4./… Eintrag, „01“, „02“ … |

Bilder stehen in `inhalt.yaml` nur mit Namen (`bild: "kasperl"`). Maße, Größenvarianten (`kasperl-480.jpg`, `kasperl-800.jpg`) und ein Fingerabdruck gegen veraltete Browser-Caches (`?v=…`) kommen beim Bauen aus `assets/` dazu – ein ausgetauschtes Foto ist also sofort überall frisch. Ebenso Video-Dateien und -Maße.

**Neues Feld in der Vorlage?** Dann gehört es auch in `ABSCHNITTE` in `bearbeiten.js`, sonst taucht es im Editor nicht auf (in `inhalt.yaml` bleibt es trotzdem erhalten).

### Editor-Seite

`bearbeiten.html` lädt `inhalt.yaml`, `vorlage.html` und `assets/medien.json`, zeigt jeden Text als Feld und baut daneben die fertige Seite als Vorschau – mit demselben Ergebnis wie `seite_bauen.py` (das prüft `gleichlauf_pruefen.js`). Am Ende schreibt sie `inhalt.yaml` zum Kopieren oder Herunterladen; Kommentare in der Datei bleiben erhalten. Kein Server, keine Abhängigkeiten, aber eine `http://`-Adresse ist nötig:

* in der Werkstatt unter <https://puppentheater-wunderlich.de/werkstatt/bearbeiten.html>,
* lokal mit `python3 -m http.server` im Projektverzeichnis und dann <http://localhost:8000/bearbeiten.html>.

Auf die öffentliche Seite kommt der Editor nicht mit (siehe unten). Er ändert nichts von allein und ist für Suchmaschinen gesperrt.

`impressum.html` ist bewusst nicht dabei – Rechtstext, der selten und nur mit Bedacht geändert wird.

## Werkstatt und Veröffentlichung

Gearbeitet wird im Branch **`werkstatt`**, öffentlich ist **`main`**. Beide liegen fertig gebaut im Branch `gh-pages`, den GitHub Pages ausliefert:

| Branch | Adresse | Workflow |
| --- | --- | --- |
| `werkstatt` | <https://puppentheater-wunderlich.de/werkstatt/> (mit Editor, gelbes Schild „Werkstatt“) | `werkstatt.yml` – bei jedem Push |
| `main` | <https://puppentheater-wunderlich.de/> (ohne Editor) | `pages.yml` – bei jedem Push |
| Pull Requests | `…/pr-preview/pr-<Nummer>/` | `pr-preview.yml` – für größere Umbauten |

**Veröffentlichen** ist ein Knopf: Actions → „Veröffentlichen“ → „Run workflow“ (`veroeffentlichen.yml`). Er holt zuerst Neues von `main` in die Werkstatt, baut, schiebt den Stand nach `main` und legt beide Seiten neu ab. Danach sind `werkstatt` und `main` gleich, und es geht in der Werkstatt weiter – kein neuer Branch, kein neuer PR, keine neuen Adressen.

Das eigentliche Bauen und Ablegen steckt in `seite-veroeffentlichen.yml` (wiederverwendbarer Workflow): bauen, gebaute `index.html` in den Branch zurückschreiben, bei `main` den Editor weglassen, bei `werkstatt` das Schild einsetzen, dann nach `gh-pages` (Wurzel bzw. Ordner `werkstatt/`). Die Ordner `werkstatt/` und `pr-preview/` bleiben beim Ablegen der öffentlichen Seite unberührt; `robots.txt` hält Suchmaschinen von beiden fern.

Regeln für Änderungen am Code: Pull Requests gehen nach **`werkstatt`**, nicht nach `main`. `main` ändert sich nur über „Veröffentlichen“. (Wird `main` doch einmal direkt geändert, holt „Veröffentlichen“ das beim nächsten Mal in die Werkstatt; nur bei Änderungen an derselben Stelle muss man einmal von Hand mergen.)

Einmalig in GitHub eingestellt: **Settings → Pages → Source: „Deploy from a branch“, Branch `gh-pages`, Ordner `/ (root)`**, Custom domain `puppentheater-wunderlich.de` (liegt als `CNAME` in `gh-pages`).
