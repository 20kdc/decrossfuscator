/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// LangEdit binds itself manually with no configurability, making it unaffected by some big issues with 'just registering' keys these days
// Thus registerKey does all the required work
window["mods"]["raptureui"]["registerKey"]("emileatasPlay", "TAS Play", ig.KEY.ADD);
window["mods"]["raptureui"]["registerKey"]("emileatasAdvframe", "TAS Advance Frame", ig.KEY.SUBSTRACT);
window["mods"]["raptureui"]["registerKey"]("emileatasPtcs", "TAS Play To Cutscene/End", ig.KEY.NUMPAD_9);
window["mods"]["raptureui"]["registerKey"]("emileatasPtdr", "TAS Play To Dash End/Fill", ig.KEY.NUMPAD_8);
window["mods"]["raptureui"]["registerKey"]("emileatasToggleJoy", "TAS Toggle Analog Movement", ig.KEY.NUMPAD_7);
window["mods"]["raptureui"]["registerKey"]("emileatasOverlay", "TAS Toggle Overlay", ig.KEY.NUMPAD_5);
window["mods"]["raptureui"]["registerKey"]("emileatasSpdD", "Playback Slowdown", ig.KEY.NUMPAD_4);
window["mods"]["raptureui"]["registerKey"]("emileatasSpdU", "Playback Speedup", ig.KEY.NUMPAD_6);
window["mods"]["raptureui"]["registerKey"]("emileatasInput1", "TAS True Input", ig.KEY.NUMPAD_0);
window["mods"]["raptureui"]["registerKey"]("emileatasInput2", "TAS Edited Input", ig.KEY.NUMPAD_1);
window["mods"]["raptureui"]["registerKey"]("emileatasInput3", "TAS File Input", ig.KEY.NUMPAD_2);
window["mods"]["raptureui"]["registerKey"]("emileatasInput3X", "TAS File Input (Force Reload)", ig.KEY.NUMPAD_3);
window["mods"]["raptureui"]["registerKey"]("emileatasFileInputSkipFrame", "TAS File Input Skip Frame", ig.KEY.DECIMAL);
window["mods"]["raptureui"]["registerKey"]("emileatasWriterToggle", "TAS Toggle Output (Turning off deletes buffer!!!)", ig.KEY.DIVIDE);
window["mods"]["raptureui"]["registerKey"]("emileatasWriterConfirm", "TAS Write Frames To Disk", ig.KEY.MULTIPLY);

