# Puppentheater Wunderlich – Website

Statische Website für das [Puppentheater Wunderlich](https://puppentheater-wunderlich.de) aus Steinfurth bei Greifswald.

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

Der Workflow in `.github/workflows/pages.yml` veröffentlicht die Seite bei jedem Push auf `main` unter
<https://valleeh.github.io/puppentheater-wunderlich/>.

Einmalig aktivieren: **Settings → Pages → Build and deployment → Source: „GitHub Actions“**.
Später kann dort auch die eigene Domain `puppentheater-wunderlich.de` eingetragen werden.

## Lokal ansehen

```
python3 -m http.server 8000
```

Dann `http://localhost:8000` im Browser öffnen.

## Inhalte pflegen

- **Neues Stück:** In `index.html` im Abschnitt `<section id="stuecke">` einen weiteren `<article class="play">`-Block kopieren und anpassen.
- **Fotos:** Neue Bilder in `assets/` ablegen (max. ca. 1600 px Breite, JPEG) und in `index.html` einbinden.
- **E-Mail-Adresse:** wird in `script.js` zusammengesetzt (`user` und `domain`), damit sie nicht als Klartext im Quelltext steht. Im Text erscheint sie als „info (at) puppentheater-wunderlich.de“.
