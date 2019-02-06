/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Ensures game always runs at precisely 60FPS.
ig.Timer.step = function() {
 var stepVal = 1 / 60.0;
 ig.Timer.time += stepVal * ig.Timer.timeScale;
};

// Needed for determinism.
Math.random = function () {
 return 0.5;
};

Date["simulated"] = 0;
Date.now = function () {
 return Date["simulated"];
};

/*
 * Example mock:
 *
 * {
 *  state: {jump: (1/2/3/4/5)}, // 1: Incoming. 2: Held. 3: Outgoing. 4: Frame-perfect hit/release or release/hit/release. 5: Frame-perfect release/hit or hit/release/hit.
 *  mouseX: 0,
 *  mouseY: 0
 * }
 *
 */

// This does the input filtering.
ig.Input.inject({
 "emileatasMockDetails": null,
 "emileatasOldX": null,
 "emileatasOldY": null,
 "emileatasAccept": function (m) {
  if (m != null) {
   this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
   this.mouse.x = m["mouseX"];
   this.mouse.y = m["mouseY"];
   if (this["emileatasMockDetails"] == null) {
    this["emileatasOldX"] = this.mouse.x;
    this["emileatasOldY"] = this.mouse.y;
   }
   this.mouseGuiActive = true;
  } else if (this["emileatasMockDetails"] != null) {
   this.mouse.x = this["emileatasOldX"];
   this.mouse.y = this["emileatasOldY"];
  }
  this["emileatasMockDetails"] = m;
 },
 pressed: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return (m["state"][a] == 1) || (m["state"][a] == 4);
   return false;
  }
  return this.parent(a);
 },
 keyupd: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return (m["state"][a] == 3) || (m["state"][a] == 4);
   return false;
  }
  return this.parent(a);
 },
 state: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return (m["state"][a] == 1) || (m["state"][a] == 2) || (m["state"][a] == 5);
   return false;
  }
  return this.parent(a);
 }
});
// Effectively disable gamepad support.
ig.Html5GamepadHandler.inject({
 update: function (c) {
 }
});

ig.System.inject({
 setWindowFocus: function (focusLost) {
  // Do nothing, this functionality can break things
 }
});

