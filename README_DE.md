# NZXT Function 2 Per-Key RGB für SignalRGB

[Deutsch](README_DE.md) | [English](README.md)

Inoffizielles Community-Plugin für **echtes Per-Key-RGB** auf der **NZXT Function 2 ISO** in SignalRGB.

Die normale SignalRGB-Unterstützung behandelt die Tastatur nur als wenige Beleuchtungszonen. Dieses Plugin verwendet direkt das USB-HID-RGB-Protokoll der Tastatur und ermöglicht SignalRGB dadurch, die einzelnen Tasten anzusteuern und normale Canvas-Effekte über die komplette Tastatur darzustellen.

## Funktionen

- Echtes **Per-Key-RGB** in SignalRGB
- Vollständiges deutsches **ISO-DE**-Layout inklusive rechter Shift-Taste (`Bit 77`)
- SignalRGB-Canvas-Effekte über die komplette Tastatur
- Unterstützung für **Keytap-/Tastendruck-Effekte** über SignalRGB-kompatible Tastennamen
- 24 RGB-Auflösung mit bis zu **60 FPS**
- Optionale Farbauflösungen: `32`, `24`, `16`, `12` oder `8`
- Optionale Update-Raten: `60`, `30`, `20`, `15` oder `10 FPS`
- Frame-Caching zur Reduzierung unnötiger USB-Übertragungen
- Eingebaute **TestRGB-Diagnose** für Raw-Bit-, Zeilen- und Einzelbit-Tests
- Benutzerdefiniertes Plugin, das normale SignalRGB-Updates überlebt

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
| Layout | Deutsch ISO-DE |

Andere Function-2-Varianten bzw. Product IDs wurden **noch nicht verifiziert**.

## Installation / How to use

### 1. Plugin herunterladen

Lade die `.js`-Plugin-Datei aus diesem Repository herunter.

Zum Beispiel:

```text
NZXT_Function2_PerKey_ISO_DE_Keytap_v6.js
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
NZXT Function 2 Per-Key ISO-DE
```

angezeigt werden.

SignalRGB sollte das Gerät dabei als Custom-/User-Plugin kennzeichnen.

## Empfohlene Einstellungen

Standardmäßig verwendet das Plugin:

```text
Per-Key Color Detail: 24
Update Rate: 60 FPS
```

Diese Einstellungen liefen während der Entwicklung auf der getesteten Tastatur stabil.

Falls Flackern, USB-Probleme oder eine ungewöhnlich hohe Last auftreten, kannst du zum Beispiel Folgendes probieren:

```text
Color Detail: 16
Update Rate: 30 FPS oder 20 FPS
```

Bei niedrigeren Farbauflösungen werden Tasten mit ähnlichen Farben in gemeinsamen HID-Farbmasken zusammengefasst. Dadurch müssen pro Frame weniger Daten übertragen werden.

## Keytap-Effekte

Keytap wird von **SignalRGB selbst** umgesetzt. Das Geräte-Plugin muss SignalRGB lediglich die richtigen Tastennamen und Positionen zur Verfügung stellen.

Dieses Plugin exportiert `LedNames()` und `LedPositions()` und verwendet die von SignalRGB erwarteten Tastennamen, zum Beispiel:

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

So verwendest du Keytap:

1. Wähle in SignalRGB einen Effekt aus, der Keytap unterstützt.
2. Aktiviere in den Effekt-Einstellungen **Enable Keytap Effect**.
3. Wähle den gewünschten Keytap-Effekt bzw. Stil.
4. Drücke eine Taste auf der Tastatur.

Je nach ausgewähltem SignalRGB-Effekt kann die gedrückte Taste beispielsweise kurz aufleuchten oder eine Welle/Ripple-Animation von dieser Taste aus starten, während der normale Canvas-Effekt im Hintergrund weiterläuft.

## TestRGB / Layout-Diagnose

Das Plugin enthält einen eingebauten Diagnosemodus. Damit können weitere Function-2-Layouts und Varianten getestet werden, ohne Wireshark oder ein separates Testprogramm zu benötigen.

Öffne in SignalRGB die Einstellungen der Function 2 und verwende den Bereich **Diagnostics**:

```text
Diagnostic Mode
- Off
- Raw Bit Scan
- Physical Key Scan
- Single Bit

Test Speed
- 250 ms
- 500 ms
- 750 ms
- 1000 ms

Single Bit
- 0 ... 143
```

`Raw Bit Scan` testet die rohen NZXT-RGB-Bits `0` bis `143` nacheinander. Das aktive Bit leuchtet rot und die aktuelle Bitnummer wird gleichzeitig in das SignalRGB-Geräte-Log geschrieben.

`Physical Key Scan` geht das aktuell bekannte Layout Zeile für Zeile von links nach rechts durch. Die aktive Taste leuchtet rot und im Log werden der SignalRGB-Tastenname sowie die zugehörigen NZXT-Bits angezeigt.

`Single Bit` lässt ein einzelnes ausgewähltes Roh-Bit dauerhaft rot leuchten und eignet sich für gezielte Tests.

Nach Abschluss eines Scans `Diagnostic Mode` einmal auf `Off` stellen und anschließend den gewünschten Scan erneut auswählen.

Für ein neues Layout wie Nordic ISO ist ein Video der Tastatur während des `Raw Bit Scan` zusammen mit dem SignalRGB-Geräte-Log besonders hilfreich.

## Fehlerbehebung

### Die Tastatur erscheint nicht

Prüfe Folgendes:

- Die Tastatur ist die ISO-Version mit PID `0x2131`
- Die `.js` liegt in `Documents\WhirlwindFX\Plugins`
- SignalRGB wurde vollständig neu gestartet
- Es liegt keine ältere Custom-Function-2-Datei mehr im gleichen Ordner

### Die Tastatur erscheint, leuchtet aber nicht richtig

Wenn NZXT CAM oder eine andere RGB-Software gerade auf die Tastatur zugreift, beende sie und starte SignalRGB anschließend neu.

Zum Gegencheck kannst du außerdem zunächst

```text
16 Farben / 20 FPS
```

einstellen, um Timing- oder USB-Probleme auszuschließen.

### Keytap funktioniert bei einer bestimmten Taste nicht

Die ISO-DE-Hardware-Map ist jetzt vollständig, inklusive **rechter Umschalttaste / Right Shift auf NZXT-RGB-Bit `77`**.

Wenn ein Keytap-Effekt bei einer bestimmten Taste nicht reagiert, prüfe zuerst, ob der ausgewählte SignalRGB-Effekt Keytap unterstützt und **Enable Keytap Effect** aktiviert ist. Falls das Problem weiterhin besteht, kannst du ein Issue erstellen und die betroffene Taste, deine SignalRGB-Version, die Firmware-Version der Tastatur und den getesteten Effekt angeben.

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

## Wichtig

Dies ist ein **inoffizielles Community-Projekt** und steht in keiner Verbindung zu NZXT, SignalRGB oder WhirlwindFX.

Die Nutzung eigener Geräte-Plugins erfolgt auf eigene Verantwortung.

## Mithelfen

Tests mit weiteren Function-2-Varianten sind sehr willkommen.

Besonders hilfreich sind:

- Keytap-Verhalten mit unterschiedlichen SignalRGB-Effekten testen
- andere Function-2-Product-IDs testen
- ANSI-Layouts testen
- physische Tastenpositionen weiter verbessern
- firmwareabhängiges Verhalten dokumentieren
- USB-Captures von noch nicht unterstützten Varianten bereitstellen
