/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Rapture structure:
// mods/teleportAnywhere/mod.json for mod ID "teleportAnywhere"
//  and mods/teleportAnywhere/mod.js
// A valid Rapture mod.js is deobfuscated.
// It doesn't return stuff anymore, mod disabling has been removed to allow simpler mod code.
// Returned stuff is ignored.
// A valid Rapture mod.json looks like this:
// {
//  "description": "A mod of some sort.",
//  "dependencies": [],
//  "disableByDefault": false
// }
// Any of these keys can be missing and will be replaced with the defaults mentioned here.

'use strict';

// -- BASE --
window.rapture = {};
var rapture = window.rapture;
rapture.prefix = ".";
console.log("window.rapture.prefix = " + rapture.prefix);
// -- CONFIG --
// disable-cat disables the mod "cat"
// config-cat is a place where mod "cat" can put configuration
rapture.config = {};
rapture.firstRun = false;
rapture.loadConfig = function () {
 var fs = require("fs");
 try {
  var rfs = fs.readFileSync(rapture.prefix + "/rapture.json", "utf8");
  if (rfs != null)
   rapture.config = JSON.parse(rfs);
 } catch (e) {
  rapture.firstRun = true;
  rapture.config = {};
 }
};
rapture.saveConfig = function () {
 var fs = require("fs");
 fs.writeFileSync(rapture.prefix + "/rapture.json", JSON.stringify(rapture.config), "utf8");
};
rapture.loadConfig();
// -- OBF --
rapture.lexer = require("./rapture-lexer");
rapture.map = new Map();
rapture.mapName = "blank.map";
rapture.reloadObf = function() {
 rapture.map = new Map();
 rapture.mapName = "blank.map";
 if (!ig.System) {
  // Only actually setup mappings if the game isn't deobfuscated
  var mapping = [];
  rapture.map = new Map();
  var checkMap = function () {
   // Can't rely on version.toOnlyNumberString because this gets called too early,
   //  but we *can* check some basic IG functions
   var databaseSym = rapture.map.get("database") || "database";
   var cacheTypeSym = rapture.map.get("cacheType") || "cacheType";
   var achievementsSym = rapture.map.get("ACHIEVEMENTS") || "ACHIEVEMENTS";
   if (ig[databaseSym])
    if (ig[databaseSym][cacheTypeSym] == "Database")
     if (ig[achievementsSym] == "data/achievements.json")
      return true;
   return false;
  };
  try {
   var fs = require("fs");
   var maps = fs.readdirSync(rapture.prefix + "/released-maps/");
   for (var i = 0; i < maps.length; i++) {
    try {
     mapping = fs.readFileSync(rapture.prefix + "/released-maps/" + maps[i], "utf8");
     mapping = rapture.lexer.strip(rapture.lexer.lexString(mapping));
     rapture.map = new Map();
     rapture.mapName = maps[i];
     for (var j = 0; j < mapping.length; j += 3) {
      if (mapping[j + 1][1] != ":")
       throw new Error("Must be : between mappings");
      rapture.map.set(mapping[j][1], mapping[j + 2][1]);
     }
     if (checkMap())
      break;
    } catch (e) {
     console.log("bad " + maps[i] + ": " + e);
    }
   }
  } catch (e) {
   console.log("no reobf: " + e);
  }
  if (!checkMap())
   alert("WARNING! RAPTURE REOBF BROKEN, BUT TRYING " + rapture.mapName + ".\r\nPlease report this issue to 20kdc#9365.");
  console.log("Rapture has decided this game is obfuscated, " + rapture.map.size + " mappings loaded");
  rapture.newModFunction = function (args, modcode) {
   modcode = rapture.lexer.lexString(modcode);
   for (var i = 0; i < modcode.length; i++) {
    if (modcode[i][0] == "id") {
     if (rapture.lexer.propKeyUnstripped(modcode, i)) {
      var deobf = modcode[i][1];
      var obf = rapture.map.get(deobf);
      if (obf != null) {
       modcode[i][1] = obf;
       // Could really be one insertion but that'd be kind of telling lies to the tokenizer.
       modcode.splice(i + 1, 0,
        ["whitespace", " "],
        ["comment", "/* " + deobf + " */"],
        ["whitespace", " "]
       );
      }
     }
    }
   }
   return new Function(args, rapture.lexer.delexString(modcode));
  };
 } else {
  console.log("Rapture has decided this game is deobfuscated (ig.System present)");
  rapture.newModFunction = function (args, modcode) {
   return new Function(args, modcode);
  };
 }
};
rapture.reloadObf();
// -- MODS --
// Mod namespace
// Inject your stuff here. For mod ID "pancake":
// mods.pancake = {};
window.mods = {};
rapture.version = "v0.3.9";
// Provides a semi-consistent order vs. loadedHeaders.keys,
//  and has a nicer API vs. a Map
rapture.knownMods = [];
// Contains mod IDs.
// NOTE: A mod can't be disabled once enabled.
rapture.enabledMods = [];
// Return values. If instanceof Function, called to try and unload
rapture.enabledModCallbacks = [];
// Maps mod ID to mod object
rapture.loadedHeaders = new Map();
rapture.loadMods = function () {
 rapture.knownMods = [];
 var fs = require("fs");
 try {
  fs.mkdirSync(rapture.prefix + "/mods");
 } catch (e) {}
 var strs = fs.readdirSync(rapture.prefix + "/mods/");
 var modsToEnable = [];
 for (var i = 0; i < strs.length; i++) {
  console.log("Rapture checking mod: " + strs[i]);
  try {
   var json = JSON.parse(fs.readFileSync(rapture.prefix + "/mods/" + strs[i] + "/mod.json", "utf8"));
   if ((typeof json.description) !== "string") {
    json.description = "A mod of some sort.";
   }
   if (!(json.dependencies instanceof Array)) {
    json.dependencies = [];
   }
   if ((typeof json.disableByDefault) !== "boolean") {
    json.disableByDefault = false;
   }
   rapture.knownMods.push(strs[i]);
   rapture.loadedHeaders.set(strs[i], json);
   if (rapture.firstRun)
    if (json.disableByDefault)
     rapture.config["disable-" + strs[i]] = true;
   if (rapture.config["disable-" + strs[i]] === true) {
    console.log(" Disabled!");
    continue;
   }
   modsToEnable.push(strs[i]);
  } catch (e) {
   console.warn(" Error! " + e);
  }
 }
 // Doing hierarchial stuff.
 // Dependencies aren't strict and circular loops are undefined behavior
 for (var pass = 0; pass < modsToEnable.length; pass++) {
  var didPushback = false;
  for (var i = 0; i < modsToEnable.length; i++) {
   var header = rapture.loadedHeaders.get(modsToEnable[i]);
   for (var dep = 0; dep < header.dependencies.length; dep++) {
    var depIdx = modsToEnable.indexOf(header.dependencies[dep]);
    if (depIdx > i) {
     didPushback = true;
     // Swap
     var a = modsToEnable[i];
     var b = modsToEnable[depIdx];
     modsToEnable[depIdx] = a;
     modsToEnable[i] = b;
     // Our index was changed so break now
     break;
    }
   }
  }
  if (!didPushback)
   break;
 }
 console.log("Rapture decided on mod load order: " + JSON.stringify(modsToEnable));
 // Dependencies sorted.
 // Disable existing mods. Note that this is in reverse,
 //  so that classes should theoretically be brought back to vanilla
 for (var i = rapture.enabledMods.length - 1; i >= 0; i--) {
  var f = rapture.enabledModCallbacks[i];
  if (f instanceof Function) {
   f("rapture.disable");
  } else {
   console.warn("Unable to disable " + rapture.enabledMods[i]);
  }
 }
 // Enable new mods...
 rapture.enabledMods = [];
 rapture.enabledModCallbacks = [];
 for (var i = 0; i < modsToEnable.length; i++) {
  const modId = modsToEnable[i];
  rapture.include = function (name) {
   // Ensure there's a '/' on the end of this even though it's against convention
   //  because you just KNOW windows users are gonna go "\\" if this isn't nipped in the bud NOW
   var modDir = rapture.prefix + "/mods/" + modId + "/";
   var mf = rapture.newModFunction(["__modid", "__moddir"], fs.readFileSync(modDir + name, "utf8"));
   return mf(modId, modDir);
  };
  var retVal = rapture.include("mod.js");
  rapture.include = null;
  rapture.enabledMods.push(modId);
  rapture.enabledModCallbacks.push(retVal);
 }
 rapture.saveConfig();
 var unit = "fathoms";
 if (modsToEnable.length == 1)
  unit = "fathom";
 console.log("Rapture has completed mod startup, " + modsToEnable.length + " " + unit + ".");
 delete rapture.loadMods;
};
// -- EXTRAS --
rapture.runVanilla = function () { location.href = "node-webkit.html"; };
rapture.uninstall = function () {
 // Uninstalling...
 var fs = require("fs");
 var json = JSON.parse(fs.readFileSync("package.json", "utf8"));
 // Most of the changes to turn boot0 into vanilla package.json were done when Rapture was installed
 json.main = "assets/node-webkit.html";
 fs.writeFileSync("package.json", JSON.stringify(json), "utf8");
 fs.unlinkSync("rapture.json");
 fs.unlinkSync("assets/rapture.js");
 fs.unlinkSync("assets/rapture-lexer.js");
 fs.unlinkSync("assets/rapture-boot0.html");
 fs.unlinkSync("assets/rapture-boot0.html.boot1.html");
 // released-maps and mods folders might actually contain important user data, so let's not
 location.href = "node-webkit.html";
};
// -- INJECT --
// Important problem here. We have to inject mods at a specific time.
// Solution?
(function () {
 var execModulesSym = rapture.map.get("_execModules") || "_execModules";
 var oldExecModules = ig[execModulesSym];
 ig[execModulesSym] = function () {
  // This is a recursive function, restore now
  ig[execModulesSym] = oldExecModules;
  oldExecModules();
  // And now do the thing
  rapture.loadMods();
 };
})();
