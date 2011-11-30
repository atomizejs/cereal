# Cereal

Serialisation Library for JavaScript that respects object aliases and
can cope with cycles in the object graph.

Can be used either client-side or in NodeJS.


## What does it solve?

### Aliases

    var x = {};
    var y = {a: x, b: x};

If you take the above and then do `JSON.parse(JSON.stringify(y))` then
you will lose the alias to `x`: what you'll get back will be `{a: {},
b: {}}`.

If you instead do `Cereal.parse(Cereal.stringify(y))` then you'll get
back the correct object shape, with both `a` and `b` pointing to the
same object.

### Loops

JSON can't cope with cyclical data structures. Cereal can.

    var x = {};
    x.x = x;

JSON will blow up if you try to `stringify(x)`. Cereal will work
correctly.


## Requirements

Currently it relies on either
[Map](http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets)
or [WeakMap](http://wiki.ecmascript.org/doku.php?id=harmony:weak_maps)
being available. If running in NodeJS, you'll need to start node with
`node --harmony-collections` (and compile node correctly). This also
limits browser support to Chrome 17 or Firefox 8, or better. If using
Chrome, you'll also need to start it as `google-chrome
--js-flags="--harmony-collections"`.

This requirement is likely to go away in the future: it is possible to
achieve the required functionality without using these exotic
features.


## Anything else?

JSON invokes `toJSON` on an object before encoding it. Analogously to
this, Cereal invokes invoking a `cerealise` function if it exists and
encoding what is returned from that.

Note that Cereal first rewrites the object structure to something
without loops or aliases (but from which the loops and aliases can be
reconstructed) and then it just uses normal JSON encoding on the
result. And vice-versa.

As a result, Cereal will ignore everything that JSON would ignore
too. Thus as normal, you lose functions, prototypes etc etc.
