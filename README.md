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

Auf GitHub passiert das von selbst: Bei jedem Push auf `main` wird gebaut, das Ergebnis ins Repository zurückgeschrieben und veröffentlicht. Für Pull Requests wird nur für die Vorschau gebaut, dort muss auch der Gleichlauf-Check grün sein.

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

* veröffentlicht unter <https://puppentheater-wunderlich.de/bearbeiten.html>,
* lokal mit `python3 -m http.server` im Projektverzeichnis und dann <http://localhost:8000/bearbeiten.html>.

Die Seite ändert nichts von allein und ist für Suchmaschinen gesperrt (`noindex`).

`impressum.html` ist bewusst nicht dabei – Rechtstext, der selten und nur mit Bedacht geändert wird.

## Veröffentlichung über GitHub Pages

Zwei Workflows in `.github/workflows/` kümmern sich um die Veröffentlichung:

| Workflow | Was passiert |
| --- | --- |
| `pages.yml` | Bei jedem Push auf `main` wird `index.html` aus `inhalt.yaml` erzeugt und die Seite in den Branch `gh-pages` kopiert; sie erscheint unter <https://puppentheater-wunderlich.de/> (bzw. <https://valleeh.github.io/puppentheater-wunderlich/>). |
| `pr-preview.yml` | Jeder Pull Request bekommt eine eigene Vorschau unter `…/pr-preview/pr-<Nummer>/`. Der Link steht als Kommentar im PR und wird bei jedem Push aktualisiert. Nach dem Merge verschwindet die Vorschau wieder. |

Einmalig eingestellt: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“, Branch: `gh-pages`, Ordner `/ (root)`**, dazu die eigene Domain `puppentheater-wunderlich.de` (liegt als `CNAME` im Branch `gh-pages`).
