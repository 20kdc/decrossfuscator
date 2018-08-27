#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Ensure you have debugCandidates on.
# This'll have enough to get you a few candidates so you can validate correctness of the worker
# This script is because the output stuff wasn't working
node forwardmap-worker.js ./versions/steam/0.7.0/subdir/assets/js/game.compiled.js 0 5000 ./versions/steam/0.7.0/deobf.map ./versions/target/subdir/assets/js/game.compiled.js ./workfiles/0.json debug
