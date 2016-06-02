/// <reference path="./typings/index.d.ts"/>
import {Observable} from "rxjs/Rx";

export function observeFirebaseList(ref, reducers, debounceTime:number = 300) {
  return new Observable(observer => {
    ref.on('value',
      snap => observer.next(snap),
      err => observer.error(err))
    return () => ref.off()
  }).debounceTime(debounceTime)
    .map((snaps:any[]) => Observable.fromPromise(new Promise(resolve => {
      function init(snap, key, reducers, values, next) {
        const reducer = reducers[key]
        if (typeof reducer['init'] === 'function') {
          Promise.resolve(reducer['init']()).then(x => {
            values[key] = x
            next()
          })
        } else {
          next()
        }
      }

      function reduce(snap, key, reducers, values, next) {
        const reducer = reducers[key]
        if (!reducer['test'] || (typeof reducer['test'] === 'function' && reducer['test'](snap))) {
          Promise.resolve(reducer['reduce'](values[key], snap)).then(x => {
            values[key] = x
            next()
          }).catch(e => console.log(e))
        } else {
          next()
        }
      }

      function after(snap, key, reducers, values, next) {
        const reducer = reducers[key]
        if (typeof reducer['after'] === 'function') {
          Promise.resolve(reducer['after'](values[key])).then(x => {
            values[key] = x
            next()
          })
        } else {
          next()
        }
      }

      function play(commands, callback) {
        let f = -1, fmax = commands.length

        function next() {
          if (++f < fmax) {
            const {task, snap, key, reducers, values} = commands[f]
            task(snap, key, reducers, values, next)
          } else {
            callback()
          }
        }

        next()
      }

      const values = {}
      const keys = Object.keys(reducers)
      const commands = []

      // initial values
      keys.forEach(key => {
        commands.push({task: init, key, reducers, values})
      })

      // reduce
      snaps.forEach(snap => {
        keys.forEach(key => {
          commands.push({task: reduce, snap, key, reducers, values})
        })
      })
      //
      // after
      keys.forEach(key => {
        commands.push({task: after, key, reducers, values})
      })

      play(commands, () => resolve(values))
    })))
    .mergeAll()
}
