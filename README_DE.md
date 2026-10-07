# NZXT Function 2 Per-Key RGB für SignalRGB

[Deutsch](README_DE.md) | [English](README.md)

Inoffizielles Community-Plugin für **echtes Per-Key-RGB** auf der **NZXT Function 2 ISO** in SignalRGB.

Die normale SignalRGB-Unterstützung behandelt die Tastatur nur als wenige Beleuchtungszonen. Dieses Plugin verwendet direkt das USB-HID-RGB-Protokoll der Tastatur und ermöglicht SignalRGB dadurch, die einzelnen Tasten anzusteuern und normale Canvas-Effekte über die komplette Tastatur darzustellen.

## Funktionen

- Echtes **Per-Key-RGB** in SignalRGB
- Multi-Layout-Support:
  - **Deutsch ISO-DE**
  - **Nordic ISO (QWERTY)**
- Vollständige physische ISO-RGB-Zuordnung inklusive rechter Shift-Taste (`Bit 77`)
- SignalRGB-Canvas-Effekte über die komplette Tastatur
- Unterstützung für **Keytap-/Tastendruck-Effekte** über SignalRGB-kompatible Tastennamen
- Volle RGB-Auflösung mit bis zu **60 FPS**
- Optionale Farbauflösungen: `32`, `24`, `16`, `12` oder `8`
- Optionale Update-Raten: `60`, `30`, `20`, `15` oder `10 FPS`
- Frame-Caching zur Reduzierung unnötiger USB-Übertragungen
- Eingebaute **TestRGB-Diagnose** für Raw-Bit-, Zeilen- und Einzelbit-Tests
- Benutzerdefiniertes Plugin, das normale SignalRGB-Updates überlebt

## Unterstützte Layouts

### Deutsch ISO-DE

Deutsch ISO-DE ist das ursprüngliche Entwicklungs-Layout und vollständig gemappt.

### Nordic ISO

Beim Test hat sich gezeigt, dass die **physische RGB-Bit-Zuordnung und die LED-Positionen identisch** zur deutschen ISO-Version sind.

Der für SignalRGB/Keytap wichtige Unterschied ist QWERTY gegenüber QWERTZ:

```text
Deutsch ISO-DE:
obere Buchstabenreihe  -> Z
untere Buchstabenreihe -> Y

Nordic ISO:
obere Buchstabenreihe  -> Y
untere Buchstabenreihe -> Z
```

Deshalb besitzt v6.2 eine auswählbare Tastaturbelegung und tauscht bei Nordic ISO die SignalRGB-Keynamen für Y und Z.

Das eigentliche HID-Protokoll, die RGB-Bits, die LED-Positionen und das 60-FPS-Streaming bleiben unverändert.

## Getestete Hardware

Das Plugin wurde mit folgender Hardware entwickelt und getestet:

| Eigenschaft | Wert |
| --- | --- |
| Tastatur | NZXT Function 2 ISO |
| USB Vendor ID | `0x1E71` |
| USB Product ID | `0x2131` |
| HID Interface | `1` |
| HID Usage Page | `0xFFCA` |
| HID Usage | `0x0001` |
| Getestete Firmware | `1.3.22` |
| Entwicklungs-Layout | Deutsch ISO-DE |

Nordic ISO wurde zusätzlich mit der physischen Tasten-/LED-Zuordnung verglichen. Falls deine Nordic Function 2 eine andere Product ID oder ein abweichendes Firmware-Verhalten hat, erstelle bitte ein Issue und füge die in SignalRGB angezeigten Geräteinformationen hinzu.

## Installation / Verwendung

### 1. Plugin herunterladen

Lade die `.js`-Plugin-Datei aus diesem Repository herunter:

```text
NZXT_Function2_PerKey_MultiLayout_Keytap_v6_2.js
```

### 2. SignalRGB vollständig beenden

Beende SignalRGB komplett, bevor du das Geräte-Plugin hinzufügst oder ersetzt.

### 3. Benutzerdefinierten Plugin-Ordner öffnen

Der empfohlene Ordner für Benutzer-Plugins ist:

```text
C:\Users\<DEIN BENUTZERNAME>\Documents\WhirlwindFX\Plugins
```

Wenn dein Dokumente-Ordner über OneDrive verwaltet wird, kann der Pfad stattdessen so aussehen:

```text
C:\Users\<DEIN BENUTZERNAME>\OneDrive\Documents\WhirlwindFX\Plugins
```

Du kannst den richtigen Ordner auch direkt in SignalRGB über den **Plugins**-Button auf der Geräte-Informationsseite öffnen.

