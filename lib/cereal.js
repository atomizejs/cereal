/*global WeakMap, Map, exports */
/*jslint browser: true, devel: true */

var Cereal;

(function (window) {
    'use strict';

    var util, cereal;

    if (typeof Map === "undefined" &&
        typeof WeakMap === "undefined") {
        if (typeof exports === "undefined") {
            // assume in browser
            console.error("Your browser is too old. Currently the only known " +
                          "compatible browsers are Chrome version 17 or better, " +
                          "and Firefox 8.0 or better.");
        } else {
            console.error("Your version of Node is using too old a version of v8. " +
                          "Please use v8 3.4.14 or better, and pass the " +
                          "--harmony-weakmaps option to node " +
                          "(or --harmony-collections if beyond 3.7).");
        }
        return;
    }

    util = (function () {
        return {
            isPrimitive: function (obj) {
                return obj !== Object(obj);
            },

            hasOwnProp: ({}).hasOwnProperty
        };
    }());

    cereal = (function () {
        var makeMap, jsonify, dejsonify;

        makeMap = function () {
            // WeakMap implementations actually appeared before Map
            // implementations. Strictly, we only need Map here, but
            // if it's not available, use WeakMap
            if (typeof Map === "undefined") {
                return new WeakMap();
            } else {
                return new Map();
            }
        };

        jsonify = function (obj) {
            // Sadly, Javascript doesn't do tailcalls. So we have a
            // horrible non-recursive traversal here.
            var seen, count, parent, name, worklist, root, child, id, keys, i, childWorklist;
            root = {};
            worklist = [obj, root, 'value'];
            seen = makeMap();
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
                    seen.set(obj, id);
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
                            childWorklist.push(obj[keys[i]]);
                            childWorklist.push(child);
                            childWorklist.push(keys[i]);
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

        return {
            stringify: function (obj) {
                return JSON.stringify(jsonify(obj));
            },

            parse: function (str) {
                return dejsonify(JSON.parse(str));
            }
        };
    }());

    if (typeof exports === "undefined") {
        Cereal = cereal;
    } else {
        exports.stringify = cereal.stringify;
        exports.parse = cereal.parse;
    }

}(this));
