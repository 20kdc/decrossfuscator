#!/bin/sh

# decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
# Written starting in 2017 by contributors (see CREDITS.txt)
# To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
# You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.

rm -rf /tmp/rapture-package
mkdir /tmp/rapture-package
mkdir /tmp/rapture-package/assets
cp -r mods /tmp/rapture-package/
cp -r released-maps /tmp/rapture-package/
cp lib/nwjs-rapture-boot0.json /tmp/rapture-package/package.json
cp lib/rapture-boot0.html /tmp/rapture-package/assets/
cp lib/rapture.js /tmp/rapture-package/assets/
cp lib/lexer.js /tmp/rapture-package/assets/rapture-lexer.js
rm rapture-package.zip
OLDPWD=$PWD
cd /tmp/rapture-package
zip $OLDPWD/rapture-package.zip -r *
