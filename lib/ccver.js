/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

function decodeCCVersion(ver) {
 var def = ver.split("-");
 var abc = def[0].split(".");
 var major = parseInt(abc[0]);
 var minor = parseInt(abc[1]);
 var patch = parseInt(abc[2]);
 var hotfix = 0;
 if (def.length == 2)
  hotfix = parseInt(def[1]);
 return {
  major: major,
  minor: minor,
  patch: patch,
  hotfix: hotfix
 };
}

module.exports = {
 decodeCCVersion: decodeCCVersion,
 getCCVersionAE: function (ax) {
  var a = decodeCCVersion(ax);
  return function (bx) {
   var b = decodeCCVersion(bx);
   // Is ax (target) >= bx (lostsym start version)?
   var com1 = [a.major, a.minor, a.patch, a.hotfix];
   var com2 = [b.major, b.minor, b.patch, b.hotfix];
   // com1 >= com2?
   for (var i = 0; i < com1.length; i++) {
    if (com1[i] < com2[i])
     return false;
    if (com1[i] > com2[i])
     return true;
   }
   // equal
   return true;
  };
 }
};
