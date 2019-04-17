# The ELTAS Tape Format

## Outer Object

If the ELTAS tape is an array, it should be assumed to be:

```json
{
 "frames": VALUE
}
```

Where 'VALUE' is the array.

If it is an object (or you have converted it via the above procedure:

In this object is the 'frames' array, containing one input mock per frame (see Frame Format).

## Legacy Feature Control In Tape Outer Object

The enabling and disabling of certain 'legacy feature properties' involves inaccuracies ELTAS generates in older versions.

This enabling and disabling only occurs during a Checkpoint (see Tape Format).

** NOTE: THIS NEXT BIT IS OFF BY DEFAULT FOR NOW, DETERMINISTIC RNG ISN'T AS DETERMINISTIC AS WAS HOPED **

If the object has a key 'dRNG' that is truthy, the Deterministic RNG is used.

The Deterministic RNG algorithm is in fakery.js.

The Deterministic RNG is not directly controllable by the user; Disabling it only exists for legacy tapes.

A user who particularly needs it to be used for some reason can trigger it by creating a blank 'empty array' tape.

If the Deterministic RNG is not used, then the fixed value 0.5 is used, and workarounds have to be in place to prevent crashes.

If the Deterministic RNG is used, SoundManager has to be kept in check to prevent determinism issues.

See workarounds.js for details on both of these.

If the object has a key 'mouseGui' that is truthy, mouseGui is properly emulated.

Again, see fakery.js ; this is another feature that's only disablable for legacy tapes.

## Key States

It is important to note here the Cubic Impact input model.

Having any activity involving a key makes `state("that key")` return true.

This includes, of course, that key being held.

But it also includes the frame of a keyup.

Thus, the state list is:

```
 1: Incoming. DS
 2: Held.      S
 3: Outgoing.  SU
 4: Perfect.  DSU
```

Getting the special keyup behavior of 3 or 4 wrong will cause charged shots to simply fail to work.

This is because Crosshair.isThrowCharged checks that the character controller is aiming.

This in turn involves a call to check the input state.

Since if you got this wrong the input state of a released button would be false, things break.

-- someone who got this wrong

## Frame Format

Example mock:

```
 {
  state: {jump: (1/2/3/4)},
  mouseX: 0,
  mouseY: 0
 }
```

There is also the possible additional attribute 'leftStick', containing `x` and `y` from -1 to 1.

While eltas's model is primarily designed around a PC keyboard & mouse,
 some speedrunning tricks require direct control of player orientation.

```
(Direct control of attack direction is of course controlled via mouse, and so on;
  supporting more than the movement stick will thus have no effect on gameplay.
 The TAS System also has too many buttons for a proper controller interface,
  so support of controllers as an input device is not happening;
  left stick emulation is only supported as part of what is necessary
  to provide all inputs players can achieve to all other users.
 Please see the comments on Symphonia46's video,
  https://www.youtube.com/watch?v=HtyliqQBu8k
  for two instances giving the reasoning.)
```

## Reader/Writer Begin ('Checkpoint') Behavior

It is assumed that any full-run tape will begin on the title-screen.

It is assumed that any macro tape expects to be run at any time, including within the recording of another tape.

When a tape begins recording, or a tape is NOT recording and a tape begins reading, a 'checkpoint' occurs.

To be clear, loading a file with the reader only causes a checkpoint if there's no recording going on; this is very important for macro tapes.

A checkpoint is used to ensure that the Deterministic RNG, internal CrossCode variables, the internal time, and other data are consistent.
(It probably doesn't currently fully succeed.)

There are two kinds of checkpoints: a Minor Checkpoint and a Major Checkpoint.

Starting a tape on the title-screen will cause a Major Checkpoint.
Starting a tape outside of the title-screen will cause a Minor Checkpoint.

Starting *recording* will always cause a checkpoint.

Major Checkpoints are specifically allowed to (and *meant to*) reset CrossCode variables that *should* be reset at the title screen but aren't.

This of course makes them capable of breaking the game if performed at the wrong time.

A Major Checkpoint should only ever reset to title-screen-after-startup state, except where that can be inconsistent (timers).

The goal is that no matter what circumstances get the player to the title screen, being there allows a deterministic run to be played back.

A Minor Checkpoint only resets minor timing details and flushes the cache.
It probably won't help much, and the cache flush *could* cause a load timing difference in a macro tape that crosses maps to a map with no loading whatsoever.
(The rest of the timing difference should be dealt with by ELTAS determinism rules - see Frames Not Included.)
In theory, the added precision a time reset gives may cause some macros that would break in some circumstances to be more likely to 'average out'.

(For reference, the cache flush as part of a Major Checkpoint is usually very beneficial to determinism.)

Check fakery.js for further information.

## Frames Not Included

The outermost level of the ELTAS frame-loop prevents anything except loading from occurring when a Loadable or SingleLoadable object is being loaded.

Furthermore, when these loads are requested, the actual load call is deferred, so loads occur one-at-a-time in order of being called.

This does increase loading times, but ensures loads are always as deterministic as possible.

The ultimate goal of this is to prevent, via any way possible, loading interfering with standard operation.

This particular mechanism is part of the System part of fakery.js, which contains the code for the timing control needed for TAS purposes.

# Minor Notes

## Tags

`hci-tagger.js` is a module in ELTAS to add additional "tags" to a file.

These tags are useful in determinism debugging, but serve no actual purpose.

`frame`, `currentState`, `currentSubState`, and `randomVal` are the current batch of tags.

## Savegames

The current system has no mechanism for the automated reset of savegames.

This is due to the probability of either accidentally causing massive damage or accidentally making moving savegames in and out extremely difficult.

## Softlocks

The Back-In-Time softlock discovered by the speedrunning community causes an interesting situation where a TAS run must be split into parts.

As it is a softlock, ELTAS will continue to run, so there is no theoretical issue; total working frame count can still be measured, etc.

## RaptureUI Interference

RaptureUI should not affect gameplay, but is necessary for the installation of key bindings, and is necessary for the overlay UI settings.

The former is due to CrossCode making changes internally to how it handles key bindings, but could be omitted if ignoring your user settings is fine.

The latter can be completely omitted if happy with the current setup.

But these are still important features otherwise, so ELTAS keeps a dependency on RaptureUI for now.

## NpcRunnerSpawner

NpcRunnerSpawner is how CrossCode spawns random NPC 'runners' to populate CrossWorlds.

It uses a very interesting algorithm, that relies on continuous random input to avoid an infinite loop.

Since early ELTAS did not use a deterministic RNG but instead used a fixed-value RNG, this caused crashes in maps with those runners.

There is now a workaround for the fixed-value RNG, but only that RNG in particular; deterministic RNG uses the regular unaltered behavior.

## Floating-point wonkiness

It's supposedly possible for floating-point itself to be non-deterministic in some circumstances.

If a CPU, OS, or node.js runtime were to theoretically treat floating-point numbers differently to another CPU, OS, or node.js runtime, then things would go very wrong very quickly.

The same may apply to JavaScript Object property order.

My answer to all this is "hope you don't have to find out about it".

A particular concern I have is that serialization *may* affect the joystick positions slightly.

They work in a fixed 1 / 60 grid right now, so it may just be a matter of correcting anything that's off.

## Web Workers

CrossCode uses Web Workers. Under most circumstances, this would spell doom for the whole TAS idea.

The good news is that Web Workers are only used for image resizing and filtering, both things which occur within image load.

And since Image is a Loadable, it qualifies for the behavior in "Frames Not Included".

So all Web Worker usage at present.

## SoundManager

SoundManager cannot be so easily ignored. It performs calls to Math.random, is entirely non-deterministic, and is generally 'a problem'.

For now, it has been relegated to the hall of "no random values forever".

It's hoped that it won't be able to do anything problematic there.

It'll definitely be non-deterministic by nature but it shouldn't have any effects on gameplay.
