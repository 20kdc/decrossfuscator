/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

// The 'Overlay' is the configurable readout used by the TAS operator.

// It is made up of 'components'.
// These are specific sections the user can add and position within the overlay.
eta["OverlayComponent"] = ig.Class.extend({
 "visualId": "I just don't know what went wrong!",
 init: function (vid) {
  this["visualId"] = vid;
 },
 text: function () {
  // If this returns null, the component will disappear.
  return "NO CONTENT";
 }
});

// All registered overlay components.
eta["overlayComponents"] = {};

eta["overlayBars"] = ["UL", "UR", "DL", "DR"];

for (var i = 0; i < eta["overlayBars"].length; i++)
 eta["overlayDefault" + eta["overlayBars"][i]] = [];

var sanitize = function (s, def) {
 if (!(s instanceof Array)) {
  return ig.copy(def);
 } else {
  for (var i = 0; i < s.length; i++) {
   if ((s[i] == "prototype") || !(s[i] in eta["overlayComponents"])) {
    s.splice(i, 1);
    i--;
   }
  }
  return s;
 }
};

eta["sanitizeOverlay"] = function () {
 // Sanitize the settings related to the eltas overlay.
 for (var i = 0; i < eta["overlayBars"].length; i++) {
  var ovl = eta["overlayBars"][i];
  rapture["config"]["eltas-overlay" + ovl] = sanitize(rapture["config"]["eltas-overlay" + ovl], eta["overlayDefault" + ovl]);
 }
};

eta["resetOverlay"] = function () {
 for (var i = 0; i < eta["overlayBars"].length; i++) {
  var ovl = eta["overlayBars"][i];
  delete rapture["config"]["eltas-overlay" + ovl];
 }
 eta["sanitizeOverlay"]();
};

var calcOverlay = function (ovl) {
 var build = "";
 var skipNextFirst = true;
 for (var i = 0; i < ovl.length; i++) {
  var com = eta["overlayComponents"][ovl[i]];
  var txt = com.text();
  if (txt == null)
   continue;
  if (!skipNextFirst)
   build += " ";
  skipNextFirst = false;
  if (com["visualId"] == "") {
   build += txt;
  } else {
   if (txt == "") {
    build += com["visualId"];
    if (com["visualId"] == "\n")
     skipNextFirst = true;
   } else {
    build += com["visualId"] + ":" + txt + ";";
   }
  }
 }
 return build;
};

var drawOverlayLine = function (block, up, right) {
 var y = 0;
 if (!up)
  y = ig.system.height - block.size.y;

 var tx = 0;
 var etx = 2;
 if (right) {
  etx = tx = ig.system.width - block.size.x;
 }

 ig.system.context.fillStyle = "#000000";
 ig.system.context.fillRect(tx, y, block.size.x, block.size.y);

 ig.system.context.fillStyle = "#808080";
 ig.system.context.fillRect(tx, y + (up ? (block.size.y - 1) : 0), block.size.x, 1);
 for (var i = 0; i < block.size.y; i++) {
  var cx = tx + block.size.x + i;
  if (right)
   cx = tx - (i + 1);
  ig.system.context.fillStyle = "#000000";
  if (up) {
   ig.system.context.fillRect(cx, y, 1, block.size.y - i);
  } else {
   ig.system.context.fillRect(cx, y + i, 1, block.size.y - i);
  }
  ig.system.context.fillStyle = "#808080";
  if (up) {
   ig.system.context.fillRect(cx, y + (block.size.y - (i + 1)), 1, 1);
  } else {
   ig.system.context.fillRect(cx, y + i, 1, 1);
  }
 }
 block.draw(etx, y);
};

eta["drawOverlay"] = function () {
 // Shouldn't be needed more than once.
 eta["sanitizeOverlay"]();

 var uText = calcOverlay(rapture["config"]["eltas-overlayUL"], ";", " ");
 var dText = calcOverlay(rapture["config"]["eltas-overlayDL"], ";", " ");
 var urText = calcOverlay(rapture["config"]["eltas-overlayUR"], ";", " ");
 var drText = calcOverlay(rapture["config"]["eltas-overlayDR"], ";", " ");

 var uBlk = new ig.TextBlock(sc.fontsystem.smallFont, uText, {});
 var dBlk = new ig.TextBlock(sc.fontsystem.smallFont, dText, {});
 var urBlk = new ig.TextBlock(sc.fontsystem.smallFont, urText, {textAlign: ig.Font.ALIGN.RIGHT});
 var drBlk = new ig.TextBlock(sc.fontsystem.smallFont, drText, {textAlign: ig.Font.ALIGN.RIGHT});

 if (uText.length != 0)
  drawOverlayLine(uBlk, true, false);
 if (dText.length != 0)
  drawOverlayLine(dBlk, false, false);
 if (urText.length != 0)
  drawOverlayLine(urBlk, true, true);
 if (drText.length != 0)
  drawOverlayLine(drBlk, false, true);
};