> Lege das Plugin **nicht** in `AppData\Local\VortxEngine\app-...\Signal-x64\Plugins` ab. Dieser Ordner gehört zur SignalRGB-Installation und kann bei Updates überschrieben werden.

### 4. Ältere Custom-Plugins für die Function 2 entfernen

Wenn du bereits eine ältere eigene Function-2-`.js` installiert hast, entferne sie oder verschiebe sie aus dem Custom-Plugin-Ordner.

Idealerweise sollte nur **ein Custom-Plugin für VID `0x1E71` / PID `0x2131`** vorhanden sein.

### 5. Plugin-Datei kopieren

Kopiere die heruntergeladene `.js` nach:

```text
Documents\WhirlwindFX\Plugins
```

### 6. SignalRGB neu starten

Starte SignalRGB wieder.

Die Tastatur sollte nun als

```text
NZXT Function 2 Per-Key ISO
```

angezeigt werden.

SignalRGB sollte das Gerät dabei als Custom-/User-Plugin kennzeichnen.

### 7. Tastatur-Layout auswählen

Öffne die Geräteeinstellungen der Function 2 und wähle:

```text
Keyboard Layout
- German ISO-DE
- Nordic ISO (QWERTY)
```

Für eine deutsche Tastatur verwendest du `German ISO-DE`, für das Nordic-Layout `Nordic ISO (QWERTY)`.

## Empfohlene Einstellungen

Standardmäßig verwendet das Plugin:

```text
Keyboard Layout: German ISO-DE
Per-Key Color Detail: 24
Update Rate: 60 FPS
TestRGB Mode: Off
```

Diese Einstellungen liefen während der Entwicklung auf der getesteten Tastatur stabil.

Falls Flackern, USB-Probleme oder eine ungewöhnlich hohe Last auftreten, kannst du zum Beispiel Folgendes probieren:

```text
Color Detail: 16
Update Rate: 30 FPS oder 20 FPS
```

Bei niedrigeren Farbauflösungen werden Tasten mit ähnlichen Farben in gemeinsamen HID-Farbmasken zusammengefasst. Dadurch müssen pro Frame weniger Daten übertragen werden.

## Keytap-Effekte

Keytap wird von **SignalRGB selbst** umgesetzt. Das Geräte-Plugin stellt SignalRGB die richtigen Tastennamen und Positionen zur Verfügung.

Das Plugin exportiert `LedNames()` und `LedPositions()` und verwendet die von SignalRGB erwarteten Tastennamen, zum Beispiel:

```text
A
Space
Enter
Left Ctrl
Print Screen
Scroll Lock
Pause Break
ISO_#
ISO_<
Num Enter
```

Dadurch kann SignalRGB Windows-Tastendrücke den entsprechenden LEDs der Tastatur zuordnen.

Die ausgewählte Option `Keyboard Layout` passt außerdem die Y/Z-Zuordnung für Keytap an:

```text
German ISO-DE -> QWERTZ
Nordic ISO    -> QWERTY
```

So verwendest du Keytap:

1. Wähle in SignalRGB einen Effekt aus, der Keytap unterstützt.
2. Aktiviere in den Effekt-Einstellungen **Enable Keytap Effect**.
3. Wähle den gewünschten Keytap-Effekt bzw. Stil.
4. Drücke eine Taste auf der Tastatur.

Je nach ausgewähltem SignalRGB-Effekt kann die gedrückte Taste beispielsweise kurz aufleuchten oder eine Welle/Ripple-Animation von dieser Taste aus starten, während der normale Canvas-Effekt im Hintergrund weiterläuft.

## TestRGB / Layout-Diagnose

Das Plugin enthält einen eingebauten Diagnosemodus. Damit können weitere Function-2-Layouts und Varianten getestet werden, ohne Wireshark oder ein separates Testprogramm zu benötigen.

Die TestRGB-Einstellungen findest du direkt in den Geräteeinstellungen der Function 2:

```text
TestRGB Mode
- Off
- Raw Bit Scan
- Physical Key Scan
- Single Bit

TestRGB Speed
- 250 ms
- 500 ms
- 750 ms
- 1000 ms

TestRGB Single Bit
- 0 ... 143
```

### Raw Bit Scan

`Raw Bit Scan` testet die rohen NZXT-RGB-Bits `0` bis `143` nacheinander.

Die Tastatur wird geleert und das aktuell getestete Bit leuchtet rot. Gleichzeitig wird die aktuelle Bitnummer in das SignalRGB-Geräte-Log geschrieben.

Dieser Modus eignet sich am besten, um unbekannte RGB-Bits bei einer anderen Function-2-Variante zu finden.

### Physical Key Scan

