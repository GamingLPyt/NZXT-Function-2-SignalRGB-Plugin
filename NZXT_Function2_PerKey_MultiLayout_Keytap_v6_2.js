/*
 * NZXT Function 2 Per-Key RGB - Multi-Layout / Keytap / TestRGB v6.2
 *
 * Custom SignalRGB plugin for:
 *   VID 0x1E71 / PID 0x2130 (US ANSI), 0x2131 (ISO)
 *   Interface 1 / Usage Page 0xFFCA / Usage 0x0001
 *
 * Hardware-tested on NZXT Function 2 ISO and US ANSI, firmware 1.3.22.
 *
 * Reverse-engineered RGB protocol:
 *   - One color group = 22 bytes:
 *       0x01 + 18-byte key mask + R + G + B
 *   - First HID packet:
 *       0x43, 0x81 + dataLength, remainingPackets, 0x10, ...
 *       up to 60 stream bytes
 *   - Continuation HID packet:
 *       0x43, dataLength, remainingPackets, ...
 *       up to 61 stream bytes
 *
 * The plugin samples every physical key from the SignalRGB canvas. The
 * firmware applies at most 10 color groups per frame: groups after the 10th
 * are dropped and their keys stay dark, and every frame replaces the whole
 * keyboard (hardware-tested on US ANSI, PID 0x2130, firmware 1.3.22). The
 * per-key colors are therefore clustered into at most 10 groups.
 *
 * Anti-flicker: the keyboard acknowledges every packet (0xE5) and every frame
 * (0x81). A frame that completes while the firmware's 60 ms internal task
 * runs gets a late 0x81 and makes some keys go dark for a moment; frames are
 * timed to avoid that task.
 *
 * Keytap support:
 *   LedNames()/LedPositions() are explicitly exported and use SignalRGB's
 *   canonical keyboard identifiers so Windows keypress events can be matched
 *   to the correct LEDs by reactive/Keytap effects.
 *
 * Verified ISO-DE mapping includes Right Shift on NZXT RGB bit 77.
 * Nordic ISO uses the same RGB bit/LED mapping; QWERTY swaps Y/Z Keytap names.
 * US ANSI (PID 0x2130): backslash on bit 45, no ISO_< key, and Fn / Right Win
 * positions swapped. The "Auto" layout picks ANSI or ISO-DE by product ID.
 * TestRGB: Raw Bit Scan, Physical Key Scan and Single Bit diagnostics.
 */

/* global
lightingMode:readonly,
colorDetail:readonly,
updateRate:readonly,
antiFlicker:readonly,
keyboardLayout:readonly,
diagnosticMode:readonly,
diagnosticSpeed:readonly,
diagnosticBit:readonly
*/

export function Name() { return "NZXT Function 2 Per-Key"; }
export function VendorId() { return 0x1E71; }
// 0x2130 = US ANSI, 0x2131 = ISO.
export function ProductId() { return [0x2130, 0x2131]; }
export function Publisher() { return "GamingLPyt / Community Reverse Engineering"; }
export function DeviceType() { return "keyboard"; }
export function Size() { return DeviceConfig.size; }
export function LedNames() { return getLayout().names; }
export function LedPositions() { return getLayout().positions; }
export function ImageUrl() { return DeviceConfig.image; }

export function Validate(endpoint) {
    const ep = DeviceConfig.endpoint;

    return endpoint.interface === ep.interface &&
           ((endpoint.usage_page & 0xFFFF) === ep.usage_page) &&
           endpoint.usage === ep.usage;
}

