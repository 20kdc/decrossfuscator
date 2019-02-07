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

window["mods"]["eltas"] = {};
window["mods"]["eltas"]["TASCore"] = ig.Class.extend({
 "workingMock": {"state": {}, "mouseX": 0, "mouseY": 0},
 "lastMock": {"state": {}, "mouseX": 0, "mouseY": 0},
 "timelineState": "tsPlay",
 // tsPlay / tsToCutscene / tsToCutsceneEnd / tsToDashRefill / tsToDashExhaust
 // NOTE! tsToCutsceneEnd actually ends a frame 'behind' due to weirdness; player gains control a frame 'early'.
 // Have your keys buffered.
 "inputSrc": 0,
 "writer": null,
 "reader": null,
 "readerTimer": 0,
 "hasSavedThisFrame": false,
 "overlay": true,
 "preRun": function () {
  if (ig.input.pressed("emileatasSpdD"))
   ig.system["emileatasSuperspeed"] = Math.max(1, ig.system["emileatasSuperspeed"] - 1);
  if (ig.input.pressed("emileatasSpdU"))
   ig.system["emileatasSuperspeed"]++;
  // Need to modularize this, but how?
  if (ig.input.pressed("emileatasWriterToggle")) {
   if (this["writer"] != null) {
    this["writer"] = null;
   } else {
    this["writer"] = [];
    ig.Timer["emileatasCheckpoint"]();
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

  if (ig.input.pressed("emileatasOverlay"))
   this["overlay"] = !this["overlay"];

  if (ig.input.pressed("emileatasPlay"))
   this["timelineState"] = "tsPlay";
  if (ig.input.pressed("emileatasPtcs"))
   this["timelineState"] = sc.model.isCutscene() ? "tsToCutsceneEnd" : "tsToCutscene";
  if (ig.input.pressed("emileatasPtdr")) {
   this["timelineState"] = "tsToDashRefill";
   // If told to before exhaustion, assume we're trying to exhaust dashing.
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount < ig.game.playerEntity.maxDash)
     this["timelineState"] = "tsToDashExhaust";
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

  if (this["timelineState"] == "tsToCutscene") {
   if (sc.model.isCutscene())
    this["timelineState"] = null;
  } else if (this["timelineState"] == "tsToCutsceneEnd") {
   if (!sc.model.isCutscene())
    this["timelineState"] = null;
  } else if ((this["timelineState"] == "tsToDashRefill")) {
   if (sc.model.isCutscene())
    this["timelineState"] = null;
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount == 0)
     this["timelineState"] = null;
  } else if ((this["timelineState"] == "tsToDashExhaust")) {
   // Cutscenes should interrupt as skipping them takes priority.
   if (sc.model.isCutscene())
    this["timelineState"] = null;
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount == ig.game.playerEntity.maxDash)
     this["timelineState"] = null;
  }

  if (this["timelineState"] == null) {
   if (!ig.input.pressed("emileatasAdvframe"))
    return null;
  } else {
   if (ig.input.pressed("emileatasAdvframe")) {
    this["timelineState"] = null;
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
  if (this["overlay"]) {
   var status = "";
   if (ig.game.playerEntity) {
    status += ig.game.playerEntity.state;
    status += "d";
    status += ig.game.playerEntity.maxDash - ig.game.playerEntity.dashCount;
    if (ig.game.playerEntity.charging.time >= 0) {
     status += "R" + ig.game.playerEntity.charging.time + ":";
    } else if (ig.game.playerEntity.gui.crosshair.isThrowCharged()) {
     status += "C";
    } else {
     status += "G";
    }
   } else {
    status += "O";
   }
   status += sc.model.currentState + ";" + sc.model.currentSubState;
   // -- End of game status, start TAS status --
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
  }
 },
 "loadNewStream": function () {
  var fs = require("fs");
  this["reader"] = JSON.parse(fs.readFileSync("eltasBuffer.json", "utf8"));
  this["readerTimer"] = 0;
  // If there's a writer, then checkpointing would upset the flow of that writer
  // If there's no writer, nothing to worry about
  if (this["writer"] == null)
   ig.Timer["emileatasCheckpoint"]();
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

