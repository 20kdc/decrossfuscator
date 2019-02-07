/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Project "Rosetta" extra data that is likely specific to the target
// Possibly move this to profile and have a "project profile name" arg?

// Blacklist used to generate externs.js
var primaryBlacklist = [
 "context", "delay", "last",
 "keydown", "keyup", "mousemove",
 "bind", "unbind", "options",
 "browser", "ready", "ajax", "resize",
 "delegate", "merge", "fadeIn", "fadeOut", "hide", "clone", "proxy", "first",
 "clearQueue", "param", "interval", "trigger", "addClass", "hasClass", "removeClass", "each",
 "eq", "is", "has", "not", "val",
 // '_wm' was here, but that actually gets obfuscated.
 // We'll see what happens.
 "x", "y", "z",
 "random", "width", "height", "scale", "onload", "data", "content", "id", "update", "position", "duration", "color", "loop",
 "face", "info", "WARNING", "map"
]
// Blacklist used by forwardmap & deobf to prevent screwups
// OBFs cannot be anything in here
// This may actually be suitable for primaryBlacklist but I don't want to blow up the important stuff
var obfBlacklist = [
 "right", "shift", "max", "length", "gfxCut",
 "particles", "NONE", "FACEANIMS", "DOCTYPE", "time",
 "namedSheets", "baseSize", "anims", "parts",
 "name", "sheet", "SUB", "frames", "dirFrames", "text",
 "targetType", "size", "stopTime", "direction", "connectPos", "msgTyp", "title", "content", "image",
 "value", "dir", "get", "min", "set", "pop", "push", "log", "error", "src", "href", "sub"
].concat(primaryBlacklist);
module.exports = {
 primaryBlacklist : primaryBlacklist,
 obfBlacklist : obfBlacklist,
 maxValidObfLen : 3
}
