/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:oldJS 3:oldJS-ST 4:oldJS-ET 5:oldMap 6:newJS 7:lastNewMap 8:saveCandidatesJSON 9:mode
// ET is not inclusive, ST is

var fs = require("fs");
var lexer = require("./lib/lexer");
var mapper = require("./lib/mapper");
var matcher = require("./lib/matcher");
var rosettaGlobals = require("./lib/rosetta-global-data");

// old .compiled.js
var oldTokens = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));
var oldTokensST = parseInt(process.argv[3]);
var oldTokensET = parseInt(process.argv[4]);
// old obf->deobf map
var mapOldObfDeobf = mapper.loadObfToDeobf(fs.readFileSync(process.argv[5], "utf8"));
// new .compiled.js
var newTokens = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[6], "utf8")));
// last deobf->obf map
var mapAlreadyResolvedDO = mapper.loadDeobfToObf(fs.readFileSync(process.argv[7], "utf8"));
var candidateMapTarget = process.argv[8];
// mode
var mode = process.argv[9];

console.error("Worker " + candidateMapTarget + " : " + JSON.stringify(process.argv));

// New map deobf->array of obf candidates
var candidateMap = new Map();

var debugCandidate = false;
var leftMargin = 12;
var rightMargin = 12;
var leftSize = 32;
var rightSize = 32;
if (mode == "debug") {
 debugCandidate = true;
} else if (mode == "pass1") {
 // initial pass, try to avoid screwing up with the big 32/32 margins
} else if (mode == "pass2") {
 // secondary pass, for stuff that needs more clarification
} else if (mode == "pass3") {
 // for stuff that changed
 leftMargin = 3;
 rightMargin = 3;
 leftSize = 8;
 rightSize = 8;
} else if (mode == "pass4") {
 // for stuff that changed weirdly like EffectConfig.loadParticleData
 leftMargin = 6;
 rightMargin = 2;
 leftSize = 16;
 rightSize = 2;
} else {
 console.error("UNKNOWN MODE " + mode);
}

var matchGoogle = new matcher.Matcher();
matchGoogle.loadProfileFile("google");
var gMapOld = matchGoogle.execute(oldTokens).map;
var gOldPropCalls = [gMapOld.get("googleNewGetter"), gMapOld.get("googleNewSetter")];
var gMapNew = matchGoogle.execute(newTokens).map;
var gNewPropCalls = [gMapNew.get("googleNewGetter"), gMapNew.get("googleNewSetter")];
var GOOGLE_CALLS = matchGoogle.knownNames;
var GOOGLE_CALLS_OLD = [];
var GOOGLE_CALLS_NEW = [];
for (var i = 0; i < GOOGLE_CALLS.length; i++) {
 GOOGLE_CALLS_OLD[i] = gMapOld.get(GOOGLE_CALLS_OLD[i]) || GOOGLE_CALLS[i];
 GOOGLE_CALLS_NEW[i] = gMapNew.get(GOOGLE_CALLS_NEW[i]) || GOOGLE_CALLS[i];
}

function isReservedWord(str) {
 if (str.length > rosettaGlobals.maxValidObfLen)
  return true;
 if (lexer.words.all.indexOf(str) != -1)
  return true;
 if (rosettaGlobals.obfBlacklist.indexOf(str) != -1)
  return true;
 return false;
}

// candidate is an array:
// [a series of match check functions as an array,
//  a series of match confirm functions as an array]
// match checks take token, return false for failure
function execCandidate(candidate) {
 for (var i = 0; i <= newTokens.length - candidate[0].length; i++) {
  var isValid = true;
  for (var j = 0; j < candidate[0].length; j++) {
   if (!candidate[0][j](newTokens[i + j])) {
    isValid = false;
    break;
   }
  }
  if (!isValid)
   continue;
  var traceback = "";
  if (debugCandidate) {
   for (var j = 0; j < candidate[1].length; j++) {
    traceback += " ";
    traceback += newTokens[i + j][1];
   }
  }
  for (var j = 0; j < candidate[1].length; j++)
   candidate[1][j](newTokens[i + j], traceback);
 }
}

