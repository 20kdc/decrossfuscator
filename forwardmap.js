/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:oldJS 3:oldMAP 4:newJS 5:lastNewMAP 6:mode

var fs = require("fs");
var process = require("process");
var child_process = require("child_process");

var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");

// old .compiled.js
var oldTokens = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));

var realMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[5], "utf8"));

console.error("forwardmap.js: " + oldTokens.length + " tokens to chew through");

var processCount = 0;
var candidateMap = new Map();

function processCore(idx, len, st) {
 processCount++;
 console.error("Activating " + st);
 var proc = child_process.spawn(process.argv[0], ["forwardmap-worker.js", process.argv[2], idx.toString(), (idx + len).toString(), process.argv[3], process.argv[4], process.argv[5], st, process.argv[6]], {
  stdio: "inherit"
 });
 proc.on("close", function (ex) {
  if (ex != 0) {
   console.error("subprocess " + st + " may have died in an accident");
  } else {
   // Process complete, merge in the process's JSON
   mapper.candidateMapLoadAndMergeJSON(candidateMap, st);
  }
  processCount--;
  if (processCount == 0) {
   console.error("No workers remain, finalizing");
   // Emit all the things and shut down
   mapper.candidateMapMergeIntoRealMap(realMap, candidateMap);
   mapper.logDeobfToObf(realMap);
   process.exit(0);
  } else if (processCount == 1) {
   console.error("1 worker remains");
  } else {
   console.error(processCount + " workers remain");
  }
 });
};

var remainingSize = oldTokens.length;
var currentIndex = 0;
var parts = 8;
var partSize = Math.floor(oldTokens.length / parts);
if (partSize != 0) {
 for (var i = 0; i < parts - 1; i++) {
  processCore(currentIndex, partSize, "./workfiles/" + i + ".json");
  currentIndex += partSize;
  remainingSize -= partSize;
 }
}
processCore(currentIndex, remainingSize, "./workfiles/" + i + ".json");
console.error("forwardmap.js done with process startup");
