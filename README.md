# NZXT Function 2 Per-Key RGB for SignalRGB

[English](README.md) | [Deutsch](README_DE.md)

Unofficial community plugin that adds **true per-key RGB control** for the **NZXT Function 2 ISO keyboard** in SignalRGB.

The stock SignalRGB implementation exposes the keyboard as a small number of lighting zones. This plugin uses the keyboard's USB HID RGB protocol directly, allowing SignalRGB to address the individual keys and use normal canvas effects across the whole keyboard.

## Features

- True **per-key RGB** control in SignalRGB
- Multi-layout support:
  - **German ISO-DE**
  - **Nordic ISO (QWERTY)**
- Complete ISO physical RGB mapping, including Right Shift (`bit 77`)
- SignalRGB canvas effects across the complete keyboard
- **Keytap / keypress effect support** through SignalRGB-compatible key names
- Full RGB detail at up to **60 FPS**
- Optional lower color-detail modes: `32`, `24`, `16`, `12`, or `8`
- Optional update-rate limits: `60`, `30`, `20`, `15`, or `10 FPS`
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

## Tested hardware

The plugin was developed and hardware-tested with:

| Item | Value |
| --- | --- |
| Keyboard | NZXT Function 2 ISO |
| USB Vendor ID | `0x1E71` |
| USB Product ID | `0x2131` |
| HID Interface | `1` |
| HID Usage Page | `0xFFCA` |
| HID Usage | `0x0001` |
| Tested firmware | `1.3.22` |
| Development layout | German ISO-DE |

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

There should ideally be only **one custom plugin matching VID `0x1E71` / PID `0x2131`**.

### 5. Copy the plugin file

Copy the downloaded `.js` file into:

```text
Documents\WhirlwindFX\Plugins
```

### 6. Restart SignalRGB

Start SignalRGB again.

The keyboard should now appear as:

```text
NZXT Function 2 Per-Key ISO
```

SignalRGB should label it as a custom/user plugin.

### 7. Select your keyboard layout

Open the Function 2 device settings and select:

```text
Keyboard Layout
- German ISO-DE
- Nordic ISO (QWERTY)
```

Use `German ISO-DE` for a German keyboard and `Nordic ISO (QWERTY)` for the Nordic layout.

## Recommended settings

The plugin defaults to:

```text
Keyboard Layout: German ISO-DE
Per-Key Color Detail: 24
Update Rate: 60 FPS
TestRGB Mode: Off
```

These settings have been stable during testing on the keyboard used for development.

If you experience flickering, USB instability, or unusually high load, try:

```text
Color Detail: 16
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
Num Enter
```

That allows SignalRGB to match Windows keypress events to the corresponding keyboard LEDs.

The selected `Keyboard Layout` also updates the Y/Z mapping used by Keytap:

```text
German ISO-DE -> QWERTZ
Nordic ISO    -> QWERTY
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

- the keyboard is a supported Function 2 ISO variant
- the `.js` file is inside `Documents\WhirlwindFX\Plugins`
- SignalRGB was fully restarted
- no older custom Function 2 plugin is still in the same folder

If your Function 2 has a Product ID other than `0x2131`, please include the device information from **SignalRGB → Settings → Device List** when opening an issue.

### The keyboard appears but does not light correctly

If NZXT CAM or another RGB application is actively controlling the keyboard, close it and restart SignalRGB.

Also try reducing the plugin to:

```text
16 colors / 20 FPS
```

to rule out timing or USB issues.

### Y and Z react to the wrong Keytap position

Check the `Keyboard Layout` setting:

```text
German ISO-DE       -> QWERTZ
Nordic ISO (QWERTY) -> QWERTY
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

The plugin groups identical colors where possible and can optionally quantize the canvas into fewer color groups.

German ISO-DE and Nordic ISO use the same physical RGB bit map in the current implementation. The layout selector only changes the SignalRGB key naming required for the QWERTZ/QWERTY Y/Z difference.

## Important

This is an **unofficial community project** and is not affiliated with or endorsed by NZXT, SignalRGB, or WhirlwindFX.

Use custom device plugins at your own risk.

## Contributing

Testing on additional Function 2 variants is very welcome.

Useful contributions include:

- testing Nordic Keytap behavior across different SignalRGB effects
- testing other Function 2 product IDs and firmware versions
- testing ANSI layouts
- improving physical key positions
- reporting firmware-specific behavior
- submitting USB captures for unsupported variants
- using TestRGB to map additional layouts
