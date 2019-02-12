/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// The write buffer.

var eta = window["mods"]["eltas"];

eta["TASCore"].inject({
 "logGameFrame": function (mock) {
  // Notably, this is ignored for actual usage; it's just a determinism debug tool.
  mock["tag"] = {
   "frame": (this["writer"]) && (this["writer"].length),
   "currentState": sc.model.currentState,
   "currentSubState": sc.model.currentSubState,
   // Actually sampling from Math.random will affect random results dependent on Tagger usage.
   // Instead this is a reading from the deterministic RNG, because if that's not in use then none of this matters.
   "randomVal": Math["emileatasRandomValue"]
  };
  this.parent(mock);
 }
});
