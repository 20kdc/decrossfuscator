/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// The write buffer.

var eta = window["mods"]["eltas"];

eta["TASCore"].inject({
 "writer": null,
 "hasSavedThisFrame": false,

 "runSingleSpeedFrame": function () {
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
  this.parent();
 },
 
 "logGameFrame": function (mock) {
  this.parent(mock);
  this["hasSavedThisFrame"] = false;
  if (this["writer"])
   this["writer"].push(mock);
 },

});
