// Browser-safe replacement for the `uniqid` package, which imports Node's `os`
// module and therefore gets externalized (with a warning) in a browser build.
let counter = 0

const uniqid = () => {
  counter += 1
  return `${Date.now().toString(36)}${counter.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export default uniqid