export function ControllableParameters() {
    return [
        {
            property: "lightingMode",
            group: "lighting",
            label: "Lighting Mode",
            type: "combobox",
            values: ["Canvas", "Off"],
            default: "Canvas"
        },
        {
            property: "colorDetail",
            group: "lighting",
            label: "Per-Key Color Detail",
            type: "combobox",
            values: ["10", "8", "6", "4"],
            default: "10",
            description: "Maximum number of different colors per frame. The keyboard firmware can show at most 10 at once."
        },
        {
            property: "updateRate",
            group: "lighting",
            label: "Update Rate",
            type: "combobox",
            values: ["60 FPS", "30 FPS", "20 FPS", "15 FPS", "10 FPS"],
            default: "60 FPS"
        },
        {
            property: "antiFlicker",
            group: "lighting",
            label: "Anti-Flicker Timing",
            type: "combobox",
            values: ["On", "Off"],
            default: "On",
            description: "Times each frame around the keyboard's internal 60 ms task. Frames that land on it make some keys go dark for a moment."
        },
        {
            property: "keyboardLayout",
            group: "lighting",
            label: "Keyboard Layout",
            type: "combobox",
            values: ["Auto", "US ANSI (QWERTY)", "German ISO-DE", "Nordic ISO (QWERTY)"],
            default: "Auto",
            description: "Selects the SignalRGB key names used for Keytap. Auto picks US ANSI for the ANSI keyboard (PID 0x2130) and German ISO-DE otherwise. US ANSI moves the backslash key to the Tab row and removes the ISO_< key."
        },
        {
            property: "diagnosticMode",
            group: "lighting",
            label: "TestRGB Mode",
            type: "combobox",
            values: ["Off", "Raw Bit Scan", "Physical Key Scan", "Single Bit"],
            default: "Off",
            description: "Raw Bit Scan tests NZXT bits 0-143. Physical Key Scan walks the selected layout row-by-row. Single Bit tests one selected raw bit."
        },
        {
            property: "diagnosticSpeed",
            group: "lighting",
            label: "TestRGB Speed",
            type: "combobox",
            values: ["250 ms", "500 ms", "750 ms", "1000 ms"],
            default: "750 ms"
        },
        {
            property: "diagnosticBit",
            group: "lighting",
            label: "TestRGB Single Bit",
            type: "number",
            step: "1",
            min: "0",
            max: "143",
            default: "0"
        }
    ];
}

const REPORT_LENGTH = 65;
const MASK_BYTES = 18;
const GROUP_BYTES = 22;

// The firmware applies at most 10 color groups per frame; later groups are
// dropped and their keys stay dark.
const MAX_GROUPS = 10;

// The firmware runs an internal task every 60 ms. A frame that completes while
// it runs makes some keys go dark for a moment, and that frame's end-of-frame
// report (0x81) arrives late (hardware-tested). Frames are timed to complete
// outside a guard zone around the task. The task's period matched 60.000 ms
// of PC time with no measurable drift, so only its phase is learned.
const BUSY_PERIOD_MS = 60;
const BUSY_GUARD_BEFORE_MS = 8;   // the task itself takes up to ~6 ms
const BUSY_GUARD_AFTER_MS = 2;
const LATE_END_MS = 3;
const MAX_MISSED_FRAME_ENDS = 10;

const MODEL_NAME = "Function 2 ISO";

