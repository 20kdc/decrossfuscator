/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var rui = window["mods"]["raptureui"];

// Utility class for any mod that wants to add a GUI for itself.
rui["TitleOverlayGui"] = ig.GuiElementBase.extend({
 init: function (bOfs, bAWidth) {
  this.parent();
  this.setSize(ig.system.width, ig.system.height);

  // interact/group stuff
  this.interact = new ig.ButtonInteractEntry();
  this.group = new sc.ButtonGroup();
  this.interact.pushButtonGroup(this.group);

  this.hook.transitions = {};
  this.hook.transitions["DEFAULT"] = {
   state: {},
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };
  this.hook.transitions["HIDDEN"] = {
   state: {
    offsetY: ig.system.height
   },
   time: 0.5,
   timeFunction: KEY_SPLINES.EASE
  };
  this.doStateTransition("HIDDEN", true);
 },
 "takeControl": function () {
  this.doStateTransition("DEFAULT");
  ig.interact.addEntry(this.interact);
 },
 "loseControl": function () {
  ig.interact.removeEntry(this.interact);
  this.doStateTransition("HIDDEN");
 }
});

// Ok, so it's clear none of the existing GUIs fit 'big button containing long description'
//  so let's just make one up!
rui["ModButtonGui"] = sc.ButtonGui.extend({
 modId: null,
 modEnabled: false,
 init: function (modId, wantedWidth) {
  this.modId = modId;
  this.modWanted = !(rapture.config["disable-" + modId]);
  this.modWantedOrig = this.modWanted;
  this.modEnabled = rapture["enabledMods"].indexOf(modId) != -1;
  this.parent(this.generateText(), wantedWidth, undefined, sc.BUTTON_TYPE.EQUIP);
  this.textChild.setMaxWidth(wantedWidth - 8);
  this.setHeight(this.textChild.hook.size.y + 8);
  this.updateFancyEnabledState();
 },
 generateText: function () {
  var enState = "\\c[2]ENABLED\\c[0]";
  if (!this.modEnabled) {
   if (this.modWantedOrig) {
    enState = "\\c[1]FAILURE\\c[0]";
   } else if (this.modWanted) {
    enState = "\\c[4]INACTIVE\\c[0]";
   } else {
    enState = "\\c[1]DISABLED\\c[0]";
   }
  } else if (!this.modWanted) {
   enState = "\\c[3]RUNNING\\c[0]";
  }
  return this.modId + ": " + enState + "\n" + rapture["loadedHeaders"].get(this.modId)["description"];
 },
 onButtonPress: function () {
  if ((this.modId == "raptureui") && this.modWanted) {
   sc.Dialogs.showYesNoDialog("This mod is responsible for the mod management UI - disabling it will leave you unable to enable it again.\nShould you continue, please note: Deleting rapture.json should undo your decision.\nDisable RaptureUI?", sc.DIALOG_INFO_ICON.WARNING, function (r) {
    if (r.data == 0)
     this.actuallyToggleModState();
   }.bind(this));
  } else {
   var reliant = "";
   if (this.modWanted) {
    // Perform dependency check
    for (var i = 0; i < rapture["knownMods"].length; i++) {
     var mod = rapture["knownMods"][i];
     if (!(rapture.config["disable-" + mod])) {
      // This is sanitized by rapture.js
      var deps = rapture["loadedHeaders"].get(mod).dependencies;
      // NOTE: '?'-dependencies don't matter here, so there's no handling for that.
      for (var j = 0; j < deps.length; j++)
       if (deps[j] == this.modId)
        reliant += " " + mod;
     }
    }
   }
   if (reliant != "") {
    sc.Dialogs.showYesNoDialog("Other enabled mods are dependent on this mod:" + reliant + "\nAs such, it will remain effectively enabled even after a restart unless these are disabled too.\nDisable " + this.modId + "?", sc.DIALOG_INFO_ICON.WARNING, function (r) {
     if (r.data == 0)
      this.actuallyToggleModState();
    }.bind(this));
   } else {
    this.actuallyToggleModState();
   }
  }
 },
 actuallyToggleModState: function () {
  if (this.modWanted) {
   rapture["config"]["disable-" + this.modId] = true;
  } else {
   rapture["config"]["disable-" + this.modId] = false;
  }
  rapture["saveConfig"]();
  this.modWanted = !this.modWanted;
  this.updateFancyEnabledState();
  rui.showRestartWarning();
 },
 updateFancyEnabledState: function () {
  var newNinePatch = sc.BUTTON_TYPE.EQUIP.ninepatch;
  if (!this.modWanted) {
   newNinePatch = ig.copy(newNinePatch.tile);
   newNinePatch.offsets["default"].x += 64;
   newNinePatch = new ig.NinePatch("media/gui/buttons.png", newNinePatch);
  }
  // Have to avoid changing size
  this.textChild.setText(this.generateText());
  this.bgGui.ninepatch = newNinePatch;
 }
});
rui["ModsGui"] = rui["TitleOverlayGui"].extend({
 listBox: null,
 init: function (bOfs, bAWidth) {
  this.parent();

  var bModsBack = new sc.ButtonGui("Back", bAWidth);
  bModsBack.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsBack.setPos(bOfs, bOfs);

  var bModsUninstall = new sc.ButtonGui("Uninstall Rapture");
  bModsUninstall.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsUninstall.setPos(bOfs + bAWidth, bOfs);

  var bModsInsp = new sc.ButtonGui("Open Inspector");
  bModsInsp.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsInsp.setPos(bOfs + bAWidth + bModsUninstall.hook.size.x, bOfs);

  var bModsRef = new sc.ButtonGui("Restart");
  bModsRef.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bModsRef.setPos(bOfs + bAWidth + bModsUninstall.hook.size.x + bModsInsp.hook.size.x, bOfs);

  this.group.addFocusGui(bModsBack, 0, 0);
  this.addChildGui(bModsBack);
  this.group.addFocusGui(bModsUninstall, 1, 0);
  this.addChildGui(bModsUninstall);
  this.group.addFocusGui(bModsInsp, 2, 0);
  this.addChildGui(bModsInsp);
  this.group.addFocusGui(bModsRef, 3, 0);
  this.addChildGui(bModsRef);

  bModsBack.onButtonPress = function() {
   // Get the mods panel offscreen & gain control
   this["loseControl"]();
   rui["titleTakeControl"]();
  }.bind(this);

  bModsUninstall.onButtonPress = function() {
   sc.Dialogs.showYesNoDialog("This will delete Rapture files and try to restore the game to an unmodded state. Are you sure you want to do this?", sc.DIALOG_INFO_ICON.WARNING, function (r) {
    if (r.data == 0) {
     // Go to title screen and then out of title screen
     this["loseControl"]();
     rui["titleButtonGui"].background.doStateTransition("HIDDEN");
     sc.model["enterRaptureUIUninstall"]();
     sc.model.enterGame();
     ig.game.transitionTimer = 1;
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

  bModsRef.onButtonPress = function() {
   this["loseControl"]();
   rui["titleButtonGui"].background.doStateTransition("HIDDEN");
   sc.model["enterRaptureUIRefresh"]();
   sc.model.enterGame();
   ig.game.transitionTimer = 1;
  }.bind(this);

  // and now for...
  var buttonWidth = Math.floor((ig.system.width - 12) / 2);
  this.listBox = new sc.ButtonListBox(0, 0, 20, 2, 0, buttonWidth, this.interact);
  var border = 4;
  this.listBox.setPos(border, 36 + border); // More magic numbers. I should stop using these, but how to replace them?
  this.listBox.setSize(ig.system.width - (border * 2), (ig.system.height - 36) - ((border * 2) + 8));
  this.listBox.setButtonGroup(this.group);
  this.addChildGui(this.listBox);
  // Ok, now add content
  var modButtons = [];
  for (var i = 0; i < rapture["knownMods"].length; i++) {
   modButtons.push(new rui.ModButtonGui(rapture["knownMods"][i], buttonWidth));
   // Equalize height of contents of each row.
   if ((i % 2) == 1) {
    var resHeight = Math.max(modButtons[i - 1].hook.size.y, modButtons[i].hook.size.y);
    modButtons[i - 1].setHeight(resHeight);
    modButtons[i].setHeight(resHeight);
   }
  }
  for (var i = 0; i < modButtons.length; i++) {
   var bt = modButtons[i];
   this.listBox.addButton(bt, true);
   this.group.insertFocusGui(bt, i % 2, 1 + Math.floor(i / 2));
  }
 }
});
// -- The actual title screen GUI --
sc.TitleScreenButtonGui.inject({
 "raptureuiShowHide": null,
 "raptureuiMods": null,
 "raptureuiFirstRun": rapture["firstRun"],
 init: function () {
  this.parent();
  rui["titleButtonGui"] = this;

  this["raptureuiShowHide"] = [];

  // Where in the TitleScreenButtons children-array to put the buttons.
  // Can't be last because it'll get in front of stuff like changelog -
  //  stuff seems to work fine if it's first?
  // Increment after each use to keep ordering
  var insertPoint = 0;

  var bWidth = sc.BUTTON_DEFAULT_WIDTH; // ^.^;
  var bAWidth = Math.floor(bWidth / 3);
  var bBWidth = bWidth - bAWidth;
  var bOfs = 12;
  // Current vertical position. Right now this assumes the performance warning is shown.
  var bVerticalTracker = 26;

  var brand = new sc.TextGui("Rapture " + rapture["version"] + " installed, " + rapture["enabledMods"].length + " mods.", {
   font: sc.fontsystem.smallFont
  });
  brand.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  brand.setPos(bOfs, bVerticalTracker); // hmm.
  bVerticalTracker += bOfs;
  brand.hook.transitions = {};
  brand.hook.transitions["DEFAULT"] = {
   state: {},
   time: 0.2,
   timeFunction: KEY_SPLINES.EASE
  };
  brand.hook.transitions["HIDDEN"] = {
   state: {
    offsetY: -bVerticalTracker
   },
   time: 0.2,
   timeFunction: KEY_SPLINES.LINEAR
  };
  brand.doStateTransition("HIDDEN", true);
  this["raptureuiShowHide"].push(brand);
  this.insertChildGui(brand, insertPoint++);

  var bMods = new sc.ButtonGui("Mods", bAWidth);
  var bVani = new sc.ButtonGui("Run Vanilla", bBWidth);
  bMods.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bMods.setPos(bOfs, bVerticalTracker);
  bVani.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
  bVani.setPos(bOfs + bAWidth, bVerticalTracker);
  bVerticalTracker += 24;
  bVani.onButtonPress = function() {
   ig.bgm.clear("MEDIUM_OUT");
   ig.interact.removeEntry(this.buttonInteract);

   // Now that that book-keeping is done, let's actually do the thing
   sc.model["enterRaptureUIRunvanilla"]();
   sc.model.enterGame();
   ig.game.transitionTimer = 1;
  }.bind(this);

  // Get ready to setup buttons.
  var buttons = [bMods, bVani];

  // Mods GUI
  var modsGui = new rui.ModsGui(bOfs, bAWidth);

  // Mods GUI Top Button Event Handlers
  bMods.onButtonPress = function() {
   if (this.getChildGuiIndex(modsGui) == -1)
    this.addChildGui(modsGui);
   rui["titleLoseControl"]();
   modsGui["takeControl"]();
  }.bind(this);
  // ----
  // save some trouble and let mods inject their own buttons if raptureui is in use
  // it'll mean it can be listbox'd later
  for (var i = 0; i < rui["titleButtons"].length; i++) {
   var b = new sc.ButtonGui(rui["titleButtons"][i], bWidth);
   b.onButtonPress = rui["titleButtonCallbacks"][i];
   buttons.push(b);
  }
  var bRow = 6; // EEevil
  for (var i = 0; i < buttons.length; i++) {
   var b = buttons[i];
   // for the two "main" buttons they do custom stuff
   var bCol = 0;
   if (i >= 2) {
    b.setAlign(ig.GUI_ALIGN.X_LEFT, ig.GUI_ALIGN.Y_TOP);
    b.setPos(bOfs, bVerticalTracker); // I wasn't able to find the variable that they use. Somehow.
    bRow++; // Do it here so button 2 is moved down from buttons 0/1
    bVerticalTracker += 24;
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
   this["raptureuiShowHide"].push(b);
  }
 },
 hide: function(a) {
  this.parent(a);
  for (var i = 0; i < this["raptureuiShowHide"].length; i++)
   this["raptureuiShowHide"][i].doStateTransition("HIDDEN", a);
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
  for (var i = 0; i < this["raptureuiShowHide"].length; i++)
   this["raptureuiShowHide"][i].doStateTransition("DEFAULT");
 }
});
