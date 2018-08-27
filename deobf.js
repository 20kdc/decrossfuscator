/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// 2:js 3:map 4:mode

var fs = require("fs");
var lexer = require("./lib/lexer");
var matcher = require("./lib/matcher");
var mapper = require("./lib/mapper");
var rosettaGlobals = require("./lib/rosetta-global-data");

var tkns = lexer.strip(lexer.lexString(fs.readFileSync(process.argv[2], "utf8")));

var mapping = fs.readFileSync(process.argv[3], "utf8");

// avoids deobfuscating something that shouldn't be deobfuscatable
// used to make the turnaround time on quick fixes to the obf blacklist a lot faster
var safe = false;

var matchGoogle = null;
var GOOGLE_CALLS_SRC = null;
var GOOGLE_CALLS_DST = null;

if ((process.argv[4] == "deobf") || (process.argv[4] == "deobf-unsafe")) {
 safe = process.argv[4] == "deobf";
 // Standard deobfuscation mode
 mapping = mapper.loadObfToDeobf(mapping);

 matchGoogle = new matcher.Matcher();
 matchGoogle.loadProfileFile("google");

 GOOGLE_CALLS_DST = matchGoogle.knownNames;
 GOOGLE_CALLS_SRC = [];

 matchGoogle = matchGoogle.execute(tkns);
 for (var i = 0; i < GOOGLE_CALLS_DST.length; i++)
  GOOGLE_CALLS_SRC[i] = matchGoogle.map.get(GOOGLE_CALLS_DST[i]) || GOOGLE_CALLS_DST[i];
} else if (process.argv[4] == "reobf") {
 // Reobfuscation mode.
 // In this mode googleCalls are thrown out the window because:
 // 1. who cares
 // 2. need to generate a separate mapping file per-version for these for it to work
 mapping = mapper.loadDeobfToObf(mapping);
} else {
 console.error("Unknown mode " + process.argv[4]);
 mapping = new Map();
}

function mapSrcDst(str) {
 // Rosetta global data can be updated to blacklist OBFs without rerunning the forwardporter
 if (safe) {
  if (str.length > rosettaGlobals.maxValidObfLen)
   return null;
  if (rosettaGlobals.obfBlacklist.indexOf(str) != -1)
   return null;
  if (mapping.has(str))
   return mapping.get(str);
 }
 if (mapping.has(str))
  return mapping.get(str);
 return null;
}

for (var i = 0; i < tkns.length; i++) {
 if (tkns[i][0] == "id") {
  if (lexer.propKey(tkns, i)) {
   var deobf = mapSrcDst(tkns[i][1]);
   if (deobf != null)
    tkns[i][1] = deobf;
  } else if (matchGoogle != null) {
   // DEOBF ONLY IN PRACTICE, IF FIXING THAT PLEASE PAY ATTENTION:
   // Really matchGoogle.map.get & whatever should just be in an array:
   //  "GOOGLE_GETSET_CALLS"
   // Maybe just make all the Google-related data into one nice JSON object so
   //  we can just load it throw it into variables and call it a day
   // Not a property - is this a Google call?
   if (i < tkns.length - 4)
    if ((tkns[i][1] == matchGoogle.map.get("googleNewSetter")) || (tkns[i][1] == matchGoogle.map.get("googleNewGetter")))
     if (tkns[i + 1][1] == "(")
      if (tkns[i + 2][0] == "str")
       if (tkns[i + 3][1] == ")") {
        // Remap setter/getter. JSON.parse is used as sandboxed string unescaper.
        var m = JSON.parse(tkns[i + 2][1]);
        var deobf = mapSrcDst(m);
        if (deobf != null) {
         var mTokens = lexer.strip(lexer.lexString(JSON.stringify(deobf)));
         if (mTokens.length != 1)
          throw new Error("JSON.stringify to escape string provided too many or no tokens. Fix lexer or local JSON.stringify kthxbai.");
         tkns[i + 2][1] = lexer.delexString(mTokens);
        }
       }
   // Done translating google call innards, safe to check for other kinds of google calls.
   // NOTE: The googlecall stuff only applies to globals.
   //       The OBFs of these are NEVER, EVER, EVER used as local variables, so it's safe.
   var gcallIndex = GOOGLE_CALLS_SRC.indexOf(tkns[i][1]);
   if (gcallIndex != -1) 
    tkns[i][1] = GOOGLE_CALLS_DST[gcallIndex];
  }
 }
}

console.log(lexer.delexString(lexer.unstrip(tkns)));
