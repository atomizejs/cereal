/*global exports */
/*jslint browser: true, devel: true */

var Cereal;

(function (window) {
    'use strict';

    var util, cereal;

    util = (function () {
        return {
            isPrimitive: function (obj) {
                return obj !== Object(obj);
            }
        };
    }());

    (function () {
        var undef  = 0,
            nu     = 1,
            prim   = 2,
            object = 3,
            array  = 4,
            ref    = 5,
            jsonify, dejsonify, generateEncodeWork, generateDecodeWork;

        generateEncodeWork = function (obj, target) {
            var worklist = [], names = Object.keys(obj),
                i, name, item;
            for (i = 0; i < names.length; i += 1) {
                name = names[i];
                target[name] = [];
                worklist.push([target[name], obj[name]]);
            }
            return worklist;
        };

        jsonify = function (obj) {
            var root = [], seen = [], seenIdx = 0, worklist = [[root, obj]],
                item, target, refIdx;

            while (worklist.length > 0) {
                item = worklist.shift();
                target = item[0];
                obj = item[1];
                if (undefined === obj) {
                    target[0] = undef;
                } else if (null === obj) {
                    target[0] = nu;
                } else if (util.isPrimitive(obj)) {
                    target[0] = prim;
                    target[1] = obj;
                } else {
                    refIdx = seen.lastIndexOf(obj);
                    if (refIdx === -1) {
                        refIdx = seenIdx;
                        seenIdx += 1;
                        seen[refIdx] = obj; // store orig obj, not result of obj.cerealise
                        target[1] = refIdx;
                        target[2] = {}; // always use an object to placate JSON itself
                        if ('cerealise' in obj && typeof obj.cerealise === 'function') {
                            obj = obj.cerealise();
                        }
                        if (Object.prototype.toString.apply(obj) === '[object Array]') {
                            target[0] = array;
                        } else {
                            target[0] = object;
                        }
                        worklist = (generateEncodeWork(obj, target[2])).concat(worklist);
                    } else {
                        target[0] = ref;
                        target[1] = refIdx;
                    }
                }
            }

            return root;
        };

        generateDecodeWork = function (obj, target) {
            var worklist = [], names = Object.keys(obj),
                i, name;
            for (i = 0; i < names.length; i += 1) {
                name = names[i];
                obj[name].unshift(name);
                obj[name].unshift(target);
                worklist.push(obj[name]);
            }
            return worklist;
        };

        dejsonify = function (obj) {
            var root = {}, seen = [], worklist = [obj],
                item, target, field;
            obj.unshift('value');
            obj.unshift(root);

            while (worklist.length > 0) {
                item = worklist.shift();
                target = item[0];
                field = item[1];
                switch (item[2]) {
                case undef:
                    target[field] = undefined;
                    break;
                case nu:
                    target[field] = null;
                    break;
                case prim:
                    target[field] = item[3];
                    break;
                case object:
                    target[field] = {};
                    seen[item[3]] = target[field];
                    worklist = (generateDecodeWork(item[4], target[field])).concat(worklist);
                    break;
                case array:
                    target[field] = [];
                    seen[item[3]] = target[field];
                    worklist = (generateDecodeWork(item[4], target[field])).concat(worklist);
                    break;
                case ref:
                    target[field] = seen[item[3]];
                    if (target[field] === undefined) {
                        throw "Decoding error";
                    }
                    break;
                default:
                    throw "Decoding error";
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
