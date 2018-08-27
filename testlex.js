/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var fs = require("fs");
var lexer = require("./lib/lexer");

var text = fs.readFileSync(process.argv[2], "utf8");
var tkns = lexer.lexString(text);
for (var i = 0; i < tkns.length; i++) {
 var t = tkns[i];
 if (t[0] != "whitespace")
  console.log(t[0] + ": " + t[1]);
}
