/*
 * decrossfuscator - A project to undo the effects of a specific version of Google Closure Compiler for a specific game by mapping between versions.
 * Written starting in 2017 by contributors (see CREDITS.txt)
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */

// Ensures game always runs at precisely 60FPS.
ig.Timer["emileatasLocked"] = false;
ig.Timer.step = function () {
 if (ig.Timer["emileatasLocked"])
  return;
 var stepVal = 1 / 60.0;
 ig.Timer["emileatasLast"] = ig.Timer.time;
 ig.Timer.time += stepVal * ig.Timer.timeScale;
};

// This is used to generate specific values to lock specific code out of an RNG,
//  be it a deterministic RNG or a fixed-value one.
// This is because certain sound-related code in CrossCode interferes with deterministic RNGs,
//  and certain gameplay-related code in CrossCode will CRASH - repeat, will CRASH - if given a fixed-value RNG with a 'bad' value.
Math["emileatasLockedValue"] = null;

// Deterministic RNG current value.
Math["emileatasRandomValue"] = 0;

Math["emileatasUseDRNG"] = true;

// Needed for determinism.
// function rnd() rv = ((rv + 0.1) * 13.9241512) rv = rv - math.floor(rv) return rv end

Math.random = function () {
 if (Math["emileatasLockedValue"] != null)
  return Math["emileatasLockedValue"];
 if (Math["emileatasUseDRNG"]) {
  Math["emileatasRandomValue"] += 0.1;
  Math["emileatasRandomValue"] *= 13.9241512;
  Math["emileatasRandomValue"] -= Math.floor(Math["emileatasRandomValue"]);
  return Math["emileatasRandomValue"];
 }
 return 0.5;
};


Date["realNow"] = Date.now;

Date["simulated"] = 0;
Date.now = function () {
 return Date["simulated"];
};

ig.Timer["emileatasCheckpoint"] = function () {
 console.log("-- TAS Checkpoint --");
 ig.system.clock.reset();
 ig.system.actualTick = 0;
 ig.cleanCache();
 Date["simulated"] = 0;
 // Camera is used for some triggers (has effect on gameplay).
 // Try to wipe it completely clean if this would not affect gameplay
 if (sc.model.isTitle()) {
  ig.camera.targets = [];
  ig.camera.namedTargets = {};
  ig.camera._currentPos = Vec2.create();
  ig.camera._currentZ = 0;
  ig.camera._currentZoom = 1;
  ig.camera._currentZoomPos = Vec2.create();
  ig.camera._zSlow = false;
  ig.camera._lastPos = Vec2.create();
  ig.camera._lastZoom = 1;
  ig.camera._lastZoomPos = Vec2.create();
  ig.camera._duration = 0;
  ig.camera._time = 0;
  ig.camera._transitionFunction = null;
  ig.camera._cameraInBounds = false;
  // This stuff has more obvious effects on gameplay, so major checkpoints only.
  // In particular re-trying a macro tape until it works out in the situations you use it in is better than
  //  getting the same randomness every time you try to record the macro tape.
  Math["emileatasRandomValue"] = 0;
  ig.input["emileatasTrueLastX"] = null;
  ig.input["emileatasTrueLastY"] = null;
 }
};

/*
 * Input Mock Documentation now at TAPE_FMT
 */

// Effectively disable actual gamepad support as it's hard to setup a proper full proxy for this.
ig.Html5GamepadHandler.inject({
 update: function (c) {
 }
});
// But then add support for a fake gamepad controlled by the injections into ig.Input.
ig.GamepadManager.addHandlerCheck(function() {
 return new (ig.Class.extend({
  ["myFakeGamepad"]: null,
  init: function () {
   this["myFakeGamepad"] = new ig.Gamepad();
  },
  update: function (gamepads) {
   if (ig.input["emileatasMockDetails"] && ig.input["emileatasMockDetails"]["leftStick"]) {
    var ls = ig.input["emileatasMockDetails"]["leftStick"];
    gamepads["myFakeGamepad"] = this["myFakeGamepad"];
    this["myFakeGamepad"].updateAxes(ig.AXES.LEFT_STICK_X, ls["x"]);
    this["myFakeGamepad"].updateAxes(ig.AXES.LEFT_STICK_Y, ls["y"]);
   } else if ("myFakeGamepad" in gamepads) {
    delete gamepads["myFakeGamepad"];
   }
  }
 }))();
})

