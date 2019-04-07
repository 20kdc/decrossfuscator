/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Provides a safe way of turning as much of rendering off as possible.
// This can be used to try and provide a solid 60FPS experience on slow systems while maintaining determinism.

ig.GuiDrawable.inject({
 draw: function (a, b) {
  if (ig.system["emileatasRenderOff"])
   return;
  this.parent(a, b);
 }
});

ig.Renderer2d.inject({
 drawLayers: function (a, b) {
  if (ig.system["emileatasRenderOff"])
   return;
  this.parent(a, b);
 },
 drawEntities: function (a, b) {
  if (ig.system["emileatasRenderOff"])
   return;
  this.parent(a, b);
 }
});

ig.System.inject({
 "emileatasRenderOff": false
});
