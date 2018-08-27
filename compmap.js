/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:old 3:new

var fs = require("fs");
var mapper = require("./lib/mapper");

var oldMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[2], "utf8"));
var newMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[3], "utf8"));

for (var p = oldMap.keys(), n = null; (n = p.next()) && !n.done;)
 if (!newMap.has(n.value))
  console.log(n.value + " missing, was " + oldMap.get(n.value));

