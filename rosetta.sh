#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

# "Rosetta Stone" approach for symbol translation.
#
# To summarize, the -min.js file is converted to an "emulation" file,
#  which should have the same AST, (apart from identifiers and occasional strings),
#  as the -compiled.js file.
#
# The "emulation" and true compiled.js files being alike except for the identifier order,
#  any identifier in one can be mapped to the other.
#
# The compiler is told to produce a mapping between the emulation and the .min.js file,
#  and this mapping in itself can be translated,
#  to a mapping between .compiled.js and .min.js - this can then be made cross-version.
#
# Expects 'root' folder as first arg, but will substitute '.' otherwise.
# Expects a CrossCode version as second arg, but defaults to steam/0.7.0 as 
#  this is the only practical version.
# Writes intermediate files and result into "workfiles/" in there.

ROOTDIR=${1:-.}
VERSION=${2:-steam/0.7.0}

GAMEJS=$ROOTDIR/versions/$VERSION/subdir/assets/js
WORKDIR=$ROOTDIR/versions/$VERSION
TOOLSDIR=$ROOTDIR/workfiles
mkdir -p $TOOLSDIR
node rosetta-prepexterns.js > $WORKDIR/rosetta-externs.js
OPTS="--js $GAMEJS/game.min.js --language_in ECMASCRIPT5_STRICT --compilation_level ADVANCED_OPTIMIZATIONS --externs $WORKDIR/rosetta-externs.js"
java -jar $TOOLSDIR/closure-compiler-20120711/build/compiler.jar --property_map_output_file $WORKDIR/rosetta-emulation.map $OPTS > $WORKDIR/rosetta-emulation.js
echo "Ignore the warnings above, everything is fine so long as no errors occurred."
node rosetta-stone.js $GAMEJS/game.compiled.js $WORKDIR/rosetta-emulation > $WORKDIR/deobf.map
