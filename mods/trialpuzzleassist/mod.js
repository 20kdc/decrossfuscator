/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// It's done at this 'level' in order to avoid copying the CrossCode code to call addTimer.
sc.TimersModel.inject({
 addTimer: function (a, b, c, d, e, f, g, h) {
  if (b == sc.TIMER_TYPES["COUNTDOWN"])
   c /= sc.options.get("assist-puzzle-speed");
  this.parent(a, b, c, d, e, f, g, h);
 }
});