// This does the input filtering.
ig.Input.inject({
 "emileatasMockDetails": null,
 "emileatasTrueLastX": null,
 "emileatasTrueLastY": null,
 "emileatasOldX": null,
 "emileatasOldY": null,
 "emileatasMouseGuiActiveTracked": null,
 "emileatasForceMouseGuiActiveAlways": false,
 "emileatasAccept": function (m) {
  if (m != null) {
   // This is more invasive than I'd like, unfortunately.
   // Some of this stuff does have *minor* effects on how the game acts.
   // It's not any more severe than Angler, but still.
   this.currentDevice = ig.INPUT_DEVICES.KEYBOARD_AND_MOUSE;
   this.mouse.x = m["mouseX"];
   this.mouse.y = m["mouseY"];
   if (this["emileatasMockDetails"] == null) {
    this["emileatasOldX"] = this.mouse.x;
    this["emileatasOldY"] = this.mouse.y;
   }
   this.mouseGuiActive = true;
  } else if (this["emileatasMockDetails"] != null) {
   // Ending mock active block, clean up
   this["emileatasMouseGuiActiveTracked"] = this.mouseGuiActive; // this can be updated in game code
   this.mouse.x = this["emileatasOldX"];
   this.mouse.y = this["emileatasOldY"];
  }
  this["emileatasMockDetails"] = m;
  // Calculate mouseGuiActive updates to ensure this has no possible effects on gameplay
  if ((this.mouse.x != this["emileatasTrueLastX"]) || (this.mouse.y != this["emileatasTrueLastY"]))
   this["emileatasMouseGuiActiveTracked"] = true;
  this["emileatasTrueLastX"] = this.mouse.x;
  this["emileatasTrueLastY"] = this.mouse.y;
  if (this["emileatasForceMouseGuiActiveAlways"]) {
   this.mouseGuiActive = true;
  } else {
   this.mouseGuiActive = this["emileatasMouseGuiActiveTracked"];
  }
 },
 pressed: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return (m["state"][a] == 1) || (m["state"][a] == 4);
   return false;
  }
  return this.parent(a);
 },
 keyupd: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return (m["state"][a] == 3) || (m["state"][a] == 4);
   return false;
  }
  return this.parent(a);
 },
 state: function (a) {
  var m = this["emileatasMockDetails"];
  if (m != null) {
   if (m["state"][a])
    return true;
   return false;
  }
  return this.parent(a);
 }
});

var getTASCore = function () {
 var tascore = window["mods"]["eltas"]["tascore"];
 if (!tascore)
  tascore = window["mods"]["eltas"]["tascore"] = new window["mods"]["eltas"]["TASCore"]();
 return tascore;
};

