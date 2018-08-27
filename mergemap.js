/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var fs = require("fs");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");
var matcher = require("./lib/matcher");
var rosettaGlobals = require("./lib/rosetta-global-data");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");

var tokens = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));
var deobfMap = mapper.loadDeobfToObf(fs.readFileSync(process.argv[3], "utf8"));
var mainMatcher = new matcher.Matcher();
mainMatcher.loadProfileFile(process.argv[4]);
var googleMatcher = new matcher.Matcher();
googleMatcher.loadProfileFile(process.argv[5]);

googleMatcher = googleMatcher.execute(tokens);
var mainMatch = mainMatcher.execute(tokens, new mapper.T2Map(deobfMap, googleMatcher.map));

for (var i = 0; i < mainMatcher.knownNames.length; i++)
 if (!mainMatch.map.has(mainMatcher.knownNames[i]))
  console.error("matcher for " + mainMatcher.knownNames[i] + " failed...");

mapper.logDeobfToObf(mainMatch.map);
