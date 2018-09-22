/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// The Leaxer (aka tokenizer)
// May not be 100% JavaScript-compliant, but is sufficiently compliant for the uses we have.

function LexerState() {
 this.lastFullToken = null;
 this.clone = function () {
  var ls = new LexerState();
  ls.lastFullToken = this.lastFullToken;
  return ls;
 };
 this.nextToken = function (str) {
  var s = nextTokenInner(str, this);
  // Stuff that bypasses LFT
  if (s[0] == "whitespace")
   return s;
  if (s[0] == "comment")
   return s;
  this.lastFullToken = s;
  return [s[0], s[1], s[2]];
 };
}

// -- the actual lexer --

function possibleRegex(lft) {
 if (lft == null)
  return true;
 if (lft[0] == "id")
  return false;
 if (lft[0] == "number")
  return false;
 if (lft[0] == "str")
  return false;
 if (lft[0] == "regex")
  return false;
 if (lft[1] == ")")
  return false;
 if (lft[1] == "]")
  return false;
 return true;
}

function processString(str, t, diClosure) {
 var i = 1;
 var depth = 0;
 // Note that we only care about escapes that could change tokenization
 var quote = str[0];
 var tx = str[0];
 var escapementMechanism = false;
 while (i < str.length) {
  tx += str[i];
  if (!escapementMechanism) {
   if (str[i] == "\\")
    escapementMechanism = true;
   depth += diClosure(str[i]);
   if (str[i] == quote)
    if (depth == 0)
     break;
  } else {
   escapementMechanism = false;
  }
  i++;
 }
 if (i == str.length) {
  return ["unknown", tx, ""];
 } else {
  return [t, tx, str.substring(i + 1)];
 }
}

function nextTokenInner(str, lexerState) {
 // NOTE: This isn't as conformant as it could be regarding a few things,
 //        but it'll at least correctly display the message from the element of loyalty.
 //       Search for "effort" without quotes.
 var m = /^\s+/.exec(str);
 if (m != null)
  return ["whitespace", m[0], str.substring(m[0].length)];
 m = /^[0-9]([0-9]|[eE][\+\-]?|\.)*/.exec(str);
 if (m != null)
  return ["number", m[0], str.substring(m[0].length)];

 m = /^[a-zA-Z_\$][a-zA-Z_0-9\$]*/.exec(str);
 if (m != null)
  return ["id", m[0], str.substring(m[0].length)];

 if ((str[0] == "\"") || (str[0] == "\'"))
  return processString(str, "str", function (chr) { return 0; });

 if (str[0] == "/") {
  // Comment?
  if (str[1] == "/") {
   // Single-line comment
   m = /^.+[\r\n]*/.exec(str); // cannot be null if sane
   return ["comment", m[0], str.substring(m[0].length)];
  } else if (str[1] == "*") {
   /* Longer comments */
   /* Like this */
   /*
    * Also, regex behavior around '.' and newlines is crazy
    */
   m = /^\/\*[^]*?\*\//m.exec(str);
   return ["comment", m[0], str.substring(m[0].length)];
  } else if (possibleRegex(lexerState.lastFullToken)) {
   var inCharClass = false;
   var nt = processString(str, "regex", function (chr) {
    if (inCharClass) {
     if (chr == "]") {
      inCharClass = false;
      return -1;
     }
     return 0;
    }
    if (chr == "(")
     return 1;
    if (chr == ")")
     return -1;
    if (chr == "{")
     return 1;
    if (chr == "}")
     return -1;
    if (chr == "[") {
     inCharClass = true;
     return 1;
    }
    return 0;
   });
   if (nt[0] != "unknown") {
    // Finalize...
    m = /^[gumyi]*/.exec(nt[2]);
    nt[1] += m[0];
    nt[2] = nt[2].substring(m[0].length);
    return nt;
   }
  }
 }

 // Ops (including / as divide)

 if (/^\&\&|^\|\||^\<\<|^\>\>|^\+\+|^\-\-/.test(str)) {
  return ["op", str[0] + str[1], str.substring(2)];
 } else if (/^\<\<\=|^\>\>\=|^\=\=\=|^\!\=\=/.test(str)) {
  return ["op", str[0] + str[1] + str[2], str.substring(3)];
 } else if (/^[\+\-\*\/\%\^\~\>\<\=\!\&\|]\=/.test(str)) {
  return ["op", str[0] + str[1], str.substring(2)];
 } else if (/^[\+\-\*\/\%\^\~\>\<\=\!\&\|]/.test(str)) {
  return ["op", str[0], str.substring(1)];
 } else if (/^[\(\)\,\.\?\:\;\[\]\{\}]/.test(str)) {
  return ["char", str[0], str.substring(1)];
 } else {
  return ["unknown", str, ""];
 }
}

