/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var eta = window["mods"]["eltas"];

// The overlay backup image is used to ensure the canvas always gets 'redrawn'.
// Actually redrawing the canvas would lead to determinism issues due to GUI stuff being handled at the wrong time.
var performBufferCopy = function (sourceImage, targetContext, whs) {
 targetContext.drawImage(sourceImage, 0, 0, whs.width, whs.height);
};

eta["TASCore"].inject({
 "overlay": true,
 "overlayCanvas": null,
 "overlayContext": null,
 "overlayImgSheet": null,
 "drawOverlaySprite": function (x, y, w, h) {
  if (this["overlayImgSheet"])
   ig.system.context.drawImage(this["overlayImgSheet"], x, y, w, h, 0, 0, w, h);
 },
 "init": function () {
  this["overlayCanvas"] = ig.$new("canvas");
  this["overlayCanvas"].width = ig.system.canvas.width;
  this["overlayCanvas"].height = ig.system.canvas.height;
  this["overlayContext"] = this["overlayCanvas"].getContext("2d");
  var imgSheet = ig.$new("img");
  imgSheet.src = "/" + rapture["prefix"] + "/mods/eltas/sheet.png";
  imgSheet.onload = function () {
   this["overlayImgSheet"] = imgSheet;
  }.bind(this);
  this.parent();
 },
 "runSingleSpeedFrame": function () {
  if (ig.input.pressed("emileatasOverlay"))
   this["overlay"] = !this["overlay"];
  this.parent();
  if (this["overlay"]) {
   eta["drawOverlay"]();
   // Input widgets aren't part of D.O.C.K, but need to be shown
   ig.system.context.save();
   ig.system.context.translate(this["workingMock"]["mouseX"] - 3.5, this["workingMock"]["mouseY"] - 3.5);
   this["drawOverlaySprite"](0, 0, 7, 7);
   ig.system.context.restore();
   // --
   var hasJoy = this["workingMock"]["leftStick"];
   if (hasJoy) {
    var radius = 32;

    ig.system.context.save();
    ig.system.context.translate(ig.system.width / 2, ig.system.height / 2);

    ig.system.context.save();
    ig.system.context.translate(-radius, -radius);
    ig.system.context.translate(-4, -4);
    this["drawOverlaySprite"](0, 8, 8, 8);
    ig.system.context.restore();

    ig.system.context.save();
    ig.system.context.translate(radius, -radius);
    ig.system.context.translate(-4, -4);
    this["drawOverlaySprite"](9, 8, 8, 8);
    ig.system.context.restore();

    ig.system.context.save();
    ig.system.context.translate(-radius, radius);
    ig.system.context.translate(-4, -4);
    this["drawOverlaySprite"](18, 8, 8, 8);
    ig.system.context.restore();

    ig.system.context.save();
    ig.system.context.translate(radius, radius);
    ig.system.context.translate(-4, -4);
    this["drawOverlaySprite"](0, 17, 17, 15);
    ig.system.context.restore();

    ig.system.context.save();
    ig.system.context.translate(radius * hasJoy["x"], radius * hasJoy["y"]);
    ig.system.context.translate(-3, -3);
    this["drawOverlaySprite"](26, 26, 6, 6);
    ig.system.context.restore();

    ig.system.context.restore();
   }
  }
 },
 "didNotRunGameFrame": function () {
  this.parent();
  performBufferCopy(this["overlayCanvas"], ig.system.context, ig.system);
 },
 "runGameFrame": function () {
  this.parent();
  performBufferCopy(ig.system.canvas, this["overlayContext"], this["overlayCanvas"]);
 }
});
