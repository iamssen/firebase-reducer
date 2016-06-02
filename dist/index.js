"use strict";
var Rx_1 = require("rxjs/Rx");
function observeFirebaseList(ref, reducers, debounceTime) {
    if (debounceTime === void 0) { debounceTime = 300; }
    return new Rx_1.Observable(function (observer) {
        ref.on('value', function (snap) { return observer.next(snap); }, function (err) { return observer.error(err); });
        return function () { return ref.off(); };
    }).debounceTime(debounceTime)
        .map(function (snaps) { return Rx_1.Observable.fromPromise(new Promise(function (resolve) {
        function init(snap, key, reducers, values, next) {
            var reducer = reducers[key];
            if (typeof reducer['init'] === 'function') {
                Promise.resolve(reducer['init']()).then(function (x) {
                    values[key] = x;
                    next();
                });
            }
            else {
                next();
            }
        }
        function reduce(snap, key, reducers, values, next) {
            var reducer = reducers[key];
            if (!reducer['test'] || (typeof reducer['test'] === 'function' && reducer['test'](snap))) {
                Promise.resolve(reducer['reduce'](values[key], snap)).then(function (x) {
                    values[key] = x;
                    next();
                }).catch(function (e) { return console.log(e); });
            }
            else {
                next();
            }
        }
        function after(snap, key, reducers, values, next) {
            var reducer = reducers[key];
            if (typeof reducer['after'] === 'function') {
                Promise.resolve(reducer['after'](values[key])).then(function (x) {
                    values[key] = x;
                    next();
                });
            }
            else {
                next();
            }
        }
        function play(commands, callback) {
            var f = -1, fmax = commands.length;
            function next() {
                if (++f < fmax) {
                    var _a = commands[f], task = _a.task, snap = _a.snap, key = _a.key, reducers_1 = _a.reducers, values_1 = _a.values;
                    task(snap, key, reducers_1, values_1, next);
                }
                else {
                    callback();
                }
            }
            next();
        }
        var values = {};
        var keys = Object.keys(reducers);
        var commands = [];
        keys.forEach(function (key) {
            commands.push({ task: init, key: key, reducers: reducers, values: values });
        });
        snaps.forEach(function (snap) {
            keys.forEach(function (key) {
                commands.push({ task: reduce, snap: snap, key: key, reducers: reducers, values: values });
            });
        });
        keys.forEach(function (key) {
            commands.push({ task: after, key: key, reducers: reducers, values: values });
        });
        play(commands, function () { return resolve(values); });
    })); })
        .mergeAll();
}
exports.observeFirebaseList = observeFirebaseList;
//# sourceMappingURL=index.js.map