class deviceLibrary {
    constructor() {
        this.PIDLibrary = {
            0x2131: MODEL_NAME
        };

        this.LEDLibrary = {
            [MODEL_NAME]: {
                size: [46, 12],

                // NZXT 144-bit LED mask bits. Some physical keys use multiple bits.
                vKeys: [
                [0],
                [1],
                [2],
                [3],
                [4],
                [5],
                [6],
                [7],
                [8],
                [9],
                [10],
                [11],
                [12],
                [13],
                [14],
                [16],
                [17],
                [18],
                [19],
                [20],
                [21],
                [22],
                [23],
                [24],
                [25],
                [26],
                [27],
                [28],
                [30],
                [32],
                [33],
                [34],
                [35],
                [36],
                [37],
                [38],
                [39],
                [40],
                [41],
                [42],
                [43],
                [44],
                [46],
                [48, 140, 141, 142, 143],
                [49],
                [50],
                [51],
                [52],
                [53],
                [54],
                [55],
                [56],
                [57],
                [58],
                [59],
                [60],
                [61],
                [62],
                [64],
                [65],
                [66],
                [67],
                [68],
                [69],
                [70],
                [71],
                [72],
                [73],
                [74],
                [75],
                [77],
                [78],
                [80],
                [81],
                [82],
                [85],
                [89],
                [90],
                [91],
                [92],
                [93],
                [94],
                [97],
                [99],
                [100],
                [101],
                [102],
                [103],
                [104],
                [105],
                [106],
                [107, 123],
                [108, 124],
                [110],
                [113],
                [114],
                [115],
                [116],
                [117],
                [118],
                [119],
                [120],
                [121],
                [122],
                [126]
                ],

                // IMPORTANT:
                // These are SignalRGB canonical key identifiers, not German labels.
                // Keytap/keypress effects depend on these exact names.
                // Bit 14 is the physical Scroll Lock key and bit 115 is Pause
                // (hardware-tested).
                vLedNames: [
                "Esc",
                "F1",
                "F2",
                "F3",
                "F4",
                "F5",
                "F6",
                "F7",
                "F8",
                "F9",
                "F10",
                "F11",
                "F12",
                "Print Screen",
                "Scroll Lock",
                "`",
                "1",
                "2",
                "3",
                "4",
                "5",
                "6",
                "7",
                "8",
                "9",
                "0",
                "-",
                "+",
                "Backspace",
                "Tab",
                "Q",
                "W",
                "E",
                "R",
                "T",
                "Z",
                "U",
                "I",
                "O",
                "P",
                "[",
                "]",
                "Insert",
                "CapsLock",
                "A",
                "S",
                "D",
                "F",
                "G",
                "H",
                "J",
                "K",
                "L",
                ";",
                "'",
                "ISO_#",
                "Enter",
                "Del",
                "Left Shift",
                "ISO_<",
                "Y",
                "X",
                "C",
                "V",
                "B",
                "N",
                "M",
                ",",
                ".",
                "/",
                "Right Shift",
                "Up Arrow",
                "Left Ctrl",
                "Left Win",
                "Left Alt",
                "Space",
                "Right Alt",
                "Fn",
                "Right Win",
                "Right Ctrl",
                "Left Arrow",
                "Down Arrow",
                "Num 8",
                "Page Up",
                "NumLock",
                "Num /",
                "Num *",
                "Num -",
                "End",
                "Page Down",
                "Num 7",
                "Num Enter",
                "Num 0",
                "Right Arrow",
                "Num 9",
                "Num +",
                "Pause Break",
                "Num 4",
                "Num 5",
                "Num 6",
                "Num 1",
                "Num 2",
                "Num 3",
                "Num .",
                "Home"
                ],

                vLedPositions: [
                [1, 0],
                [4, 0],
                [6, 0],
                [8, 0],
                [10, 0],
                [14, 0],
                [16, 0],
                [18, 0],
                [20, 0],
                [22, 0],
                [24, 0],
                [26, 0],
                [28, 0],
                [32, 0],
                [34, 0],
                [1, 3],
                [3, 3],
                [5, 3],
                [7, 3],
                [9, 3],
                [11, 3],
                [13, 3],
                [15, 3],
                [17, 3],
                [19, 3],
                [21, 3],
                [23, 3],
                [25, 3],
                [28, 3],
                [2, 5],
                [4, 5],
                [6, 5],
                [8, 5],
                [10, 5],
                [12, 5],
                [14, 5],
                [16, 5],
                [18, 5],
                [20, 5],
                [22, 5],
                [24, 5],
                [26, 5],
                [32, 3],
                [2, 7],
                [4, 7],
                [6, 7],
                [8, 7],
                [10, 7],
                [12, 7],
                [14, 7],
                [16, 7],
                [18, 7],
                [20, 7],
                [22, 7],
                [24, 7],
                [26, 7],
                [28, 6],
                [32, 5],
                [1, 9],
                [4, 9],
                [6, 9],
                [8, 9],
                [10, 9],
                [12, 9],
                [14, 9],
                [16, 9],
                [18, 9],
                [20, 9],
                [22, 9],
                [24, 9],
                [27, 9],
                [34, 9],
                [2, 11],
                [4, 11],
                [6, 11],
                [14, 11],
                [22, 11],
                [24, 11],
                [26, 11],
                [28, 11],
                [32, 11],
                [34, 11],
                [40, 5],
                [36, 3],
                [38, 3],
                [40, 3],
                [42, 3],
                [44, 3],
                [34, 5],
                [36, 5],
                [38, 5],
                [44, 10],
                [40, 11],
                [36, 11],
                [42, 5],
                [44, 6],
                [36, 0],
                [38, 7],
                [40, 7],
                [42, 7],
                [38, 9],
                [40, 9],
                [42, 9],
                [42, 11],
                [34, 3]
                ],

                endpoint: {
                    interface: 1,
                    usage: 0x0001,
                    usage_page: 0xFFCA,
                    collection: 0x0000
                },

                image: "https://assets.signalrgb.com/devices/brands/nzxt/keyboards/function-2.png"
            }
        };
    }
}

const NZXTdeviceLibrary = new deviceLibrary();
const DeviceConfig = NZXTdeviceLibrary.LEDLibrary[MODEL_NAME];

const ANSI_LAYOUT = "US ANSI (QWERTY)";
const ANSI_PRODUCT_ID = 0x2130;

let keys = [];
let physicalScanOrder = [];

// "Auto" follows the keyboard model: US ANSI for PID 0x2130, otherwise
// German ISO-DE (the original default).
function selectedLayout() {
    const chosen = typeof keyboardLayout === "undefined" ? "Auto" : String(keyboardLayout || "Auto");

    if (chosen !== "Auto") {
        return chosen;
    }

    let productId = 0;

    try {
        productId = device.productId();
    } catch (e) {
        // LedNames()/LedPositions() can run before a device is attached.
    }

    return productId === ANSI_PRODUCT_ID ? ANSI_LAYOUT : "German ISO-DE";
}