// -- exports --

// propKey constants
var PK = {
 NONE: 0,   // not a propKey, counts as false in an if
 OBJECT: 1, // .what
 INDEX: 2   // what:
};

module.exports = {
 LexerState: LexerState,
 lexString: function (str) {
  var state = new LexerState();
  var tokens = [];
  while (str != "") {
   var temp = state.nextToken(str);
   tokens.push([temp[0], temp[1]]);
   str = temp[2];
  }
  return tokens;
 },
 // Assumes everything is valid. If not...
 delexString: function (tkns) {
  var str = "";
  for (var i = 0; i < tkns.length; i++)
   str += tkns[i][1];
  return str;
 },
 strip: function (tkns) {
  var n = [];
  for (var i = 0; i < tkns.length; i++) {
   if (tkns[i][0] == "whitespace")
    continue;
   if (tkns[i][0] == "comment")
    continue;
   n.push(tkns[i]);
  }
  return n;
 },
 words: {
  all: [
   "break", "do", "instanceof", "typeof",
   "case", "else", "new", "var",
   "catch", "finally", "return", "void",
   "continue", "for", "switch", "while",
   "debugger", "function", "this", "with",
   "default", "if", "throw", "delete", "in", "try"
  ],
  // (/[ usually remove spaces at the start in beautification, but if the ID before them is one of these, don't
  forceSpaceAfter: [
   "do", "case", "new",
   "catch", "finally", "return", "void",
   "for", "switch", "while", "function", "with",
   "if", "throw", "delete", "in", "try"
  ],
 },
 PK: PK,
 // NOTE: Only works on stripped lists.
 // Must catch all references,
 //  but ensures that the ones caught are valid.
 // Note that this doesn't check if the target value is an ID or not.
 propKey: function (tkns, i) {
  if (i > 0) {
   if (tkns[i - 1][1] == ".") {
    return PK.INDEX;
   } else if (i < tkns.length - 1) {
    if (tkns[i + 1][1] == ":") {
     if (tkns[i - 1][1] == ",")
      return PK.OBJECT;
     if (tkns[i - 1][1] == "{")
      return PK.OBJECT;
    }
   }
  }
  return PK.NONE;
 },
 // A version of the above that works for unstripped token lists.
 propKeyUnstripped: function (tkns, i) {
  var lTknI, rTknI;
  for (lTknI = i - 1; lTknI >= 0; lTknI--) {
   if (tkns[lTknI][0] == "comment")
    continue;
   if (tkns[lTknI][0] == "whitespace")
    continue;
   if (tkns[lTknI][1] == ".")
    return PK.INDEX;
   break;
  }
  if (lTknI == -1)
   return PK.NONE;
  for (rTknI = i + 1; rTknI < tkns.length; rTknI++) {
   if (tkns[rTknI][0] == "comment")
    continue;
   if (tkns[rTknI][0] == "whitespace")
    continue;
   if (tkns[rTknI][1] == ":") {
    if (tkns[lTknI][1] == ",")
     return PK.OBJECT;
    if (tkns[lTknI][1] == "{")
     return PK.OBJECT;
   }
   break;
  }
  return PK.NONE;
 },
 // Adds *required* whitespace and no more (hopefully).
 // Results are actually slightly smaller than the Closure Compiler output, which is slightly concerning.
 unstrip: function (tkns) {
  var tkns2 = [];
  // tokens that should have spaces between them - divided into sets
  var spaceTknsA = ["id", "regex", "number"];
  // some ops (- in particular) like to combine and change
  var spaceTknsB = ["op"];
  for (var i = 0; i < tkns.length; i++) {
   if (i > 0) {
    var lastToken = tkns[i - 1][0];
    var thisToken = tkns[i][0];
    if (spaceTknsA.indexOf(lastToken) != -1)
     if (spaceTknsA.indexOf(thisToken) != -1)
      tkns2.push(["whitespace", " "]);
    if (spaceTknsB.indexOf(lastToken) != -1)
     if (spaceTknsB.indexOf(thisToken) != -1)
      tkns2.push(["whitespace", " "]);
   }
   tkns2.push(tkns[i]);
  }
  return tkns2;
 }
};
