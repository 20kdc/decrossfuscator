1. Use whatever you prefer, but keep it consistent per-file,
 ideally per-codebase ('a Rapture mod' or 'the deobf libs' being a codebase)

2. Use quoted properties whenever not dealing with CrossCode itself.
 If you *don't* do this, and in future a property is defined
  that overlaps with yours, there'll be trouble.
 
I'm introducing a tool, mod-lint.js, to help out;
 basically, if code isn't ALREADY broken on reobf, it'll warn you.

If it is already broken, then you're kind of screwed, because if the information
 about if a prop should be reobf'd was available, we wouldn't need to quote.
