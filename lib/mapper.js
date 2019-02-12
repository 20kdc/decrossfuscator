/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

var fs = require("fs");

var lexer = require("./lexer");

// NOTE: This also represents the minimum interface for a map
//  usable by mapper and matcher
function T2Map(p, u) {
 this.primaryMap = p;
 this.underMap = u;
 this.has = function (key) {
  return this.primaryMap.has(key) || this.underMap.has(key);
 };
 this.get = function (key) {
  if (this.primaryMap.has(key))
   return this.primaryMap.get(key);
  return this.underMap.get(key);
 };
 this.keys = function () {
  return this.primaryMap.keys();
 };
 this.set = function (key, value) {
  this.primaryMap.set(key, value);
 };
 this.delete = function (key) {
  this.primaryMap.delete(key);
 };
}

module.exports = {
 loadObfToDeobf: function (tC) {
  tC = lexer.strip(lexer.lexString(tC));
  var mapRosettaToReal = new Map();
  for (var i = 0; i < tC.length; i += 3) {
   if (tC[i + 1][1] != ":")
    throw new Error("Must be : between mappings");
   mapRosettaToReal.set(tC[i + 2][1], tC[i][1]);
  }
  return mapRosettaToReal;
 },
 loadDeobfToObf: function (tC) {
  tC = lexer.strip(lexer.lexString(tC));
  var mapRosettaToReal = new Map();
  for (var i = 0; i < tC.length; i += 3) {
   if (tC[i + 1][1] != ":")
    throw new Error("Must be : between mappings");
   mapRosettaToReal.set(tC[i][1], tC[i + 2][1]);
  }
  return mapRosettaToReal;
 },
 logObfToDeobf: function (mapCompiledToReal) {
  // ugh! this iterator is so bad!
  for (var p = mapCompiledToReal.keys(), n = null; (n = p.next()) && !n.done;)
   console.log(mapCompiledToReal.get(n.value) + ":" + n.value);
 },
 logDeobfToObf: function (mapRealToCompiled) {
  // ugh! this iterator is so bad!
  for (var p = mapRealToCompiled.keys(), n = null; (n = p.next()) && !n.done;)
   console.log(n.value + ":" + mapRealToCompiled.get(n.value));
 },
 candidate: function (candidateMap, deobf, obf) {
  if (!candidateMap.has(deobf)) {
   candidateMap.set(deobf, [obf]);
  } else {
   candidateMap.get(deobf).push(obf);
  }
 },
 realMapToCandidateMap: function (realMap) {
  var candidateMap = new Map();
  for (var p = realMap.keys(), n = null; (n = p.next()) && !n.done;)
   candidateMap.set(n.value, [realMap.get(n.value)]);
  return candidateMap;
 },
 candidateMapMergeIntoRealMap: function (realMap, candidateMap, exclusionList) {
  var known = new Map();
  // NOTE: realMap takes precedence
  for (var p = realMap.keys(), n = null; (n = p.next()) && !n.done;)
   known.set(realMap.get(n.value), true);
  for (var p = candidateMap.keys(), n = null; (n = p.next()) && !n.done;) {
   if (realMap.has(n.value))
    continue;
   if (exclusionList.indexOf(n.value) != -1)
    continue;
   var candidateList = candidateMap.get(n.value);
   var bestCandidate = null;
   var bestCandidateScore = -1;
   for (var i = 0; i < candidateList.length; i++) {
    if (known.has(candidateList[i]))
     continue;
    var score = 0;
    for (var j = 0; j < candidateList.length; j++)
     if (candidateList[i] == candidateList[j])
      score++;
    if (score > bestCandidateScore) {
     bestCandidate = candidateList[i];
     bestCandidateScore = score;
    }
   }
   if (bestCandidate != null) {
    known.set(bestCandidate, true);
    realMap.set(n.value, bestCandidate);
   }
  }
  return realMap;
 },
 // used for parallel process save/load
 candidateMapLoadAndMergeJSON: function (candidateMap, target) {
  var obj = JSON.parse(fs.readFileSync(target, "utf8"));
  for (var n in obj)
   candidateMap.set(n.substring(1), obj[n]);
 },
 candidateMapSaveJSON: function (candidateMap, target) {
  var obj = {};
  for (var p = candidateMap.keys(), n = null; (n = p.next()) && !n.done;) {
   obj["*" + n.value] = candidateMap.get(n.value);
  }
  fs.writeFileSync(target, JSON.stringify(obj), "utf8");
 },
 T2Map: T2Map
};
