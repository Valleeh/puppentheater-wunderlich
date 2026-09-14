# Puppentheater Wunderlich – Website

Statische Website für das [Puppentheater Wunderlich](https://puppentheater-wunderlich.de) aus Steinfurth vor der Insel Usedom.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `index.html` | Startseite mit allen Stücken, Bühnenprojekten, Team, Stimmen, Galerie, Ablauf und Kontakt |
| `impressum.html` | Impressum und Datenschutzerklärung |
| `style.css` | Gestaltung (Farben aus dem Blumen-Logo) |
| `script.js` | Mobiles Menü und Zusammensetzen der E-Mail-Adresse |
| `assets/` | Logo, Favicons und optimierte Fotos |

Keine Build-Schritte, keine Abhängigkeiten: Die Dateien können direkt auf jeden Webspace (z. B. Strato) hochgeladen werden.

## Veröffentlichung über GitHub Pages

Zwei Workflows in `.github/workflows/` kümmern sich um die Veröffentlichung:

| Workflow | Was passiert |
| --- | --- |
| `pages.yml` | Bei jedem Push auf `main` wird die Seite in den Branch `gh-pages` kopiert und erscheint unter <https://valleeh.github.io/puppentheater-wunderlich/>. |
| `pr-preview.yml` | Jeder Pull Request bekommt eine eigene Vorschau unter `…/pr-preview/pr-<Nummer>/`. Der Link steht als Kommentar im PR und wird bei jedem Push aktualisiert. Nach dem Merge verschwindet die Vorschau wieder. |

Einmalig einstellen: **Settings → Pages → Build and deployment → Source: „Deploy from a branch“, Branch: `gh-pages`, Ordner `/ (root)`**.

Später kann dort auch die eigene Domain `puppentheater-wunderlich.de` eingetragen werden.
