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

MODFOLDER=$PWD/mods
MAPFOLDER=$PWD/released-maps

node lineadder.js $VERSIMF/subdir/assets/node-webkit.html "game.compiled.js" "<script type='text/javascript' src='rapture.js'></script>" > $VERSIMF/subdir/assets/rapture-obf.html
# nwjs will by default assume package.json means "app takes over". Move any existing package.json but don't overwrite it in case we already did that
# Try to 'disable' the game
mv -n $VERSIMF/subdir/package.json $VERSIMF/subdir/package-backup.json
mkdir $MODFOLDER
rm $VERSIMF/mods
ln -s $MODFOLDER $VERSIMF/
rm $VERSIMF/released-maps
ln -s $MAPFOLDER $VERSIMF/

cp lib/rapture.js $VERSIMF/subdir/assets/rapture.js
cp lib/lexer.js $VERSIMF/subdir/assets/rapture-lexer.js

# Copy in the package.json *into the parent directory*, avoids damage but should work if the package.json moving-about works
cp lib/nwjs-rapture-obf.json $VERSIMF/package.json

# GOING INTO THE PARENT FOLDER

cd $VERSIMF
subdir/CrossCode .

# Try to 'enable' the game
mv -n subdir/package-backup.json subdir/package.json
