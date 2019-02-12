/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

eta["TAS_TIMELINE_STATE"]["TO_CUTSCENE"] = 3;
eta["TAS_TIMELINE_STATE"]["TO_CUTSCENE_END"] = 4;
eta["TAS_TIMELINE_STATE"]["TO_DASH_EXHAUST"] = 5;
eta["TAS_TIMELINE_STATE"]["TO_DASH_REFILL"] = 6;

eta["TASCore"].inject({
 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasPtcs"))
   this["timelineState"] = eta["TAS_TIMELINE_STATE"][sc.model.isCutscene() ? "TO_CUTSCENE_END" : "TO_CUTSCENE"];
  if (ig.input.pressed("emileatasPtdr")) {
   this["timelineState"] = eta["TAS_TIMELINE_STATE"]["TO_DASH_REFILL"];
   // If told to before exhaustion, assume we're trying to exhaust dashing.
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount < (ig.game.playerEntity.maxDash - 1))
     this["timelineState"] = eta["TAS_TIMELINE_STATE"]["TO_DASH_EXHAUST"];
  }
  if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["TO_CUTSCENE"]) {
   if (sc.model.isCutscene())
    this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
  } else if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["TO_CUTSCENE_END"]) {
   if (!sc.model.isCutscene())
    this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
  } else if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["TO_DASH_REFILL"]) {
   // Refill/exhaust checkers both also stop on cutscene
   if (sc.model.isCutscene())
    this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount == 0)
     this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
  } else if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["TO_DASH_EXHAUST"]) {
   // Refill/exhaust checkers both also stop on cutscene
   if (sc.model.isCutscene())
    this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
   if (ig.game.playerEntity)
    if (ig.game.playerEntity.dashCount >= ig.game.playerEntity.maxDash - 1)
     this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
  }
  this.parent();
 },

 "checkTimelineState": function () {
  if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["ADVANCE"]) {
   return ig.input.pressed("emileatasAdvframe");
  } else if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["ADVANCE_PRE"]) {
   return false;
  }
  return true;
 }
});
