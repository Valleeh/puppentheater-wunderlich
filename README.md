# Puppentheater Wunderlich – Website

Statische Website für das [Puppentheater Wunderlich](https://puppentheater-wunderlich.de) aus Steinfurth vor der Insel Usedom.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite mit allen Stücken, Bühnenprojekten, Team, Stimmen, Galerie, Ablauf und Kontakt |
| `inhalt.yaml` | Termine, Stimmen und Team als reiner Text – die Inhalte, die sich oft ändern |
| `impressum.html` | Impressum und Datenschutzerklärung |
| `style.css` | Gestaltung (Farben aus dem Blumen-Logo) |
| `script.js` | Mobiles Menü, Kopfzeile, Videos und Zusammensetzen der E-Mail-Adresse |
| `bearbeiten.html`, `bearbeiten.css`, `bearbeiten.js` | Editor-Seite: Felder statt HTML, mit Vorschau der echten Website |
| `werkzeuge/seite_bauen.py` | setzt die Inhalte aus `inhalt.yaml` in `index.html` ein |
| `ANLEITUNG.md` | Schritt-für-Schritt-Anleitung zum Ändern der Inhalte, ohne Vorkenntnisse |
| `assets/` | Logo, Favicons und optimierte Fotos |

Keine Build-Schritte im klassischen Sinn, keine Abhängigkeiten im Browser: Die Dateien können direkt auf jeden Webspace (z. B. Strato) hochgeladen werden.

## Inhalte ändern

`index.html` bleibt die Seite, wie sie ausgeliefert wird – von Hand gepflegt bis auf vier Stellen, die aus `inhalt.yaml` erzeugt werden. Sie sind im HTML eingefasst:

```html
<!-- inhalt: termine-liste -->
…erzeugt aus inhalt.yaml…
<!-- /inhalt: termine-liste -->
```

Es gibt die Abschnitte `termine-kopf`, `termine-liste`, `stimmen-liste` und `team-liste`. Alles außerhalb der Markierungen bleibt unberührt.

Neu erzeugen:

```sh
pip install pyyaml                      # einmalig
python3 werkzeuge/seite_bauen.py        # index.html neu schreiben
python3 werkzeuge/seite_bauen.py --pruefen   # nur prüfen, ob beides zusammenpasst
```

Auf GitHub passiert das von selbst: Bei jedem Push auf `main` wird `index.html` erzeugt, ins Repository zurückgeschrieben und veröffentlicht. Für Pull Requests wird sie nur für die Vorschau erzeugt.

### Editor-Seite

`bearbeiten.html` zeigt `inhalt.yaml` als Formular, daneben eine Vorschau der echten Seite, und schreibt am Ende die Datei wieder – zum Kopieren oder Herunterladen. Sie läuft ohne Server und ohne Abhängigkeiten, braucht aber eine `http://`-Adresse, weil sie `inhalt.yaml` und `index.html` nachlädt:

* veröffentlicht unter <https://puppentheater-wunderlich.de/bearbeiten.html>,
* lokal mit `python3 -m http.server` im Projektverzeichnis und dann <http://localhost:8000/bearbeiten.html>.

Die Seite ändert nichts von allein; der fertige Text wird bei GitHub eingefügt. Sie ist für Suchmaschinen gesperrt (`noindex`).

Wichtig beim Weiterentwickeln: `werkzeuge/seite_bauen.py` (Funktionen `termine_liste` und Nachbarn) und `bearbeiten.js` (Funktion `abschnitte`) erzeugen dasselbe HTML. Wer das eine ändert, ändert auch das andere.

## Veröffentlichung über GitHub Pages

Zwei Workflows in `.github/workflows/` kümmern sich um die Veröffentlichung:

| Workflow | Was passiert |
| --- | --- |
| `pages.yml` | Bei jedem Push auf `main` wird `index.html` aus `inhalt.yaml` erzeugt und die Seite in den Branch `gh-pages` kopiert; sie erscheint unter <https://puppentheater-wunderlich.de/> (bzw. <https://valleeh.github.io/puppentheater-wunderlich/>). |
| `pr-preview.yml` | Jeder Pull Request bekommt eine eigene Vorschau unter `…/pr-preview/pr-<Nummer>/`. Der Link steht als Kommentar im PR und wird bei jedem Push aktualisiert. Nach dem Merge verschwindet die Vorschau wieder. |

Einmalig eingestellt: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“, Branch: `gh-pages`, Ordner `/ (root)`**, dazu die eigene Domain `puppentheater-wunderlich.de` (liegt als `CNAME` im Branch `gh-pages`).
