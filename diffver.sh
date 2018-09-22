#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Compmap shows missing symbols.
# Expects 'root' folder as first arg, but will substitute '.' otherwise.
# Expects the 'source' CrossCode version as second arg, but defaults to steam/0.7.0
# Expects the 'target' CrossCode version as third arg, but defaults to target
# Expects a matcher library

ROOTDIR=${1:-.}
SVERSION=${2:-source}
TVERSION=${3:-target}

SJMF=$ROOTDIR/versions/$SVERSION
TJMF=$ROOTDIR/versions/$TVERSION

SJSF=$SJMF/subdir/assets/js/game.compiled.js
TJSF=$TJMF/subdir/assets/js/game.compiled.js

BASIS=$ROOTDIR/workfiles

node deobf.js $SJSF $SJMF/deobf.map deobf-diff > $BASIS/diff1.js
node deobf.js $TJSF $TJMF/deobf.map deobf-diff > $BASIS/diff2.js
js-beautify $BASIS/diff1.js > $BASIS/diff1.b.js
js-beautify $BASIS/diff2.js > $BASIS/diff2.b.js
diff -u $BASIS/diff1.b.js $BASIS/diff2.b.js > $BASIS/diff.diff
less $BASIS/diff.diff