function getLayout() {
    const layout = selectedLayout();
    const names = DeviceConfig.vLedNames.slice();
    const positions = DeviceConfig.vLedPositions.map(p => p.slice());
    const bits = DeviceConfig.vKeys.map(b => b.slice());

    if (layout === "Nordic ISO (QWERTY)" || layout === ANSI_LAYOUT) {
        // The base table is QWERTZ; QWERTY layouts only swap the Y/Z names.
        const zIndex = names.indexOf("Z");
        const yIndex = names.indexOf("Y");

        if (zIndex >= 0 && yIndex >= 0) {
            names[zIndex] = "Y";
            names[yIndex] = "Z";
        }
    }

    if (layout === ANSI_LAYOUT) {
        // ANSI backslash sits at the end of the Tab row on bit 45
        // (hardware-tested). The ISO_# spot (bit 60) lies under the wider
        // ANSI Enter key, so that bit goes to Enter.
        const hashIndex = names.indexOf("ISO_#");
        const enterIndex = names.indexOf("Enter");
        if (hashIndex >= 0) {
            names[hashIndex] = "\\";
            bits[hashIndex] = [45];
            positions[hashIndex] = [28, 5];
            if (enterIndex >= 0) {
                bits[enterIndex] = bits[enterIndex].concat([60]);
            }
        }

        // ANSI has no ISO_< key; its bit is folded into the wider Left Shift.
        const lessIndex = names.indexOf("ISO_<");
        const shiftIndex = names.indexOf("Left Shift");
        if (lessIndex >= 0) {
            if (shiftIndex >= 0) {
                bits[shiftIndex] = bits[shiftIndex].concat(bits[lessIndex]);
            }
            names.splice(lessIndex, 1);
            positions.splice(lessIndex, 1);
            bits.splice(lessIndex, 1);
        }

        // ANSI order is Right Alt, Right Win, Fn, Right Ctrl. Bit 90 lights
        // the Fn key (hardware-tested), so Fn and Right Win swap positions.
        const fnIndex = names.indexOf("Fn");
        const winIndex = names.indexOf("Right Win");
        if (fnIndex >= 0 && winIndex >= 0) {
            const fnPos = positions[fnIndex];
            positions[fnIndex] = positions[winIndex];
            positions[winIndex] = fnPos;
        }
    }

    return { names, positions, bits };
}

function rebuildKeys() {
    const layout = getLayout();

    keys = layout.names.map((name, index) => ({
        name,
        bits: layout.bits[index],
        pos: layout.positions[index]
    }));

    physicalScanOrder = keys
        .map((key, index) => index)
        .sort((a, b) => {
            const dy = keys[a].pos[1] - keys[b].pos[1];
            if (dy !== 0) return dy;
            return keys[a].pos[0] - keys[b].pos[0];
        });

    return layout;
}

function applyKeyboardLayout(logChange) {
    const layout = rebuildKeys();

    device.setControllableLeds(layout.names, layout.positions);

    // Force a clean next render after changing Keytap names.
    lastStream = null;
    lastCanvasColors = null;
    lastDetail = null;
    lastRenderAt = 0;

    if (logChange) {
        device.log("[NZXT Layout] Active layout: " + selectedLayout());
    }
}

export function onkeyboardLayoutChanged() {
    applyKeyboardLayout(true);
}


let lastStream = null;
let lastCanvasColors = null;
let lastDetail = null;
let lastRenderAt = 0;
let lastCentroids = null;

// Date.now() when a late end-of-frame report showed the busy task finishing.
let busyEndAt = -1;
// Frame timing turns itself off if the keyboard's reports cannot be read.
let missedFrameEnds = 0;

let diagnosticActiveMode = "Off";
let diagnosticIndex = -1;
let diagnosticLastStepAt = 0;
let diagnosticComplete = false;
let diagnosticLastSingleBit = -1;

export function Initialize() {
    device.setName(Name());
    device.setSize(Size());
    applyKeyboardLayout(false);

    lastStream = null;
    lastCanvasColors = null;
    lastDetail = null;
    lastRenderAt = 0;
    lastCentroids = null;
    busyEndAt = -1;
    missedFrameEnds = 0;

    diagnosticActiveMode = "Off";
    diagnosticIndex = -1;
    diagnosticLastStepAt = 0;
    diagnosticComplete = false;
    diagnosticLastSingleBit = -1;

    setSoftwareMode();

    device.log("Function 2 v6.2 initialized: US ANSI + German + Nordic layout support / 10 color groups / 60 FPS / Keytap / TestRGB");
}

