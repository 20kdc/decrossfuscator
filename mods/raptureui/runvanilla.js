/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// This code creates RaptureUI game transition substates, similar to how New Game and Load Game have substates.
// Why? Because I want to make my code less awful. - 20kdc

var rui = window["mods"]["raptureui"];

sc.GAME_MODEL_SUBSTATE["RAPTUREUI_RUNVANILLA"] = rui["allocateConstant"]();
sc.GAME_MODEL_SUBSTATE["RAPTUREUI_UNINSTALL"] = rui["allocateConstant"]();
sc.GAME_MODEL_SUBSTATE["RAPTUREUI_REFRESH"] = rui["allocateConstant"]();

sc.GameModel.inject({
 ["enterRaptureUIRunvanilla"]: function() {
  this._setSubState(sc.GAME_MODEL_SUBSTATE["RAPTUREUI_RUNVANILLA"]);
 },
 ["enterRaptureUIUninstall"]: function() {
  this._setSubState(sc.GAME_MODEL_SUBSTATE["RAPTUREUI_UNINSTALL"]);
 },
 ["enterRaptureUIRefresh"]: function() {
  this._setSubState(sc.GAME_MODEL_SUBSTATE["RAPTUREUI_REFRESH"]);
 }
});

sc.CrossCode.inject({
 transitionEnded: function () {
  if (sc.model.currentSubState == sc.GAME_MODEL_SUBSTATE["RAPTUREUI_RUNVANILLA"]) {
   rapture["runVanilla"]();
  } else if (sc.model.currentSubState == sc.GAME_MODEL_SUBSTATE["RAPTUREUI_UNINSTALL"]) {
   rapture["uninstall"]();
  } else if (sc.model.currentSubState == sc.GAME_MODEL_SUBSTATE["RAPTUREUI_REFRESH"]) {
   location.href = location.href;
  }
  this.parent();
 }
});

