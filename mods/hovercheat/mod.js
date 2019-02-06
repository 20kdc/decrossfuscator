/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// LangEdit binds itself manually with no configurability, making it unaffected by some big issues with 'just registering' keys these days
window["mods"]["raptureui"]["registerKey"]("hover", "Hovercheat", ig.KEY.P);

(function () {

 var HCGameAddon = ig.GameAddon.extend({
  init: function () {
   this.parent("Hovercheat");
  },
  onPreUpdate: function () {
   if (ig.input.pressed("hover"))
    if (ig.game.playerEntity)
     ig.game.playerEntity.fly.height = (ig.game.playerEntity.fly.height || 0) + 25;
  }
 });
 ig.addGameAddon(function () {
  return new HCGameAddon();
 });

})();

