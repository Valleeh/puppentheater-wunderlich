# Inhalte selbst ändern

Diese Anleitung ist für alle, die Termine, Stimmen oder das Team auf der
Website ändern möchten – ohne HTML, ohne Programme zu installieren.

Zum Ändern reicht ein Browser und ein GitHub-Konto. Wer noch keins hat:
kostenlos auf <https://github.com> anlegen und Bescheid geben – das Konto
muss einmalig für die Website freigeschaltet werden.

## Was sich hier ändern lässt

| Geht selbst | Bitte melden |
| --- | --- |
| Termine: hinzufügen, ändern, löschen, umsortieren | Neue Stücke und deren Beschreibungen |
| Stimmen von Kitas, Schulen, Veranstaltern | Fotos und Plakate |
| Namen und Aufgaben im Team | Alle übrigen Texte, Farben, Aufbau der Seite |

## Der Weg über die Editor-Seite

**1. Editor öffnen**

<https://puppentheater-wunderlich.de/bearbeiten.html>

Am besten gleich als Lesezeichen speichern. Links stehen die Felder, rechts
die Vorschau der echten Website. Mit den Knöpfen **Handy** und **Rechner**
lässt sich umschalten, wie die Seite später aussieht.

**2. Ändern**

In die Felder schreiben, was drinstehen soll. Mit **+ Termin hinzufügen**
kommt ein neuer Termin dazu, mit **↑ ↓** wandert eine Karte nach oben oder
unten, mit **löschen** verschwindet sie. Ein Feld, das leer bleibt, fällt auf
der Website einfach weg.

Die Vorschau rechts zieht kurz nach jeder Änderung mit. Wenn sie einmal
stehen bleibt: auf **neu laden** klicken.

Es geht dabei nichts kaputt: Die Editor-Seite ändert die Website nicht. Sie
schreibt nur den Text, der im nächsten Schritt eingefügt wird.

**3. Speichern – die drei Schritte ganz unten auf der Editor-Seite**

1. **Text kopieren** – ein Klick auf den Knopf genügt.
2. **inhalt.yaml bei GitHub öffnen** – der Knopf öffnet ein neues Fenster.
   Dort ins große Textfeld klicken, mit **Strg + A** (am Mac ⌘ + A) alles
   markieren und mit **Strg + V** (⌘ + V) den kopierten Text einfügen. Der
   alte Text wird dabei ersetzt – genau so soll es sein.
3. **Änderung vorschlagen** – oben rechts auf **„Commit changes…“** klicken.
   Im Fenster, das aufgeht:
   * oben eine kurze Beschreibung eintragen, z. B. „Termin im Dezember dazu“,
   * **„Create a new branch for this commit and start a pull request“**
     auswählen,
   * auf **„Propose changes“** klicken und auf der nächsten Seite auf
     **„Create pull request“**.

**4. Anschauen und übernehmen lassen**

Nach ein paar Minuten erscheint im Vorschlag (dem „Pull Request“) automatisch
ein Kommentar mit einem Vorschau-Link. Dahinter liegt die komplette Website
mit der Änderung – noch nicht öffentlich, nur zum Anschauen.

Passt alles? Dann Bescheid geben. Nach dem Übernehmen („Merge“) ist die
Änderung ein paar Minuten später auf
<https://puppentheater-wunderlich.de/> zu sehen.

## Der kurze Weg für Tippfehler

Kleinigkeiten gehen auch ohne Editor-Seite: die Datei `inhalt.yaml` bei GitHub
öffnen, auf den Stift oben rechts klicken, die Stelle ändern und wie oben unter
Punkt 3 mit **„Commit changes…“** vorschlagen.

Dabei zwei Dinge beachten:

* Die Einrückung mit Leerzeichen am Zeilenanfang bleibt, wie sie ist.
* Jeder Text steht zwischen `"` und `"`. Deutsche Anführungszeichen „so“
  dürfen mitten im Text stehen.

Geht etwas schief, meldet GitHub das im Vorschlag mit einem roten Kreuz – die
Website bleibt dann einfach unverändert. Kaputtgehen kann nichts.

## Fragen, die immer wieder kommen

**Muss ich etwas installieren?** Nein. Browser genügt, auch auf dem Tablet.

**Ich habe mich vertan – und schon abgeschickt.** Kein Problem. Solange der
Vorschlag nicht übernommen wurde, ändert sich an der Website nichts. Einfach
Bescheid geben, dann wird er verworfen.

**Wie lange dauert es, bis etwas online ist?** Nach dem Übernehmen etwa zwei
bis fünf Minuten.

**Ich habe die Seite zugemacht, ohne zu speichern.** Die Editor-Seite merkt
sich den Stand im Browser und bietet beim nächsten Öffnen an, den Entwurf
weiterzubearbeiten.
