/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Safety measure, detects if JS uses unquoted symbols that aren't from MAP,
//  and alerts user, as a safety against if symbols in MAP include the unquoted symbol in future.
// 2:js 3:map

var fs = require("fs");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");
var rosettaGlobals = require("./lib/rosetta-global-data");

var tkns = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));

var mapping = fs.readFileSync(process.argv[3], "utf8");
mapping = mapper.loadDeobfToObf(mapping);

for (var i = 0; i < tkns.length; i++) {
 if (tkns[i][0] == "id") {
  var propKey = lexer.propKey(tkns, i);
  if (propKey) {
   if (!mapping.has(tkns[i][1])) {
    if (rosettaGlobals.primaryBlacklist.indexOf(tkns[i][1]) == -1) {
     if (rosettaGlobals.hiddenExternBlacklist.indexOf(tkns[i][1]) == -1) {
      console.log(process.argv[2] + ": " + tkns[i][1]);
     }
    }
   }
  }
 }
}

