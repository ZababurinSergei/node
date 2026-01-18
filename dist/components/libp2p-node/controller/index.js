// ../../node_modules/multiformats/dist/src/bytes.js
var empty = new Uint8Array(0);
function coerce(o2) {
  if (o2 instanceof Uint8Array && o2.constructor.name === "Uint8Array") {
    return o2;
  }
  if (o2 instanceof ArrayBuffer) {
    return new Uint8Array(o2);
  }
  if (ArrayBuffer.isView(o2)) {
    return new Uint8Array(o2.buffer, o2.byteOffset, o2.byteLength);
  }
  throw new Error("Unknown type, must be binary type");
}

// ../../node_modules/multiformats/dist/src/vendor/base-x.js
function base(ALPHABET, name) {
  if (ALPHABET.length >= 255) {
    throw new TypeError("Alphabet too long");
  }
  var BASE_MAP = new Uint8Array(256);
  for (var j = 0; j < BASE_MAP.length; j++) {
    BASE_MAP[j] = 255;
  }
  for (var i2 = 0; i2 < ALPHABET.length; i2++) {
    var x = ALPHABET.charAt(i2);
    var xc = x.charCodeAt(0);
    if (BASE_MAP[xc] !== 255) {
      throw new TypeError(x + " is ambiguous");
    }
    BASE_MAP[xc] = i2;
  }
  var BASE = ALPHABET.length;
  var LEADER = ALPHABET.charAt(0);
  var FACTOR = Math.log(BASE) / Math.log(256);
  var iFACTOR = Math.log(256) / Math.log(BASE);
  function encode2(source) {
    if (source instanceof Uint8Array)
      ;
    else if (ArrayBuffer.isView(source)) {
      source = new Uint8Array(source.buffer, source.byteOffset, source.byteLength);
    } else if (Array.isArray(source)) {
      source = Uint8Array.from(source);
    }
    if (!(source instanceof Uint8Array)) {
      throw new TypeError("Expected Uint8Array");
    }
    if (source.length === 0) {
      return "";
    }
    var zeroes = 0;
    var length = 0;
    var pbegin = 0;
    var pend = source.length;
    while (pbegin !== pend && source[pbegin] === 0) {
      pbegin++;
      zeroes++;
    }
    var size = (pend - pbegin) * iFACTOR + 1 >>> 0;
    var b58 = new Uint8Array(size);
    while (pbegin !== pend) {
      var carry = source[pbegin];
      var i3 = 0;
      for (var it1 = size - 1; (carry !== 0 || i3 < length) && it1 !== -1; it1--, i3++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i3;
      pbegin++;
    }
    var it2 = size - length;
    while (it2 !== size && b58[it2] === 0) {
      it2++;
    }
    var str = LEADER.repeat(zeroes);
    for (; it2 < size; ++it2) {
      str += ALPHABET.charAt(b58[it2]);
    }
    return str;
  }
  function decodeUnsafe(source) {
    if (typeof source !== "string") {
      throw new TypeError("Expected String");
    }
    if (source.length === 0) {
      return new Uint8Array();
    }
    var psz = 0;
    if (source[psz] === " ") {
      return;
    }
    var zeroes = 0;
    var length = 0;
    while (source[psz] === LEADER) {
      zeroes++;
      psz++;
    }
    var size = (source.length - psz) * FACTOR + 1 >>> 0;
    var b256 = new Uint8Array(size);
    while (source[psz]) {
      var carry = BASE_MAP[source.charCodeAt(psz)];
      if (carry === 255) {
        return;
      }
      var i3 = 0;
      for (var it3 = size - 1; (carry !== 0 || i3 < length) && it3 !== -1; it3--, i3++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length = i3;
      psz++;
    }
    if (source[psz] === " ") {
      return;
    }
    var it4 = size - length;
    while (it4 !== size && b256[it4] === 0) {
      it4++;
    }
    var vch = new Uint8Array(zeroes + (size - it4));
    var j2 = zeroes;
    while (it4 !== size) {
      vch[j2++] = b256[it4++];
    }
    return vch;
  }
  function decode2(string) {
    var buffer = decodeUnsafe(string);
    if (buffer) {
      return buffer;
    }
    throw new Error(`Non-${name} character`);
  }
  return {
    encode: encode2,
    decodeUnsafe,
    decode: decode2
  };
}
var src = base;
var _brrp__multiformats_scope_baseX = src;
var base_x_default = _brrp__multiformats_scope_baseX;

// ../../node_modules/multiformats/dist/src/bases/base.js
var Encoder = class {
  name;
  prefix;
  baseEncode;
  constructor(name, prefix, baseEncode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
  }
  encode(bytes) {
    if (bytes instanceof Uint8Array) {
      return `${this.prefix}${this.baseEncode(bytes)}`;
    } else {
      throw Error("Unknown type, must be binary type");
    }
  }
};
var Decoder = class {
  name;
  prefix;
  baseDecode;
  prefixCodePoint;
  constructor(name, prefix, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    const prefixCodePoint = prefix.codePointAt(0);
    if (prefixCodePoint === void 0) {
      throw new Error("Invalid prefix character");
    }
    this.prefixCodePoint = prefixCodePoint;
    this.baseDecode = baseDecode;
  }
  decode(text) {
    if (typeof text === "string") {
      if (text.codePointAt(0) !== this.prefixCodePoint) {
        throw Error(`Unable to decode multibase string ${JSON.stringify(text)}, ${this.name} decoder only supports inputs prefixed with ${this.prefix}`);
      }
      return this.baseDecode(text.slice(this.prefix.length));
    } else {
      throw Error("Can only multibase decode strings");
    }
  }
  or(decoder) {
    return or(this, decoder);
  }
};
var ComposedDecoder = class {
  decoders;
  constructor(decoders) {
    this.decoders = decoders;
  }
  or(decoder) {
    return or(this, decoder);
  }
  decode(input) {
    const prefix = input[0];
    const decoder = this.decoders[prefix];
    if (decoder != null) {
      return decoder.decode(input);
    } else {
      throw RangeError(`Unable to decode multibase string ${JSON.stringify(input)}, only inputs prefixed with ${Object.keys(this.decoders)} are supported`);
    }
  }
};
function or(left, right) {
  return new ComposedDecoder({
    ...left.decoders ?? { [left.prefix]: left },
    ...right.decoders ?? { [right.prefix]: right }
  });
}
var Codec = class {
  name;
  prefix;
  baseEncode;
  baseDecode;
  encoder;
  decoder;
  constructor(name, prefix, baseEncode, baseDecode) {
    this.name = name;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name, prefix, baseEncode);
    this.decoder = new Decoder(name, prefix, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
};
function from({ name, prefix, encode: encode2, decode: decode2 }) {
  return new Codec(name, prefix, encode2, decode2);
}
function baseX({ name, prefix, alphabet }) {
  const { encode: encode2, decode: decode2 } = base_x_default(alphabet, name);
  return from({
    prefix,
    name,
    encode: encode2,
    decode: (text) => coerce(decode2(text))
  });
}
function decode(string, alphabetIdx, bitsPerChar, name) {
  let end = string.length;
  while (string[end - 1] === "=") {
    --end;
  }
  const out = new Uint8Array(end * bitsPerChar / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i2 = 0; i2 < end; ++i2) {
    const value = alphabetIdx[string[i2]];
    if (value === void 0) {
      throw new SyntaxError(`Non-${name} character`);
    }
    buffer = buffer << bitsPerChar | value;
    bits += bitsPerChar;
    if (bits >= 8) {
      bits -= 8;
      out[written++] = 255 & buffer >> bits;
    }
  }
  if (bits >= bitsPerChar || (255 & buffer << 8 - bits) !== 0) {
    throw new SyntaxError("Unexpected end of data");
  }
  return out;
}
function encode(data, alphabet, bitsPerChar) {
  const pad = alphabet[alphabet.length - 1] === "=";
  const mask = (1 << bitsPerChar) - 1;
  let out = "";
  let bits = 0;
  let buffer = 0;
  for (let i2 = 0; i2 < data.length; ++i2) {
    buffer = buffer << 8 | data[i2];
    bits += 8;
    while (bits > bitsPerChar) {
      bits -= bitsPerChar;
      out += alphabet[mask & buffer >> bits];
    }
  }
  if (bits !== 0) {
    out += alphabet[mask & buffer << bitsPerChar - bits];
  }
  if (pad) {
    while ((out.length * bitsPerChar & 7) !== 0) {
      out += "=";
    }
  }
  return out;
}
function createAlphabetIdx(alphabet) {
  const alphabetIdx = {};
  for (let i2 = 0; i2 < alphabet.length; ++i2) {
    alphabetIdx[alphabet[i2]] = i2;
  }
  return alphabetIdx;
}
function rfc4648({ name, prefix, bitsPerChar, alphabet }) {
  const alphabetIdx = createAlphabetIdx(alphabet);
  return from({
    prefix,
    name,
    encode(input) {
      return encode(input, alphabet, bitsPerChar);
    },
    decode(input) {
      return decode(input, alphabetIdx, bitsPerChar, name);
    }
  });
}

// ../../node_modules/multiformats/dist/src/bases/base32.js
var base32 = rfc4648({
  prefix: "b",
  name: "base32",
  alphabet: "abcdefghijklmnopqrstuvwxyz234567",
  bitsPerChar: 5
});
var base32upper = rfc4648({
  prefix: "B",
  name: "base32upper",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567",
  bitsPerChar: 5
});
var base32pad = rfc4648({
  prefix: "c",
  name: "base32pad",
  alphabet: "abcdefghijklmnopqrstuvwxyz234567=",
  bitsPerChar: 5
});
var base32padupper = rfc4648({
  prefix: "C",
  name: "base32padupper",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567=",
  bitsPerChar: 5
});
var base32hex = rfc4648({
  prefix: "v",
  name: "base32hex",
  alphabet: "0123456789abcdefghijklmnopqrstuv",
  bitsPerChar: 5
});
var base32hexupper = rfc4648({
  prefix: "V",
  name: "base32hexupper",
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
  bitsPerChar: 5
});
var base32hexpad = rfc4648({
  prefix: "t",
  name: "base32hexpad",
  alphabet: "0123456789abcdefghijklmnopqrstuv=",
  bitsPerChar: 5
});
var base32hexpadupper = rfc4648({
  prefix: "T",
  name: "base32hexpadupper",
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUV=",
  bitsPerChar: 5
});
var base32z = rfc4648({
  prefix: "h",
  name: "base32z",
  alphabet: "ybndrfg8ejkmcpqxot1uwisza345h769",
  bitsPerChar: 5
});

// ../../node_modules/multiformats/dist/src/bases/base58.js
var base58btc = baseX({
  name: "base58btc",
  prefix: "z",
  alphabet: "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
});
var base58flickr = baseX({
  name: "base58flickr",
  prefix: "Z",
  alphabet: "123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ"
});

// ../../node_modules/multiformats/dist/src/bases/base64.js
var base64 = rfc4648({
  prefix: "m",
  name: "base64",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
  bitsPerChar: 6
});
var base64pad = rfc4648({
  prefix: "M",
  name: "base64pad",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  bitsPerChar: 6
});
var base64url = rfc4648({
  prefix: "u",
  name: "base64url",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_",
  bitsPerChar: 6
});
var base64urlpad = rfc4648({
  prefix: "U",
  name: "base64urlpad",
  alphabet: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_=",
  bitsPerChar: 6
});

// ../../node_modules/weald/node_modules/ms/dist/index.js
var e = 1e3;
var t = e * 60;
var n = t * 60;
var r = n * 24;
var i = r * 7;
var a = r * 365.25;
var o = a / 12;
function s(e2, t2) {
  if (typeof e2 == `string`) return l(e2);
  if (typeof e2 == `number`) return p(e2, t2);
  throw Error(`Value provided to ms() must be a string or number. value=${JSON.stringify(e2)}`);
}
var c = s;
function l(s2) {
  if (typeof s2 != `string` || s2.length === 0 || s2.length > 100) throw Error(`Value provided to ms.parse() must be a string with length between 1 and 99. value=${JSON.stringify(s2)}`);
  let c2 = /^(?<value>-?\d*\.?\d+) *(?<unit>milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|months?|mo|years?|yrs?|y)?$/i.exec(s2);
  if (!c2?.groups) return NaN;
  let { value: l2, unit: u = `ms` } = c2.groups, d2 = parseFloat(l2), f2 = u.toLowerCase();
  switch (f2) {
    case `years`:
    case `year`:
    case `yrs`:
    case `yr`:
    case `y`:
      return d2 * a;
    case `months`:
    case `month`:
    case `mo`:
      return d2 * o;
    case `weeks`:
    case `week`:
    case `w`:
      return d2 * i;
    case `days`:
    case `day`:
    case `d`:
      return d2 * r;
    case `hours`:
    case `hour`:
    case `hrs`:
    case `hr`:
    case `h`:
      return d2 * n;
    case `minutes`:
    case `minute`:
    case `mins`:
    case `min`:
    case `m`:
      return d2 * t;
    case `seconds`:
    case `second`:
    case `secs`:
    case `sec`:
    case `s`:
      return d2 * e;
    case `milliseconds`:
    case `millisecond`:
    case `msecs`:
    case `msec`:
    case `ms`:
      return d2;
    default:
      throw Error(`Unknown unit "${f2}" provided to ms.parse(). value=${JSON.stringify(s2)}`);
  }
}
function d(s2) {
  let c2 = Math.abs(s2);
  return c2 >= a ? `${Math.round(s2 / a)}y` : c2 >= o ? `${Math.round(s2 / o)}mo` : c2 >= i ? `${Math.round(s2 / i)}w` : c2 >= r ? `${Math.round(s2 / r)}d` : c2 >= n ? `${Math.round(s2 / n)}h` : c2 >= t ? `${Math.round(s2 / t)}m` : c2 >= e ? `${Math.round(s2 / e)}s` : `${s2}ms`;
}
function f(s2) {
  let c2 = Math.abs(s2);
  return c2 >= a ? m(s2, c2, a, `year`) : c2 >= o ? m(s2, c2, o, `month`) : c2 >= i ? m(s2, c2, i, `week`) : c2 >= r ? m(s2, c2, r, `day`) : c2 >= n ? m(s2, c2, n, `hour`) : c2 >= t ? m(s2, c2, t, `minute`) : c2 >= e ? m(s2, c2, e, `second`) : `${s2} ms`;
}
function p(e2, t2) {
  if (typeof e2 != `number` || !Number.isFinite(e2)) throw Error(`Value provided to ms.format() must be of type number.`);
  return t2?.long ? f(e2) : d(e2);
}
function m(e2, t2, n2, r2) {
  let i2 = t2 >= n2 * 1.5;
  return `${Math.round(e2 / n2)} ${r2}${i2 ? `s` : ``}`;
}

// ../../node_modules/weald/dist/src/common.js
function setup(env) {
  createDebug.debug = createDebug;
  createDebug.default = createDebug;
  createDebug.coerce = coerce2;
  createDebug.disable = disable;
  createDebug.enable = enable;
  createDebug.enabled = enabled;
  createDebug.humanize = c;
  createDebug.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug[key] = env[key];
  });
  createDebug.names = [];
  createDebug.skips = [];
  createDebug.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i2 = 0; i2 < namespace.length; i2++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i2);
      hash |= 0;
    }
    return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
  }
  createDebug.selectColor = selectColor;
  function createDebug(namespace, options) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self = debug;
      const curr = Number(/* @__PURE__ */ new Date());
      const ms = curr - (prevTime || curr);
      self.diff = ms;
      self.prev = prevTime;
      self.curr = curr;
      prevTime = curr;
      args[0] = createDebug.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug.formatArgs.call(self, args);
      if (options?.onLog != null) {
        options.onLog(...args);
      }
      const logFn = self.log || createDebug.log;
      logFn.apply(self, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug.useColors();
    debug.color = createDebug.selectColor(namespace);
    debug.extend = extend;
    debug.destroy = createDebug.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug.namespaces) {
          namespacesCache = createDebug.namespaces;
          enabledCache = createDebug.enabled(namespace);
        }
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug.init === "function") {
      createDebug.init(debug);
    }
    return debug;
  }
  function extend(namespace, delimiter) {
    const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug.save(namespaces);
    createDebug.namespaces = namespaces;
    createDebug.names = [];
    createDebug.skips = [];
    let i2;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i2 = 0; i2 < len; i2++) {
      if (!split[i2]) {
        continue;
      }
      namespaces = split[i2].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
      } else {
        createDebug.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug.names.map(toNamespace),
      ...createDebug.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i2;
    let len;
    for (i2 = 0, len = createDebug.skips.length; i2 < len; i2++) {
      if (createDebug.skips[i2].test(name)) {
        return false;
      }
    }
    for (i2 = 0, len = createDebug.names.length; i2 < len; i2++) {
      if (createDebug.names[i2].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce2(val) {
    if (val instanceof Error) {
      return val.stack ?? val.message;
    }
    return val;
  }
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug.setupFormatters(createDebug.formatters);
  createDebug.enable(createDebug.load());
  return createDebug;
}

// ../../node_modules/weald/dist/src/browser.js
var storage = localstorage();
var colors = [
  "#0000CC",
  "#0000FF",
  "#0033CC",
  "#0033FF",
  "#0066CC",
  "#0066FF",
  "#0099CC",
  "#0099FF",
  "#00CC00",
  "#00CC33",
  "#00CC66",
  "#00CC99",
  "#00CCCC",
  "#00CCFF",
  "#3300CC",
  "#3300FF",
  "#3333CC",
  "#3333FF",
  "#3366CC",
  "#3366FF",
  "#3399CC",
  "#3399FF",
  "#33CC00",
  "#33CC33",
  "#33CC66",
  "#33CC99",
  "#33CCCC",
  "#33CCFF",
  "#6600CC",
  "#6600FF",
  "#6633CC",
  "#6633FF",
  "#66CC00",
  "#66CC33",
  "#9900CC",
  "#9900FF",
  "#9933CC",
  "#9933FF",
  "#99CC00",
  "#99CC33",
  "#CC0000",
  "#CC0033",
  "#CC0066",
  "#CC0099",
  "#CC00CC",
  "#CC00FF",
  "#CC3300",
  "#CC3333",
  "#CC3366",
  "#CC3399",
  "#CC33CC",
  "#CC33FF",
  "#CC6600",
  "#CC6633",
  "#CC9900",
  "#CC9933",
  "#CCCC00",
  "#CCCC33",
  "#FF0000",
  "#FF0033",
  "#FF0066",
  "#FF0099",
  "#FF00CC",
  "#FF00FF",
  "#FF3300",
  "#FF3333",
  "#FF3366",
  "#FF3399",
  "#FF33CC",
  "#FF33FF",
  "#FF6600",
  "#FF6633",
  "#FF9900",
  "#FF9933",
  "#FFCC00",
  "#FFCC33"
];
function useColors() {
  if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
    return true;
  }
  if (typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/(edge|trident)\/(\d+)/) != null) {
    return false;
  }
  return typeof document !== "undefined" && document.documentElement?.style?.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
  // @ts-expect-error window.console.firebug and window.console.exception are not in the types
  typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
  // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
  typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/firefox\/(\d+)/) != null && parseInt(RegExp.$1, 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
  typeof navigator !== "undefined" && navigator.userAgent?.toLowerCase().match(/applewebkit\/(\d+)/);
}
function formatArgs(args) {
  args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + c(this.diff);
  if (!this.useColors) {
    return;
  }
  const c2 = "color: " + this.color;
  args.splice(1, 0, c2, "color: inherit");
  let index = 0;
  let lastC = 0;
  args[0].replace(/%[a-zA-Z%]/g, (match) => {
    if (match === "%%") {
      return;
    }
    index++;
    if (match === "%c") {
      lastC = index;
    }
  });
  args.splice(lastC, 0, c2);
}
var log = console.debug ?? console.log ?? (() => {
});
function save(namespaces) {
  try {
    if (namespaces) {
      storage?.setItem("debug", namespaces);
    } else {
      storage?.removeItem("debug");
    }
  } catch (error) {
  }
}
function load() {
  let r2;
  try {
    r2 = storage?.getItem("debug");
  } catch (error) {
  }
  if (!r2 && typeof globalThis.process !== "undefined" && "env" in globalThis.process) {
    r2 = globalThis.process.env.DEBUG;
  }
  return r2;
}
function localstorage() {
  try {
    return localStorage;
  } catch (error) {
  }
}
function setupFormatters(formatters) {
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
}
var browser_default = setup({ formatArgs, save, load, useColors, setupFormatters, colors, storage, log });

