/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:new

var fs = require("fs");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");
var rosettaGlobals = require("./lib/rosetta-global-data");

var v = fs.readFileSync(process.argv[2], "utf8");
var map = mapper.loadDeobfToObf(v);
var map2 = mapper.loadObfToDeobf(v);

function checkId(str, d) {
 if (lexer.words.all.indexOf(str) != -1) {
  console.log(d + str + " is a JS keyword");
  return;
 }
 if (rosettaGlobals.obfBlacklist.indexOf(str) != -1) {
  console.log(d + str + " is on the OBF blacklist");
  return;
 }
}

for (var p = map.keys(), n = null; (n = p.next()) && !n.done;)
 checkId(n.value, "Deobf (NON-ISSUE) ");
for (var p = map2.keys(), n = null; (n = p.next()) && !n.done;)
 checkId(n.value, "Obf ");

