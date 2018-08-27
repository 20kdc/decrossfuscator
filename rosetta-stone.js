/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var fs = require("fs");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");

// .compiled.js
var tA = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));
// rosetta-work.js
var tB = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[3] + ".js", "utf8")));
// rosetta-work.map
var mapRosettaToReal = mapper.loadObfToDeobf(fs.readFileSync(process.argv[3] + ".map", "utf8"));

var mapRealToCompiled = new Map();

for (var i = 0; i < tA.length; i++) {
 if (tA[i][0] != tB[i][0])
  throw new Error("Incompatibilities of this kind CANNOT be accepted at this stage (Rosetta inherently works using identical ASTs)");
 if (tA[i][0] == "id") {
  if (lexer.propKey(tA, i)) {
   var idx1 = tB[i][1];
   if (mapRosettaToReal.has(idx1)) {
    var targ = mapRosettaToReal.get(idx1);
    var val = tA[i][1];
    if (mapRealToCompiled.has(targ)) {
     if (mapRealToCompiled.get(targ) != val)
      throw new Error("Inconsistency");
    } else {
     mapRealToCompiled.set(targ, val);
    }
   }
  }
 } else if (tA[i][0] == "str") {
  // This doesn't count for structural compatibility! (closcom being a pain)
 } else {
  if (tA[i][1] != tB[i][1])
   throw new Error("Incompatibilities of this kind CANNOT be accepted at this stage");
 }
}

mapper.logDeobfToObf(mapRealToCompiled);
