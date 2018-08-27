#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Mergemap is useful for additional patches for new CrossCode versions.
# Expects 'root' folder as first arg, but will substitute '.' otherwise.
# Expects the CrossCode version as second arg, but defaults to target
# Expects the matcher library as third arg, but defaults to matchers/fixup.json

ROOTDIR=${1:-.}
VERSION=${2:-target}
MATCHERS=${3:-fixup}
IMATCHERS=${4:-google}

VERSIMF=$ROOTDIR/versions/$VERSION
VERSISF=$VERSIMF/subdir/assets/js/game.compiled.js

node mergemap.js $VERSISF $VERSIMF/deobf-forward.map $MATCHERS $IMATCHERS > $VERSIMF/deobf.map
