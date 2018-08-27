/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

/*
 * matcher.js format:
 * A snippet is two name lists acting as a set of pairs, and a JavaScript token stream.
 * The first name list pair is the unobfuscated names.
 * The second name list pair is the obfuscated names.
 * The token stream is generally a solid equality requirement, with the following exceptions:
 * Known obfuscated names don't have to be equal
 * An ID token that is $$ is a wildcard.
 * An ID token that starts with $$ is a wildcard unless there is a mapping known for what comes after the $$,
 *  in which case it's required.
 */

var fs = require("fs");
var lexer = require("./lexer");

function Snippet(namesU, namesO, snippetArray) {
 this.tokens = [];
 for (var i = 0; i < snippetArray.length; i++) {
  var tkns = lexer.strip(lexer.lexString(snippetArray[i]));
  for (var j = 0; j < tkns.length; j++)
   this.tokens.push(tkns[j]);
 }
 if (namesU.length != namesO.length)
  throw new Error("#namesU != #namesO on snippet.");
 this.namesU = namesU;
 this.namesO = namesO;
 this.dependencyCheck = function (map) {
  for (var i = 0; i < this.tokens.length; i++) {
   var tkn = this.tokens[i];
   if (tkn[0] == "id") {
    if (tkn[1] == "$$")
     continue;
    if (tkn[1].startsWith("$$"))
     if (!map.has(tkn[1].substring(2)))
      return false;
   }
  }
  return true;
 };
 this.calculate = function (map, worldTokens) {
  for (var i = 0; i < worldTokens.length; i++) {
   var r = snippetMatch(this.namesO, this.tokens, map, worldTokens, i);
   if (r) {
    // Write to the map, execution was AOK
    for (var j = 0; j < this.tokens.length; j++) {
     if (this.tokens[j][0] == "id") {
      var nameAssign = this.namesO.indexOf(this.tokens[j][1]);
      if (nameAssign != -1)
       map.set(this.namesU[nameAssign], worldTokens[i + j][1]);
     }
    }
    return i;
   }
  }
  return null;
 };
}

// The actual function this is all based around (also see dependencyCheck & Snippet.execute, which also depend on details made explicit here)
function snippetMatch(snippetONames, snippetTokens, map, worldTokens, idx) {
 for (var i = 0; i < snippetTokens.length; i++) {
  if (i + idx >= worldTokens.length)
   return false;
  if (snippetTokens[i][1] == "$$")
   continue; // Token is wildcard
  if (snippetTokens[i][0] != worldTokens[i + idx][0])
   return false;
  if (snippetTokens[i][0] == "id") {
   // Ok, actual important stuff
   if (snippetONames.indexOf(snippetTokens[i][1]) != -1)
    continue; // Token in snippet is obfuscated
   if (snippetTokens[i][1].startsWith("$$")) {
    var targName = snippetTokens[i][1].substring(2);
    if (map.has(targName))
     if (map.get(targName) != worldTokens[i + idx][1])
      return false;
   } else {
    if (snippetTokens[i][1] != worldTokens[i + idx][1])
     return false;
   }
  } else if (snippetTokens[i][1] != worldTokens[i + idx][1]) {
   return false; // incompatible
  }
 }
 return true;
}

function Matcher() {
 this.snippets = [];
 // used by the gcall stuff
 this.knownNames = [];
 this.deleteThese = [];
 this.importSnippet = function (nameFrag) {
  for (var i = 0; i < nameFrag[0].length; i++) {
   var str = nameFrag[0][i];
   if (this.knownNames.indexOf(str) == -1)
    this.knownNames.push(str);
  }
  this.snippets.push(new Snippet(nameFrag[0], nameFrag[1], nameFrag[2]));
 };
 this.loadProfileFile = function (profile) {
  this.loadProfile(fs.readFileSync("./matchers/" + profile + ".json", "utf8"));
 };
 this.loadProfile = function (profile) {
  profile = JSON.parse(profile);
  for (var i = 0; i < profile.includes.length; i++)
   this.loadProfileFile(profile.includes[i]);
  for (var i = 0; i < profile.snippets.length; i++)
   this.importSnippet(profile.snippets[i]);
   this.deleteThese = this.deleteThese.concat(profile.deleteThese);
 };
 // NOTE: map is optional and maps DeobfToObf
 this.execute = function (tokens, map) {
  if (map == undefined)
   map = new Map();
  var snippetsConv = [];
  for (var i = 0; i < this.snippets.length; i++)
   snippetsConv.push(this.snippets[i]);
  for (var i = 0; i < this.deleteThese.length; i++)
   map.delete(this.deleteThese[i]);
  return new MatcherResults(snippetsConv, tokens, map);
 };
}

function MatcherResults(snippetsConv, tokens, m) {
 // The actual bulk of the work happens starting now.
 // Firstly, just prepare this object
 this.sourceTokens = tokens;
 this.map = m;
 // Secondly... this.
 var snippetOrder = [];
 for (var i = 0; i < snippetsConv.length; i++)
  snippetOrder.push(i);
 while (snippetOrder.length > 0) {
  var snippetOrder2 = [];
  var didWeDoAnything = false;
  for (var i = 0; i < snippetOrder.length; i++) {
   var snippetId = snippetOrder[i];
   var snippet = snippetsConv[snippetId];
   if (snippet.dependencyCheck(this.map)) {
    // logic operator shortcircuits can be very dumb sometimes
    var c = snippet.calculate(this.map, this.sourceTokens);
    didWeDoAnything = didWeDoAnything || (c != null);
   } else {
    snippetOrder2.push(snippetId);
   }
  }
  snippetOrder = snippetOrder2;
  // If it seems to be stuck, calculate the first snippet regardless and remove it in the hope something happens.
  if (!didWeDoAnything)
   if (snippetOrder.length > 0)
    snippetsConv[snippetOrder.shift()].calculate(this.map, this.sourceTokens);
 }
 // Used by Rosebud
 this.appendSnippet = function (snippet, test) {
  var mapBk = this.map;
  if (test)
   this.map = new Map(mapBk);
  var r = snippet.calculate(this.map, this.sourceTokens);
  if (test)
   this.map = mapBk;
  return r;
 };
}

module.exports = {
 Matcher: Matcher,
 Snippet: Snippet
};
