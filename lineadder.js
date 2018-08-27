/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:filesource 3:find 4:addline

var fs = require("fs");
var src = fs.readFileSync(process.argv[2], "utf8");
var lines = src.split("\n");
for (var i = 0; i < lines.length; i++) {
 console.log(lines[i]);
 if (lines[i].indexOf(process.argv[3]) != -1)
  console.log(process.argv[4]);
}