export function Render() {
    if (renderDiagnostics()) {
        return;
    }

    if (lightingMode === "Off") {
        sendAllBlack(false);
        lastCanvasColors = null;
        lastDetail = null;
        return;
    }

    const now = Date.now();
    const interval = getUpdateIntervalMs();

    if (lastRenderAt !== 0 && (now - lastRenderAt) < interval) {
        return;
    }

    lastRenderAt = now;

    const colors = sampleCanvasColors();
    const detailKey = String(colorDetail);

    // Skip both color processing and USB traffic when the sampled canvas did not
    // change. Changing Color Detail still forces a rebuild.
    if (detailKey === lastDetail && colorsEqual(colors, lastCanvasColors)) {
        return;
    }

    const groups = buildColorGroups(colors);
    const stream = encodeColorGroups(groups);

    // Different sampled colors can still resolve to the same outgoing stream.
    if (arraysEqual(stream, lastStream)) {
        lastCanvasColors = cloneColors(colors);
        lastDetail = detailKey;
        return;
    }

    if (sendStream(stream)) {
        lastStream = stream.slice();
        lastCanvasColors = cloneColors(colors);
        lastDetail = detailKey;
    }
}

export function Shutdown(SystemSuspending) {
    sendAllBlack(true);
    lastStream = null;
    lastCanvasColors = null;
    lastDetail = null;
    lastRenderAt = 0;
}

function setSoftwareMode() {
    writeSimple([0x43, 0x81, 0x00, 0x84]);
    device.pause(20);

    writeSimple([0x43, 0x81, 0x00, 0x86]);
    device.pause(20);

    writeSimple([0x43, 0x82, 0x00, 0x41, 0x64]);
    device.pause(20);

    writeSimple([0x43, 0x97, 0x00, 0x10, 0x01]);
    device.pause(50);
}

function sampleCanvasColors() {
    const colors = new Array(keys.length);

    for (let i = 0; i < keys.length; i++) {
        const p = keys[i].pos;
        const c = device.color(p[0], p[1]);

        if (!c || c.length < 3) {
            colors[i] = [0, 0, 0];
        } else {
            colors[i] = [
                clampByte(c[0]),
                clampByte(c[1]),
                clampByte(c[2])
            ];
        }
    }

    return colors;
}

function renderDiagnostics() {
    const mode = String(diagnosticMode || "Off");

    if (mode !== diagnosticActiveMode) {
        diagnosticActiveMode = mode;
        diagnosticIndex = -1;
        diagnosticLastStepAt = 0;
        diagnosticComplete = false;
        diagnosticLastSingleBit = -1;

        lastStream = null;
        lastCanvasColors = null;
        lastDetail = null;
        lastRenderAt = 0;

        if (mode === "Off") {
            device.log("[NZXT TestRGB] Diagnostics disabled; returning to normal canvas output.");
            return false;
        }

        sendAllBlack(true);
        lastStream = null;
        device.log("[NZXT TestRGB] Diagnostic mode started: " + mode);
    }

    if (mode === "Off") return false;

    if (mode === "Single Bit") {
        const bit = clampDiagnosticBit(diagnosticBit);

        if (bit !== diagnosticLastSingleBit) {
            diagnosticLastSingleBit = bit;
            sendDiagnosticBits([bit], [255, 0, 0]);
            device.log("[NZXT TestRGB] Single Bit | bit " + bit + " / 143");
        }

        return true;
    }

    if (diagnosticComplete) return true;

    const now = Date.now();
    const interval = getDiagnosticIntervalMs();

    if (diagnosticLastStepAt !== 0 && (now - diagnosticLastStepAt) < interval) {
        return true;
    }

    diagnosticLastStepAt = now;
    diagnosticIndex++;

    if (mode === "Raw Bit Scan") {
        if (diagnosticIndex >= 144) {
            finishDiagnosticScan("Raw Bit Scan");
            return true;
        }

        sendDiagnosticBits([diagnosticIndex], [255, 0, 0]);
        device.log("[NZXT TestRGB] Raw Bit " + (diagnosticIndex + 1) + "/144 | bit " + diagnosticIndex);
        return true;
    }

    if (mode === "Physical Key Scan") {
        if (diagnosticIndex >= physicalScanOrder.length) {
            finishDiagnosticScan("Physical Key Scan");
            return true;
        }

        const keyIndex = physicalScanOrder[diagnosticIndex];
        const key = keys[keyIndex];

        sendDiagnosticBits(key.bits, [255, 0, 0]);
        device.log(
            "[NZXT TestRGB] Physical Key " +
            (diagnosticIndex + 1) + "/" + physicalScanOrder.length +
            " | " + key.name +
            " | bit(s): " + key.bits.join(",")
        );
        return true;
    }

    diagnosticActiveMode = "Off";
    return false;
}

