/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

(function () {
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
 
 ig.GUI.IntroScreen.inject({
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

 // Issue 4: Map "Not quite parallaxes" (heat-dng)
 // These *aren't* Parallaxes. They're actually map layers.
 // The Impact map system this is all based on seems to be rather sensitive to *any* attempt to alter this in any way.
 // Trying to redefine tilesize *will get your bottom kicked with exceptions*.
 // The best theoretical bet is to scale the tileset *without* getting the implementer's bottom kicked,
 //  a continuation of the "just scale the assets" plan.
 // ...Somehow.
 
 ig.MAP["Background"].inject({
  init: function (a, b) {
   if (a["distance"] != 1) {
    // MAGIC HERE
   }
   this.parent(a, b);
  }
 });

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
})();
