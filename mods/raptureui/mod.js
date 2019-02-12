/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var rui = window["mods"]["raptureui"] = {};

// -- API --
rui["titleButtons"] = [];
rui["constantAllocatorNext"] = -9876;
rui["allocateConstant"] = function () {
 return rui["constantAllocatorNext"]--;
};
rui["titleButtonCallbacks"] = [];
rui["showRestartWarning"] = function () {
 sc.Dialogs.showInfoDialog("Please note that to apply these changes, you will have to restart the game.");
 rui["showRestartWarning"] = function () {};
};
rui["titleButtonGui"] = null; // Instance of sc.TitleScreenButtonGui
rui["titleLoseControl"] = function () {
 // Makes the title screen lose control for your custom UI.
 ig.bgm.pause("SLOW");
 ig.interact.removeEntry(rui["titleButtonGui"].buttonInteract);
 rui["titleButtonGui"].background.doStateTransition("DEFAULT");
};
rui["titleTakeControl"] = function () {
 // Gives the title screen control again.
 rui["titleButtonGui"].background.doStateTransition("HIDDEN");
 ig.interact.addEntry(rui["titleButtonGui"].buttonInteract);
 ig.bgm.resume("SLOW");
};
// rui["registerKey"] // keybinding.js
// The enter state functions & constants defined by runvanilla.js
// rui["TitleOverlayGui"] // title.js
// The other classes in title.js are internal to RaptureUI.
// They are public in case you *REALLY NEED* to play with them but expect issues.

rapture["include"]("runvanilla.js");
rapture["include"]("keybinding.js");
rapture["include"]("decontaminant.js");
rapture["include"]("title.js");