function finishDiagnosticScan(name) {
    sendAllBlack(true);
    lastStream = null;
    diagnosticComplete = true;
    device.log("[NZXT TestRGB] " + name + " complete. Set Diagnostic Mode to Off and back to the scan mode to restart.");
}

function getDiagnosticIntervalMs() {
    const parsed = parseInt(String(diagnosticSpeed), 10);
    return (!parsed || parsed < 50) ? 750 : parsed;
}

function clampDiagnosticBit(value) {
    let bit = parseInt(String(value), 10);
    if (isNaN(bit)) bit = 0;
    if (bit < 0) bit = 0;
    if (bit > 143) bit = 143;
    return bit;
}

function sendDiagnosticBits(bits, rgb) {
    const mask = new Array(MASK_BYTES).fill(0);

    for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];
        if (bit < 0 || bit >= 144) continue;

        const byteIndex = Math.floor(bit / 8);
        const bitIndex = bit % 8;
        mask[byteIndex] |= (1 << bitIndex);
    }

    const stream = encodeColorGroups([{
        rgb: [clampByte(rgb[0]), clampByte(rgb[1]), clampByte(rgb[2])],
        mask
    }]);

    sendStream(stream);
}

function getUpdateIntervalMs() {
    const parsed = parseInt(String(updateRate), 10);
    const fps = parsed > 0 ? parsed : 60;

    return Math.max(1, Math.round(1000 / fps));
}

function colorsEqual(a, b) {
    if (!a || !b || a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (!a[i] || !b[i] ||
            a[i][0] !== b[i][0] ||
            a[i][1] !== b[i][1] ||
            a[i][2] !== b[i][2]) {
            return false;
        }
    }

    return true;
}

function cloneColors(colors) {
    const copy = new Array(colors.length);

    for (let i = 0; i < colors.length; i++) {
        copy[i] = [colors[i][0], colors[i][1], colors[i][2]];
    }

    return copy;
}

function buildColorGroups(colors) {
    let target = parseInt(colorDetail, 10);

    // Older settings ("Full", "24", ...) exceed what the firmware can show.
    if (!target || target < 1 || target > MAX_GROUPS) {
        target = MAX_GROUPS;
    }

    // Exact colors when they fit; identical colors share one mask.
    const exact = buildExactGroups(colors);

    if (exact.length <= target) {
        return exact;
    }

    return buildKMeansGroups(colors, target);
}

function buildExactGroups(colors) {
    const groups = [];
    const lookup = {};

    for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const packed = (c[0] << 16) | (c[1] << 8) | c[2];
        const id = String(packed);

        let groupIndex = lookup[id];

        if (groupIndex === undefined) {
            groupIndex = groups.length;
            lookup[id] = groupIndex;

            groups.push({
                rgb: [c[0], c[1], c[2]],
                mask: new Array(MASK_BYTES).fill(0)
            });
        }

        addKeyBitsToMask(groups[groupIndex].mask, keys[i].bits);
    }

    return groups;
}

function buildKMeansGroups(colors, target) {
    let best = runKMeans(colors, initialiseCentroids(colors, target));

    // With only 10 groups, clustering every frame from scratch makes group
    // borders jump while an effect animates. Seeding from the previous frame
    // keeps them steady; it wins unless the fresh result is clearly better.
    if (lastCentroids && lastCentroids.length === target) {
        const seeded = runKMeans(colors, cloneColors(lastCentroids));

        if (seeded.error <= best.error * 1.25) {
            best = seeded;
        }
    }

    lastCentroids = cloneColors(best.centroids);

    const centroids = best.centroids;
    const assignments = best.assignments;
    const byCluster = new Array(centroids.length);

    for (let c = 0; c < centroids.length; c++) {
        byCluster[c] = {
            rgb: [
                clampByte(centroids[c][0]),
                clampByte(centroids[c][1]),
                clampByte(centroids[c][2])
            ],
            mask: new Array(MASK_BYTES).fill(0),
            used: false
        };
    }

    for (let i = 0; i < keys.length; i++) {
        const cluster = assignments[i];
        byCluster[cluster].used = true;
        addKeyBitsToMask(byCluster[cluster].mask, keys[i].bits);
    }

    const result = [];

    for (let c = 0; c < byCluster.length; c++) {
        if (byCluster[c].used) {
            result.push({
                rgb: byCluster[c].rgb,
                mask: byCluster[c].mask
            });
        }
    }

    return result;
}

