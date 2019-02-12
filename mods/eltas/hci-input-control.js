/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

eta["TAS_INPUT_SOURCE"] = {
 "DIRECT": 0,
 "EDITED": 1
 // See hci-reader.js
};

eta["blankMock"] = {"state": {}, "mouseX": 0, "mouseY": 0};

eta["TASCore"].inject({
 "workingMock": null,
 "lastMock": null,

 "inputSrc": eta["TAS_INPUT_SOURCE"]["DIRECT"],

 "init": function () {
  this["workingMock"] = ig.copy(eta["blankMock"]);
  this["lastMock"] = ig.copy(eta["blankMock"]);
 },

 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasInput1"))
   this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["DIRECT"]);
  else if (ig.input.pressed("emileatasInput2"))
   this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["EDITED"]);
  this["executeInputSrc"]();
  this.parent();
 },

 "enterInputSrc": function (i) {
  this["inputSrc"] = i;
 },

 // NOTE! When defining your own input source, if it is recognized, DO NOT call this.parent in case your source performs enterInputSrc.
 // If you're *intending* to have the new input source called, you need to call executeInputSrc from the top again anyway.
 "executeInputSrc": function () {
  if (this["inputSrc"] == eta["TAS_INPUT_SOURCE"]["DIRECT"]) {
   // Real Input
   // Translate user input into mock state.
   this["workingMock"]["state"] = {};
   // Release all keys. This is then checked for...
   for (var k in this["lastMock"]["state"]) {
    var ls = this["lastMock"]["state"][k];
    if ((ls != 3) && (ls != 4))
     this["workingMock"]["state"][k] = 3;
   }
   // Here, where released keys are converted back to holds.
   for (var k in ig.input.actions) {
    if (k.startsWith("emileatas"))
     continue;
    if (ig.input.actions[k]) {
     if (k in this["workingMock"]["state"]) {
      // Hold.
      this["workingMock"]["state"][k] = 2;
     } else {
      // Press.
      this["workingMock"]["state"][k] = 1;
     }
    }
   }
   // Key was both pressed & released, so it goes into the correct state for that (4).
   for (var k in ig.input.presses) {
    if (k.startsWith("emileatas"))
     continue;
    if (ig.input.keyups[k])
     this["workingMock"]["state"][k] = 4;
   }
   this["workingMock"]["mouseX"] = ig.input.mouse.x;
   this["workingMock"]["mouseY"] = ig.input.mouse.y;
  } else if (this["inputSrc"] == eta["TAS_INPUT_SOURCE"]["EDITED"]) {
   if (ig.input.pressed("emileatasToggleJoy")) {
    // Note that this occurs before executeInputSrc.
    if (!this["workingMock"]["leftStick"]) {
     this["workingMock"]["leftStick"] = {x: 0, y: 0};
    } else {
     delete this["workingMock"]["leftStick"];
    }
   }
   var hasJoy = this["workingMock"]["leftStick"];
   if (hasJoy) {
    if (ig.input.state("left"))
     hasJoy["x"] -= 1 / 60;
    if (ig.input.state("right"))
     hasJoy["x"] += 1 / 60;
    if (ig.input.state("up"))
     hasJoy["y"] -= 1 / 60;
    if (ig.input.state("down"))
     hasJoy["y"] += 1 / 60;
    hasJoy["x"] = Math.max(Math.min(hasJoy["x"], 1), -1);
    hasJoy["y"] = Math.max(Math.min(hasJoy["y"], 1), -1);
   }
   // Perform mock editing.
   for (var k in ig.input.presses) {
    if (k.startsWith("emileatas"))
     continue;
    if (hasJoy && ((k == "up") || (k == "down") || (k == "left") || (k == "right")))
     continue;
    if (ig.input.presses[k]) {
     // Switch between the 5 different states.
     // Allows for precise control.
     if (!(k in this["workingMock"]["state"])) {
      this["workingMock"]["state"][k] = 1;
     } else if (this["workingMock"]["state"][k] == 4) {
      delete this["workingMock"]["state"][k];
     } else {
      this["workingMock"]["state"][k]++;
     }
    }
   }
   this["workingMock"]["mouseX"] = ig.input.mouse.x;
   this["workingMock"]["mouseY"] = ig.input.mouse.y;
  }
 },

 "runGameFrame": function () {
  ig.input["emileatasAccept"](this["workingMock"]);
  this["logGameFrame"](this["workingMock"]);
  this.parent();
  this["lastMock"] = this["workingMock"];
  this["workingMock"] = ig.copy(this["workingMock"]);
  ig.input["emileatasAccept"](null);
 },

 "logGameFrame": function (mock) {
 },

 "runLoading": function () {
  ig.input["emileatasAccept"](this["workingMock"]);
  this.parent();
  this["lastMock"] = ig.copy(this["workingMock"]);
  ig.input["emileatasAccept"](null);
 }
});
