/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var rui = window["mods"]["raptureui"];

// --- KEYBINDING REGISTRATION ---
// This system is needed because of the conversion table they now apparently have.
var ruiKeyBinderDefaults = [];
rui["registerKey"] = function (int, eng, k) {
 ruiKeyBinderDefaults.push(function () {
  //console.log("doing the other thing");
  var sov = sc.options.values["keys-" + int];
  if (sov) {
   if (sov["key1"]) {
    ig.input.bind(sov["key1"], int);
   }
   if (sov["key2"]) {
    ig.input.bind(sov["key2"], int);
   }
  } else {
   ig.input.bind(k, int);
  }
  var useNewSystem = false;
  if ("options" in ig.lang.labels["sc"]["gui"])
   if ("controls" in ig.lang.labels["sc"]["gui"]["options"])
    if ("keys" in ig.lang.labels["sc"]["gui"]["options"]["controls"])
     useNewSystem = true;
  if (useNewSystem) {
   ig.lang.labels["sc"]["gui"]["options"]["controls"]["keys"][int] = eng;
  } else {
   ig.lang.labels["sc"]["gui"]["menu"]["option"]["keys-" + int] = eng;
  }
 });
 sc.OPTIONS_DEFINITION["keys-" + int] = {
  type: "CONTROLS",
  init: {
   "key1": k,
   "key2": undefined
  },
  cat: sc.OPTION_CATEGORY.CONTROLS,
 };
};

sc.KeyBinder.inject({
 initBindings: function () {
  this.parent();
  for (var i = 0; i < ruiKeyBinderDefaults.length; i++)
   ruiKeyBinderDefaults[i]();
 },
 // Unbinds a key from optId. May rebind it to another key.
 // 'input' is used for a Input "key".
 changeBinding: function (inputOptId, igKeyId, key2, unbind) {
  // This bit is NOT how I'd have liked this bit of code to work
  // Unfortunately they stuck the variable I'd need to access to fix this behind a closure,
  //  so nothing I can do except imitate correct behavior
  // Only, I don't really understand the logic...
  var i = sc.options.values;
  var inputOpt = i[inputOptId];
  sc.options.hasChanged = true;
  // Unbind existing key
  if (!key2) {
   ig.input.unbind(inputOpt["key1"]);
  } else if (ig.input.bindings[inputOpt["key2"]]) {
   ig.input.unbind(inputOpt["key2"]);
  }
  if (key2 && unbind) {
   // Unbind only works for key2.
   inputOpt["key2"] = undefined;
  } else {
   var inputId = inputOptId.substr(5);
   var conflict = ig.input.bindings[igKeyId];
   ig.input.bind(igKeyId, inputId);
   sc.fontsystem.changeKeyCodeIcon(inputId, igKeyId);
   if (conflict) {
    // Conflict: Swaps keys.
    var conflictOpt = i["keys-" + conflict];
    var oldKey = key2 ? inputOpt["key2"] : inputOpt["key1"];
    if (conflictOpt["key1"] == igKeyId) {
     conflictOpt["key1"] = oldKey;
    } else if (conflictOpt["key2"] == igKeyId) {
     conflictOpt["key2"] = oldKey;
    } else {
     console.log("Unable to find the binding to swap.");
    }
    ig.input.bind(oldKey, conflict);
    sc.fontsystem.changeKeyCodeIcon(conflict, oldKey);
    sc.options.dispatchKeySwappedEvent();
   }
   // Actually set the target key to the target key ID.
   if (!key2) {
    inputOpt["key1"] = igKeyId;
   } else {
    inputOpt["key2"] = igKeyId;
   }
  }
 }
});

