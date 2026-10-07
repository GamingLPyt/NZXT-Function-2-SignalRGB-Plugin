# NZXT Function 2 Per-Key RGB for SignalRGB

[English](README.md) | [Deutsch](README_DE.md)

Unofficial community plugin that adds **true per-key RGB control** for the **NZXT Function 2 ISO keyboard** in SignalRGB.

The stock SignalRGB implementation exposes the keyboard as a small number of lighting zones. This plugin uses the keyboard's USB HID RGB protocol directly, allowing SignalRGB to address the individual keys and use normal canvas effects across the whole keyboard.

## Features

- True **per-key RGB** control in SignalRGB
- Complete German **ISO-DE** physical key layout, including Right Shift (`bit 77`)
- SignalRGB canvas effects across the complete keyboard
- **Keytap / keypress effect support** through SignalRGB-compatible key names
- Full RGB detail at up to **60 FPS**
- Optional lower color-detail modes: `32`, `24`, `16`, `12`, or `8`
- Optional update-rate limits: `60`, `30`, `20`, `15`, or `10 FPS`
- Frame caching to avoid unnecessary USB traffic
- Built-in **TestRGB diagnostics** for raw-bit, row-by-row, and single-bit testing
- Custom user plugin, so it survives normal SignalRGB updates

## Tested hardware

This plugin was developed and hardware-tested with:

| Item | Value |
| --- | --- |
| Keyboard | NZXT Function 2 ISO |
| USB Vendor ID | `0x1E71` |
| USB Product ID | `0x2131` |
| HID Interface | `1` |
| HID Usage Page | `0xFFCA` |
| HID Usage | `0x0001` |
| Tested firmware | `1.3.22` |
| Layout | German ISO-DE |

Other Function 2 variants or product IDs have **not been verified yet**.

## Installation / How to use

### 1. Download the plugin

Download the `.js` plugin file from this repository.

For example:

```text
NZXT_Function2_PerKey_ISO_DE_Keytap_v6.js
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
NZXT Function 2 Per-Key ISO-DE
```

SignalRGB should label it as a custom/user plugin.

## Recommended settings

The plugin defaults to:

```text
Per-Key Color Detail: 24
Update Rate: 60 FPS
```

These settings have been stable during testing on the keyboard used for development.

If you experience flickering, USB instability, or unusually high load, try:

```text
Color Detail: 16
Update Rate: 30 FPS or 20 FPS
```

Lower color-detail modes group keys with similar colors into shared HID color masks and therefore reduce the amount of USB data sent per frame.

## Keytap effects

Keytap effects are handled by **SignalRGB itself**. The plugin only has to expose the keyboard using the key identifiers SignalRGB expects.

This plugin exports `LedNames()` and `LedPositions()` and uses canonical SignalRGB key names such as:

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

To use a Keytap effect:

1. Select an effect in SignalRGB that supports Keytap.
2. Enable **Enable Keytap Effect** in that effect's settings.
3. Select the desired Keytap style/effect.
4. Press a key on the keyboard.

Depending on the selected SignalRGB effect, the pressed key may flash, change color, or start a ripple/wave from that key while the normal canvas effect continues underneath.

## TestRGB / layout diagnostics

The plugin includes a built-in diagnostic mode for testing additional Function 2 layouts and variants without Wireshark or a separate test program.

Open the Function 2 device settings in SignalRGB and use the **Diagnostics** section:

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

`Raw Bit Scan` tests raw NZXT RGB bits `0` through `143` one after another. The active bit is shown in red and the current bit number is written to the SignalRGB device log.

`Physical Key Scan` walks through the currently known layout row-by-row from left to right. The active key is shown in red and the log prints the SignalRGB key name plus the associated NZXT bit(s).

`Single Bit` keeps one selected raw bit illuminated in red and is useful for targeted testing.

After a scan completes, set `Diagnostic Mode` to `Off` and select the scan mode again to restart it.

For testing a new layout such as Nordic ISO, a video of the keyboard during `Raw Bit Scan` together with the SignalRGB device log is especially useful.

## Troubleshooting

### The keyboard does not appear

Check that:

- the keyboard is the ISO model with PID `0x2131`
- the `.js` file is inside `Documents\WhirlwindFX\Plugins`
- SignalRGB was fully restarted
- no older custom Function 2 plugin is still in the same folder

### The keyboard appears but does not light correctly

If NZXT CAM or another RGB application is actively controlling the keyboard, close it and restart SignalRGB.

Also try reducing the plugin to:

```text
16 colors / 20 FPS
```

to rule out timing or USB issues.

### Keytap does not react to a specific key

The ISO-DE hardware map is now complete, including **Right Shift on NZXT RGB bit `77`**.

If a Keytap effect does not react to a specific key, first verify that the selected SignalRGB effect supports Keytap and that **Enable Keytap Effect** is enabled. If the problem remains, please open an issue and include the affected key, SignalRGB version, keyboard firmware version, and the effect you tested.

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

## Important

This is an **unofficial community project** and is not affiliated with or endorsed by NZXT, SignalRGB, or WhirlwindFX.

Use custom device plugins at your own risk.

## Contributing

Testing on additional Function 2 variants is very welcome.

Useful contributions include:

- testing Keytap behavior across different SignalRGB effects
- testing other Function 2 product IDs
- testing ANSI layouts
- improving physical key positions
- reporting firmware-specific behavior
- submitting USB captures for unsupported variants
