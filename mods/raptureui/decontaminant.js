/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var rui = window["mods"]["raptureui"];

// --- ACCIDENT PREVENTION ---

// This code is responsible for ensuring CrossCode developers are informed when a save has been run on a modified copy of the game.
// It is a sanity measure to prevent frustration on their part. - 20kdc

sc.VerionChangeLog.inject({
 toOnlyNumberString: function() {
  return this.parent() + " modded";
 }
});

var ccDeveloperAlert = "RaptureUI in use, Rapture " + rapture.version + ". This save came directly from a modded copy of the game.";
var ccDeveloperAlertLongterm = "RaptureUI was previously used as part of this save's history. If you do not see an ALERT_TO_CC_DEVS in the outer save object, then it's not modded anymore, and will likely not affect the bug."

sc.CrossCode.inject({
 getErrorData: function(data) {
  this.parent(data);
  data["ALERT_TO_CC_DEVS"] = ccDeveloperAlert;
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
  a["ALERT_TO_CC_DEVS"] = ccDeveloperAlert;
  // This is buried deeper in, and 'taints' the save
  a["vars"]["storage"]["ALERT_TO_CC_DEVS"] = ccDeveloperAlertLongterm;
 }
});
ig.addGameAddon(function() {
 return rui.riGameAddon = new rui.RIGameAddon();
});
if (ig.LANG_EDIT_SUBMIT_URL)
 ig.LANG_EDIT_SUBMIT_URL += "?modded=raptureui";

