/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

sc.OPTIONS_DEFINITION["keys-hover"] = {
 type: "CONTROLS",
 init: {key1: ig.KEY.P},
 cat: sc.OPTION_CATEGORY.CONTROLS
};

(function () {

 var HCGameAddon = ig.GameAddon.extend({
  init: function () {
   // Ideally, a language file would be loaded here. Need to do this at some point.
   ig.lang.labels["sc"]["gui"]["menu"]["option"]["keys-hover"] = "Hovercheat";
   ig.input.bind(ig.KEY.P, "hover");
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

