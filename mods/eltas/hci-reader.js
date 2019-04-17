/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// The read tape.

var eta = window["mods"]["eltas"];

eta["TAS_INPUT_SOURCE"]["READER"] = 2;

eta["TASCore"].inject({
 "reader": null,
 "readerTimer": null,

 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasInput3")) {
   this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["READER"]);
  } else if (ig.input.pressed("emileatasInput3X")) {
   this["reader"] = null;
   this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["READER"]);
  }
  if (ig.input.pressed("emileatasFileInputSkipFrame"))
   this["advanceReader"]();
  this.parent();
 },

 "loadReader": function () {
  var fs = require("fs");
  try {
   this["reader"] = JSON.parse(fs.readFileSync("eltasBuffer.json", "utf8"));
  } catch (e) {
   return false;
  }
  if (this["reader"] instanceof Array) {
   this["reader"] = {
    "frames": this["reader"]
   };
  }
  this["readerTimer"] = 0;
  // If there's a writer, then checkpointing & messing around would upset the flow of that writer
  // If there's no writer, nothing to worry about
  if (this["writer"] == null) {
   // Check for presence of newer features, and enable them / switch to legacy behavior as required.
   if (this["reader"]["dRNG"]) {
    Math["emileatasUseDRNG"] = true;
   } else {
    Math["emileatasUseDRNG"] = false;
   }
   if (this["reader"]["mouseGui"]) {
    ig.Input["emileatasForceMouseGuiActiveAlways"] = false;
   } else {
    ig.Input["emileatasForceMouseGuiActiveAlways"] = true;
   }
   // ----
   ig.Timer["emileatasCheckpoint"]();
  }
  if (this["reader"]["frames"].length == 0)
   this["reader"] = null;
  return true;
 },

 "advanceReader": function () {
  this["readerTimer"]++;
  if (this["readerTimer"] >= this["reader"]["frames"].length) {
   this["reader"] = null;
   if (this["inputSrc"] == eta["TAS_INPUT_SOURCE"]["READER"])
    this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["DIRECT"]);
  }
 },

 "enterInputSrc": function (i) {
  // Entering READER input source? Try to load. If that fails, change mind
  if (i == eta["TAS_INPUT_SOURCE"]["READER"])
   if (this["reader"] == null)
    if (!this["loadReader"]())
     return this["enterInputSrc"](eta["TAS_INPUT_SOURCE"]["DIRECT"]);
  this.parent(i);
 },

 "executeInputSrc": function () {
  if (this["inputSrc"] == eta["TAS_INPUT_SOURCE"]["READER"]) {
   if (this["readerTimer"] < this["reader"]["frames"].length)
    this["workingMock"] = ig.copy(this["reader"]["frames"][this["readerTimer"]]);
   return;
  }
  this.parent();
 },

 "runGameFrame": function () {
  if (this["inputSrc"] == eta["TAS_INPUT_SOURCE"]["READER"])
   this["advanceReader"]();
  this.parent();
 }
});
