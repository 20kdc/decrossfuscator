/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

eta["TASCore"].inject({
 "superspeed": 1,
 "run": function () {
  for (var i = 0; i < this["superspeed"]; i++)
   this.parent();
 },
 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasSpdD"))
   this["superspeed"] = Math.max(1, this["superspeed"] - 1);
  if (ig.input.pressed("emileatasSpdU"))
   this["superspeed"]++;
  this.parent();
 }
});