`Physical Key Scan` geht das bekannte physische Layout **Zeile für Zeile von links nach rechts** durch.

Die aktive Taste leuchtet rot und im Geräte-Log werden der SignalRGB-Tastenname sowie die zugehörigen NZXT-RGB-Bits angezeigt.

Damit lässt sich ein weiteres ISO-Layout sehr schnell mit der bekannten physischen RGB-Zuordnung vergleichen.

### Single Bit

`Single Bit` lässt ein einzelnes ausgewähltes NZXT-Bit dauerhaft rot leuchten.

Über `TestRGB Single Bit` kann ein beliebiges Bit zwischen `0` und `143` ausgewählt werden.

Nach Abschluss eines Scans `TestRGB Mode` einmal auf `Off` stellen und anschließend den gewünschten Scan erneut auswählen.

## Fehlerbehebung

### Die Tastatur erscheint nicht

Prüfe Folgendes:

- Die Tastatur ist eine unterstützte Function-2-ISO-Variante
- Die `.js` liegt in `Documents\WhirlwindFX\Plugins`
- SignalRGB wurde vollständig neu gestartet
- Es liegt keine ältere Custom-Function-2-Datei mehr im gleichen Ordner

Wenn deine Function 2 eine andere Product ID als `0x2131` besitzt, füge bei einem Issue bitte die Geräteinformationen aus **SignalRGB → Einstellungen → Geräteliste** hinzu.

### Die Tastatur erscheint, leuchtet aber nicht richtig

Wenn NZXT CAM oder eine andere RGB-Software gerade auf die Tastatur zugreift, beende sie und starte SignalRGB anschließend neu.

Zum Gegencheck kannst du außerdem zunächst

```text
16 Farben / 20 FPS
```

einstellen, um Timing- oder USB-Probleme auszuschließen.

### Y und Z reagieren beim Keytap an der falschen Position

Prüfe die Einstellung `Keyboard Layout`:

```text
German ISO-DE       -> QWERTZ
Nordic ISO (QWERTY) -> QWERTY
```

### Keytap funktioniert bei einer bestimmten Taste nicht

Die bekannte ISO-Hardware-Map enthält unter anderem **Right Shift auf NZXT-RGB-Bit `77`**.

Wenn ein Keytap-Effekt bei einer bestimmten Taste nicht reagiert, prüfe zuerst, ob der ausgewählte SignalRGB-Effekt Keytap unterstützt und **Enable Keytap Effect** aktiviert ist.

Falls das Problem weiterhin besteht, kannst du ein Issue erstellen und die betroffene Taste, das ausgewählte Tastatur-Layout, deine SignalRGB-Version, die Firmware-Version der Tastatur und den getesteten Effekt angeben.

## Technische Details

Das RGB-Protokoll der NZXT Function 2 wurde aus USB-HID-Daten reverse engineered und anschließend direkt an echter Hardware getestet.

Eine RGB-Farbgruppe besteht aus:

```text
0x01
18 Byte / 144-Bit-Tastenmaske
R
G
B
```

Damit besteht eine logische Farbgruppe aus **22 Byte**.

Der Datenstrom wird anschließend auf 64-Byte-HID-Transfers aufgeteilt:

```text
Erstes Paket:
43 | 81 + dataLength | remainingPackets | 10 | bis zu 60 Byte

Folgepaket:
43 | dataLength | remainingPackets | bis zu 61 Byte
```

Das Plugin fasst identische Farben nach Möglichkeit zusammen und kann den SignalRGB-Canvas optional auf weniger Farbgruppen quantisieren.

Deutsch ISO-DE und Nordic ISO verwenden in der aktuellen Implementierung dieselbe physische RGB-Bit-Map. Der Layout-Schalter ändert nur die für den QWERTZ-/QWERTY-Unterschied notwendige Y/Z-Benennung in SignalRGB.

## Wichtig

Dies ist ein **inoffizielles Community-Projekt** und steht in keiner Verbindung zu NZXT, SignalRGB oder WhirlwindFX.

Die Nutzung eigener Geräte-Plugins erfolgt auf eigene Verantwortung.

## Mithelfen

Tests mit weiteren Function-2-Varianten sind sehr willkommen.

Besonders hilfreich sind:

- Nordic-Keytap mit unterschiedlichen SignalRGB-Effekten testen
- andere Function-2-Product-IDs und Firmware-Versionen testen
- ANSI-Layouts testen
- physische Tastenpositionen weiter verbessern
- firmwareabhängiges Verhalten dokumentieren
- USB-Captures von noch nicht unterstützten Varianten bereitstellen
- weitere Layouts mit TestRGB mappen