function createSnippet(firstTkn, lastTkn) {
 var res = [[], []];
 var isValidSnippet = false;
 var balance = 0;
 for (var i = firstTkn; i <= lastTkn; i++) {
  var score = 1;
  const tkn = oldTokens[i];
  var shouldCapture = null;
  var mustBeSame = true;
  var mustBeSameValue = tkn[1];
  if (tkn[0] == "id") {
   // 5 types of ID:
   // reserved ID, aka keyword or obfBlacklist
   // non-reserved property ID, aka something for us to deobf
   // non-reserved property known ID, aka an extra constraint to improve balance
   // non-reserved non-property ID, aka local variable
   // Google Call, aka AAAAAAAA (also has to have handling in "str")
   if (!isReservedWord(tkn[1])) {
    mustBeSame = false;
    if (lexer.propKey(oldTokens, i)) {
     if (mapOldObfDeobf.has(tkn[1])) {
      var theDeobf = mapOldObfDeobf.get(tkn[1]);
      if (mapAlreadyResolvedDO.has(theDeobf)) {
       mustBeSame = true;
       mustBeSameValue = mapAlreadyResolvedDO.get(theDeobf);
      } else {
       var inRange = false;
       if (i >= firstTkn + leftMargin)
        if (i <= lastTkn - rightMargin)
         inRange = true;
       if (inRange)
        shouldCapture = theDeobf;
      }
     }
    } else {
     var gci = GOOGLE_CALLS_OLD.indexOf(tkn[1]);
     if (gci != -1) {
      // Same reasoning as for an OBF symbol we already know how to translate
      mustBeSame = true;
      mustBeSameValue = GOOGLE_CALLS_NEW[gci];
     }
    }
   }
  } else if (tkn[0] == "str") {
   // Try to determine if we're inside a google call...
   if ((i > 1) && (i < oldTokens.length - 1)) {
    // Relatives -2, -1, 0, 1 are available
    if (oldTokens[i - 1][1] != "(") {
    } else if (oldTokens[i + 1][1] != ")") {
    } else if (gOldPropCalls.indexOf(oldTokens[i - 2][1]) != -1) {
     // This is absolutely definitely a GCall thing
     mustBeSame = false;
     var str = JSON.parse(tkn[1]);
     if (mapOldObfDeobf.has(str)) {
      str = mapOldObfDeobf.get(str);
      if (mapAlreadyResolvedDO.has(str)) {
       str = mapAlreadyResolvedDO.get(str);
       var mTokens = lexer.strip(lexer.lexString(JSON.stringify(str)));
       if (mTokens.length != 1)
        throw new Error("JSON.stringify to escape string provided too many or no tokens. Fix lexer or local JSON.stringify kthxbai.");
       mustBeSame = true;
       mustBeSameValue = lexer.delexString(mTokens);
      }
     }
    }
   }
   if (mustBeSame)
    score += 2;
  }
  if (mustBeSame) {
   balance++;
   const tknText = mustBeSameValue;
   res[0].push(function (t) {
    return tknText == t[1];
   });
  } else {
   balance -= 2;
   if (shouldCapture != null) {
    res[0].push(function (t) {
     return (t[0] == "id") && !isReservedWord(t[1]);
    });
   } else {
    res[0].push(function (t) {return true;});
   }
  }
  if (shouldCapture != null) {
   isValidSnippet = true;
   const asc = shouldCapture;
   const actScore = score;
   res[1].push(function (t, tb) {
    if (debugCandidate) {
     console.error("successful candidate " + asc + " -> " + t[1]);
     console.error(tb);
    }
    for (var ix = 0; ix < actScore; ix++)
     mapper.candidate(candidateMap, asc, t[1]);
   });
  } else {
   res[1].push(function (t, tb) {
   });
  }
 }
 if (!isValidSnippet)
  return null;
 if (balance <= 0)
  return null;
 return res;
}
function lookAround(tknIdx) {
 const tkn = oldTokens[tknIdx];
 // It has to be a valid OBF in the first place.
 if (tkn[0] != "id")
  return;
 if (!lexer.propKey(oldTokens, tknIdx))
  return;
 if (!mapOldObfDeobf.has(tkn[1]))  
  return;
 var deobf = mapOldObfDeobf.get(tkn[1]);
 if (mapAlreadyResolvedDO.has(deobf))
  return;
 var sn = createSnippet(Math.max(tknIdx - leftSize, 0), Math.min(tknIdx + rightSize, oldTokens.length - 1));
 if (sn != null)
  execCandidate(sn);
}

var perProgressUpdate = (oldTokensET - oldTokensST) / 20;
var toProgressUpdate = 0;
for (var tknIdx = oldTokensST; tknIdx < oldTokensET; tknIdx++) {
 toProgressUpdate--;
 if (toProgressUpdate <= 0) {
  console.error(candidateMapTarget + " at " + (tknIdx - oldTokensST) + "/" + (oldTokensET - oldTokensST));
  toProgressUpdate += perProgressUpdate;
 }
 lookAround(tknIdx);
}
mapper.candidateMapSaveJSON(candidateMap, candidateMapTarget);
