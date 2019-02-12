/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];
var rui = window["mods"]["raptureui"];

// UI used to adjust the overlay.

eta["OptionsGui"] = rui["TitleOverlayGui"].extend({
 "bBack": null,
 "bReset": null,
 "bUL": null,
 "bUR": null,
 "bDL": null,
 "bDR": null,
 "listBox1": null,
 "listBox2": null,
 "targetArray": null,
 "_lbw": 0,
 "_lbh": 0,
 
 init: function () {
  this.parent();
  // Ensures all future interactions are sane, assuming no external interference
  eta["sanitizeOverlay"]();
  this["targetArray"] = rapture["config"]["eltas-overlayDL"];

  var bWidth = sc.BUTTON_DEFAULT_WIDTH;
  var bAWidth = Math.floor(bWidth / 3);
  var bDWidth = 24;
  var bQWidth = 28;
  var border = 12;
  var x = border;

  this["bBack"] = new sc.ButtonGui("Back", bAWidth);
  this["bBack"].setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  this["bBack"].setPos(x, border); x += bAWidth + bDWidth;

  this["bReset"] = new sc.ButtonGui("Reset", bAWidth);
  this["bReset"].setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  this["bReset"].setPos(x, border); x += border;

  x = border;

  this["bDR"] = new sc.ButtonGui("DR", bQWidth);
  this["bDR"].setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
  this["bDR"].setPos(x, border); x += bQWidth;

  this["bDL"] = new sc.ButtonGui("DL", bQWidth);
  this["bDL"].setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
  this["bDL"].setPos(x, border); x += bQWidth;

  this["bUR"] = new sc.ButtonGui("UR", bQWidth);
  this["bUR"].setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
  this["bUR"].setPos(x, border); x += bQWidth;

  this["bUL"] = new sc.ButtonGui("UL", bQWidth);
  this["bUL"].setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
  this["bUL"].setPos(x, border); x += bQWidth;

  this["bBack"].onButtonPress = function() {
   // Get the panel offscreen & gain control
   this["loseControl"]();
   rui["titleTakeControl"]();
  }.bind(this);

  this["bReset"].onButtonPress = function() {
   eta["resetOverlay"]();
   this["targetArray"] = rapture["config"]["eltas-overlayDL"];
   this["refreshContent"]();
   rapture["saveConfig"]();
  }.bind(this);

  this["bDL"].onButtonPress = function() {
   this["targetArray"] = rapture["config"]["eltas-overlayDL"];
   this["refreshContent"]();
  }.bind(this);
  this["bDR"].onButtonPress = function() {
   this["targetArray"] = rapture["config"]["eltas-overlayDR"];
   this["refreshContent"]();
  }.bind(this);
  this["bUL"].onButtonPress = function() {
   this["targetArray"] = rapture["config"]["eltas-overlayUL"];
   this["refreshContent"]();
  }.bind(this);
  this["bUR"].onButtonPress = function() {
   this["targetArray"] = rapture["config"]["eltas-overlayUR"];
   this["refreshContent"]();
  }.bind(this);

  var lbw = Math.floor((ig.system.width - (border * 3)) / 2);
  var lbh = (ig.system.height - 36) - ((border * 2) + 8);
  this["_lbw"] = lbw;
  this["_lbh"] = lbh;

  this["listBox1"] = new sc.ButtonListBox(0, 0, 20, 1, 0, null, this.interact);
  this["listBox1"].setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  this["listBox1"].setPos(border, 36 + border);
  this["listBox1"].setSize(lbw, lbh);
  this["listBox1"].setButtonGroup(this.group);

  // listBox2 is kept out of view except when called upon.
  // A local interact & button group is created for the context.
  var lb2ButtonInteract = new ig.ButtonInteractEntry();
  this["listBox2"] = new sc.ButtonListBox(0, 0, 20, 1, 0, null, lb2ButtonInteract);
  lb2ButtonInteract.pushButtonGroup(this["listBox2"].buttonGroup);
  this["listBox2"].setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
  this["listBox2"].setPos(border, 36 + border);
  this["listBox2"].setSize(lbw, lbh);
  this["listBox2"].hook.transitions = {};
  this["listBox2"].hook.transitions["DEFAULT"] = {
   state: {},
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };
  this["listBox2"].hook.transitions["HIDDEN"] = {
   state: {
    offsetX: -(ig.system.width / 2)
   },
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };
  this["listBox2"].doStateTransition("HIDDEN", true);

  this.addChildGui(this["bBack"]);
  this.addChildGui(this["bReset"]);
  this.addChildGui(this["bUL"]);
  this.addChildGui(this["bUR"]);
  this.addChildGui(this["bDL"]);
  this.addChildGui(this["bDR"]);

  var brand = new sc.TextGui("Dynamic Overlay Configuration Kit v3.14159\nUnderlaying your overlay since 2019.", {
   font: sc.fontsystem.smallFont,
   textAlign: ig.Font.ALIGN.CENTER
  });
  brand.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
  brand.setPos(0, border - 2);
  this.addChildGui(brand);

  this.addChildGui(this["listBox1"]);
  this.addChildGui(this["listBox2"]);

  var bt = new sc.ButtonGui("Cancel", lbw - 4);
  bt.onButtonPress = function () {
   this["closeAdder"]();
  }.bind(this);
  this["listBox2"].addButton(bt, false);
  for (var oc in eta["overlayComponents"]) {
   const transferOc = oc;
   bt = new sc.ButtonGui(oc, lbw - 4);
   bt.onButtonPress = function () {
    this["closeAdder"]();
    this["targetArray"].push(transferOc);
    this["refreshContent"]();
    rapture["saveConfig"]();
   }.bind(this);
   this["listBox2"].addButton(bt, false);
  }

  this["refreshContent"]();
 },
 "openAdder": function () {
  this["listBox2"].doStateTransition("DEFAULT");
  ig.interact.removeEntry(this.interact);
  ig.interact.addEntry(this["listBox2"].buttonInteract);
 },
 "closeAdder": function () {
  ig.interact.removeEntry(this["listBox2"].buttonInteract);
  ig.interact.addEntry(this.interact);
  this["listBox2"].doStateTransition("HIDDEN");
 },
 "refreshContent": function () {
  this.group.clear();
  this.group.insertFocusGui(this["bBack"], 0, 0);
  this.group.insertFocusGui(this["bReset"], 1, 0);
  this.group.insertFocusGui(this["bUL"], 2, 0);
  this.group.insertFocusGui(this["bUR"], 3, 0);
  this.group.insertFocusGui(this["bDL"], 4, 0);
  this.group.insertFocusGui(this["bDR"], 5, 0);
  // Prepare listBox1
  this["listBox1"].clear();
  for (var i = 0; i < this["targetArray"].length; i++) {
   var bt = new sc.ButtonGui(this["targetArray"][i], this["_lbw"] - 4);
   const transferI = i;
   bt.onButtonPress = function () {
    this["targetArray"].splice(transferI, 1);
    this["refreshContent"]();
    rapture["saveConfig"]();
   }.bind(this);
   this["listBox1"].addButton(bt, true);
   this.group.insertFocusGui(bt, 0, i + 1);
  }
  var addButton = new sc.ButtonGui("Add...", this["_lbw"] - 4);
  addButton.onButtonPress = function () {
   this["openAdder"]();
  }.bind(this);
  this["listBox1"].addButton(addButton, true);
  this.group.insertFocusGui(addButton, 0, this["targetArray"].length + 1);
 }
});

// ---

eta["optionsGui"] = null;

rui["titleButtons"].push("ELTAS Options");
rui["titleButtonCallbacks"].push(function () {
 rui["titleLoseControl"]();
 var opts = eta["optionsGui"];
 if (opts == null) {
  opts = eta["optionsGui"] = new eta["OptionsGui"]();
  rui["titleButtonGui"].addChildGui(opts);
 }
 opts["takeControl"]();
});
