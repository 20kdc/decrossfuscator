/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var scale = 2; // WARNING: Non-integer values will likely cause an awful mess. Don't try it.
var oldScreenW = window["IG_WIDTH"];
var oldScreenH = window["IG_HEIGHT"];
window["IG_WIDTH"] = Math.floor(window["IG_WIDTH"] * scale);
window["IG_HEIGHT"] = Math.floor(window["IG_HEIGHT"] * scale);

// There aren't *THAT* many issues to patch over -
// CrossCode devs know what they're doing in regards to how to build a UI.
// Any issues that do exist aren't their fault - they locked it to a specific screen resolution,
//  and there's no good reason for it to suddenly use any other resolution.

// Running it at alternate resolutions is frankly a really stupid idea,
//  because the game's totally not intended to be played this way and various fun will result.

// Of course, this is exactly what makes it a good target for a mod.

// A DoubledImage is an Image which adds an additional alteration step to scale it up.
// If the code will work fine when given assets that match the screen size,
//  then this is how you *get* assets that match the screen size.
// Since the devs typically write code that'll work so long as assets match the screen size,
//  since as I may have noted in other places the devs are pretty damn good at writing this stuff,
//  the code-only equivalent of just making the assets bigger works fine.
var DoubledImage = ig.Image.extend({
 cacheType: "DoubledImage",
 onload: function() {
  this.width = this.data.width;
  this.height = this.data.height;
  // The way this function works is that it resizes data from the 'original size' to that multiplied by the ig system scale.
  // There's a callback for when it's done. The only property written to by this is data,
  //  which is turned into a canvas that's exactly the real size we want it to be.
  this.resize(ig.system.scale * scale);
  // But of course, after that's set going, this happens, so for onresized & onwards, as far as they're concerned it was *always* this size.
  // Note that data has already been changed by this point. Using .data here caused some fun bugs in trying to figure out parallax stuff...
  this.width = Math.floor(this.width * scale);
  this.height = Math.floor(this.height * scale);
 }
});

// Issue 1: env-black/etc.
// This is the most critical *gameplay* issue.
// NOTE: The handling of this means stuff is being slightly delay-loaded,
// but it's a non-issue since at the time this crops up you're still trying to click past the HTML5 logo.
ig.OverlayCornerGui.inject({
 init: function (a) {
  this.parent(new DoubledImage(a.path));
 }
});

// Issue 2: Intro.
// Talking of which, there's *one image* on said intro screen that we need to deal with and
//  we *can't safely deal with* in this way because it's *immediately after loading*.
// ...Unless doing this:
var theTechBG = new DoubledImage("media/gui/tech-intro-bg.png");
// (NOTE: scaleX/scaleY centre around the centre of the image, ignoring align, which is all well and good but causes trouble here.
//  So it's probably a bad idea to even try messing around with those.)
 
// Interestingly, this symbol isn't obfuscated... I suspect the 'GUI' namespace has something to do with it.
ig.GUI["IntroScreen"].inject({
 init: function (a) {
  this.gfx["techBG"] = theTechBG;
  // Try to centre these a bit more?
  // (NOTE: absolutely DO NOT try to adjust the Radical Fish coords. It's in two parts so you can't consider it single units like
  //  the Impact and HTML5 logos are.
  // It's clearly meant to always have the same relative position to scale, and altering it is going to break things and annoy them.)
  if (this.gui["html5Logo"])
   this.gui["html5Logo"].pos.y *= scale;
  if (this.gui["impactLogo"])
   this.gui["impactLogo"].pos.y *= scale;
  this.parent(a);
 }
});

// Issue 3: All Parallaxes
// A "Parallax" in Cubic Impact is somewhat more advanced than the RPG Maker concept.
// It's *basically* a fully capable 2D animation format.
// (At most one could say it's lacking per-track interpolation types, but that's really nitpicky.).
// The uses in data/parallax/*.json serve the purpose of Picture scrolls from other games,
//  but with layers and more effort put into them.
// See note on "2D animation format".

// The Parallax runtime is essentially based entirely off of their GUI transition engine.
// Which says something about their GUI transition engine.
// (And how OP it is)
// The Parallax entries for a given graphic are converted into different GUI states for each point in the animation.

var alterInjectMove = function (kvr) {
 if (kvr["x"])
  kvr["x"] *= scale;
 if (kvr["y"])
  kvr["y"] *= scale;
};

ig.Parallax.inject({
 init: function (a) {
  this.parent(a);
 },
 onload: function (a) {
  // Double image sizes. This is the only chance to do this without causing the image to be loaded twice.
  var entries = a["entries"];
  for (var k in a["entries"]) {
   var entry = a["entries"][k];
   if (!this.gfx[entry["gfx"]])
     this.gfx[entry["gfx"]] = new DoubledImage(entry["gfx"]);
   if (entry["src"]) {
    entry["src"]["x"] *= scale;
    entry["src"]["y"] *= scale;
    entry["src"]["w"] *= scale;
    entry["src"]["h"] *= scale;
   }
   if (entry["pos"]) {
    entry["pos"]["x"] *= scale;
    entry["pos"]["y"] *= scale;
   }
  }
  // Transform!
  if (a["points"]) {
   for (var k in a["points"]) {
    a["points"][k]["x"] *= scale;
    a["points"][k]["y"] *= scale;
   }
  }
  if (a["sequence"]) {
   for (var k in a["sequence"]) {
    var kv = a["sequence"][k];
    // Debug timescale
    //if (kv["duration"])
    // kv["duration"] *= 10;
    if (kv["reset"]) {
     var kvr = kv["reset"];
     alterInjectMove(kvr);
    }
    if (kv["move"]) {
      var kvr = kv["move"];
     alterInjectMove(kvr);
    }
   }
  }
  this.parent(a);
 }
});

