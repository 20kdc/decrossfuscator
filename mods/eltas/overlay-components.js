/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = mods["eltas"];

eta["GAME_LEA_THROW_STATES"] = {
 "IDLE": 0,
 "THROW": 1,
 "HELD": 2
};

// Default Components; Part 1; In-Game

eta["overlayComponents"]["eltas.PlayerState"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.game.playerEntity)
   return eta["decodeEnum"](eta["GAME_LEA_THROW_STATES"], ig.game.playerEntity.state);
  return null;
 }
}))("PSt");

eta["overlayComponents"]["eltas.Dash"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.game.playerEntity)
   return (ig.game.playerEntity.maxDash - ig.game.playerEntity.dashCount).toString();
  return null;
 }
}))("Dash");

eta["overlayComponents"]["eltas.Charged"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.game.playerEntity) {
   var mock = eta["tascore"]["workingMock"];
   ig.input["emileatasAccept"](mock);
   var res = ig.game.playerEntity.gui.crosshair.isThrowCharged();
   ig.input["emileatasAccept"](null);
   if (res)
    return "";
  }
  return null;
 }
}))("VRB");

eta["overlayComponents"]["eltas.Special"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.game.playerEntity)
   if (ig.game.playerEntity.charging.time >= 0)
    return ig.game.playerEntity.charging.time.toString();
  return null;
 }
}))("Spc");

eta["overlayComponents"]["eltas.GameState"] = new (eta["OverlayComponent"].extend({
 text: function () {
  return eta["decodeEnum"](sc.GAME_MODEL_STATE, sc.model.currentState) + "," + eta["decodeEnum"](sc.GAME_MODEL_SUBSTATE, sc.model.currentSubState);
 }
}))("GSt");

// Default Components; Part 2; TAS

eta["overlayComponents"]["eltas.Reader"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (eta["tascore"]["reader"] != null)
   return eta["tascore"]["readerTimer"].toString();
  return null;
 }
}))("Rd");

eta["overlayComponents"]["eltas.Writer"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (eta["tascore"]["writer"] != null)
   return eta["tascore"]["writer"].length.toString();
  return null;
 }
}))("Wr");

eta["overlayComponents"]["eltas.Saved"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (eta["tascore"]["hasSavedThisFrame"])
   return "";
  return null;
 }
}))("Saved");

eta["overlayComponents"]["eltas.Input"] = new (eta["OverlayComponent"].extend({
 text: function () {
  return eta["decodeEnum"](eta["TAS_INPUT_SOURCE"], eta["tascore"]["inputSrc"]);
 }
}))("In");

eta["overlayComponents"]["eltas.Timeline"] = new (eta["OverlayComponent"].extend({
 text: function () {
  return eta["decodeEnum"](eta["TAS_TIMELINE_STATE"], eta["tascore"]["timelineState"]) + "@" + eta["tascore"]["superspeed"];
 }
}))("TS");

eta["overlayComponents"]["eltas.Keys"] = new (eta["OverlayComponent"].extend({
 text: function () {
  status = "";
  for (var k in eta["tascore"]["workingMock"]["state"]) {
   if (status != "")
    status += " ";
   status += k + eta["tascore"]["workingMock"]["state"][k];
  }
  if (status == "")
   return null;
  return status;
 }
}))("K");

// -- Setup default...
eta["overlayDefaultDL"].push("eltas.PlayerState");
eta["overlayDefaultDL"].push("eltas.Dash");
eta["overlayDefaultDL"].push("eltas.Charged");
eta["overlayDefaultDL"].push("eltas.Special");
eta["overlayDefaultDL"].push("eltas.GameState");

eta["overlayDefaultDL"].push("eltas.Input");
eta["overlayDefaultDL"].push("eltas.Timeline");
eta["overlayDefaultDL"].push("eltas.Saved");
eta["overlayDefaultDL"].push("eltas.Reader");
eta["overlayDefaultDL"].push("eltas.Writer");

eta["overlayDefaultDR"].push("eltas.Keys");

// Optional Components
eta["overlayComponents"]["eltas.Map"] = new (eta["OverlayComponent"].extend({
 text: function () {
  return ig.game.mapName;
 }
}))("Map");

eta["overlayComponents"]["eltas.Marker"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.game.marker) {
   return ig.game.marker;
  } else {
   return null;
  }
 }
}))("Marker");

eta["overlayComponents"]["eltas.CheckpointMap"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.storage.checkPointSave.map)
   return ig.storage.checkPointSave.map;
  return null;
 }
}))("CMap");

eta["overlayComponents"]["eltas.CheckpointMarker"] = new (eta["OverlayComponent"].extend({
 text: function () {
  if (ig.storage.checkPointSave.position)
   if (ig.storage.checkPointSave.position.marker)
    return ig.storage.checkPointSave.position.marker;
  return null;
 }
}))("CMarker");

eta["overlayComponents"]["eltas.SaveCount"] = new (eta["OverlayComponent"].extend({
 text: function () {
  var i = sc.stats.getMap("player", "saves");
  if (i == undefined)
   return null;
  return i;
 }
}))("Saves");

eta["overlayComponents"]["eltas.LineBreak"] = new (eta["OverlayComponent"].extend({
 text: function () {
  return "";
 }
}))("\n");
