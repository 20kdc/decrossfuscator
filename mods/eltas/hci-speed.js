/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// This is both responsible for 'superspeed' functionality and responsible for using safe-render-off to maintain 60FPS.

var eta = window["mods"]["eltas"];

var counter = 0;

eta["TASCore"].inject({
 "superspeed": 1,
 "speedTrackingOverruns": 0,
 "speedTrackingUnderruns": 0,
 "speedTimeBreak": 0,
 "lastNow": 0,

 "run": function () {
  var rn = performance.now() - this["lastNow"];
  if ((rn > 1000) || (this["speedTimeBreak"] > 0)) {
   this["lastNow"] += rn;
   rn = 1000 / 60;
   if (this["speedTimeBreak"] > 0)
    this["speedTimeBreak"]--;
  }
  // Having a proper time accumulation system turned out to generate even more stutter. DO NOT DO THAT.
  var wantedFPS = 60 * this["superspeed"];
  var scheduled = Math.round(rn / (1000 / wantedFPS));
  // Safety limit
  for (var i = 0; i < scheduled; i++) {
   // Subframe importance checks are used to work out when to turn on/off the semi-null renderer.
   ig.system["emileatasRenderOff"] = !this["checkSubframeImportance"](i == 0, i == (scheduled - 1));
   this["lastNow"] += 1000 / wantedFPS;
   this.parent();
  }
  if (scheduled == 0)
   this["speedTrackingOverruns"]++;
  if (scheduled > 1)
   this["speedTrackingUnderruns"]++;
  ig.system["emileatasRenderOff"] = false;
 },

 "checkSubframeImportance": function (isFirst, isLast) {
  return isLast;
 },

 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasSpdD"))
   this["superspeed"] = Math.max(1, this["superspeed"] - 1);
  if (ig.input.pressed("emileatasSpdU"))
   this["superspeed"]++;
  this.parent();
 },

 "alertTimeBreak": function () {
  this.parent();
  this["speedTimeBreak"] = 60;
 }
});
