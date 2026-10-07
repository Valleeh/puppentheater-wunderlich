# Inhalte selbst ändern

Diese Anleitung ist für alle, die Texte auf der Website ändern möchten – ohne
HTML, ohne Programme zu installieren.

Zum Ändern reicht ein Browser und ein GitHub-Konto. Wer noch keins hat:
kostenlos auf <https://github.com> anlegen und Bescheid geben – das Konto
muss einmalig für die Website freigeschaltet werden.

## Werkstatt und öffentliche Seite

Die Website gibt es zweimal:

| | Adresse | Wofür |
| --- | --- | --- |
| **Werkstatt** | <https://puppentheater-wunderlich.de/werkstatt/> | Hier wird gearbeitet. Jede gespeicherte Änderung ist nach ein, zwei Minuten zu sehen – aber nur hier. Unten links steht ein gelbes Schild „Werkstatt“. |
| **Öffentliche Seite** | <https://puppentheater-wunderlich.de/> | Das, was alle sehen. Ändert sich erst, wenn man auf **Veröffentlichen** drückt. |

So kann man in Ruhe ändern, anschauen, noch einmal ändern – und erst
veröffentlichen, wenn alles passt. Beide Adressen bleiben immer gleich.

## Was sich ändern lässt

**Jeder Text auf der Startseite** – vom Titel im Browser-Tab über die Termine,
Stücke und Bühnenprojekte bis zur Fußzeile. Überall, wo es mehrere gleiche
Dinge gibt (Termine, Stücke, Absätze, Fotos in der Galerie, Menüpunkte, Fragen
…), lassen sich Einträge **hinzufügen, löschen und umsortieren**.

Bilder lassen sich aus allen Fotos auswählen, die schon auf der Website
liegen. Ein **neues** Foto muss erst hochgeladen werden – siehe unten.

Nicht hier, sondern bitte melden: Farben, Schriften, Aufbau der Seite, und
das Impressum.

## So geht es

**1. Editor öffnen**

<https://puppentheater-wunderlich.de/werkstatt/bearbeiten.html>

Am besten gleich als Lesezeichen speichern. Oben steht eine Leiste mit den
Abschnitten der Website (Termine, Stücke, Galerie …), darunter die Felder,
rechts die Vorschau. Mit den Knöpfen **Handy** und **Rechner** lässt sich
umschalten, wie die Seite später aussieht.

**2. Ändern**

Oben den Abschnitt anklicken, dann in die Felder schreiben, was drinstehen
soll. Einträge in Listen sind zugeklappt – ein Klick auf den Titel klappt sie
auf. Mit **+ … hinzufügen** kommt ein neuer Eintrag dazu, mit **↑ ↓** wandert
er nach oben oder unten, mit **löschen** verschwindet er. Ein Feld, das leer
bleibt, fällt auf der Website einfach weg.

Ein paar Zeichen haben eine besondere Wirkung (steht auch über den Feldern):

| So schreiben | So erscheint es |
| --- | --- |
| Neue Zeile mit Enter | ein Zeilenumbruch |
| `*Geschichten*` | *Geschichten* – in großen Überschriften rot |
| `**Liederliste:**` | **Liederliste:** |
| `[Programm](https://beispiel.de)` | ein Link mit dem Wort „Programm“ |

Die Vorschau rechts zieht kurz nach jeder Änderung mit. Wenn sie einmal
stehen bleibt: auf **neu laden** klicken.

**3. Speichern – ganz unten auf der Editor-Seite**

1. **Text kopieren** – ein Klick auf den Knopf genügt.
2. **inhalt.yaml bei GitHub öffnen** – der Knopf öffnet ein neues Fenster.
   Dort ins große Textfeld klicken, mit **Strg + A** (am Mac ⌘ + A) alles
   markieren und mit **Strg + V** (⌘ + V) den kopierten Text einfügen. Der
   alte Text wird dabei ersetzt – genau so soll es sein.
3. Oben rechts auf **„Commit changes…“** klicken. Im Fenster, das aufgeht,
   oben kurz hineinschreiben, was geändert wurde (z. B. „Termin im Dezember
   dazu“), **„Commit directly to the werkstatt branch“** ausgewählt lassen
   und auf **„Commit changes“** klicken.

Nach ein, zwei Minuten steht die Änderung in der Werkstatt. Die Editor-Seite
neu laden – dann geht es mit dem neuen Stand weiter.

**4. Veröffentlichen – wenn alles passt**

Ganz unten auf der Editor-Seite auf **Veröffentlichen** klicken. Auf der
GitHub-Seite, die sich öffnet, rechts auf **„Run workflow“** und im kleinen
Fenster noch einmal auf den grünen Knopf **„Run workflow“**.

Ein paar Minuten später zeigt <https://puppentheater-wunderlich.de/> genau
das, was vorher in der Werkstatt stand.

## Ein neues Foto

1. Das Foto direkt in die Werkstatt hochladen:
   <https://github.com/Valleeh/puppentheater-wunderlich/upload/werkstatt/assets>
   – Foto hineinziehen, unten auf **„Commit changes“**. Am besten vorher einen
   kurzen Namen ohne Leerzeichen und Umlaute geben, z. B. `kasperl-winter.jpg`.
2. Nach ein, zwei Minuten steht es in der Editor-Seite in jeder Bildauswahl
   zur Verfügung (Seite neu laden).

Fotos direkt vom Handy sind oft sehr groß. Für eine schnelle Website lohnt es
sich, sie vorher verkleinern zu lassen – im Zweifel einfach schicken.

## Der kurze Weg für Tippfehler

Kleinigkeiten gehen auch ohne Editor-Seite:
<https://github.com/Valleeh/puppentheater-wunderlich/edit/werkstatt/inhalt.yaml>
öffnen, die Stelle ändern und wie oben unter Punkt 3 mit
**„Commit changes…“** speichern.

Dabei zwei Dinge beachten:

* Die Einrückung mit Leerzeichen am Zeilenanfang bleibt, wie sie ist.
* Jeder Text steht zwischen `"` und `"`. Deutsche Anführungszeichen „so“
  dürfen mitten im Text stehen.

Steckt ein Fehler in der Datei, baut GitHub die Werkstatt nicht neu und zeigt
unter „Actions“ ein rotes Kreuz – die öffentliche Seite bleibt unberührt.

## Fragen, die immer wieder kommen

**Muss ich etwas installieren?** Nein. Browser genügt, auch auf dem Tablet.

**Ich habe mich vertan.** Kein Problem: In der Werkstatt einfach noch einmal
ändern und speichern. Öffentlich wird erst etwas mit „Veröffentlichen“.
Und wenn es schon veröffentlicht ist: korrigieren, speichern, noch einmal
veröffentlichen.

**Wie lange dauert es?** In der Werkstatt ein, zwei Minuten, nach dem
Veröffentlichen zwei bis fünf Minuten.

**Ich habe die Seite zugemacht, ohne zu speichern.** Die Editor-Seite merkt
sich den Stand im Browser und bietet beim nächsten Öffnen an, den Entwurf
weiterzubearbeiten.