// Issue 4: Map "Not quite parallaxes" (heat-dng, Great Scar)
// These *aren't* Parallaxes. They're actually map layers.
// These need a very special complex set of workarounds because of several reasons:
// 1. Obviously these were NOT calibrated for the new screensize.
//    They *HAVE* to be double-sized to have even a remote chance of working properly.
// 2. redrawChunkTile presumably hasn't been used before for this particular case. At least I assume that's why it crashes.
//    The assertion seems to be along the lines of (ig.system.width % tilesize) == 0 and (ig.system.height % tilesize) == 0.
//    Screwing this up WILL BREAK THE GAME. Turns out the screen width/height isn't divisible by 32. So, workarounds.
// 3. Even after 1., the scroll algorithm needs more adjustment. Unsolved.
/*
ig.MAP["Background"].inject({
 init: function (a, b) {
  if (a["distance"] && a["distance"] != 1)
   a["tilesize"] *= scale;
  this.parent(a, b);
 },
 setTileset: function(a) {
  this.parent(a);
  if (this.distance && this.distance != 1)
   this.tiles = new DoubledImage(this.tilesetName);
 },
 redrawChunkTile: function (a, b, c, d, e, f, g) {
  if (this.distance && this.distance != 1) {
   d = Math.floor(d / this.tilesize) * this.tilesize;
   e = Math.floor(e / this.tilesize) * this.tilesize;
   f = Math.floor(f / this.tilesize) * this.tilesize;
   g = Math.floor(g / this.tilesize) * this.tilesize;
   this.parent(a, b, c, d, e, f, g);
  } else {
   this.parent(a, b, c, d, e, f, g);
  }
 }
 setScreenPos: function (a, b) {
  if (this.distance && this.distance != 1) {
   // hmm
   this.parent(a, b);
  } else {
   this.parent(a, b);
  }
 }
});*/

// Issue 5: Rhombus/Button Misalignment
// The StartMenu buttons are manually positioned and thus don't align on the big triangle.
// Basically all the buttons need a nice big semi-constant offset on them, and this'll provide it:
sc.StartMenu.inject({
 _createButton: function (b, c, d, f, h) {
  var nt = this.parent(b, c, d, f, h);
  var yOffset = (ig.system.height - oldScreenH) / 2;
  nt.setPos(nt.hook.pos.x, nt.hook.pos.y + yOffset);
  return nt;
 }
});

// Issue 6: World map doesn't work properly due to being designed for a fixed screen size. Scale it up.
// Also handle some more minor details (they used the corner image again)
sc.MapWorldMap.inject({
 gfx: new DoubledImage("media/gui/world-map.png"),
 _addAreaButton: function (a, b) {
  var btn = this.parent(a, b);
  btn.setPos((b["position"]["x"] * scale) - 6, (b["position"]["y"] * scale) - 7);
  return btn;
 }
});
sc.MapAreaContainer.inject({
 background: new DoubledImage("media/gui/env-white.png")
});

// Issue 7: The "MainMenu" background pattern in general needs something done to it, or else the gradient repeats.
// This is more complicated since it'd be best to remodel the asset here,
//  but at the same time distributing a modded version is not gonna happen.
// Luckily the changes can be programmatically performed anyway.
sc.MainMenu.inject({
 init: function () {
  if (!this.constructor.PATTERN) {
   var i = ig.$new("canvas");
   i.width = 32 * scale * ig.system.scale;
   i.height = 320 * scale * ig.system.scale;
   var j = ig.system.getBufferContext(i);
   // This bit's really complex but seems to work?
   // 160 source 'scanline pairs'
   for (var y = 0; y < 160; y++) {
    // 160 * scale 'scanline pairs' in destination
    for (var y2 = 0; y2 < scale; y2++) {
     j.drawImage(this.gfx.data, 0, y * 2 * ig.system.scale, 32 * ig.system.scale, 2 * ig.system.scale, 0, ((y * 2 * scale) + (y2 * 2)) * ig.system.scale, (32 * scale) * ig.system.scale, 2 * ig.system.scale);
    }
   }
   var gfx2 = new ig.ImageCanvasWrapper(i);
   // env-white is used as a dummy here so that it doesn't crash
   var ptrn = new ig.ImagePattern("media/gui/env-white.png", 0, 0, 32 * scale, 320 * scale, ig.ImagePattern.OPT.REPEAT_X);
   ptrn.sourceImage = gfx2;
   ptrn.initBuffer();
   this.constructor.PATTERN = ptrn;
  }
  this.parent();
 }
});

// Issue 8: Only the top half of the Circuits menu works.
// This is a rather interesting one, because it's one of those issues that 'shouldn't happen'.
// But sc.CircuitTreeDetail.Node has some really odd rules about node selection.
// And by 'odd rules' I mean there's an explicit check to see if the cursor is within specific global coordinates.
// There's no good way of doing this, let's lie to the code instead...
sc.CircuitTreeDetail.Node.inject({
 isMouseOver: function () {
  var tempOld = sc.control.getMouseY;
  var tempOld2 = this.hook.screenCoords.y;
  var tempOld3 = this.coords.h;

  sc.control.getMouseY = function () {
   return tempOld.bind(sc.control)() / scale;
  };
  this.hook.screenCoords.y /= scale;
  this.coords.h /= scale;

  var res = this.parent();
  
  sc.control.getMouseY = tempOld;
  this.hook.screenCoords.y = tempOld2;
  this.coords.h = tempOld3;
  return res;
 }
});
