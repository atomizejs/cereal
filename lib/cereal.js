/*global WeakMap, Map, exports */
/*jslint browser: true, devel: true */

var Cereal;

(function (window) {
    'use strict';

    var util, cereal, MyMap;

    util = (function () {
        return {
            isPrimitive: function (obj) {
                return obj !== Object(obj);
            },

            hasOwnProp: ({}).hasOwnProperty
        };
    }());

    (function () {
        var nextId = 0;
        if (typeof Map === "undefined") {
            if (typeof WeakMap === "undefined") {
                MyMap = function () {
                    this.dict = {};
                };
                MyMap.prototype = {
                    id: function () {
                        nextId += 1;
                        return nextId;
                    },

                    set: function (key, value) {
                        if (typeof key === "object") {
                            if (undefined === key._map) {
                                key._map = this.id();
                            }
                            this.dict[key._map] = value;
                        } else {
                            this.dict[key] = value;
                        }
                    },

                    get: function (key) {
                        if (typeof key === "object") {
                            if (undefined !== key._map) {
                                return this.dict[key._map];
                            } else {
                                return undefined;
                            }
                        } else {
                            return this.dict[key];
                        }
                    },

                    has: function (key) {
                        if (typeof key === "object") {
                            return (undefined !== key._map &&
                                    util.hasOwnProp.call(this.dict, key._map));
                        } else {
                            return util.hasOwnProp.call(this.dict, key);
                        }
                    }
                };
            } else {
                MyMap = WeakMap;
            }
        } else {
            MyMap = Map;
        }
    }());

    (function () {
        var jsonify, dejsonify;

        jsonify = function (obj) {
            // Sadly, Javascript doesn't do tailcalls. So we have a
            // horrible non-recursive traversal here.
            var seen, count, parent, name, worklist, root, child, id, keys, i, childWorklist;
            root = {};
            worklist = [obj, root, 'value'];
            seen = new MyMap();
            count = 0;

            while (0 < worklist.length) {
                obj = worklist.shift();
                parent = worklist.shift();
                name = worklist.shift();

                if (util.isPrimitive(obj)) {
                    parent[name] = obj;
                } else if (seen.has(obj)) {
                    parent[name] = {seen: seen.get(obj)};
                } else {
                    count += 1;
                    id = count;
                    seen.set(obj, id);
                    if (undefined !== obj.cerealise && typeof obj.cerealise === "function") {
                        obj = obj.cerealise();
                    }
                    if (obj.constructor === Array) {
                        child = [];
                        childWorklist = [];
                        for (i = 0; i < obj.length; i += 1) {
                            childWorklist.push(obj[i]);
                            childWorklist.push(child);
                            childWorklist.push(i);
                        }
                        worklist = childWorklist.concat(worklist);
                    } else {
                        child = {};
                        keys = Object.keys(obj);
                        childWorklist = [];
                        for (i = 0; i < keys.length; i += 1) {
                            if (keys[i] !== 'cerealise' && keys[i] !== '_map') {
                                childWorklist.push(obj[keys[i]]);
                                childWorklist.push(child);
                                childWorklist.push(keys[i]);
                            }
                        }
                        worklist = childWorklist.concat(worklist);
                    }
                    parent[name] = {unseen: id, object: child};
                }
            }
            return root.value;
        };

        dejsonify = function (obj) {
            var worklist, root, parent, name, seen, id, child, keys, i, childWorklist;

            root = {};
            worklist = [obj, root, 'value'];
            seen = {};

            while (0 < worklist.length) {
                obj = worklist.shift();
                parent = worklist.shift();
                name = worklist.shift();

                if (util.isPrimitive(obj)) {
                    parent[name] = obj;
                } else if (undefined !== obj.seen) {
                    parent[name] = seen[obj.seen];
                } else {
                    id = obj.unseen;
                    obj = obj.object;
                    if (obj.constructor === Array) {
                        child = [];
                    } else {
                        child = {};
                    }
                    seen[id] = child;
                    childWorklist = [];
                    keys = Object.keys(obj);
                    for (i = 0; i < keys.length; i += 1) {
                        childWorklist.push(obj[keys[i]]);
                        childWorklist.push(child);
                        childWorklist.push(keys[i]);
                    }
                    worklist = childWorklist.concat(worklist);
                    parent[name] = child;
                }
            }

            keys = Object.keys(seen);
            for (i = keys.length - 1; i >= 0; i -= 1) {
                obj = seen[keys[i]];
                if (undefined !== obj.decerealise && typeof obj.decerealise === "function") {
                    obj.decerealise();
                }
            }

            return root.value;
        };

        cereal = {
            stringify: function (obj) {
                return JSON.stringify(jsonify(obj));
            },

            parse: function (str) {
                return dejsonify(JSON.parse(str));
            },

            Map: MyMap
        };
    }());

    if (typeof exports === "undefined") {
        Cereal = cereal;
    } else {
        exports.stringify = cereal.stringify;
        exports.parse = cereal.parse;
        exports.Map = cereal.Map;
    }

}(this));
