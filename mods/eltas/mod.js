/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"] = {};

rapture["include"]("fakery.js");
rapture["include"]("workarounds.js");

eta["decodeEnum"] = function (enu, val) {
 for (var k in enu) {
  if (enu[k] == val) {
   // It's possible 'k' is obfuscated.
   return rapture.mapBack.get(k) || k;
  }
 }
 return val.toString();
};

eta["TASCore"] = ig.Class.extend({
 // -- 'run' and 'runLoading' functions are the TASCore API to Fakery. --
 // Default behavior of TASCore is to be a 'dummy'.
 // This means no input mocks are performed at all.

 // The outermost run function! This is called from ig.System to perform TAS functions.
 "run": function () {
  // This space reserved for speed control
  this["runSingleSpeedFrame"]();
 },
 "runSingleSpeedFrame": function () {
  // This space reserved for TAS always-on per-frame mechanisms that do not affect general control flow
  this["runMaybeGameFrame"]();
  // This space reserved for more of that, plus overlay
 },
 "runMaybeGameFrame": function () {
  // This space reserved for any mechanism that controls if the game actually runs (frame-advance more or less)
  this["runGameFrame"]();
 },
 "didNotRunGameFrame": function () {
  ig.input.clearPressed();
 },
 "runGameFrame": function () {
  // This space reserved for input control & confirmation handling
  ig.system["emileatasGameRun"]();
  // This space reserved for input control deactivation
 },

 // The *other* outermost run function! This is called from ig.System during the LOADING state.
 // In this case, the frame counter does not advance.
 "runLoading": function () {
  // This space reserved for input control
  ig.system["emileatasGameRun"]();
  // This space also reserved for input control
 }

});

eta["tascore"] = null;

rapture["include"]("hci-keys.js");

// Reasonable rule of thumb for these components:
// They must never break playability. Each is an individual module of
//  the TAS system that can be enabled or disabled, dependencies allowing.
rapture["include"]("hci-speed.js");
rapture["include"]("hci-frame-control.js");
rapture["include"]("hci-input-control.js");

rapture["include"]("hci-reader.js");
rapture["include"]("hci-writer.js");

rapture["include"]("hci-frame-control-additional.js");

rapture["include"]("overlay.js");
rapture["include"]("overlay-components.js");
rapture["include"]("settingsui.js");

rapture["include"]("hci-overlay.js");