function runKMeans(colors, centroids) {
    const assignments = new Array(colors.length).fill(0);

    // Six passes are plenty for ~104 keys and 10 clusters. The canvas cache
    // skips this work entirely for unchanged frames.
    for (let iteration = 0; iteration < 6; iteration++) {
        const sumR = new Array(centroids.length).fill(0);
        const sumG = new Array(centroids.length).fill(0);
        const sumB = new Array(centroids.length).fill(0);
        const count = new Array(centroids.length).fill(0);

        for (let i = 0; i < colors.length; i++) {
            const cluster = nearestCentroid(colors[i], centroids);
            assignments[i] = cluster;

            sumR[cluster] += colors[i][0];
            sumG[cluster] += colors[i][1];
            sumB[cluster] += colors[i][2];
            count[cluster]++;
        }

        for (let c = 0; c < centroids.length; c++) {
            if (count[c] > 0) {
                centroids[c] = [
                    Math.round(sumR[c] / count[c]),
                    Math.round(sumG[c] / count[c]),
                    Math.round(sumB[c] / count[c])
                ];
            } else {
                // An empty cluster would waste one of the 10 groups.
                centroids[c] = farthestColor(colors, centroids).slice();
            }
        }
    }

    // Final assignment using the final centroid positions.
    let error = 0;

    for (let i = 0; i < colors.length; i++) {
        assignments[i] = nearestCentroid(colors[i], centroids);
        error += colorDistanceSq(colors[i], centroids[assignments[i]]);
    }

    return { centroids, assignments, error };
}

function initialiseCentroids(colors, target) {
    const count = Math.min(target, colors.length);
    const centroids = [];

    let meanR = 0;
    let meanG = 0;
    let meanB = 0;

    for (let i = 0; i < colors.length; i++) {
        meanR += colors[i][0];
        meanG += colors[i][1];
        meanB += colors[i][2];
    }

    centroids.push([
        Math.round(meanR / colors.length),
        Math.round(meanG / colors.length),
        Math.round(meanB / colors.length)
    ]);

    while (centroids.length < count) {
        const chosen = farthestColor(colors, centroids);
        centroids.push([chosen[0], chosen[1], chosen[2]]);
    }

    return centroids;
}

// The sampled color that the current centroids represent worst.
function farthestColor(colors, centroids) {
    let bestIndex = 0;
    let bestDistance = -1;

    for (let i = 0; i < colors.length; i++) {
        let nearest = Number.MAX_SAFE_INTEGER;

        for (let c = 0; c < centroids.length; c++) {
            const d = colorDistanceSq(colors[i], centroids[c]);

            if (d < nearest) {
                nearest = d;
            }
        }

        if (nearest > bestDistance) {
            bestDistance = nearest;
            bestIndex = i;
        }
    }

    return colors[bestIndex];
}

function nearestCentroid(color, centroids) {
    let best = 0;
    let bestDistance = Number.MAX_SAFE_INTEGER;

    for (let i = 0; i < centroids.length; i++) {
        const d = colorDistanceSq(color, centroids[i]);

        if (d < bestDistance) {
            bestDistance = d;
            best = i;
        }
    }

    return best;
}

function colorDistanceSq(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];

    return dr * dr + dg * dg + db * db;
}

function addKeyBitsToMask(mask, bits) {
    for (let i = 0; i < bits.length; i++) {
        const bit = bits[i];

        if (bit < 0 || bit >= 144) {
            continue;
        }

        const byteIndex = Math.floor(bit / 8);
        const bitIndex = bit % 8;

        mask[byteIndex] |= (1 << bitIndex);
    }
}

function encodeColorGroups(groups) {
    const stream = new Array(groups.length * GROUP_BYTES).fill(0);

    for (let g = 0; g < groups.length; g++) {
        const base = g * GROUP_BYTES;
        const group = groups[g];

        stream[base] = 0x01;

        for (let m = 0; m < MASK_BYTES; m++) {
            stream[base + 1 + m] = group.mask[m] & 0xFF;
        }

        stream[base + 19] = group.rgb[0] & 0xFF;
        stream[base + 20] = group.rgb[1] & 0xFF;
        stream[base + 21] = group.rgb[2] & 0xFF;
    }

    return stream;
}

