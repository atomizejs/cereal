# Cereal

Serialisation Library for JavaScript that respects object aliases,
copes with cycles in the object graph, understands `undefined`, and
can cope with arrays that have arbitrary properties.

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

### Undefined

JSON can't represent `undefined`. Cereal can.

     var x = {a: undefined};

`JSON.parse(JSON.stringify(x))` will yield `{}`. Cereal will get it
right.

### Array fields

JSON thinks arrays can't have arbitrary properties, and will drop
them. Cereal won't.

      var x = [5];
      x.foo = true;

`JSON.parse(JSON.stringify(x))` will yield `[5]`. Cereal will get it
right.


## Anything else?

JSON invokes `toJSON` on an object before encoding it. Analogously to
this, Cereal invokes a `cerealise` function if it exists and encodes
what is returned from that.

Note that Cereal first rewrites the object structure to something
without loops or aliases (but from which the loops and aliases can be
reconstructed) and then it just uses normal JSON encoding on the
result, and vice-versa.

As a result, Cereal will ignore everything that JSON would ignore
too. Thus as normal, you lose functions, prototypes etc etc.
