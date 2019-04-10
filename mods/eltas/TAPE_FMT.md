# The ELTAS Tape Format

## Outer Object

If the ELTAS tape is an array, it should be assumed to be:

```json
{
 "frames": VALUE
}
```

Where 'VALUE' is the array.

In this object is the 'frames' array, containing one input mock per frame (see Frame Format).

If the object has a key 'dRNG' that is truthy, the Deterministic RNG is used.

The Deterministic RNG algorithm is in fakery.js.

The Deterministic RNG is not directly controllable by the user; Disabling it only exists for legacy tapes.

A user who particularly needs it to be used for some reason can trigger it by creating a blank 'empty array' tape.

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

When a tape begins recording, or a tape is NOT recording and a tape begins reading, a 'checkpoint' occurs.

A checkpoint is used to ensure that the Deterministic RNG, internal CrossCode variables, the internal time, and other data are consistent.
(It doesn't currently fully succeed...)

There are two kinds of checkpoints: a Minor Checkpoint and a Major Checkpoint.

It is assumed that any full-run tape will begin on the title-screen.
Starting a tape on the title-screen will cause a Major Checkpoint.

It is assumed that any macro tape expects to be run at any time, including within the recording of another tape.
Starting a tape outside of the title-screen will cause a Minor Checkpoint.

Starting recording will always cause a checkpoint.

Loading a file with the reader will cause a checkpoint if and only if no recording has been started.

Major Checkpoints are specifically allowed to (and *meant to*) reset CrossCode variables that *should* be reset at the title screen but aren't.

This of course makes them capable of breaking the game if performed at the wrong time.

A Major Checkpoint should only ever reset to title-screen-after-startup state, except where that can be inconsistent (timers).

The goal is that no matter what circumstances get the player to the title screen, being there allows a deterministic run to be played back.

## Frames Not Included

ELTAS tapes do not contain any frames that started in the LOADING substate.

Furthermore, the outermost level of the ELTAS frame-loop prevents anything except loading from occurring when a loadable object is being loaded.

The ultimate goal of this is to prevent, via any way possible, loading interfering with standard operation.
