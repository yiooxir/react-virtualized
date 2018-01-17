import { Utils } from "./interfaces";
import defaultNCArgs = Utils.defaultNCArgs;
import NormalizeCountArgs = Utils.NormalizeCountArgs;

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
      count
  }
}

export {
  toIndex,
  toCount,
  normalizeCount
}
