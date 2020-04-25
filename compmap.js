/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:old 3:new 4:lost-syms-profile 5:lost-syms-version

var fs = require("fs");
var mapper = require("./lib/mapper");
var matcher = require("./lib/matcher");
var lexer = require("./lib/lexer");

var rosettaGlobals = require("./lib/rosetta-global-data");

var oldMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[2], "utf8"));
var newMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[3], "utf8"));
// just to generate the warnings
mapper.loadObfToDeobf(fs.readFileSync(process.argv[2], "utf8"));
mapper.loadObfToDeobf(fs.readFileSync(process.argv[3], "utf8"));

var mainMatcher = new matcher.Matcher(process.argv[5]);
mainMatcher.loadProfileFile(process.argv[4]);

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

console.log("-- Additions --")

for (var p = newMap.keys(), n = null; (n = p.next()) && !n.done;)
 if (!oldMap.has(n.value))
  console.log(n.value + " added as " + newMap.get(n.value));

console.log("-- Errors & Subtractions --")

for (var p = newMap.keys(), n = null; (n = p.next()) && !n.done;) {
 checkId(newMap.get(n.value), "Obf for " + n.value + ": ");
 if (mainMatcher.lostSymbols.indexOf(n.value) != -1)
  console.log("Lost symbol " + n.value + " present");
}

for (var p = oldMap.keys(), n = null; (n = p.next()) && !n.done;)
 if (!newMap.has(n.value))
  if (mainMatcher.lostSymbols.indexOf(n.value) == -1)
   console.log(n.value + " missing, was " + oldMap.get(n.value));

