/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

window["mods"]["raptureui"] = {};
var rui = window["mods"]["raptureui"];
rui.titleButtons = [];
rui.titleButtonCallbacks = [];

// --- ACCIDENT PREVENTION ---
// I'm not expecting a biscuit for this, but... - 20kdc
sc.VerionChangeLog.inject({
 init: function() {
  this.parent();
 },
 toOnlyNumberString: function() {
  return this.parent() + " modded";
 }
});

rui.RIGameAddon = ig.GameAddon.extend({
 init: function() {
  this.parent("RaptureUI");
  // NOTE: Only call singleton methods like this during GameAddon init and later!
  // It's no-mans-land on singletons before then because of mods overriding them.
  ig.storage.register(this);
 },
 onStorageSave: function(a) {
  a.ALERT_TO_CC_DEVS = "RaptureUI in use. The game is absolutely definitely modded.";
 }
});
ig.addGameAddon(function() {
 return rui.riGameAddon = new rui.RIGameAddon();
});
ig.LANG_EDIT_SUBMIT_URL += "?modded=raptureui";

// --- TITLE SCREEN GUI ---
sc.TitleScreenButtonGui.inject({
 "raptureuiButtons": null,
 init: function () {
  this.parent();
  var bWidth = sc.BUTTON_DEFAULT_WIDTH; // ^.^;
  var bAWidth = Math.floor(bWidth / 3);
  var bBWidth = bWidth - bAWidth;
  var bOfs = 12;

  var brand = new sc.TextGui("Rapture Mod Loader installed", {
   font: sc.fontsystem.smallFont
  });
  brand.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  brand.setPos(bOfs + 4, 0); // hmm.
  brand.hook.transitions = {};
  brand.hook.transitions["DEFAULT"] = {
   state: {},
   time: 0.2,
   timeFunction: KEY_SPLINES.EASE
  };
  brand.hook.transitions["HIDDEN"] = {
   state: {
    offsetY: -bOfs
   },
   time: 0.2,
   timeFunction: KEY_SPLINES.LINEAR
  };
  brand.doStateTransition("HIDDEN", true);
  this.addChildGui(brand);

  var bMods = new sc.ButtonGui("Mods", bAWidth);
  var bVani = new sc.ButtonGui("Run Vanilla", bBWidth);
  bMods.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bMods.setPos(bOfs, bOfs);
  bVani.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bVani.setPos(bOfs + bAWidth, bOfs);
  this["raptureuiButtons"] = [bMods, bVani];
  bMods.onButtonPress = function() {
   // Actually show mods???
   ig.bgm.clear("MEDIUM_OUT");
   ig.interact.removeEntry(this.buttonInteract);
   ig.game.transitionTimer = 0.3;
  };
  bVani.onButtonPress = function() {
   this.changelogGui.clearLogs();
   ig.bgm.clear("MEDIUM_OUT");
   ig.interact.removeEntry(this.buttonInteract);
   // Here's how the system seems to work for new games:
   // 1. Model is told we want to start the game
   // 2. A massive notification goes out saying that we're changing state (modelChanged @ TitleScreenGui)
   // 3. All the UI goes and hides itself
   // 4. Time passes
   // 5. transitionEnded is called and starts the game
   // So in the end trying to start the game and hooking immediately has...
   //  about the same effect as actually trying to follow this system (and thus defining a new constant/etc.)
   ig.game.start(sc.START_MODE.STORY, 1);
   ig.game.transitionEnded = function () { location.href = "node-webkit.html"; };
  }.bind(this);
  // save some trouble and let mods inject their own buttons if raptureui is in use
  // it'll mean it can be listbox'd later
  for (var i = 0; i < mods.raptureui.titleButtons.length; i++) {
   var b = new sc.ButtonGui(mods.raptureui.titleButtons[i], bWidth);
   b.onButtonPress = mods.raptureui.titleButtonCallbacks[i];
   this["raptureuiButtons"].push(b);
  }
  for (var i = 0; i < this["raptureuiButtons"].length; i++) {
   var b = this["raptureuiButtons"][i];
   // for the two "main" buttons they do custom stuff
   if (i >= 2) {
    b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
    b.setPos(bOfs, bOfs + ((i - 1) * 28)); // I wasn't able to find the variable that they use. Somehow.
   }
   // This is a really cool animation framework
   //  and it's kind of a shame nobody gets to look at it
   // It explains how they wrote so much cool UI transition stuff
   // Also note the need to quote because these are in a sense strings
   b.hook.transitions = {};
   b.hook.transitions["DEFAULT"] = {
    state: {},
    time: 0.2,
    timeFunction: KEY_SPLINES.EASE
   };
   b.hook.transitions["HIDDEN"] = {
    state: {
     offsetX: -(bWidth + bOfs)
    },
    time: 0.2,
    timeFunction: KEY_SPLINES.LINEAR
   };
   b.doStateTransition("HIDDEN", true);
   this.buttonGroup.addFocusGui(b, 0, i + 6); // eeeevil
   this.addChildGui(b);
  }
  // Attach this to make it do state transitions
  this["raptureuiButtons"].push(brand);
  // Unfortunately things break if the background isn't elevated
  this.addChildGui(this.background);
  // this might be gotten rid of in v1.0
  if (sc.TitlePresetMenu)
   if (this.presetMenu instanceof sc.TitlePresetMenu)
    this.addChildGui(this.presetMenu);
 },
 hide: function(a) {
  this.parent(a);
  for (var i = 0; i < this["raptureuiButtons"].length; i++)
   this["raptureuiButtons"][i].doStateTransition("HIDDEN", a);
 },
 show: function() {
  this.parent();
  for (var i = 0; i < this["raptureuiButtons"].length; i++)
   this["raptureuiButtons"][i].doStateTransition("DEFAULT");
 }
});
