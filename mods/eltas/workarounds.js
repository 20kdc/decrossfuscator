/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// The NPC runner code causes crashes if you're using the 0.5 randomness strategy,
//  because it expects randomness to be... well, *random*.

sc.NpcRunnerSpawner.inject({
 getRandomCharacter: function () {
  if (Math["emileatasUseDRNG"] && (Math["emileatasLockedValue"] == null))
   return this.parent();
  // Overriding Math.random won't work ; it seems the only way to make this work is true randomness...
  return this.groupData.characters[0];
 }
});

// This is important if the TAS system is on deterministic randomness.
// The sound manager throws about as many wrenches as one can find, and seems to have room for a few more, into these plans.
ig.SoundManager.inject({
 update: function () {
  Math["emileatasLockedValue"] = 0.5;
  this.parent();
  Math["emileatasLockedValue"] = null;
 },
 _updateTracks: function () {
  Math["emileatasLockedValue"] = 0.5;
  this.parent();
  Math["emileatasLockedValue"] = null;
 }
});