function sendStream(stream) {
    if (!stream || stream.length === 0) {
        return false;
    }

    const firstDataLength = Math.min(60, stream.length);
    const bytesAfterFirst = stream.length - firstDataLength;
    const continuationCount =
        bytesAfterFirst <= 0 ? 0 : Math.ceil(bytesAfterFirst / 61);
    // typeof guard: a newly added setting may not be defined yet.
    const timed = (typeof antiFlicker === "undefined" || antiFlicker !== "Off") &&
        missedFrameEnds < MAX_MISSED_FRAME_ENDS;

    if (timed) {
        waitForQuietSlot(1 + continuationCount);
        device.clearReadBuffer();
    }

    const first = new Array(REPORT_LENGTH).fill(0);

    first[0] = 0x43;
    first[1] = (0x81 + firstDataLength) & 0xFF;
    first[2] = continuationCount & 0xFF;
    first[3] = 0x10;

    for (let i = 0; i < firstDataLength; i++) {
        first[4 + i] = stream[i];
    }

    if (device.write(first, REPORT_LENGTH) === -1) {
        return false;
    }

    let offset = firstDataLength;

    while (offset < stream.length) {
        const bytesLeft = stream.length - offset;
        const chunkLength = Math.min(61, bytesLeft);
        const afterThis = bytesLeft - chunkLength;
        const reportsRemaining =
            afterThis <= 0 ? 0 : Math.ceil(afterThis / 61);

        const packet = new Array(REPORT_LENGTH).fill(0);

        packet[0] = 0x43;
        packet[1] = chunkLength & 0xFF;
        packet[2] = reportsRemaining & 0xFF;

        for (let i = 0; i < chunkLength; i++) {
            packet[3 + i] = stream[offset + i];
        }

        if (device.write(packet, REPORT_LENGTH) === -1) {
            return false;
        }

        offset += chunkLength;
    }

    if (timed) {
        trackFrameEnd();
    }

    return true;
}

// Delays a frame that would complete inside the guard zone around the busy
// task. Each packet takes ~1 ms, plus ~1 ms for the end-of-frame report.
function waitForQuietSlot(packetCount) {
    if (busyEndAt < 0) {
        return;
    }

    const completesAt = Date.now() + packetCount + 1;
    const sinceBusy =
        ((completesAt - busyEndAt) % BUSY_PERIOD_MS + BUSY_PERIOD_MS) % BUSY_PERIOD_MS;

    if (sinceBusy < BUSY_GUARD_AFTER_MS) {
        device.pause(Math.ceil(BUSY_GUARD_AFTER_MS - sinceBusy));
    } else if (sinceBusy > BUSY_PERIOD_MS - BUSY_GUARD_BEFORE_MS) {
        device.pause(Math.ceil(BUSY_PERIOD_MS - sinceBusy + BUSY_GUARD_AFTER_MS));
    }
}

// Reads the per-packet acknowledgements (0xE5) and the end-of-frame report
// (0x81). A late end-of-frame report marks the moment the busy task finished.
function trackFrameEnd() {
    const deadline = Date.now() + 20;
    let lastAckAt = -1;

    // At most 4 acknowledgements plus the end-of-frame report per frame.
    for (let reads = 0; reads < 12 && Date.now() < deadline; reads++) {
        const report = device.read([0x00], 64, 5);

        if (device.getLastReadSize() <= 0) {
            continue;
        }

        if (report[1] === 0xE5) {
            lastAckAt = Date.now();
        } else if (report[1] === 0x81) {
            const endAt = Date.now();

            if (lastAckAt >= 0 && endAt - lastAckAt >= LATE_END_MS) {
                busyEndAt = endAt;
            }

            missedFrameEnds = 0;
            return;
        }
    }

    missedFrameEnds++;

    if (missedFrameEnds === MAX_MISSED_FRAME_ENDS) {
        device.log("[NZXT] No end-of-frame reports from the keyboard; Anti-Flicker Timing disabled.");
    }
}

function sendAllBlack(force) {
    const group = {
        rgb: [0, 0, 0],
        mask: new Array(MASK_BYTES).fill(0xFF)
    };

    const stream = encodeColorGroups([group]);

    if (!force && arraysEqual(stream, lastStream)) {
        return;
    }

    if (sendStream(stream)) {
        lastStream = stream.slice();
    }
}

function writeSimple(data) {
    const packet = new Array(REPORT_LENGTH).fill(0);

    for (let i = 0; i < data.length && i < REPORT_LENGTH; i++) {
        packet[i] = data[i] & 0xFF;
    }

    return device.write(packet, REPORT_LENGTH);
}

function arraysEqual(a, b) {
    if (!a || !b || a.length !== b.length) {
        return false;
    }

    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) {
            return false;
        }
    }

    return true;
}

function clampByte(value) {
    value = Math.round(Number(value) || 0);

    if (value < 0) return 0;
    if (value > 255) return 255;

    return value;
}
