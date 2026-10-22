# NZXT Function 2 Per-Key RGB for SignalRGB

[English](README.md) | [Deutsch](README_DE.md)

Unofficial community plugin that adds **true per-key RGB control** for the **NZXT Function 2 keyboard** (**ISO** and **US ANSI**) in SignalRGB.

The stock SignalRGB implementation exposes the keyboard as a small number of lighting zones. This plugin uses the keyboard's USB HID RGB protocol directly, allowing SignalRGB to address the individual keys and use normal canvas effects across the whole keyboard.

## Features

- True **per-key RGB** control in SignalRGB
- Multi-layout support:
  - **German ISO-DE**
  - **Nordic ISO (QWERTY)**
  - **US ANSI (QWERTY)**
  - **Auto**: picks US ANSI or German ISO-DE from the keyboard's Product ID
- Complete ISO physical RGB mapping, including Right Shift (`bit 77`)
- SignalRGB canvas effects across the complete keyboard
- **Keytap / keypress effect support** through SignalRGB-compatible key names
- Per-key colors at up to **60 FPS**, with up to **10 different colors per frame** (the firmware's limit, see [Technical notes](#technical-notes))
- Optional lower color-detail modes: `8`, `6`, or `4`
- Optional update-rate limits: `60`, `30`, `20`, `15`, or `10 FPS`
- **Anti-flicker timing**: frames avoid the firmware's internal 60 ms task, which otherwise makes some keys blink off
- Frame caching to avoid unnecessary USB traffic
- Built-in **TestRGB diagnostics** for raw-bit, row-by-row, and single-bit testing
- Custom user plugin, so it survives normal SignalRGB updates

## Layout support

### German ISO-DE

German ISO-DE is the original development layout and is fully mapped.

### Nordic ISO

Testing showed that the **physical RGB bit mapping and LED positions are identical** to the German ISO version.

The important layout difference for SignalRGB/Keytap is QWERTY vs. QWERTZ:

```text
German ISO-DE:
top letter row    -> Z
bottom letter row -> Y

Nordic ISO:
top letter row    -> Y
bottom letter row -> Z
```

Because of this, v6.2 includes a selectable keyboard layout and swaps the SignalRGB Y/Z key names when Nordic ISO is selected.

The underlying HID protocol, RGB bit mapping, LED positions, and 60 FPS streaming remain unchanged.

### US ANSI

The US ANSI Function 2 uses Product ID `0x2130` and the same RGB protocol. Its layout differs from ISO in a few places:

- `\` sits at the end of the Tab row on **bit 45**
- there is no `ISO_<` key; its bit is folded into the wider Left Shift
- the `ISO_#` bit (`60`) lies under the wider ANSI Enter
- the right side of the bottom row is Right Alt, Right Win, Fn, Right Ctrl, and **bit 90 is Fn**
- Y and Z use the QWERTY names

### Auto

`Auto` is the default. It selects `US ANSI (QWERTY)` for Product ID `0x2130` and `German ISO-DE` otherwise. Select `Nordic ISO (QWERTY)` manually for the Nordic keyboard.

## Tested hardware

The plugin was developed and hardware-tested with:

| Item | ISO | US ANSI |
| --- | --- | --- |
| Keyboard | NZXT Function 2 ISO | NZXT Function 2 US ANSI |
| USB Vendor ID | `0x1E71` | `0x1E71` |
| USB Product ID | `0x2131` | `0x2130` |
| HID Interface | `1` | `1` |
| HID Usage Page | `0xFFCA` | `0xFFCA` |
| HID Usage | `0x0001` | `0x0001` |
| Tested firmware | `1.3.22` | `1.3.22` |
| Layout | German ISO-DE (development layout) | US ANSI (QWERTY) |

Nordic ISO has additionally been checked against the physical key/LED mapping. If your Nordic Function 2 uses a different Product ID or firmware behavior, please open an issue and include the device information shown in SignalRGB.

## Installation / How to use

### 1. Download the plugin

Download the `.js` plugin file from this repository:

```text
NZXT_Function2_PerKey_MultiLayout_Keytap_v6_2.js
```

### 2. Close SignalRGB

Exit SignalRGB completely before replacing or adding a device plugin.

### 3. Open the custom plugin folder

The recommended user plugin directory is:

```text
C:\Users\<YOUR USERNAME>\Documents\WhirlwindFX\Plugins
```

If your Documents folder is managed by OneDrive, it may instead be:

```text
C:\Users\<YOUR USERNAME>\OneDrive\Documents\WhirlwindFX\Plugins
```

You can also open the correct folder directly from SignalRGB using the **Plugins** button on the device information page.

> Do **not** put the custom plugin into SignalRGB's `AppData\Local\VortxEngine\app-...\Signal-x64\Plugins` directory. Files there belong to the installed application and can be replaced by SignalRGB updates.

### 4. Remove older custom Function 2 plugins

If you previously installed another custom Function 2 `.js` file, remove or move it out of the custom Plugins folder.

There should ideally be only **one custom plugin matching VID `0x1E71` / PID `0x2130` or `0x2131`**.

### 5. Copy the plugin file

Copy the downloaded `.js` file into:

```text
Documents\WhirlwindFX\Plugins
```

### 6. Restart SignalRGB

Start SignalRGB again.

The keyboard should now appear as:

```text
NZXT Function 2 Per-Key
```

SignalRGB should label it as a custom/user plugin.

### 7. Select your keyboard layout

Open the Function 2 device settings and select:

```text
Keyboard Layout
- Auto
- US ANSI (QWERTY)
- German ISO-DE
- Nordic ISO (QWERTY)
```

`Auto` picks US ANSI or German ISO-DE from the keyboard's Product ID. Use `Nordic ISO (QWERTY)` for the Nordic layout.

## Recommended settings

The plugin defaults to:

```text
Keyboard Layout: Auto
Per-Key Color Detail: 10
Update Rate: 60 FPS
Anti-Flicker Timing: On
TestRGB Mode: Off
```

10 colors is the most the keyboard can show at once. Older settings above 10 (`Full`, `32`, `24`, ...) are treated as 10.

If you experience USB instability or unusually high load, try:

```text
Color Detail: 8
Update Rate: 30 FPS or 20 FPS
```

Lower color-detail modes group keys with similar colors into shared HID color masks and therefore reduce the amount of USB data sent per frame.

## Keytap effects

Keytap effects are handled by **SignalRGB itself**. The plugin exposes the keyboard using the key identifiers SignalRGB expects.

The plugin exports `LedNames()` and `LedPositions()` and uses canonical SignalRGB key names such as:

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
\
Num Enter
```

That allows SignalRGB to match Windows keypress events to the corresponding keyboard LEDs.

The selected `Keyboard Layout` also updates the Y/Z mapping used by Keytap:

```text
German ISO-DE -> QWERTZ
Nordic ISO    -> QWERTY
US ANSI       -> QWERTY
```

To use a Keytap effect:

1. Select an effect in SignalRGB that supports Keytap.
2. Enable **Enable Keytap Effect** in that effect's settings.
3. Select the desired Keytap style/effect.
4. Press a key on the keyboard.

Depending on the selected SignalRGB effect, the pressed key may flash, change color, or start a ripple/wave from that key while the normal canvas effect continues underneath.

## TestRGB / layout diagnostics

The plugin includes a built-in diagnostic mode for testing additional Function 2 layouts and variants without Wireshark or a separate test program.

The TestRGB controls are shown in the Function 2 device settings:

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

`Raw Bit Scan` tests raw NZXT RGB bits `0` through `143` one after another.

The keyboard is cleared and the currently tested bit is shown in red. The active bit number is also written to the SignalRGB device log.

This is the best mode for finding unknown RGB bits on another Function 2 variant.

### Physical Key Scan

`Physical Key Scan` walks through the known physical layout **row-by-row from left to right**.

The active key is shown in red and the device log prints the SignalRGB key name plus the associated NZXT RGB bit(s).

This mode is useful for quickly comparing another ISO layout with the known physical RGB map.

### Single Bit

`Single Bit` keeps one selected raw NZXT bit illuminated in red.

Use `TestRGB Single Bit` to choose any bit from `0` to `143`.

After a scan completes, set `TestRGB Mode` to `Off` and select the scan mode again to restart it.

## Troubleshooting

### The keyboard does not appear

Check that:

- the keyboard is a supported Function 2 variant (ISO `0x2131` or US ANSI `0x2130`)
- the `.js` file is inside `Documents\WhirlwindFX\Plugins`
- SignalRGB was fully restarted
- no older custom Function 2 plugin is still in the same folder

If your Function 2 has a Product ID other than `0x2130` or `0x2131`, please include the device information from **SignalRGB → Settings → Device List** when opening an issue.

### Some keys stay dark with colorful effects

The firmware shows at most 10 color groups per frame. Keep `Per-Key Color Detail` at `10` or lower; older values above 10 are treated as 10.

If NZXT CAM or another RGB application is actively controlling the keyboard, close it and restart SignalRGB.

### Keys blink off for a moment every few seconds

Make sure `Anti-Flicker Timing` is `On`. If the device log says that Anti-Flicker Timing was disabled, the plugin could not read the keyboard's reports; please open an issue and include your SignalRGB version.

### Y and Z react to the wrong Keytap position

Check the `Keyboard Layout` setting:

```text
German ISO-DE       -> QWERTZ
Nordic ISO (QWERTY) -> QWERTY
US ANSI (QWERTY)    -> QWERTY
```

### Keytap does not react to a specific key

The known ISO hardware map includes **Right Shift on NZXT RGB bit `77`**.

If a Keytap effect does not react to a specific key, first verify that the selected SignalRGB effect supports Keytap and that **Enable Keytap Effect** is enabled.

If the problem remains, please open an issue and include the affected key, selected keyboard layout, SignalRGB version, keyboard firmware version, and the effect you tested.

## Technical notes

The NZXT Function 2 RGB protocol was reverse engineered from USB HID traffic and verified on real hardware.

Each RGB color group uses:

```text
0x01
18-byte / 144-bit key mask
R
G
B
```

So one logical color group is **22 bytes**.

The data stream is split into 64-byte HID transfers using:

```text
First packet:
43 | 81 + dataLength | remainingPackets | 10 | up to 60 bytes

Continuation packet:
43 | dataLength | remainingPackets | up to 61 bytes
```

The firmware applies at most **10 color groups per frame**. Groups after the 10th are ignored and their keys stay dark. Every frame also replaces the whole keyboard, so a frame cannot be split into several transactions. The plugin sends identical colors as one group where possible and otherwise clusters the keys into at most 10 colors (k-means, seeded from the previous frame so group borders stay steady while an effect animates).

The keyboard acknowledges every packet with an input report on the same interface:

```text
Packet echo:
43 | E5 | remainingPackets | echoed payload

End of frame (after the last packet):
43 | 81 | 00 | 01 | ...
```

The firmware also runs an internal task every 60 ms. A frame that completes while it runs gets a late end-of-frame report (2-6 ms instead of about 1 ms), and with real effects some keys blink off for a moment. With `Anti-Flicker Timing` on, the plugin reads these reports, learns the task's phase from the late ones, and delays a frame by a few milliseconds when it would complete between 8 ms before and 2 ms after the task.

German ISO-DE and Nordic ISO use the same physical RGB bit map in the current implementation; that layout selector only changes the SignalRGB key naming required for the QWERTZ/QWERTY Y/Z difference. US ANSI differs as listed under [US ANSI](#us-ansi).

## Important

This is an **unofficial community project** and is not affiliated with or endorsed by NZXT, SignalRGB, or WhirlwindFX.

Use custom device plugins at your own risk.

## Contributing

Testing on additional Function 2 variants is very welcome.

Useful contributions include:

- testing Nordic Keytap behavior across different SignalRGB effects
- testing other Function 2 product IDs and firmware versions
- testing ANSI layouts other than US
- improving physical key positions
- reporting firmware-specific behavior
- submitting USB captures for unsupported variants
- using TestRGB to map additional layouts
