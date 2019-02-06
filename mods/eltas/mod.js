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
window["mods"]["raptureui"]["registerKey"]("emileatasInput1", "TAS True Input", ig.KEY.NUMPAD_0);
window["mods"]["raptureui"]["registerKey"]("emileatasInput2", "TAS Edited Input", ig.KEY.NUMPAD_1);
window["mods"]["raptureui"]["registerKey"]("emileatasInput3", "TAS File Input", ig.KEY.NUMPAD_2);
window["mods"]["raptureui"]["registerKey"]("emileatasInput3X", "TAS File Input (Force Reload)", ig.KEY.NUMPAD_3);
window["mods"]["raptureui"]["registerKey"]("emileatasFileInputSkipFrame", "TAS File Input Skip Frame", ig.KEY.DECIMAL);
window["mods"]["raptureui"]["registerKey"]("emileatasWriterToggle", "TAS Toggle Output (Turning off deletes buffer!!!)", ig.KEY.DIVIDE);
window["mods"]["raptureui"]["registerKey"]("emileatasWriterConfirm", "TAS Write Frames To Disk", ig.KEY.MULTIPLY);

window["mods"]["eltas"] = {};
window["mods"]["eltas"]["TASCore"] = ig.Class.extend({
 "workingMock": {"state": {}, "mouseX": 0, "mouseY": 0},
 "lastMock": {"state": {}, "mouseX": 0, "mouseY": 0},
 "frameAdvance": false,
 "inputSrc": 0,
 "writer": null,
 "reader": null,
 "readerTimer": 0,
 "hasSavedThisFrame": false,
 "preRun": function () {
  // Need to modularize this, but how?
  if (ig.input.pressed("emileatasWriterToggle")) {
   if (this["writer"] != null) {
    this["writer"] = null;
   } else {
    this["writer"] = [];
   }
  }
  if (ig.input.pressed("emileatasWriterConfirm")) {
   var fs = require("fs");
   var c = JSON.stringify(this["writer"]);
   // Overwrite the read-in spool and create a backup file
   fs.writeFileSync("eltasBuffer.json", c, "utf8");
   fs.writeFileSync("eltasBuffer" + (new Date().getTime()) + ".json", c, "utf8");
   this["hasSavedThisFrame"] = true;
  }
  // --- Input Source Selection ---
  if (ig.input.pressed("emileatasInput1")) {
   this["inputSrc"] = 0;
  } else if (ig.input.pressed("emileatasInput2")) {
   this["inputSrc"] = 1;
  } else if (ig.input.pressed("emileatasInput3")) {
   this["inputSrc"] = 2;
   if (this["reader"] == null)
    this["loadNewStream"]();
  } else if (ig.input.pressed("emileatasInput3X")) {
   this["inputSrc"] = 2;
   this["loadNewStream"]();
  }
  // --- Input Source Add. Functions ---
  if (ig.input.pressed("emileatasFileInputSkipFrame") && (this["reader"] != null))
   this["advanceReader"]();
  // --- Input Source Execution ---
  if (this["inputSrc"] == 0) {
   // Real Input
   // Translate user input into mock state.
   this["workingMock"]["state"] = {};
   // Release all keys. This is then checked for...
   for (k in this["lastMock"]["state"]) {
    var ls = this["lastMock"]["state"][k];
    if ((ls != 3) && (ls != 4))
     this["workingMock"]["state"][k] = 3;
   }
   // Here, where released keys are converted back to holds.
   for (k in ig.input.actions) {
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
   for (k in ig.input.presses) {
    if (k.startsWith("emileatas"))
     continue;
    if (ig.input.keyups[k])
     this["workingMock"]["state"][k] = 4;
   }
   this["workingMock"]["mouseX"] = ig.input.mouse.x;
   this["workingMock"]["mouseY"] = ig.input.mouse.y;
  } else if (this["inputSrc"] == 1) {
   // Perform mock editing.
   for (k in ig.input.presses) {
    if (k.startsWith("emileatas"))
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
  } else if (this["inputSrc"] == 2) {
   // Get the mock from the file input buffer, so advancing splices the file into the current stream.
   // Note that a copy is used, so if the input source is changed, the read source isn't corrupted.
   // This does generate some rubbish objects, oh well...
   if (this["reader"].length > 0)
    this["workingMock"] = this["copyMock"](this["reader"][0]);
  }
  // --- Frame Control ---
  if (ig.input.pressed("emileatasPlay"))
   this["frameAdvance"] = false;
  if (this["frameAdvance"]) {
   if (!ig.input.pressed("emileatasAdvframe"))
    return null;
  } else {
   if (ig.input.pressed("emileatasAdvframe")) {
    this["frameAdvance"] = true;
    return null;
   }
  }
  // --- Input Frame Confirmation ---
  if (this["inputSrc"] == 2) {
   this["advanceReader"]();
  }
  // --- Output Frame Confirmation ---
  if (this["writer"] != null) {
   // Notably, this is ignored for actual usage; it's just a determinism debug tool.
   this["workingMock"]["tag"] = {
    "frame": this["writer"].length,
    "currentState": sc.model.currentState,
    "currentSubState": sc.model.currentSubState,
    "randomVal": Math.random(),
   };
   // --
   this["writer"].push(this["workingMock"]);
  }
  // --- Common frame confirmation code ---
  this["lastMock"] = this["workingMock"];
  this["workingMock"] = this["copyMock"](this["lastMock"]);
  this["hasSavedThisFrame"] = false; // Really applies to next frame after the run
  // NOTE BECAUSE THIS IS IMPORTANT FOR RECORDING: The mock doesn't get modified outside of this code.
  // In Output Frame Confirmation, the mock is modified to add tags.
  return this["lastMock"];
 },
 "postRun": function () {
  var status = sc.model.currentState + ";" + sc.model.currentSubState;
  if (this["reader"] != null) {
   if (this["writer"] != null) {
    status += "~" + this["readerTimer"] + "f";
   } else {
    status += "R" + this["readerTimer"] + "f";
   }
  } else {
   if (this["writer"] != null) {
    status += "W";
   } else {
    status += "I";
   }
  }
  if (this["hasSavedThisFrame"])
   status += "!";
  status += this["inputSrc"];
  for (k in this["workingMock"]["state"])
   status += k + this["workingMock"]["state"][k];

  this["drawOverlay"](status);
 },
 "loadNewStream": function () {
  var fs = require("fs");
  this["reader"] = JSON.parse(fs.readFileSync("eltasBuffer.json", "utf8"));
  this["readerTimer"] = 0;
 },
 "advanceReader": function () {
  this["reader"].shift();
  this["readerTimer"]++;
  if (this["reader"].length == 0) {
   this["reader"] = null;
   if (this["inputSrc"] == 2)
    this["inputSrc"] = 0;
  }
 },
 "copyMock": function (src) {
  var dst = {"state": {}, "mouseX": src["mouseX"], "mouseY": src["mouseY"]};
  for (k in src["state"])
   dst["state"][k] = src["state"][k];
  return dst;
 },
 "drawOverlay": function (status) {
  // Draw overlay
  var xw = ig.system.width * ig.system.scale;
  var yh = 16;
  var yx = (ig.system.height * ig.system.scale) - yh;
  ig.system.context.fillStyle = "black";
  ig.system.context.clearRect(0, yx, xw, yh);
  ig.system.context.font = "16px sans-serif";
  ig.system.context.fillStyle = "white";
  ig.system.context.fillText(status, 2, yx + 14);
  var mx = this["workingMock"]["mouseX"];
  var my = this["workingMock"]["mouseY"];
  ig.system.context.fillStyle = "black";
  ig.system.context.clearRect(mx - 1, my - 1, 3, 3);
  ig.system.context.fillStyle = "white";
  ig.system.context.clearRect(mx, my, 1, 1);
 }
});
window["mods"]["eltas"]["tascore"] = null;

rapture.include("fakery.js");

sc.CrossCode.inject({
 run: function () {
  if (ig.loading) {
   return;
  }
  // Safety measure to help ensure loads DO NOT EVER COUNT
  if (sc.model.isLoading() || sc.model.isTeleport() || sc.model.isReset() || sc.model.isLoadGame() || sc.model.isNewGame()) {
   this.parent();
   return;
  }
  var tascore = window["mods"]["eltas"]["tascore"];
  if (!tascore)
   tascore = window["mods"]["eltas"]["tascore"] = new window["mods"]["eltas"]["TASCore"]();
  var mock = tascore["preRun"]();
  if (mock != null) {
   ig.input["emileatasAccept"](mock);
   this.parent();
   ig.input["emileatasAccept"](null);
  } else {
   ig.input.clearPressed();
  }
  tascore["postRun"]();
 }
});