// ../../node_modules/weald/dist/src/index.js
var src_default = browser_default;

// ../../node_modules/@libp2p/logger/dist/src/index.js
src_default.formatters.b = (v) => {
  return v == null ? "undefined" : base58btc.baseEncode(v);
};
src_default.formatters.t = (v) => {
  return v == null ? "undefined" : base32.baseEncode(v);
};
src_default.formatters.m = (v) => {
  return v == null ? "undefined" : base64.baseEncode(v);
};
src_default.formatters.p = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.c = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.k = (v) => {
  return v == null ? "undefined" : v.toString();
};
src_default.formatters.a = (v) => {
  return v == null ? "undefined" : v.toString();
};
function formatError(v, indent = "") {
  const message = notEmpty(v.message);
  const stack = notEmpty(v.stack);
  if (message != null && stack != null) {
    if (stack.includes(message)) {
      return `${stack.split("\n").join(`
${indent}`)}`;
    }
    return `${message}
${indent}${stack.split("\n").join(`
${indent}`)}`;
  }
  if (stack != null) {
    return `${stack.split("\n").join(`
${indent}`)}`;
  }
  if (message != null) {
    return `${message}`;
  }
  return `${v.toString()}`;
}
function isAggregateError(err) {
  return err instanceof AggregateError || err?.name === "AggregateError" && Array.isArray(err.errors);
}
function printError(err, indent = "") {
  if (isAggregateError(err)) {
    let output = formatError(err, indent);
    if (err.errors.length > 0) {
      indent = `${indent}    `;
      output += `
${indent}${err.errors.map((err2) => `${printError(err2, `${indent}`)}`).join(`
${indent}`)}`;
    } else {
      output += `
${indent}[Error list was empty]`;
    }
    return output.trim();
  }
  return formatError(err, indent);
}
src_default.formatters.e = (v) => {
  if (v == null) {
    return "undefined";
  }
  return printError(v);
};
function createDisabledLogger(namespace) {
  const logger2 = () => {
  };
  logger2.enabled = false;
  logger2.color = "";
  logger2.diff = 0;
  logger2.log = () => {
  };
  logger2.namespace = namespace;
  logger2.destroy = () => true;
  logger2.extend = () => logger2;
  return logger2;
}
function logger(name, options) {
  let trace = createDisabledLogger(`${name}:trace`);
  if (src_default.enabled(`${name}:trace`) && src_default.names.map((r2) => r2.toString()).find((n2) => n2.includes(":trace")) != null) {
    trace = src_default(`${name}:trace`, options);
  }
  return Object.assign(src_default(name, options), {
    error: src_default(`${name}:error`, options),
    trace,
    newScope: (scope) => logger(`${name}:${scope}`, options)
  });
}
function notEmpty(str) {
  if (str == null) {
    return;
  }
  str = str.trim();
  if (str.length === 0) {
    return;
  }
  return str;
}

