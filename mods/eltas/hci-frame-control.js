/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

eta["TAS_TIMELINE_STATE"] = {
 "ADVANCE": 0,
 "ADVANCE_PRE": 1,
 "PLAYING": 2
 // see hci-frame-control-additional
};

eta["TASCore"].inject({
 "timelineState": eta["TAS_TIMELINE_STATE"]["PLAYING"],

 "runSingleSpeedFrame": function () {
  if (this["timelineState"] == eta["TAS_TIMELINE_STATE"]["ADVANCE_PRE"]) {
   this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE"];
  } else if ((this["timelineState"] != eta["TAS_TIMELINE_STATE"]["ADVANCE"]) && ig.input.pressed("emileatasAdvframe")) {
   this["timelineState"] = eta["TAS_TIMELINE_STATE"]["ADVANCE_PRE"];
  }
  if (ig.input.pressed("emileatasPlay"))
   this["timelineState"] = eta["TAS_TIMELINE_STATE"]["PLAYING"];
  this.parent();
 },

 "runMaybeGameFrame": function () {
  if (this["checkTimelineState"]()) {
   this.parent();
  } else {
   this["didNotRunGameFrame"]();
  }
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
