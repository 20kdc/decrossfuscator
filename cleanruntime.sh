#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# Expects 'root' folder as first arg, but will substitute '.' otherwise.
# Expects a CrossCode version as second arg, but defaults to target

ROOTDIR=${1:-.}
VERSION=${2:-target}
VERSIMF=$ROOTDIR/versions/$VERSION

cd $VERSIMF
cd subdir
mv -n package-backup.json package.json
cd assets
rm deobf.html
rm rapture.js
rm rapture-lexer.js
rm rapture-obf.html
rm rapture-deobf.html
