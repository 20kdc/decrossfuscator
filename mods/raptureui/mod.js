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

rui["RIGameAddon"] = ig.GameAddon.extend({
 init: function() {
  this.parent("RaptureUI");
  // NOTE: Only call singleton methods like this during GameAddon init and later!
  // It's no-mans-land on singletons before then because of mods overriding them.
  ig.storage.register(this);
 },
 onStorageSave: function(a) {
  a["ALERT_TO_CC_DEVS"] = "RaptureUI in use. The game is absolutely definitely modded.";
 }
});
ig.addGameAddon(function() {
 return rui.riGameAddon = new rui.RIGameAddon();
});
ig.LANG_EDIT_SUBMIT_URL += "?modded=raptureui";

// --- MODS GUI ---
rui["showRestartWarning"] = function () {
 sc.Dialogs.showInfoDialog("Please note that to apply these changes, you will have to restart the game.");
 rui.showRestartWarning = function () {};
};
// Ok, so it's clear none of the existing GUIs fit 'big button containing long description'
//  so let's just make one up!
rui["ModButtonGui"] = sc.ButtonGui.extend({
 modId: null,
 modEnabled: false,
 init: function (modId, wantedWidth) {
  this.modId = modId;
  this.modEnabled = rapture["enabledMods"].indexOf(modId) != -1;
  this.parent(this.generateText(), wantedWidth, undefined, sc.BUTTON_TYPE.EQUIP);
  this.textChild.setMaxWidth(wantedWidth - 8);
  this.setHeight(this.textChild.hook.size.y + 8);
  this.updateFancyEnabledState();
 },
 generateText: function () {
  var enState = "\\c[2]ENABLED\\c[0]";
  if (!this.modEnabled)
   enState = "\\c[1]DISABLED\\c[0]";
  return this.modId + ": " + enState + "\n" + rapture["loadedHeaders"].get(this.modId)["description"];
 },
 onButtonPress: function () {
  if (this.modId == "raptureui") {
   sc.Dialogs.showYesNoDialog("This mod is responsible for the mod management UI - disabling it will leave you unable to enable it again.\nShould you continue, please note: Deleting rapture.json should undo your decision.", sc.DIALOG_INFO_ICON.WARNING, function (r) {
    if (r.data == 0)
     this.actuallyToggleModState();
   }.bind(this));
  } else {
   this.actuallyToggleModState();
  }
 },
 actuallyToggleModState: function () {
  if (this.modEnabled) {
   rapture["config"]["disable-" + this.modId] = true;
  } else {
   delete rapture["config"]["disable-" + this.modId];
  }
  rapture["saveConfig"]();
  this.modEnabled = !this.modEnabled;
  this.updateFancyEnabledState();
  rui.showRestartWarning();
 },
 updateFancyEnabledState: function () {
  var newNinePatch = sc.BUTTON_TYPE.EQUIP.ninepatch;
  if (!this.modEnabled) {
   newNinePatch = ig.copy(newNinePatch.tile);
   newNinePatch.offsets["default"].x += 64;
   newNinePatch = new ig.NinePatch("media/gui/buttons.png", newNinePatch);
  }
  // Have to avoid changing size
  this.textChild.setText(this.generateText());
  this.bgGui.ninepatch = newNinePatch;
 }
});
rui["ModsGui"] = ig.GuiElementBase.extend({
 "raptureuiButtons": null,
 init: function (btns) {
  this.parent();
  this.setSize(ig.system.width, ig.system.height);
  // interact/group stuff
  this.interact = new ig.ButtonInteractEntry();
  this.group = new sc.ButtonGroup();
  this.interact.pushButtonGroup(this.group);
  for (var i = 0; i < btns.length; i++) {
   this.group.addFocusGui(btns[i], i, 0);
  }
  this.raptureuiButtons = btns;
  // and now for...
  var buttonWidth = Math.floor((ig.system.width - 12) / 2);
  this.listBox = new sc.ButtonListBox(0, 0, 20, 2, 0, buttonWidth);
  var border = 4;
  this.listBox.setPos(border, 36 + border); // More magic numbers. I should stop using these, but how to replace them?
  this.listBox.setSize(ig.system.width - (border * 2), (ig.system.height - 36) - ((border * 2) + 8));
  this.listBox.setButtonGroup(this.group);
  this.addChildGui(this.listBox);
  // Ok, now add content
  for (var i = 0; i < rapture["knownMods"].length; i++) {
   var bt = new rui.ModButtonGui(rapture["knownMods"][i], buttonWidth);
   this.listBox.addButton(bt, true);
   this.group.insertFocusGui(bt, i % 2, 1 + Math.floor(i / 2));
  }
 },
 "takeControl": function () {
  this.doStateTransition("DEFAULT");
  for (var i = 0; i < this["raptureuiButtons"].length; i++) {
   this["raptureuiButtons"][i].doStateTransition("DEFAULT");
  }
  ig.interact.addEntry(this.interact);
 },
 "loseControl": function () {
  ig.interact.removeEntry(this.interact);
  this.doStateTransition("HIDDEN");
  for (var i = 0; i < this["raptureuiButtons"].length; i++) {
   this["raptureuiButtons"][i].doStateTransition("HIDDEN");
  }
 }
});
// --- TITLE SCREEN GUI ---
sc.TitleScreenButtonGui.inject({
 "raptureuiButtons": null,
 "raptureuiMods": null,
 "raptureuiFirstRun": rapture["firstRun"],
 init: function () {
  this.parent();

  // Where in the TitleScreenButtons children-array to put the buttons.
  // Can't be last because it'll get in front of stuff like changelog -
  //  stuff seems to work fine if it's first?
  // Increment after each use to keep ordering
  var insertPoint = 0;

  var bWidth = sc.BUTTON_DEFAULT_WIDTH; // ^.^;
  var bAWidth = Math.floor(bWidth / 3);
  var bBWidth = bWidth - bAWidth;
  var bOfs = 12;

  var brand = new sc.TextGui("Rapture " + rapture.version + " installed, " + rapture.enabledMods.length + " mods.", {
   font: sc.fontsystem.smallFont
  });
  brand.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  brand.setPos(bOfs, 0); // hmm.
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
  this.insertChildGui(brand, insertPoint++);

  var bMods = new sc.ButtonGui("Mods", bAWidth);
  var bVani = new sc.ButtonGui("Run Vanilla", bBWidth);
  bMods.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bMods.setPos(bOfs, bOfs);
  bVani.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bVani.setPos(bOfs + bAWidth, bOfs);
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
   ig.game.transitionEnded = rapture.runVanilla;
  }.bind(this);
  this["raptureuiButtons"] = [bMods, bVani];

  // Mods GUI hide/show is handled here for simplicity.
  // bModsBack and modsGui need to be placed at the front
  var bModsBack = new sc.ButtonGui("Back", bAWidth);
  bModsBack.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsBack.setPos(bOfs, bOfs);

  var bModsUninstall = new sc.ButtonGui("Uninstall Rapture");
  bModsUninstall.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsUninstall.setPos(bOfs + bAWidth, bOfs);

  var bModsInsp = new sc.ButtonGui("Open Inspector");
  bModsInsp.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsInsp.setPos(bOfs + bAWidth + bModsUninstall.hook.size.x, bOfs);

  var modsGuiTopButtons = [bModsBack, bModsUninstall, bModsInsp];

  // Everything from here on should treat the buttons as a group.
  // Transition Setup...
  var modsGuiTopTransition = {
   "DEFAULT": {
    state: {},
    time: 0.2,
    timeFunction: KEY_SPLINES.EASE
   },
   "HIDDEN": {
    state: {
     offsetY: -(bOfs + 24)
    },
    time: 0.2,
    timeFunction: KEY_SPLINES.LINEAR
   }
  };
  for (var i = 0; i < modsGuiTopButtons.length; i++) {
   modsGuiTopButtons[i].hook.transitions = modsGuiTopTransition;
  }

  // Mods GUI
  var modsGui = new rui.ModsGui(modsGuiTopButtons);
  modsGui.hook.transitions = {};
  modsGui.hook.transitions["DEFAULT"] = {
   state: {},
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };
  modsGui.hook.transitions["HIDDEN"] = {
   state: {
    offsetX: ig.system.width
   },
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };

  modsGui.doStateTransition("HIDDEN", true);

  // Note that 'bModsBack' must be over 'modsGui'.
  this.addChildGui(modsGui);
  for (var i = 0; i < modsGuiTopButtons.length; i++) {
   modsGuiTopButtons[i].doStateTransition("HIDDEN", true);
   this.addChildGui(modsGuiTopButtons[i]);
  }
  // Mods GUI Top Button Event Handlers
  bMods.onButtonPress = function() {
   // Get the mods panel onscreen & release control
   ig.bgm.pause("SLOW");
   ig.interact.removeEntry(this.buttonInteract);

   this.background.doStateTransition("DEFAULT");
   modsGui["takeControl"]();
  }.bind(this);
  bModsBack.onButtonPress = function() {
   // Get the mods panel offscreen & gain control
   modsGui["loseControl"]();
   this.background.doStateTransition("HIDDEN");

   ig.interact.addEntry(this.buttonInteract);
   ig.bgm.resume("SLOW");
  }.bind(this);
  bModsUninstall.onButtonPress = function() {
   sc.Dialogs.showYesNoDialog("This will delete Rapture files and try to restore the game to an unmodded state. Are you sure you want to do this?", sc.DIALOG_INFO_ICON.WARNING, function (r) {
    if (r.data == 0) {
     // Go to title screen and then out of title screen
     modsGui["loseControl"]();
     this.background.doStateTransition("HIDDEN");

     this.changelogGui.clearLogs();
     ig.game.start(sc.START_MODE.STORY, 1);
     ig.game.transitionEnded = rapture.uninstall;
    }
   }.bind(this));
  }.bind(this);
  bModsInsp.onButtonPress = function() {
   var nwWindow = require('nw.gui').Window.get();
   nwWindow.showDevTools();
   sc.Dialogs.showYesNoDialog(
    "Opened. Note that the inspector may not work in 0.9.8-8 and onwards.\n" +
    "These versions use a newer version of nw.js with debugging off, that does not support the web inspector.\n" +
    "Should a browser be opened to a page to get the older version?\n" +
    "(NOTE: On this page, see 'Downgrading NW.js')",
    sc.DIALOG_INFO_ICON.WARNING, function (r) {
    if (r.data == 0) {
     var url = "https://steamcommunity.com/games/368340/announcements/detail/2676716678827055494";
     var plat = process.platform;
     var cmd = "xdg-open"; // This *should* work on all popularish non-Windows non-Apple systems (Linux & BSDs)
     if (plat == "haiku") {
      cmd = "open";
     } else if (plat == "sunos") {
      // no, I don't have any evidence to suggest this is the command,
      //  but it's a better shot than "xdg-open" on something before xdg was really a thing
      cmd = "open";
     } else if (plat == "darwin") {
      cmd = "open";
     } else if (plat == "windows") {
      cmd = "start";
     }
     require("child_process").execFile(cmd, [url]);
     // Really just an alert() so the user can type it manually.
     alert(url + " opened with " + cmd + ". Please see 'Downgrading NW.js' on this page.");
    }
   }.bind(this));
  }.bind(this);
  // ----
  // save some trouble and let mods inject their own buttons if raptureui is in use
  // it'll mean it can be listbox'd later
  for (var i = 0; i < mods.raptureui.titleButtons.length; i++) {
   var b = new sc.ButtonGui(mods.raptureui.titleButtons[i], bWidth);
   b.onButtonPress = mods.raptureui.titleButtonCallbacks[i];
   this["raptureuiButtons"].push(b);
  }
  var bRow = 6; // EEevil
  for (var i = 0; i < this["raptureuiButtons"].length; i++) {
   var b = this["raptureuiButtons"][i];
   // for the two "main" buttons they do custom stuff
   var bCol = 0;
   if (i >= 2) {
    b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
    b.setPos(bOfs, bOfs + ((i - 1) * 28)); // I wasn't able to find the variable that they use. Somehow.
    bRow++; // Do it here so button 2 is moved down from buttons 0/1
   } else {
    bCol = i;
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
   this.buttonGroup.addFocusGui(b, bCol, bRow);
   this.insertChildGui(b, insertPoint++);
  }
  // Attach brand to this to make it do state transitions, but do it after the code that adds/positions/sets transitions for buttons,
  //  because this is not a button.
  this["raptureuiButtons"].push(brand);
 },
 hide: function(a) {
  this.parent(a);
  for (var i = 0; i < this["raptureuiButtons"].length; i++)
   this["raptureuiButtons"][i].doStateTransition("HIDDEN", a);
 },
 show: function() {
  this.parent();
  if (this["raptureuiFirstRun"]) {
   sc.Dialogs.showInfoDialog(
    "Rapture has been installed successfully.\n" +
    "You can temporarily return to vanilla by clicking Run Vanilla, or more permanently by going to the Mods panel and pressing 'Uninstall Rapture'.\n" +
    "Most mods have been left disabled. You can enable them in the Mods panel.\n" +
    "Furthermore, the Mods panel has access to the Web Inspector."
   );
   this["raptureuiFirstRun"] = false;
  }
  for (var i = 0; i < this["raptureuiButtons"].length; i++)
   this["raptureuiButtons"][i].doStateTransition("DEFAULT");
 }
});