// src/logger/logger.ts
var COLORS = {
  WARN: "\x1B[33m",
  // Темно-желтый
  INFO: "\x1B[36m",
  // Голубой
  DEBUG: "\x1B[90m",
  // Серый
  ERROR: "\x1B[31m",
  // Красный
  RESET: "\x1B[0m"
  // Сброс
};
function createLogger(prefix) {
  const baseLogger = logger(prefix);
  const enhancedLogger = (...args) => {
    if (args.length === 0) {
      baseLogger("");
    } else {
      const message = args.map(
        (arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      baseLogger(message);
    }
  };
  enhancedLogger.trace = baseLogger.trace;
  enhancedLogger.warn = (...args) => {
    baseLogger(`${COLORS.WARN}⚠️ WARN:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.info = (...args) => {
    baseLogger(`${COLORS.INFO}ℹ️ INFO:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.debug = (...args) => {
    baseLogger(`${COLORS.DEBUG}🔍 DEBUG:${COLORS.RESET}`, ...args);
  };
  enhancedLogger.error = (...args) => {
    baseLogger(`${COLORS.ERROR}❌ ERROR:${COLORS.RESET}`, ...args);
  };
  return enhancedLogger;
}

// src/components/libp2p-node/controller/index.ts
var log2 = createLogger("libp2p-node:controller");
var controller = (context) => {
  let eventListeners = [];
  let updateInterval = null;
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  const startStatsUpdate = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
    updateInterval = window.setInterval(async () => {
      try {
        await updateNodeStats();
      } catch (error) {
        console.error("Error updating node stats:", error);
      }
    }, 5e3);
  };
  const stopStatsUpdate = () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  };
  const updateNodeStats = async () => {
    if (!context.isNodeActive()) {
      return;
    }
    try {
      const state = context.getState();
      try {
        const dhtStats = state.dhtStats || {};
        if (dhtStats) {
        }
      } catch (dhtError) {
        log2.debug("DHT stats not available:", dhtError);
      }
    } catch (error) {
      console.error("Error in stats update:", error);
    }
  };
  const updateDHTStatsUI = async (dhtStats) => {
    const dhtTypes = ["lan", "amino", "universe"];
    for (const dhtType of dhtTypes) {
      const stats = dhtStats[dhtType];
      if (stats) {
      }
    }
  };
  const handleStartNode = async () => {
    log2("Starting libp2p node...");
    await context.updateElement({
      selector: ".btn-start",
      value: true,
      property: "disabled"
    });
    await context.updateElement({
      selector: ".btn-start .btn-text",
      value: "Starting...",
      property: "textContent"
    });
    try {
      if (context.isNodeActive()) {
        log2("Node already running");
        await context.updateElement({
          selector: ".btn-start .btn-text",
          value: "Already Running",
          property: "textContent"
        });
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      } else {
        await context._actions.startNode();
      }
      await context.updateElement({
        selector: ".btn-start",
        value: true,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-stop",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-discover",
        value: false,
        property: "disabled"
      });
    } catch (error) {
      log2.error("Failed to start node:", error);
      await context.updateElement({
        selector: ".btn-start",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-start .btn-text",
        value: "Start Node",
        property: "textContent"
      });
      await context.showModal({
        title: "Start Failed",
        content: `Failed to start node: ${error}`,
        buttons: [{ text: "OK", type: "primary" }]
      });
    } finally {
      await context.updateElement({
        selector: ".btn-start .btn-text",
        value: "Start Node",
        property: "textContent"
      });
      await context.updateElement({
        selector: ".btn-start",
        value: false,
        property: "disabled"
      });
    }
  };
  const handleStopNode = async () => {
    log2("Stopping libp2p node...");
    await context.updateElement({
      selector: ".btn-stop",
      value: true,
      property: "disabled"
    });
    await context.updateElement({
      selector: ".btn-stop .btn-text",
      value: "Stopping...",
      property: "textContent"
    });
    try {
      if (!context.isNodeActive()) {
        log2("Node not running");
        await context.updateElement({
          selector: ".btn-stop .btn-text",
          value: "Not Running",
          property: "textContent"
        });
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      } else {
        await context._actions.stopNode();
        stopStatsUpdate();
      }
      await context.updateElement({
        selector: ".btn-start",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-stop",
        value: true,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-discover",
        value: true,
        property: "disabled"
      });
    } catch (error) {
      log2.error("Failed to stop node:", error);
      await context.updateElement({
        selector: ".btn-stop",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-stop .btn-text",
        value: "Stop Node",
        property: "textContent"
      });
      await context.showModal({
        title: "Stop Failed",
        content: `Failed to stop node: ${error}`,
        buttons: [{ text: "OK", type: "primary" }]
      });
    } finally {
      await context.updateElement({
        selector: ".btn-stop .btn-text",
        value: "Stop Node",
        property: "textContent"
      });
      await context.updateElement({
        selector: ".btn-stop",
        value: false,
        property: "disabled"
      });
    }
  };
  const handleDiscoverPeers = async () => {
    log2("Starting peer discovery...");
    await context.updateElement({
      selector: ".btn-discover",
      value: true,
      property: "disabled"
    });
    await context.updateElement({
      selector: ".btn-discover .btn-text",
      value: "Discovering...",
      property: "textContent"
    });
    try {
      if (!context.isNodeActive()) {
        throw new Error("Node is not running. Start the node first.");
      }
      await context._actions.discoverPeers();
      await context.showModal({
        title: "Success",
        content: "Peer discovery completed successfully",
        buttons: [{ text: "OK", type: "primary" }]
      });
    } catch (error) {
      log2.error("Peer discovery failed:", error);
      await context.showModal({
        title: "Error",
        content: `Peer discovery failed: ${error}`,
        buttons: [{ text: "OK", type: "primary" }]
      });
    } finally {
      await context.updateElement({
        selector: ".btn-discover .btn-text",
        value: "Discover Peers",
        property: "textContent"
      });
      await context.updateElement({
        selector: ".btn-discover",
        value: false,
        property: "disabled"
      });
    }
  };
  const handleClearLogs = async () => {
    await context._actions.clearLogs();
    await context.showModal({
      title: "Success",
      content: "Logs cleared successfully",
      buttons: [{ text: "OK", type: "primary" }]
    });
  };
  const handleCopyPeerId = async () => {
    try {
      const state = context.getState();
      const peerId = state.peerId;
      if (peerId) {
        await navigator.clipboard.writeText(peerId);
        await context.showModal({
          title: "Copied",
          content: "Peer ID copied to clipboard",
          buttons: [{ text: "OK", type: "primary" }]
        });
      } else {
        throw new Error("Peer ID not available. Start the node first.");
      }
    } catch (error) {
      log2.error("Failed to copy peer ID:", error);
      await context.showModal({
        title: "Error",
        content: "Failed to copy Peer ID. Make sure the node is running.",
        buttons: [{ text: "OK", type: "primary" }]
      });
    }
  };
  const setupKeyboardShortcuts = () => {
    addEventListener(window, "keydown", (e2) => {
      const keyboardEvent = e2;
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "s") {
        e2.preventDefault();
        if (!context.isNodeActive()) {
          handleStartNode().catch((e3) => {
            console.log(e3);
          });
        }
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "q") {
        e2.preventDefault();
        if (context.isNodeActive()) {
          handleStopNode().catch((e3) => {
            console.log(e3);
          });
        }
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "d") {
        e2.preventDefault();
        if (context.isNodeActive()) {
          handleDiscoverPeers().catch((e3) => {
            console.log(e3);
          });
        }
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "l") {
        e2.preventDefault();
        handleClearLogs().catch((e3) => {
          console.log(e3);
        });
      }
      if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
        e2.preventDefault();
        if (context.isNodeActive()) {
          handleCopyPeerId();
        }
      }
    });
  };
  const setupContextMenu = () => {
    addEventListener(context.shadowRoot, "contextmenu", (e2) => {
      e2.preventDefault();
      const target = e2.target;
      if (target.classList.contains("peer-id")) {
        const menu = document.createElement("div");
        menu.className = "context-menu";
        menu.style.cssText = `
          position: fixed;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          box-shadow: var(--shadow-lg);
          z-index: 10000;
          min-width: 200px;
          padding: 8px 0;
        `;
        const copyItem = document.createElement("div");
        copyItem.className = "context-menu-item";
        copyItem.textContent = "Copy Peer ID";
        copyItem.style.cssText = `
          padding: 8px 16px;
          cursor: pointer;
          transition: var(--transition);
        `;
        copyItem.onmouseover = () => {
          copyItem.style.background = "var(--surface-100)";
        };
        copyItem.onmouseout = () => {
          copyItem.style.background = "transparent";
        };
        copyItem.onclick = async () => {
          menu.remove();
          await handleCopyPeerId();
        };
        menu.appendChild(copyItem);
        const rect = target.getBoundingClientRect();
        menu.style.left = `${rect.left}px`;
        menu.style.top = `${rect.bottom + 5}px`;
        document.body.appendChild(menu);
        const closeMenu = (event) => {
          if (!menu.contains(event.target)) {
            menu.remove();
            document.removeEventListener("click", closeMenu);
          }
        };
        setTimeout(() => {
          document.addEventListener("click", closeMenu);
        }, 0);
      }
    });
  };
  const setupDragAndDrop = () => {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialX = 0;
    let initialY = 0;
    const header = context.shadowRoot.querySelector(".header");
    if (!header) return;
    header.style.cursor = "move";
    header.style.userSelect = "none";
    addEventListener(header, "mousedown", (e2) => {
      const mouseEvent = e2;
      isDragging = true;
      startX = mouseEvent.clientX;
      startY = mouseEvent.clientY;
      const rect = context.getBoundingClientRect();
      initialX = rect.left;
      initialY = rect.top;
      e2.preventDefault();
    });
    addEventListener(document, "mousemove", (e2) => {
      if (!isDragging) return;
      const mouseEvent = e2;
      const deltaX = mouseEvent.clientX - startX;
      const deltaY = mouseEvent.clientY - startY;
      context.style.position = "fixed";
      context.style.left = `${initialX + deltaX}px`;
      context.style.top = `${initialY + deltaY}px`;
      context.style.zIndex = "1000";
    });
    addEventListener(document, "mouseup", () => {
      isDragging = false;
    });
    addEventListener(document, "keydown", (e2) => {
      const keyboardEvent = e2;
      if (keyboardEvent.key === "Escape" && isDragging) {
        isDragging = false;
        context.style.position = "";
        context.style.left = "";
        context.style.top = "";
        context.style.zIndex = "";
      }
    });
  };
  const setupResizeHandler = () => {
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, var(--primary) 50%);
      opacity: 0.5;
      transition: opacity 0.2s;
    `;
    context.shadowRoot.appendChild(resizeHandle);
    let isResizing = false;
    let startWidth = 0;
    let startHeight = 0;
    let startX = 0;
    let startY = 0;
    addEventListener(resizeHandle, "mousedown", (e2) => {
      const mouseEvent = e2;
      isResizing = true;
      startWidth = context.offsetWidth;
      startHeight = context.offsetHeight;
      startX = mouseEvent.clientX;
      startY = mouseEvent.clientY;
      e2.preventDefault();
    });
    addEventListener(document, "mousemove", (e2) => {
      if (!isResizing) return;
      const mouseEvent = e2;
      const deltaX = mouseEvent.clientX - startX;
      const deltaY = mouseEvent.clientY - startY;
      const newWidth = Math.max(300, startWidth + deltaX);
      const newHeight = Math.max(400, startHeight + deltaY);
      context.style.width = `${newWidth}px`;
      context.style.height = `${newHeight}px`;
    });
    addEventListener(document, "mouseup", () => {
      isResizing = false;
    });
    addEventListener(resizeHandle, "mouseenter", () => {
      resizeHandle.style.opacity = "1";
    });
    addEventListener(resizeHandle, "mouseleave", () => {
      if (!isResizing) {
        resizeHandle.style.opacity = "0.5";
      }
    });
  };
  return {
    async init() {
      log2("Initializing libp2p node controller...");
      addEventListener(context.shadowRoot, "click", async (e2) => {
        const target = e2.target;
        const button = target.closest("button[data-action]");
        if (!button) return;
        const action = button.getAttribute("data-action");
        switch (action) {
          case "start":
            await handleStartNode();
            break;
          case "stop":
            await handleStopNode();
            break;
          case "discover":
            await handleDiscoverPeers();
            break;
          case "clear-logs":
            await handleClearLogs();
            break;
          case "copy-peer-id":
            await handleCopyPeerId();
            break;
        }
      });
      addEventListener(context.shadowRoot, "dblclick", (e2) => {
        const target = e2.target;
        if (target.closest(".header")) {
          context.style.position = "";
          context.style.left = "";
          context.style.top = "";
          context.style.width = "";
          context.style.height = "";
          context.style.zIndex = "";
        }
      });
      addEventListener(window, "libp2p:start", () => {
        if (!context.isNodeActive()) {
          handleStartNode();
        }
      });
      addEventListener(window, "libp2p:stop", () => {
        if (context.isNodeActive()) {
          handleStopNode();
        }
      });
      addEventListener(window, "libp2p:discover", () => {
        if (context.isNodeActive()) {
          handleDiscoverPeers();
        }
      });
      addEventListener(document, "visibilitychange", () => {
        if (document.hidden && context.isNodeActive()) {
          log2("Page hidden, pausing stats updates");
          stopStatsUpdate();
        } else if (!document.hidden && context.isNodeActive()) {
          log2("Page visible, resuming stats updates");
          startStatsUpdate();
        }
      });
      addEventListener(window, "online", () => {
        log2("Network connection restored");
        if (context.isNodeActive()) {
          context.addLogToBuffer?.("Network connection restored", "info");
        }
      });
      addEventListener(window, "offline", () => {
        log2("Network connection lost");
        if (context.isNodeActive()) {
          context.addLogToBuffer?.("Network connection lost", "warn");
        }
      });
      setupKeyboardShortcuts();
      setupContextMenu();
      await context.updateElement({
        selector: ".btn-start",
        value: false,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-stop",
        value: true,
        property: "disabled"
      });
      await context.updateElement({
        selector: ".btn-discover",
        value: true,
        property: "disabled"
      });
      if (!context.shadowRoot.querySelector(".btn-copy-peer-id")) {
        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-secondary btn-copy-peer-id";
        copyBtn.setAttribute("data-action", "copy-peer-id");
        copyBtn.innerHTML = `
          <span class="btn-icon">📋</span>
          <span class="btn-text">Copy Peer ID</span>
        `;
        const controls = context.shadowRoot.querySelector(".controls");
        if (controls) {
          controls.appendChild(copyBtn);
          addEventListener(copyBtn, "click", async () => {
            await handleCopyPeerId();
          });
        }
      }
      log2("Libp2p node controller initialized successfully");
    },
    async destroy() {
      log2("Destroying libp2p node controller...");
      stopStatsUpdate();
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      eventListeners = [];
      const contextMenu = document.querySelector(".context-menu");
      if (contextMenu) {
        contextMenu.remove();
      }
      log2("Libp2p node controller destroyed");
    }
  };
};
export {
  controller
};
//# sourceMappingURL=index.js.map
