#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Expects 'root' folder as first arg, but will substitute '.' otherwise.
# Expects a CrossCode version as second arg, but defaults to steam/0.9.8-5 (the version it was tested with)
# Will copy resulting file into your game folder in case you've modded to play deobf

ROOTDIR=${1:-.}
VERSION=${2:-target}
VERSIMF=$ROOTDIR/versions/$VERSION
VERSIJS=$VERSIMF/subdir/assets/js

echo "Please remember! In case of errors specific to the deobfuscated version, try to find a symbol that shouldn't be used where it is."
echo "Add it to lib/rosetta-global-data.js, and rerun deobf.sh"

node deobf.js $VERSIJS/game.compiled.js $VERSIMF/deobf.map deobf > $VERSIJS/game.deobf.js
js-beautify $VERSIJS/game.deobf.js > $VERSIJS/game.deobf.beauty.js
