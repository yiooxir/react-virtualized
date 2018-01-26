import { Utils } from "./interfaces";
import NormalizeCountArgs = Utils.NormalizeCountArgs;
import { defaultNCArgs } from "./const";

function toIndex(count) {
  return count ? count - 1 : 0
}

function toCount(index) {
  return index + 1
}

function normalizeCount(count, options: NormalizeCountArgs = defaultNCArgs) {
  switch (true) {
    case count > options.max:
      return options.max
    case count < options.min:
      return options.min
    default:
      return count
  }
}

function pick(object: Object, keys: Array<number | string>): Object {
  const res = {}

  for(let key of keys) {
    if (key in object) res[key] = object[key]
  }

  return res
}

function sumByKey(objects: Array<Object>, key: string): number {
  return objects.reduce((sum, next) => next[key] + sum, 0)
}

function sliceRange<T>(arr: Array<T>, start: number, stop: number): Array<T> {
  return arr.slice(start, stop - start)
}

export {
  pick,
  toIndex,
  toCount,
  sumByKey,
  sliceRange,
  normalizeCount
}