ig.System.inject({
 "emileatasTasks": [],
 "emileatasRunningTask": false,
 "emileatasAJAXTransferToTask": false,
 // Actual parent run function.
 "emileatasGameRun": null,
 "emileatasWarning": null,
 init: function (a, b, c, j, k, l) {
  this.parent(a, b, c, j, k, l);
  // Extra backup safety.
  this.clock.tick = function () {
   if (ig.Timer["emileatasLocked"])
    return 0;
   Date["simulated"] += 1000 / 60;
   return 1 / 60;
  };
 },
 setWindowFocus: function (focusLost) {
  // Do nothing, this functionality can break things
 },
 "emileatasInternalRun2": function () {
  var tascore = getTASCore();
  if (ig.system["emileatasTasks"].length > 0) {
   // Tasks to run, stay in holding pattern.
   if (!ig.system["emileatasRunningTask"]) {
    ig.system["emileatasRunningTask"] = true;
    ig.system["emileatasTasks"].shift()();
   }
   tascore["alertTimeBreak"]();
   return;
  }
  if (ig.loading || ig.system["emileatasRunningTask"]) {
   tascore["alertTimeBreak"]();
   return;
  }

  if (sc.model.isLoading()) {
   ig.Timer["emileatasLocked"] = true;
   // Safety nets.
   Math["emileatasLockedValue"] = 0.5;
   tascore["runLoading"]();
   Math["emileatasLockedValue"] = null;
   ig.Timer["emileatasLocked"] = false;
   tascore["alertTimeBreak"]();
   return;
  }
  tascore["run"]();
 },
 "emileatasInternalRun": function () {
  try {
   this["emileatasInternalRun2"]();
  } catch (b) {
   ig.system.error(b);
  }
  window.requestAnimationFrame(ig.system["emileatasInternalRun"].bind(ig.system), ig.system.canvas);
 },
 run: function () {
  if (this["emileatasGameRun"])
   return;
  this["emileatasGameRun"] = this.parent.bind(this);
  this["emileatasInternalRun"]();
 }
});

(function () {
 function loadCommon(a) {
  // The task ensures that even zero-frame loads count as one-frame.
  // Only one task can run at a time, so load submission order is used to aid determinism.
  // As no frames occur during the load,
  //  all loads are thus one-frame from game perspective.
  var cLoad = this.parent.bind(this);
  var cb = function () {
   //console.log("Did load.");
   cLoad(function (b, c, d) {
    //console.log("Did load end.");
    ig.system["emileatasRunningTask"] = false;
    a && a(b, c, d);
    // Ends the time it took for a callback, so alert to time break
    getTASCore()["alertTimeBreak"]();
   });
   getTASCore()["alertTimeBreak"]();
  };
  if ((!ig.system) || (!ig.system.running)) {
   // Game not using run()
   cb();
  } else {
   ig.system["emileatasTasks"].push(cb);
  }
  getTASCore()["alertTimeBreak"]();
 }
 ig.Loadable.inject({
  load: loadCommon
 });
 ig.SingleLoadable.inject({
  load: loadCommon
 });
 ig.Game.inject({
  preloadLevel: function (a) {
   ig.system["emileatasAJAXTransferToTask"] = true;
   this.parent(a);
   ig.system["emileatasAJAXTransferToTask"] = false;
  }
 });
 // This may not need quoting, but consider it a safety measure.
 var oldAjax = $["ajax"];
 $["ajax"] = function (a) {
  if ((ig.system) && (ig.system.running)) {
   if (ig.system["emileatasAJAXTransferToTask"]) {
    var oldSuccess = a["success"];
    var oldError = a["error"];
    // As per usual, making it a task ensures it isn't handled until after the frame,
    //  and after that frames are disabled until the request finishes
    ig.system["emileatasTasks"].push(function () {
     a["success"] = function (res) {
      oldSuccess.bind(this)(res);
      ig.system["emileatasRunningTask"] = false;
     };
     a["error"] = function (res) {
      oldError.bind(this)(res);
      ig.system["emileatasRunningTask"] = false;
     };
     oldAjax(a);
    });
    // Task has been pushed, return now
    return;
   } else {
    if (!ig.system["emileatasRunningTask"]) {
     ig.system["emileatasWarning"] = "AJAX Request Performed Outside Of Loading Barrier!\nDeterminism Compromised. Contact 20kdc Immediately.";
     if (a["url"])
      ig.system["emileatasWarning"] += "\nTrace: " + a["url"];
    }
   }
  }
  oldAjax(a);
 };
})();
