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
  constructor(name, prefix2, baseEncode) {
    this.name = name;
    this.prefix = prefix2;
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
  constructor(name, prefix2, baseDecode) {
    this.name = name;
    this.prefix = prefix2;
    const prefixCodePoint = prefix2.codePointAt(0);
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
    const prefix2 = input[0];
    const decoder = this.decoders[prefix2];
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
  constructor(name, prefix2, baseEncode, baseDecode) {
    this.name = name;
    this.prefix = prefix2;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name, prefix2, baseEncode);
    this.decoder = new Decoder(name, prefix2, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
};
function from({ name, prefix: prefix2, encode: encode2, decode: decode2 }) {
  return new Codec(name, prefix2, encode2, decode2);
}
function baseX({ name, prefix: prefix2, alphabet }) {
  const { encode: encode2, decode: decode2 } = base_x_default(alphabet, name);
  return from({
    prefix: prefix2,
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
function rfc4648({ name, prefix: prefix2, bitsPerChar, alphabet }) {
  const alphabetIdx = createAlphabetIdx(alphabet);
  return from({
    prefix: prefix2,
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
function createLogger(prefix2) {
  const baseLogger = logger(prefix2);
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

// src/base/base-component.ts
var cssModule = false;
async function loadCSSModule() {
  try {
    cssModule = await import("virtual:css");
  } catch (e2) {
  }
}
var cssModuleInitialized = false;
async function ensureCSSModule() {
  if (!cssModuleInitialized) {
    await loadCSSModule();
    cssModuleInitialized = true;
  }
}
var prefix = "wc";
var log2 = createLogger(`${prefix}:base-component`);
var exclusion = [];
var BaseComponent = class _BaseComponent extends HTMLElement {
  static pendingRequests = /* @__PURE__ */ new Map();
  static observedAttributes = ["*"];
  static MAX_POLLING_INTERVAL = 100;
  // ms
  static errorStore = [];
  static ERROR_STORE_LIMIT = 10;
  // Лимит записей
  _templateMethods;
  _controller;
  _actions;
  state = {};
  createLogger;
  getComponentAsync;
  addError;
  getErrors;
  clearErrors;
  pendingRequests;
  #templateImported = false;
  #isLoading = false;
  #id;
  constructor() {
    super();
    if (new.target === _BaseComponent) {
      throw new Error("ЯТО-ABS1: Нельзя инстанциировать BaseComponent напрямую");
    }
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" });
    }
    this.#templateImported = false;
    this.createLogger = createLogger;
    this.getComponentAsync = _BaseComponent.getComponentAsync;
    this.addError = _BaseComponent.addError;
    this.getErrors = _BaseComponent.getErrors;
    this.clearErrors = _BaseComponent.clearErrors;
    this.pendingRequests = _BaseComponent.pendingRequests;
    this.#id = _BaseComponent.generateId();
    this.#isLoading = false;
    log2(`Создан экземпляр ${this.constructor.name} с ID: ${this.#id}`);
  }
  /**
   * Добавляет ошибку в статическое хранилище ошибок.
   */
  static addError(errorData) {
    const errorEntry = {
      timestamp: Date.now(),
      ...errorData
    };
    _BaseComponent.errorStore.unshift(errorEntry);
    if (_BaseComponent.errorStore.length > _BaseComponent.ERROR_STORE_LIMIT) {
      _BaseComponent.errorStore = _BaseComponent.errorStore.slice(0, _BaseComponent.ERROR_STORE_LIMIT);
    }
    console.error(`Ошибка добавлена в хранилище. Всего записей: ${_BaseComponent.errorStore.length}`, errorEntry);
  }
  /**
   * Получает копию текущего хранилища ошибок.
   */
  static getErrors() {
    return [..._BaseComponent.errorStore];
  }
  /**
   * Очищает хранилище ошибок.
   */
  static clearErrors() {
    _BaseComponent.errorStore = [];
    log2("Хранилище ошибок очищено.");
  }
  /**
   * Отображает универсальное модальное окно.
   */
  async showModal(options = {}) {
    const {
      title = "Информация",
      content = "",
      buttons = [],
      closeOnBackdropClick = true
    } = options;
    return new Promise((resolve) => {
      const modalBackdrop = document.createElement("div");
      modalBackdrop.className = "yato-modal-backdrop";
      const currentModal = document.body.querySelector(".yato-modal-backdrop");
      if (currentModal) {
        currentModal.remove();
      }
      const closeModal = () => {
        if (modalBackdrop.parentNode) {
          modalBackdrop.parentNode.removeChild(modalBackdrop);
        }
        resolve();
      };
      const modalWrapper = document.createElement("div");
      modalWrapper.className = "yato-modal-wrapper";
      modalWrapper.setAttribute("role", "dialog");
      modalWrapper.setAttribute("aria-modal", "true");
      modalWrapper.setAttribute("aria-labelledby", "yato-modal-title");
      const modalContent = document.createElement("div");
      modalContent.className = "yato-modal-content";
      const modalHeader = document.createElement("div");
      modalHeader.className = "yato-modal-header";
      const modalTitle = document.createElement("h3");
      modalTitle.id = "yato-modal-title";
      modalTitle.className = "yato-modal-title";
      modalTitle.textContent = title;
      const modalCloseButton = document.createElement("button");
      modalCloseButton.type = "button";
      modalCloseButton.className = "yato-modal-close-button";
      modalCloseButton.setAttribute("aria-label", "Закрыть");
      modalCloseButton.innerHTML = "&times;";
      const modalBody = document.createElement("div");
      modalBody.className = "yato-modal-body";
      modalBody.innerHTML = content;
      const modalFooter = document.createElement("div");
      modalFooter.className = "yato-modal-footer";
      modalHeader.appendChild(modalTitle);
      modalHeader.appendChild(modalCloseButton);
      modalContent.appendChild(modalHeader);
      modalContent.appendChild(modalBody);
      if (buttons && buttons.length > 0) {
        buttons.forEach((btnConfig) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = `yato-button ${btnConfig.type ? btnConfig.type : "secondary"}`;
          button.textContent = btnConfig.text || "OK";
          button.onclick = () => {
            if (typeof btnConfig.action === "function") {
              try {
                btnConfig.action();
              } catch (e2) {
                console.error("Ошибка в обработчике кнопки модального окна:", e2);
              }
            }
            closeModal();
          };
          modalFooter.appendChild(button);
        });
        modalContent.appendChild(modalFooter);
      } else {
        const defaultCloseButton = document.createElement("button");
        defaultCloseButton.type = "button";
        defaultCloseButton.className = "yato-button primary";
        defaultCloseButton.textContent = "Закрыть";
        defaultCloseButton.onclick = closeModal;
        modalFooter.appendChild(defaultCloseButton);
        modalContent.appendChild(modalFooter);
      }
      modalWrapper.appendChild(modalContent);
      modalBackdrop.appendChild(modalWrapper);
      modalCloseButton.onclick = closeModal;
      if (closeOnBackdropClick !== false) {
        modalBackdrop.onclick = (event) => {
          if (event.target === modalBackdrop) {
            closeModal();
          }
        };
      }
      const handleKeyDown = (event) => {
        if (event.key === "Escape") {
          closeModal();
          document.removeEventListener("keydown", handleKeyDown);
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      document.body.appendChild(modalBackdrop);
    });
  }
  static generateId() {
    return "yato-" + Math.random().toString(36).substr(2, 9);
  }
  async connectedCallback() {
    try {
      log2(`${this.constructor.name} подключается к DOM.`);
      await this.#initComponent();
      log2(`${this.constructor.name} готов.`);
    } catch (error) {
      console.error(`Ошибка в connectedCallback для ${this.constructor.name}:`, error);
      await this.#render({ state: { error: error.message } });
    }
  }
  async disconnectedCallback() {
    log2(`${this.constructor.name} отключен от DOM.`);
    await this._componentDisconnected();
  }
  async adoptedCallback() {
    log2(`${this.constructor.name} перемещен в новый документ.`);
    await this._componentAdopted();
  }
  async attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (this.#templateImported) {
      await this._componentAttributeChanged(name, oldValue, newValue);
      log2(`Атрибут ${name} изменился с '${oldValue}' на '${newValue}'.`);
    }
  }
  async #initComponent() {
    const type = this.dataset.type;
    if (!exclusion.includes(this.tagName)) {
      this.#templateImported = true;
      if (type !== "server" && !this.hasAttribute("data-no-render")) {
        await this.#loadComponentStyles();
        await this.showSkeleton();
      }
    }
    await this._componentReady();
    await this.#registerComponent();
  }
  async #loadComponentStyles() {
    const componentTagName = this.constructor.tagName || this.tagName.toLowerCase();
    await ensureCSSModule();
    if (cssModule) {
      const componentCSS = cssModule.getCSSForComponent(componentTagName);
      if (componentCSS) {
        const style = document.createElement("style");
        style.textContent = componentCSS;
        if (this.shadowRoot) {
          this.shadowRoot.appendChild(style);
        }
        log2(`Стили для ${this.constructor.name} загружены из бандла`);
      } else {
        console.warn(`CSS для компонента ${componentTagName} не найден в бандле`);
      }
    } else {
      try {
        let cssPath = new URL(`../components/${componentTagName}/css/index.css`, import.meta.url);
        const style = document.createElement("style");
        style.textContent = `@import url('${cssPath.pathname}');`;
        if (this.shadowRoot) {
          this.shadowRoot.appendChild(style);
        }
        log2(`Стили для ${this.constructor.name} загружены через fallback`);
      } catch (fallbackError) {
        console.error(`Fallback загрузки стилей также не удалась:`, fallbackError);
      }
    }
  }
  async showSkeleton() {
    this.#isLoading = true;
    const container = this.shadowRoot.querySelector("#root") || document.createElement("div");
    container.id = "root";
    container.classList.add("skeleton-container");
    if (!this.shadowRoot.querySelector("#skeleton-styles")) {
      const style = document.createElement("style");
      style.id = "skeleton-styles";
      style.textContent = `/* Универсальные стили скелетона для всех компонентов */
        :host { position: relative; }
        .skeleton-container * { pointer-events: none !important; user-select: none !important; }
        .skeleton-container :not(style, script, link, meta) {
          color: transparent !important; background-size: 200% 100% !important;
          animation: skeleton-loading 1.5s infinite !important; border-color: transparent !important;
          box-shadow: none !important;
        }
        .skeleton-container :not(style, script, link, meta)::before {
          content: "" !important; position: absolute !important; top: 0 !important;
          left: 0 !important; right: 0 !important; bottom: 0 !important;
          background: inherit !important; border-radius: inherit !important; z-index: 1 !important;
        }
        @keyframes skeleton-loading {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        [data-theme="dark"] .skeleton-container :not(style, script, link, meta) {
          background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%) !important;
        }
        .skeleton-container form, .skeleton-container input, .skeleton-container textarea,
        .skeleton-container select, .skeleton-container button {
          opacity: 1 !important; visibility: visible !important; display: block !important;
        }
        .skeleton-container img, .skeleton-container [class*="avatar"],
        .skeleton-container [class*="circle"] { border-radius: 50% !important; }`;
      if (this.shadowRoot) {
        this.shadowRoot.appendChild(style);
      }
    }
    if (!this.shadowRoot.querySelector("#root")) {
      if (this.shadowRoot) {
        this.shadowRoot.appendChild(container);
      }
    }
  }
  async hideSkeleton() {
    this.#isLoading = false;
    const container = this.shadowRoot.querySelector("#root");
    if (container) {
      container.classList.remove("skeleton-container");
    }
  }
  isLoading() {
    return this.#isLoading;
  }
  async fullRender(state = {}) {
    try {
      await this.#render({ state });
      log2(`Полный рендеринг выполнен для ${this.constructor.name}`);
      return true;
    } catch (error) {
      console.error(`Ошибка полного рендеринга:`, error);
      return false;
    }
  }
  async renderPart(options) {
    try {
      const { partName = "defaultTemplate", state = {}, selector, method = "innerHTML" } = options;
      if (!this._templateMethods || !this._templateMethods[partName]) {
        console.error(`Метод шаблона '${partName}' не найден в ${this.constructor.name}`);
        return false;
      }
      if (!selector) {
        console.error(`Не указан селектор для рендеринга части '${partName}'`);
        return false;
      }
      const targetElement = this.shadowRoot.querySelector(selector);
      if (!targetElement) {
        console.error(`Элемент с селектором '${selector}' не найден`);
        return false;
      }
      const htmlContent = await this._templateMethods[partName]({ state, context: this });
      switch (method) {
        case "innerHTML":
          targetElement.innerHTML = htmlContent;
          break;
        case "append":
          targetElement.insertAdjacentHTML("beforeend", htmlContent);
          break;
        case "prepend":
          targetElement.insertAdjacentHTML("afterbegin", htmlContent);
          break;
        case "before":
          targetElement.insertAdjacentHTML("beforebegin", htmlContent);
          break;
        case "after":
          targetElement.insertAdjacentHTML("afterend", htmlContent);
          break;
        default:
          console.error(`Неизвестный метод вставки: ${method}`);
          return false;
      }
      log2(`Часть '${partName}' успешно отрендерена в '${selector}' методом '${method}'`);
      await this.#waitForDOMUpdate();
      await this.#setupEventListeners();
      return true;
    } catch (error) {
      console.error(`Ошибка рендеринга части '${options.partName}':`, error);
      this.addError({
        componentName: this.constructor.name,
        source: "renderPart",
        message: `Ошибка рендеринга части ${options.partName}`,
        details: error
      });
      return false;
    }
  }
  async updateElement(options) {
    try {
      const { selector, value, property = "textContent", action = "set" } = options;
      if (!selector) {
        console.warn(`[Компонент] Не указан селектор для обновления элемента`);
        return false;
      }
      const targetElement = this.shadowRoot.querySelector(selector);
      if (!targetElement) {
        console.warn(`[Компонент] Элемент с селектором '${selector}' не найден`);
        return false;
      }
      switch (action) {
        case "set":
          if (property === "style" && typeof value === "object") {
            Object.assign(targetElement.style, value);
          } else if (property === "className" && typeof value === "string") {
            targetElement.className = value;
          } else if (property === "dataset.theme" && typeof value === "string") {
            targetElement.dataset.theme = value;
          } else {
            targetElement[property] = value;
          }
          break;
        case "append":
          if (property === "innerHTML" || property === "textContent") {
            targetElement[property] += value;
          } else if (property === "value") {
            targetElement.value += String(value);
          }
          break;
        case "prepend":
          if (property === "innerHTML" || property === "textContent") {
            targetElement[property] = value + targetElement[property];
          } else if (property === "value") {
            targetElement.value = String(value) + targetElement.value;
          }
          break;
        case "toggle":
          if (property === "checked" || property === "disabled" || property === "hidden") {
            targetElement[property] = !targetElement[property];
          } else if (property === "className") {
            targetElement.classList.toggle(String(value));
          }
          break;
        case "add":
          if (property === "className") {
            targetElement.classList.add(String(value));
          }
          break;
        case "remove":
          if (property === "className") {
            targetElement.classList.remove(String(value));
          }
          break;
        default:
          console.warn(`[Компонент] Неизвестное действие: ${action}`);
          return false;
      }
      return true;
    } catch (error) {
      console.error(`[Компонент] Ошибка обновления элемента '${options.selector}':`, error);
      this.addError({
        componentName: this.constructor.name,
        source: "updateElement",
        message: `Ошибка обновления элемента ${options.selector}`,
        details: error
      });
      return false;
    }
  }
  async #render(params = {}) {
    try {
      const { partName = "defaultTemplate", state = {}, selector = "*" } = params;
      if (this._templateMethods) {
        const storedState = this.state || {};
        const mergedState = { ...storedState, ...state };
        const rootContainer = document.createElement("div");
        const templatePartName = this._templateMethods[partName] ? partName : "default";
        if (this._templateMethods[templatePartName]) {
          const templateResult = await this._templateMethods[templatePartName]({
            state: mergedState,
            context: this
          });
          rootContainer.insertAdjacentHTML("beforeend", templateResult);
          rootContainer.id = "root";
          if (selector === "*") {
            const existingRoot = this.shadowRoot.querySelector("#root");
            if (existingRoot) {
              existingRoot.remove();
            }
            if (this.shadowRoot) {
              this.shadowRoot.appendChild(rootContainer);
            }
          } else {
            const targetElement = this.shadowRoot.querySelector(selector);
            if (targetElement) {
              targetElement.innerHTML = "";
              targetElement.appendChild(rootContainer);
            }
          }
          await this.#waitForDOMUpdate();
          await this.#setupEventListeners();
          await this.hideSkeleton();
          log2(`${this.constructor.name} отрендерен с состоянием:`, mergedState);
        } else {
          console.error(`Метод шаблона '${templatePartName}' не найден`);
        }
      } else {
        console.error(`${this.constructor.name} темплейт не определен`);
      }
    } catch (error) {
      console.error(`Ошибка рендеринга для ${this.constructor.name}:`, error);
      if (this.shadowRoot) {
        this.shadowRoot.innerHTML = `<p style="color:red;">Ошибка рендеринга: ${error.message}</p>`;
      }
    }
  }
  async #waitForDOMUpdate(timeout = 100) {
    return new Promise((resolve) => {
      const rafId = requestAnimationFrame(() => {
        clearTimeout(timeoutId);
        resolve();
      });
      const timeoutId = setTimeout(() => {
        cancelAnimationFrame(rafId);
        resolve();
      }, timeout);
    });
  }
  async #setupEventListeners() {
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
    if (this._controller?.init) {
      await this._controller.init();
    }
    log2(`${this.constructor.name} настройка обработчиков событий (базовая реализация).`);
  }
  async #registerComponent() {
    try {
      if (!this.id) {
        console.error("ЯТО-ID1: Компонент желательно имеет ID для регистрации");
        throw new Error("ЯТО-ID1: Компонент требует ID");
      }
      const key = `${this.tagName.toLowerCase()}:${this.id}`;
      _BaseComponent.pendingRequests.set(key, this);
      if (this.tagName.toLowerCase() === "navigation-manager" || this.tagName.toLowerCase() === "navigation-sections") {
        log2(`${this.constructor.name} с ID ${this.id} зарегистрирован.`);
      }
    } catch (e2) {
      console.error(e2.toString(), this.tagName.toLowerCase());
    }
  }
  /**
   * Асинхронно получает экземпляр компонента, ожидая его регистрации, если необходимо.
   */
  static async getComponentAsync(tagName, id, timeout = 5e3) {
    const key = `${tagName}:${id}`;
    let component = _BaseComponent.pendingRequests.get(key);
    if (component) {
      return Promise.resolve(component);
    }
    return new Promise((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.error(`Таймаут ожидания компонента '${key}'.`);
          resolve(null);
        }
      }, timeout);
      const checkComponent = () => {
        if (resolved) return;
        component = _BaseComponent.pendingRequests.get(key);
        if (component) {
          clearTimeout(timeoutId);
          resolved = true;
          log2(`Асинхронно найден зарегистрированный компонент '${key}'.`);
          resolve(component);
        } else {
          setTimeout(checkComponent, _BaseComponent.MAX_POLLING_INTERVAL);
        }
      };
      checkComponent();
    });
  }
  async postMessage(_event) {
    log2(`сообщение для компонента ${this.constructor.name} отправлено.`);
    return { success: true, message: "Base handler - override in child components" };
  }
  async _componentReady() {
    log2(`${this.constructor.name} компонент готов (базовая реализация).`);
  }
  async _componentAttributeChanged(_name, _oldValue, _newValue) {
    log2(`${this.constructor.name} Атрибуты изменены (базовая реализация).`);
  }
  async _componentAdopted() {
    log2(`${this.constructor.name} компонент перемещен (базовая реализация).`);
  }
  async _componentDisconnected() {
    log2(`${this.constructor.name} компонент отключен (базовая реализация).`);
  }
};

// src/components/dht-manager/template/index.ts
function defaultTemplate({ state = {}, context }) {
  return `
        <div class="card full-width">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🌐</span>
                    Distributed Hash Table (DHT)
                </h3>
            </div>
            <div class="card-content">
                <div class="action-bar">
                    <button class="btn btn-success" data-dht-action="refresh-stats">
                        <span>📊</span> Refresh DHT Stats
                    </button>
                    <div class="btn-group">
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "all" ? "btn-primary" : ""}" 
                                id="dhtBtn-all" data-dht-type="all" data-dht-action="switch-type">
                            All DHTs
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "lan" ? "btn-primary" : ""}" 
                                id="dhtBtn-lan" data-dht-type="lan" data-dht-action="switch-type">
                            LAN
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "amino" ? "btn-primary" : ""}" 
                                id="dhtBtn-amino" data-dht-type="amino" data-dht-action="switch-type">
                            Amino
                        </button>
                        <button class="btn-secondary dht-type-btn ${state.activeDHTType === "universe" ? "btn-primary" : ""}" 
                                id="dhtBtn-universe" data-dht-type="universe" data-dht-action="switch-type">
                            Universe
                        </button>
                    </div>
                    <button class="btn btn-info" data-dht-action="find-peer">
                        <span>🔍</span> Find Peer
                    </button>
                    <button class="btn btn-warning" data-dht-action="find-providers">
                        <span>📦</span> Find Providers
                    </button>
                    <button class="btn btn-primary" data-dht-action="provide-content">
                        <span>📤</span> Provide Content
                    </button>
                    <button class="btn btn-secondary" data-dht-action="copy-addresses">
                        <span>📋</span> Copy Addresses
                    </button>
                </div>

                <div class="dht-stats" id="dhtStatsContainer">
                    ${renderDHTStats({ state, context })}
                </div>

                <div class="buckets-container hidden" id="bucketsContainer">
                    <!-- Buckets info will be rendered here -->
                </div>

                <div class="api-response-area mt-2" id="api-response-area">
                    <!-- API responses will be rendered here -->
                </div>
            </div>
        </div>
    `;
}
function renderDHTStats({ state = {} }) {
  const { dhtStats, activeDHTType } = state;
  let instancesToShow = [];
  if (activeDHTType === "all") {
    instancesToShow = ["lan", "amino", "universe"];
  } else {
    instancesToShow = [activeDHTType];
  }
  return `
        ${instancesToShow.map((type) => renderDHTInstance(type, dhtStats?.[type])).join("")}
        
        <div class="dht-instance full-width">
            <div class="dht-header">
                <div class="dht-name">📊 DHT Summary</div>
                <div class="dht-status ${dhtStats?.summary?.activeDHTs > 0 ? "status-running" : "status-stopped"}">${dhtStats?.summary?.activeDHTs > 0 ? "Active" : "Inactive"}</div>
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalPeers || 0}</div>
                    <div class="stat-label">Total Peers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalQueries || 0}</div>
                    <div class="stat-label">Total Queries</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.totalRecords || 0}</div>
                    <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${dhtStats?.summary?.activeDHTs || 0}</div>
                    <div class="stat-label">Active DHTs</div>
                </div>
            </div>
<!--            <div class="text-center text-muted mt-1">-->
<!--                Last updated: ${dhtStats?.lastUpdated ? new Date(dhtStats.lastUpdated).toLocaleTimeString() : "Never"}-->
<!--            </div>-->
        </div>
    `;
}
function renderBucketInfo({ state = {} }) {
  const { dhtType, bucketInfo } = state;
  if (!bucketInfo) {
    return '<div class="text-center text-muted">No bucket information available</div>';
  }
  return `
        <div class="buckets-section">
            <div class="buckets-header">
                <h4>📊 ${dhtType.toUpperCase()} DHT Routing Table Buckets</h4>
                <button class="btn btn-secondary" data-dht-action="hide-buckets">
                    ✕ Hide
                </button>
            </div>
            
            <div class="info-grid mb-2">
                <div class="info-item">
                    <span class="info-label">Total Buckets:</span>
                    <span class="info-value">${bucketInfo.totalBuckets || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Full Buckets:</span>
                    <span class="info-value">${bucketInfo.fullBuckets || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Total Peers:</span>
                    <span class="info-value">${bucketInfo.totalPeers || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Avg Peers/Bucket:</span>
                    <span class="info-value">${bucketInfo.averagePeersPerBucket ? bucketInfo.averagePeersPerBucket.toFixed(1) : 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Routing Table Depth:</span>
                    <span class="info-value">${bucketInfo.routingTableDepth || 0}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Success Rate:</span>
                    <span class="info-value">${bucketInfo.metrics?.successRate || "0%"}</span>
                </div>
            </div>

            <div class="buckets-list">
                ${bucketInfo.buckets && bucketInfo.buckets.length > 0 ? bucketInfo.buckets.map((bucket) => `
                    <div class="bucket ${bucket.full ? "bucket-full" : bucket.size === 0 ? "bucket-empty" : ""}">
                        <div class="bucket-header">
                            <span class="bucket-index">Bucket #${bucket.index}</span>
                            <span class="bucket-size">${bucket.size}/${bucket.capacity} peers</span>
                        </div>
                        ${bucket.size > 0 ? `
                            <div class="bucket-peers">
                                ${bucket.peers ? bucket.peers.slice(0, 3).join(", ") : "No peers"}${bucket.peers && bucket.peers.length > 3 ? "..." : ""}
                            </div>
                        ` : '<div class="bucket-empty-message">Empty</div>'}
                    </div>
                `).join("") : '<div class="text-center text-muted">No bucket data available</div>'}
            </div>
        </div>
    `;
}
function renderAPIResponse({ state = {} }) {
  const { responseData } = state;
  if (!responseData) {
    return '<div class="text-center text-muted">No response data</div>';
  }
  const formatResponse = (data) => {
    if (typeof data === "object") {
      return JSON.stringify(data, null, 2);
    }
    return String(data);
  };
  const isSuccess = responseData.status !== false;
  return `
        <div class="api-response-container ${isSuccess ? "api-response-success" : "api-response-error"}">
            <div class="api-response-header">
                <h5>${isSuccess ? "✅ Success" : "❌ Error"}</h5>
                <span class="response-timestamp">${(/* @__PURE__ */ new Date()).toLocaleTimeString()}</span>
            </div>
            <div class="api-response-content">
                <pre>${formatResponse(responseData)}</pre>
            </div>
        </div>
    `;
}
function renderDHTInstance(type, stats) {
  if (!stats) {
    return `
            <div class="dht-instance">
                <div class="dht-header">
                    <div class="dht-name">
                        <span>${type.toUpperCase()} DHT</span>
                    </div>
                    <div class="dht-status status-stopped">Stopped</div>
                </div>
                <div class="text-center text-muted p-2">
                    DHT instance not available
                </div>
            </div>
        `;
  }
  const statusClass = `status-${stats.status || "stopped"}`;
  const statusText = stats.status === "running" ? "Running" : stats.status === "stopped" ? "Stopped" : stats.status === "error" ? "Stopped" : "Stopped";
  const successRate = stats.metrics && stats.metrics.successRate !== void 0 ? typeof stats.metrics.successRate === "number" ? `${stats.metrics.successRate.toFixed(1)}%` : stats.metrics.successRate === 0 ? "0%" : `${stats.metrics.successRate}%` : "0%";
  const queryLatency = stats.metrics && stats.metrics.queryLatency ? typeof stats.metrics.queryLatency === "number" ? stats.metrics.queryLatency + "ms" : stats.metrics.queryLatency === 0 ? "0ms" : stats.metrics.queryLatency : "0ms";
  const bucketsInfo = stats.buckets ? `${stats.buckets.full || 0}/${stats.buckets.total || 0} full` : "0/0 full";
  return `
        <div class="dht-instance">
            <div class="dht-header">
                <div class="dht-name">
                    <span>${type.toUpperCase()} DHT</span>
                </div>
                <div class="dht-status ${statusClass}">${statusText}</div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.peerCount || 0}</div>
                    <div class="stat-label">Peers</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.routingTableSize || 0}</div>
                    <div class="stat-label">Routing Table</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.queries ? stats.queries.successful : 0}</div>
                    <div class="stat-label">successful</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.records ? stats.records.stored : 0}</div>
                    <div class="stat-label">Stored</div>
                </div>
            </div>
            
            <div class="info-grid mt-1">
                <div class="info-item">
                    <span class="info-label">Success Rate:</span>
                    <span class="info-value">${successRate}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Query Latency:</span>
                    <span class="info-value">${queryLatency}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Buckets:</span>
                    <span class="info-value">${bucketsInfo}</span>
                </div>
            </div>
            
            <div class="form-actions mt-1">
                <button class="btn btn-secondary" data-dht-action="get-buckets" data-dht-type="${type}">
                    View Buckets
                </button>
            </div>
        </div>
    `;
}

// src/components/dht-manager/controller/index.ts
var controller = async (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, options);
    eventListeners.push({ element, event, handler, options });
  };
  const getActions = () => {
    return {
      refreshDHTData: async () => {
        return await context.postMessage({ type: "REFRESH_STATS" });
      },
      getDHTBuckets: async (dhtType) => {
        return await context.postMessage({
          type: "GET_BUCKETS",
          data: { type: dhtType }
        });
      },
      findPeer: async (peerId, dhtType) => {
        return await context.postMessage({
          type: "FIND_PEER",
          data: { peerId, dhtType }
        });
      },
      findProviders: async (cid, dhtType, maxProviders) => {
        return await context.postMessage({
          type: "FIND_PROVIDERS",
          data: { cid, dhtType, maxProviders }
        });
      },
      provideContent: async (cid, dhtType) => {
        return await context.postMessage({
          type: "PROVIDE_CONTENT",
          data: { cid, dhtType }
        });
      },
      copyDHTAddresses: async () => {
        try {
          const response = await fetch("/system/node-info");
          const data = await response.json();
          if (data.status && data.addresses) {
            const addressesText = data.addresses.join("\\n");
            await navigator.clipboard.writeText(addressesText);
            showNotification("Адреса DHT скопированы в буфер обмена", "success");
          }
        } catch (error) {
          console.error("Error copying DHT addresses:", error);
          showNotification("Ошибка копирования адресов DHT", "error");
        }
      },
      switchDHTType: async (dhtType) => {
        return await context.postMessage({
          type: "SWITCH_TYPE",
          data: { type: dhtType }
        });
      },
      hideBuckets: async () => {
        await context.updateElement({
          selector: "#bucketsContainer",
          value: "hidden",
          property: "className",
          action: "add"
        });
      },
      updateDHTDisplay: async (data) => {
        return await context.postMessage({
          type: "UPDATE_DISPLAY",
          data
        });
      },
      filterDHTStats: async (searchTerm) => {
        showNotification(`Фильтр по запросу: "${searchTerm}"`, "info");
      }
    };
  };
  const showNotification = (message, type = "info") => {
    window.dispatchEvent(new CustomEvent("show-notification", {
      detail: {
        message,
        type
      }
    }));
  };
  const setupDHTListeners = (dhtType, dhtInstance) => {
    if (!dhtInstance?.routingTable) {
      console.log(`DHT ${dhtType} routingTable не доступен`);
      return;
    }
    const routingTable = dhtInstance.routingTable;
    let timerId = null;
    routingTable.addEventListener("peer:add", (event) => {
      console.log(`----- 🎯 [${dhtType}] peer:add`, event.detail);
      if (timerId) {
        clearTimeout(timerId);
      }
      timerId = setTimeout(() => {
        context.refreshData(dhtType).catch((e2) => {
          console.error(`Error refreshing ${dhtType} DHT:`, e2);
        });
      }, 2e3);
    });
    routingTable.addEventListener("peer:remove", (event) => {
      console.log(`🎯 [${dhtType}] peer:remove`, event.detail);
      context.refreshData(dhtType).catch((e2) => {
        console.error(`Error refreshing ${dhtType} DHT:`, e2);
      });
    });
    routingTable.addEventListener("peer:removed", (event) => {
      console.log(`+++++++🎯 [${dhtType}] peer:removed`, event.detail);
      context.refreshData(dhtType).catch((e2) => {
        console.error(`Error refreshing ${dhtType} DHT:`, e2);
      });
    });
  };
  const setupAllDHTListeners = (libp2p2) => {
    const dhtTypes = {
      "amino": "aminoDHT",
      "lan": "lanDHT",
      "universe": "universeDHT"
    };
    for (const [dhtType, serviceName] of Object.entries(dhtTypes)) {
      if (libp2p2?.services?.[serviceName]) {
        try {
          setupDHTListeners(dhtType, libp2p2.services[serviceName]);
        } catch (error) {
          console.error(`❌ Ошибка настройки слушателей для ${dhtType} DHT:`, error);
        }
      } else {
        console.log(`ℹ️ ${dhtType} DHT не доступен в libp2p сервисах`);
      }
    }
  };
  const handleDHTButtonClick = async (e2) => {
    const target = e2.target;
    const button = target.closest("[data-dht-action]");
    if (!button) return;
    const action = button.getAttribute("data-dht-action");
    const dhtType = button.getAttribute("data-dht-type");
    try {
      console.log(`Выполнение действия DHT: ${action} для типа: ${dhtType}`);
      const actions = getActions();
      switch (action) {
        case "refresh-stats":
          await actions.refreshDHTData();
          break;
        case "get-buckets":
          if (dhtType) {
            await actions.getDHTBuckets(dhtType);
          }
          break;
        case "find-peer":
          await showFindPeerForm(actions);
          break;
        case "find-providers":
          await showFindProvidersForm(actions);
          break;
        case "provide-content":
          await showProvideContentForm(actions);
          break;
        case "copy-addresses":
          await actions.copyDHTAddresses();
          break;
        case "switch-type":
          if (dhtType) {
            await actions.switchDHTType(dhtType);
          }
          break;
        case "hide-buckets":
          await actions.hideBuckets();
          break;
        default:
          console.warn(`Неизвестное действие DHT: ${action}`);
      }
    } catch (error) {
      console.error(`Ошибка выполнения действия DHT ${action}:`, error);
      await context.showModal({
        title: "Ошибка DHT",
        content: `Не удалось выполнить действие: ${error}`,
        buttons: [{ text: "Закрыть", type: "primary" }]
      });
    }
  };
  const showFindPeerForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Peer ID:</label>
              <input type="text" id="findPeerId" class="form-input" placeholder="Введите Peer ID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="findPeerDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
      </div>
    `;
    await context.showModal({
      title: "🔍 Поиск пира в DHT",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Поиск пира отменен")
        },
        {
          text: "Найти",
          type: "primary",
          action: async () => {
            const peerIdInput = document.getElementById("findPeerId");
            const dhtTypeSelect = document.getElementById("findPeerDHTType");
            const peerId = peerIdInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            if (!peerId) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите Peer ID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.findPeer(peerId, dhtType);
          }
        }
      ]
    });
  };
  const showFindProvidersForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Content ID (CID):</label>
              <input type="text" id="findProvidersCid" class="form-input" placeholder="Введите CID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="findProvidersDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
          <div class="form-group">
              <label class="form-label">Максимум провайдеров:</label>
              <input type="number" id="findProvidersMax" class="form-input" value="20" min="1" max="100">
          </div>
      </div>
    `;
    await context.showModal({
      title: "📦 Поиск провайдеров контента",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Поиск провайдеров отменен")
        },
        {
          text: "Найти",
          type: "primary",
          action: async () => {
            const cidInput = document.getElementById("findProvidersCid");
            const dhtTypeSelect = document.getElementById("findProvidersDHTType");
            const maxProvidersInput = document.getElementById("findProvidersMax");
            const cid = cidInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            const maxProviders = maxProvidersInput?.value ? parseInt(maxProvidersInput.value) : 20;
            if (!cid) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите CID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.findProviders(cid, dhtType, maxProviders);
          }
        }
      ]
    });
  };
  const showProvideContentForm = async (actions) => {
    const modalContent = `
      <div style="padding: 1rem 0;">
          <div class="form-group">
              <label class="form-label">Content ID (CID):</label>
              <input type="text" id="provideContentCid" class="form-input" placeholder="Введите CID...">
          </div>
          <div class="form-group">
              <label class="form-label">Тип DHT:</label>
              <select id="provideContentDHTType" class="form-input">
                  <option value="all">Все DHT</option>
                  <option value="lan">LAN</option>
                  <option value="amino">Amino</option>
                  <option value="universe">Universe</option>
              </select>
          </div>
          <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(59, 130, 246, 0.1); border-radius: 8px; border: 1px solid rgba(59, 130, 246, 0.3);">
              <strong>💡 Информация:</strong> Эта операция опубликует информацию о том, что вы предоставляете указанный контент.
          </div>
      </div>
    `;
    await context.showModal({
      title: "📤 Публикация контента в DHT",
      content: modalContent,
      buttons: [
        {
          text: "Отмена",
          type: "secondary",
          action: () => console.log("Публикация контента отменена")
        },
        {
          text: "Опубликовать",
          type: "primary",
          action: async () => {
            const cidInput = document.getElementById("provideContentCid");
            const dhtTypeSelect = document.getElementById("provideContentDHTType");
            const cid = cidInput?.value?.trim() || "";
            const dhtType = dhtTypeSelect?.value || "all";
            if (!cid) {
              await context.showModal({
                title: "Ошибка",
                content: "<p>Пожалуйста, введите CID</p>",
                buttons: [{ text: "OK", type: "primary" }]
              });
              return;
            }
            await actions.provideContent(cid, dhtType);
          }
        }
      ]
    });
  };
  const handleDHTSearch = async (e2) => {
    const target = e2.target;
    if (target.id === "dhtSearchInput") {
      const searchTerm = target.value.toLowerCase().trim();
      const actions = getActions();
      await actions.filterDHTStats(searchTerm);
    }
  };
  const handleSectionToggle = (e2) => {
    const target = e2.target;
    const toggle = target.closest("[data-section-toggle]");
    if (!toggle) return;
    const sectionId = toggle.getAttribute("data-section-toggle");
    if (!sectionId) return;
    const section = context.shadowRoot?.getElementById(sectionId);
    if (!section) return;
    const isHidden = section.classList.contains("hidden");
    if (isHidden) {
      section.classList.remove("hidden");
      toggle.textContent = "📕 Скрыть";
    } else {
      section.classList.add("hidden");
      toggle.textContent = "📖 Показать";
    }
  };
  const libp2p = await context.getComponentAsync("libp2p-node", "libp2p-node-1");
  return {
    /**
     * Инициализирует контроллер DHT Manager
     */
    async init() {
      try {
        if (libp2p?.libp2pInstance?.libp2p) {
          setupAllDHTListeners(libp2p.libp2pInstance.libp2p);
        }
        addEventListener(context.shadowRoot, "click", handleDHTButtonClick);
        addEventListener(context.shadowRoot, "input", handleDHTSearch);
        addEventListener(context.shadowRoot, "click", handleSectionToggle);
        addEventListener(document, "TAB_CHANGED", async (e2) => {
          const customEvent = e2;
          if (customEvent.detail?.tabId === "dht") {
            const actions = getActions();
            setTimeout(async () => {
              await actions.refreshDHTData();
            }, 100);
          }
        });
      } catch (error) {
        console.error("❌ Ошибка инициализации контроллера DHT Manager:", error);
        throw error;
      }
    },
    /**
     * Уничтожает контроллер и очищает ресурсы
     */
    async destroy() {
      try {
        eventListeners.forEach(({ element, event, handler, options }) => {
          element.removeEventListener(event, handler, options);
        });
        eventListeners = [];
      } catch (error) {
        console.error("Ошибка уничтожения контроллера DHT Manager:", error);
      }
    },
    /**
     * Принудительно обновляет данные DHT
     */
    async forceRefresh() {
      try {
        const actions = getActions();
        await actions.refreshDHTData();
        console.log("Принудительное обновление DHT данных выполнено");
      } catch (error) {
        console.error("Ошибка принудительного обновления DHT:", error);
        throw error;
      }
    },
    /**
     * Получает текущее состояние контроллера
     */
    async getState() {
      const response = await context.postMessage({ type: "GET_STATS" });
      if (response.success) {
        return {
          activeDHTType: response.state?.activeDHTType || "all",
          eventListenersCount: eventListeners.length
        };
      }
      return {
        activeDHTType: "all",
        eventListenersCount: eventListeners.length
      };
    }
  };
};

// src/components/dht-manager/actions/index.ts
async function createActions(context) {
  return {
    loadDHTStats: loadDHTStats.bind(context),
    findPeer: findPeer.bind(context),
    findProviders: findProviders.bind(context),
    provideContent: provideContent.bind(context),
    getDHTBuckets: getDHTBuckets.bind(context),
    refreshDHTData: refreshDHTData.bind(context),
    handleDHTTabActivation: handleDHTTabActivation.bind(context),
    updateDHTDisplay: updateDHTDisplay.bind(context),
    filterDHTStats: filterDHTStats.bind(context),
    copyDHTAddresses: copyDHTAddresses.bind(context),
    switchDHTType: switchDHTType.bind(context),
    hideBuckets: hideBuckets.bind(context)
  };
}
function createEmptyDHTStats(type, status = "stopped") {
  return {
    type,
    peerCount: 0,
    routingTableSize: 0,
    queries: { total: 0, successful: 0, failed: 0, pending: 0 },
    records: { stored: 0, provided: 0, received: 0 },
    buckets: { total: 0, full: 0, depth: 0 },
    network: { closestPeers: [], knownPeers: 0 },
    status,
    lastActivity: null,
    metrics: { queryLatency: 0, successRate: 0, peersPerBucket: 0 },
    dataQuality: { score: 0, issues: [], lastValidated: null, status: "unknown" }
  };
}
async function loadDHTStats(data) {
  try {
    console.log("🔄 Loading DHT stats with data:", data);
    if (!data) {
      console.warn("⚠️ DHT stats data is undefined, using default structure");
      data = { stats: null };
    }
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_DHT_STATS" });
    if (response.success && response.dhtStats) {
      await this.postMessage({
        type: "UPDATE_DISPLAY",
        data: {
          stats: {
            lan: response.dhtStats.lan || createEmptyDHTStats("lan"),
            amino: response.dhtStats.amino || createEmptyDHTStats("amino"),
            universe: response.dhtStats.universe || createEmptyDHTStats("universe"),
            summary: response.dhtStats.summary || {
              totalPeers: 0,
              totalQueries: 0,
              totalRecords: 0,
              activeDHTs: 0
            },
            lastUpdated: Date.now()
          }
        }
      });
      console.log("✅ DHT stats updated from libp2p-node");
    } else {
      throw new Error(response.error || "Failed to get DHT stats from libp2p-node");
    }
  } catch (error) {
    console.error(`❌ Не удалось загрузить статистику DHT: ${error}`, error);
    await this.postMessage({
      type: "UPDATE_DISPLAY",
      data: {
        stats: {
          lan: createEmptyDHTStats("lan", "error"),
          amino: createEmptyDHTStats("amino", "error"),
          universe: createEmptyDHTStats("universe", "error"),
          summary: { totalPeers: 0, totalQueries: 0, totalRecords: 0, activeDHTs: 0 },
          lastUpdated: Date.now()
        }
      }
    });
    this.addError({
      componentName: "DHTManager",
      source: "loadDHTStats",
      message: `Ошибка загрузки статистики DHT: ${error}`,
      details: error
    });
  }
}
async function findPeer(peerId, dhtType = "all") {
  if (!peerId || !peerId.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите Peer ID для поиска"
    });
    return { status: false, error: "Peer ID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "FIND_PEER",
      data: { peerId, dhtType }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 1");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      const foundResults = response.result.results ? response.result.results.filter((r2) => r2.success).length : 0;
      if (foundResults > 0) {
        this.showNotification(`Найдено ${foundResults} результатов для пира ${peerId}`, "success");
      } else {
        this.showNotification(`Пир ${peerId} не найден в указанных DHT`, "warning");
      }
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 2 mock результат");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            results: [
              {
                success: Math.random() > 0.5,
                peerId,
                addresses: ["/ip4/127.0.0.1/tcp/4001/p2p/" + peerId],
                metadata: { foundIn: dhtType }
              }
            ]
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Поиск пира ${peerId} выполнен (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка поиска пира",
      content: `Не удалось выполнить поиск пира: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "findPeer",
      message: `Ошибка поиска пира ${peerId}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function findProviders(cid, dhtType = "all", maxProviders = 20) {
  if (!cid || !cid.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите CID для поиска провайдеров"
    });
    return { status: false, error: "CID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "FIND_PROVIDERS",
      data: { cid, dhtType, maxProviders }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 3");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      this.showNotification(
        `Найдено ${response.result.totalProviders || 0} провайдеров для CID ${cid}`,
        "success"
      );
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 4 mock");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            totalProviders: Math.floor(Math.random() * maxProviders),
            providers: Array.from({ length: Math.min(5, maxProviders) }, (_, i2) => ({
              peerId: `12D3KooWProvider${i2}`,
              addresses: [`/ip4/192.168.${i2}.1/tcp/4001/p2p/12D3KooWProvider${i2}`]
            }))
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Поиск провайдеров для CID ${cid} выполнен (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка поиска провайдеров",
      content: `Не удалось найти провайдеров: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "findProviders",
      message: `Ошибка поиска провайдеров для CID ${cid}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function provideContent(cid, dhtType = "all") {
  if (!cid || !cid.trim()) {
    await this.showModal({
      title: "Ошибка",
      content: "Пожалуйста, введите CID для публикации"
    });
    return { status: false, error: "CID required" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "PROVIDE_CONTENT",
      data: { cid, dhtType }
    });
    if (response.success && response.result) {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 6");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: { responseData: response.result },
        selector: "#api-response-area"
      });
      const successful = response.result.results ? response.result.results.filter((r2) => r2.success).length : 0;
      this.showNotification(
        `Контент ${cid} опубликован в ${successful} DHT сетях`,
        "success"
      );
    } else {
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 7 mock");
      await this.renderPart({
        partName: "renderAPIResponse",
        state: {
          responseData: {
            status: true,
            results: [
              {
                success: true,
                dhtType,
                message: `Content ${cid} provided successfully (mock)`
              }
            ]
          }
        },
        selector: "#api-response-area"
      });
      this.showNotification(`Контент ${cid} опубликован (mock данные)`, "info");
    }
    await this.hideSkeleton();
    return response.result || { status: false, error: "No result" };
  } catch (error) {
    await this.hideSkeleton();
    await this.showModal({
      title: "Ошибка публикации контента",
      content: `Не удалось опубликовать контент: ${error}`
    });
    this.addError({
      componentName: "DHTManager",
      source: "provideContent",
      message: `Ошибка публикации контента ${cid}`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function getDHTBuckets(dhtType) {
  if (!["lan", "amino", "universe"].includes(dhtType)) {
    await this.showModal({
      title: "Ошибка",
      content: "Неверный тип DHT. Допустимые значения: lan, amino, universe"
    });
    return { status: false, error: "Invalid DHT type" };
  }
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({
      type: "GET_BUCKETS",
      data: { type: dhtType }
    });
    if (response.success) {
      const bucketInfo = response.buckets || {
        totalBuckets: 10,
        fullBuckets: 2,
        totalPeers: Math.floor(Math.random() * 100),
        averagePeersPerBucket: Math.floor(Math.random() * 10),
        buckets: Array.from({ length: 10 }, (_, i2) => ({
          index: i2,
          size: Math.floor(Math.random() * 5),
          capacity: 20,
          full: false,
          peers: []
        }))
      };
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 10");
      await this.renderPart({
        partName: "renderBucketInfo",
        state: {
          bucketInfo,
          dhtType
        },
        selector: "#api-response-area"
      });
      await this.updateElement({
        selector: "#bucketsContainer",
        value: "hidden",
        property: "className",
        action: "remove"
      });
      this.showNotification(
        `Информация о бакетах ${dhtType.toUpperCase()} DHT загружена`,
        "success"
      );
      return bucketInfo;
    }
    await this.hideSkeleton();
    return { status: false, error: "Failed to get bucket info" };
  } catch (error) {
    await this.hideSkeleton();
    console.error("Ошибка загрузки бакетов:", error);
    this.addError({
      componentName: "DHTManager",
      source: "getDHTBuckets",
      message: `Ошибка загрузки бакетов для ${dhtType} DHT`,
      details: error
    });
    return { status: false, error: String(error) };
  }
}
async function refreshDHTData() {
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "UPDATE_DISPLAY" });
    if (response.success) {
      await this.refreshData("all");
      this.showNotification("DHT статистика обновлена", "success");
    } else {
      throw new Error(response.error || "Не удалось обновить DHT статистику");
    }
    await this.hideSkeleton();
  } catch (error) {
    await this.hideSkeleton();
    this.showNotification("Ошибка обновления данных DHT", "error");
    this.addError({
      componentName: "DHTManager",
      source: "refreshDHTData",
      message: "Ошибка обновления данных DHT",
      details: error
    });
  }
}
async function updateDHTDisplay(data = null) {
  try {
    const response = await this.postMessage({
      type: "UPDATE_DISPLAY",
      data
    });
    if (!response.success) {
      console.error("❌ Error updating DHT display:", response.error);
    }
  } catch (error) {
    console.error("❌ Error updating DHT display:", error);
    this.addError({
      componentName: "DHTManager",
      source: "updateDHTDisplay",
      message: "Ошибка обновления отображения DHT",
      details: error
    });
  }
}
async function filterDHTStats(searchTerm) {
  try {
    if (!searchTerm) {
      await this.postMessage({ type: "UPDATE_DISPLAY" });
      return;
    }
    this.showNotification(`Фильтр по запросу: "${searchTerm}"`, "info");
  } catch (error) {
    console.error("Error filtering DHT stats:", error);
  }
}
async function copyDHTAddresses() {
  try {
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_MULTIADDRS" });
    if (response.success && response.multiaddrs) {
      const addressesText = response.multiaddrs.join("\\n");
      await navigator.clipboard.writeText(addressesText);
      this.showNotification("Адреса DHT скопированы в буфер обмена", "success");
    } else {
      throw new Error("Не удалось получить адреса ноды из libp2p-node");
    }
  } catch (error) {
    console.error("Error copying DHT addresses:", error);
    this.showNotification("Ошибка копирования адресов DHT", "error");
  }
}
async function handleDHTTabActivation() {
  const response = await this.postMessage({ type: "GET_STATS" });
  if (response.success && response.stats) {
    const dhtStats = response.stats;
    const hasStats = dhtStats && Object.keys(dhtStats).length > 0;
    if (!hasStats) {
      await this.refreshData("all");
    }
  }
}
async function switchDHTType(dhtType) {
  try {
    const response = await this.postMessage({
      type: "SWITCH_TYPE",
      data: { type: dhtType }
    });
    if (response.success) {
      this.showNotification(`Показаны данные для: ${dhtType.toUpperCase()} DHT`, "info");
    }
  } catch (error) {
    console.error("Error switching DHT type:", error);
  }
}
async function hideBuckets() {
  await this.updateElement({
    selector: "#bucketsContainer",
    value: "hidden",
    property: "className",
    action: "add"
  });
}

// src/components/dht-manager/index.ts
var log3 = console.log;
var DHTManager = class extends BaseComponent {
  static observedAttributes = ["data-auto-refresh", "data-default-type"];
  constructor() {
    super();
    this._templateMethods = {
      defaultTemplate,
      renderDHTStats: (params) => renderDHTStats({ state: params.state, context: params.context }),
      renderBucketInfo: (params) => renderBucketInfo({ state: params.state, context: params.context }),
      renderAPIResponse: (params) => renderAPIResponse({ state: params.state, context: params.context })
    };
    this.state = this.initializeState();
  }
  /**
   * Инициализирует состояние компонента
   */
  initializeState() {
    return {
      dhtStats: {
        lan: this.createEmptyDHTStats("lan"),
        amino: this.createEmptyDHTStats("amino"),
        universe: this.createEmptyDHTStats("universe"),
        summary: {
          totalPeers: 0,
          totalQueries: 0,
          totalRecords: 0,
          activeDHTs: 0,
          overallHealth: "unknown",
          dataQuality: 0
        },
        lastUpdated: Date.now()
      },
      bucketsInfo: {
        lan: null,
        amino: null,
        universe: null
      },
      activeDHTType: "all",
      dhtStatsUpdated: false,
      connectionStatus: "disconnected",
      sseConnectionState: "disconnected",
      dataQuality: {
        score: 0,
        lastValidation: null,
        issues: [],
        status: "unknown"
      }
    };
  }
  /**
   * Создает пустую структуру статистики DHT
   */
  createEmptyDHTStats(type, status = "stopped") {
    return {
      type,
      peerCount: 0,
      routingTableSize: 0,
      queries: {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0
      },
      records: {
        stored: 0,
        provided: 0,
        received: 0
      },
      buckets: {
        total: 0,
        full: 0,
        depth: 0
      },
      network: {
        closestPeers: [],
        knownPeers: 0
      },
      status,
      lastActivity: null,
      metrics: {
        queryLatency: 0,
        successRate: 0,
        peersPerBucket: 0
      },
      dataQuality: {
        score: 0,
        issues: [],
        lastValidated: null,
        status: "unknown"
      }
    };
  }
  /**
   * Визуализирует K-бакеты DHT
   */
  visualizeBuckets(kb, dhtType = "DHT") {
    console.log(`
📊 === ВИЗУАЛИЗАЦИЯ K-БАКЕТОВ (${dhtType}) ===`);
    function printBucket(bucket, indent = "", isLast = true) {
      const marker = isLast ? "└── " : "├── ";
      if (bucket.peers) {
        const fillPercentage = bucket.peers.length / kb.kBucketSize * 100;
        const fillBar = "█".repeat(Math.floor(fillPercentage / 10)) + "░".repeat(10 - Math.floor(fillPercentage / 10));
        console.log(`${indent}${marker}📂 Префикс: "${bucket.prefix || "root"}"`);
        console.log(`${indent}    Тип: ${dhtType}`);
        console.log(`${indent}    Глубина: ${bucket.depth || 0}`);
        console.log(`${indent}    Заполненность: ${bucket.peers.length}/${kb.kBucketSize}`);
        console.log(`${indent}    ${fillBar} ${fillPercentage.toFixed(1)}%`);
        if (bucket.peers.length > 0) {
          console.log(`${indent}    Пиры (первые 3):`);
          bucket.peers.slice(0, 3).forEach((peer, i2) => {
            const age = peer.lastPing ? Math.floor((Date.now() - peer.lastPing) / 1e3) : "unknown";
            const peerIdStr = peer.peerId?.toString() || "unknown";
            console.log(`${indent}      ${i2 + 1}. ${peerIdStr.slice(-8)} (возраст: ${age}с)`);
          });
          if (bucket.peers.length > 3) {
            console.log(`${indent}      ... и еще ${bucket.peers.length - 3} пиров`);
          }
        }
      } else {
        console.log(`${indent}${marker}📁 Узел: "${bucket.prefix || "root"}"`);
        console.log(`${indent}    Тип: ${dhtType}`);
        const newIndent = indent + (isLast ? "    " : "│   ");
        if (bucket.left) printBucket(bucket.left, newIndent, !bucket.right);
        if (bucket.right) printBucket(bucket.right, newIndent, true);
      }
    }
    if (kb.root) {
      printBucket(kb.root);
    }
    console.log(`
📈 === СВОДНАЯ СТАТИСТИКА (${dhtType}) ===`);
    try {
      const allPeers = Array.from(kb.toIterable ? kb.toIterable() : []);
      const totalPeers = allPeers.length;
      const maxPeers = Math.pow(2, kb.prefixLength) * kb.kBucketSize;
      const fillPercentage = maxPeers > 0 ? totalPeers / maxPeers * 100 : 0;
      console.log(`Всего пиров: ${totalPeers}`);
      console.log(`Максимальная емкость: ${maxPeers}`);
      console.log(`Заполненность сети: ${fillPercentage.toFixed(2)}%`);
      console.log(`Размер бакета (K): ${kb.kBucketSize}`);
      console.log(`Длина префикса: ${kb.prefixLength}`);
    } catch (error) {
      console.log(`❌ Ошибка расчета статистики: ${error}`);
    }
  }
  /**
   * Визуализирует все доступные DHT
   */
  visualizeAllDHTs(services) {
    const dhtTypes = {
      "amino": "aminoDHT",
      "lan": "lanDHT",
      "universe": "universeDHT"
    };
    for (const [displayName, serviceName] of Object.entries(dhtTypes)) {
      const dhtInstance = services[serviceName];
      if (dhtInstance?.routingTable?.kb) {
      } else {
        console.log(`ℹ️ ${displayName} DHT не доступен для визуализации`);
      }
    }
  }
  /**
   * Собирает статистику для конкретного DHT
   */
  async collectDHTStats(dhtType, dhtInstance) {
    try {
      const stats = {
        type: dhtType,
        peerCount: 0,
        routingTableSize: 0,
        queries: { total: 0, successful: 0, failed: 0, pending: 0 },
        records: { stored: 0, provided: 0, received: 0 },
        buckets: { total: 0, full: 0, depth: 0 },
        network: { closestPeers: [], knownPeers: 0 },
        status: "running",
        lastActivity: Date.now(),
        metrics: { queryLatency: 0, successRate: 0, peersPerBucket: 0 },
        dataQuality: { score: 0, issues: [], lastValidated: null, status: "unknown" }
      };
      if (dhtInstance.routingTable) {
        try {
          stats.peerCount = dhtInstance.routingTable.size || 0;
          stats.routingTableSize = stats.peerCount;
          if (dhtInstance.routingTable.kb) {
            const allPeers = Array.from(dhtInstance.routingTable.kb.toIterable?.() || []);
            stats.peerCount = allPeers.length;
            const totalBuckets = Math.pow(2, dhtInstance.routingTable.kb.prefixLength) || 20;
            const avgPeersPerBucket = stats.peerCount > 0 ? stats.peerCount / totalBuckets : 0;
            stats.buckets = {
              total: totalBuckets,
              full: Math.floor(stats.peerCount / (dhtInstance.routingTable.kb.kBucketSize || 20)),
              depth: dhtInstance.routingTable.kb.prefixLength || 0
            };
            stats.metrics.peersPerBucket = avgPeersPerBucket;
          }
        } catch (rtError) {
          console.error(`❌ Ошибка получения routing table для ${dhtType}:`, rtError);
        }
      }
      if (dhtInstance.metrics) {
        try {
          stats.metrics.queryLatency = dhtInstance.metrics.averageLatency || 0;
          stats.metrics.successRate = dhtInstance.metrics.successRate || 0;
        } catch (metricsError) {
          console.error(`❌ Ошибка получения метрик для ${dhtType}:`, metricsError);
        }
      }
      stats.dataQuality = this.calculateDataQuality(stats);
      return stats;
    } catch (error) {
      console.error(`❌ Ошибка сбора статистики для ${dhtType}:`, error);
      return this.createEmptyDHTStats(dhtType, "error");
    }
  }
  /**
   * Рассчитывает качество данных DHT
   */
  calculateDataQuality(instanceStats) {
    let score = 100;
    const issues = [];
    if (instanceStats.queries.total < instanceStats.queries.successful + instanceStats.queries.failed) {
      score -= 20;
      issues.push("Total queries less than sum of successful + failed");
    }
    if (instanceStats.status === "running" && instanceStats.peerCount === 0 && instanceStats.queries.total === 0) {
      score -= 30;
      issues.push("Running DHT with no peers or queries");
    }
    if (instanceStats.metrics.successRate > 100 || instanceStats.metrics.successRate < 0) {
      score -= 15;
      issues.push("Invalid success rate value");
    }
    if (instanceStats.peerCount < 0 || instanceStats.queries.total < 0) {
      score -= 25;
      issues.push("Negative values detected");
    }
    return {
      score: Math.max(0, score),
      issues,
      lastValidated: Date.now(),
      status: score >= 80 ? "good" : score >= 60 ? "fair" : "poor"
    };
  }
  /**
   * Рассчитывает summary статистику для всех DHT
   */
  calculateSummary(stats) {
    const activeDHTs = ["lan", "amino", "universe"].filter(
      (type) => stats[type]?.status === "running"
    ).length;
    const totalPeers = ["lan", "amino", "universe"].reduce(
      (sum, type) => sum + (stats[type]?.peerCount || 0),
      0
    );
    const totalQueries = ["lan", "amino", "universe"].reduce(
      (sum, type) => sum + (stats[type]?.queries?.total || 0),
      0
    );
    const totalRecords = ["lan", "amino", "universe"].reduce(
      (sum, type) => sum + (stats[type]?.records?.stored || 0),
      0
    );
    return {
      totalPeers,
      totalQueries,
      totalRecords,
      activeDHTs,
      overallHealth: this.calculateOverallHealth(stats),
      dataQuality: this.calculateSummaryDataQuality(stats)
    };
  }
  /**
   * Рассчитывает общее состояние здоровья DHT
   */
  calculateOverallHealth(stats) {
    const activeDHTs = ["lan", "amino", "universe"].filter(
      (type) => stats[type]?.status === "running"
    ).length;
    if (activeDHTs === 0) return "critical";
    if (activeDHTs === 3) return "excellent";
    if (activeDHTs >= 2) return "good";
    return "fair";
  }
  /**
   * Рассчитывает общее качество данных
   */
  calculateSummaryDataQuality(stats) {
    const scores = ["lan", "amino", "universe"].map((type) => stats[type]?.dataQuality?.score || 0).filter((score) => score > 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a2, b) => a2 + b, 0) / scores.length);
  }
  /**
   * Обновляет общее качество данных
   */
  updateOverallDataQuality(stats) {
    const dhtTypes = ["lan", "amino", "universe"];
    const qualityScores = dhtTypes.map((type) => stats[type]?.dataQuality?.score || 0).filter((score) => score > 0);
    const avgScore = qualityScores.length > 0 ? qualityScores.reduce((a2, b) => a2 + b, 0) / qualityScores.length : 0;
    const state = this.state;
    state.dataQuality = {
      score: Math.round(avgScore),
      lastValidation: Date.now(),
      issues: dhtTypes.flatMap(
        (type) => (stats[type]?.dataQuality?.issues || []).map((issue) => `${type}: ${issue}`)
      ),
      status: avgScore >= 80 ? "good" : avgScore >= 60 ? "fair" : "poor"
    };
  }
  async _componentReady() {
    await this.fullRender(this.state);
    this._controller = await controller(this);
    this._actions = await createActions(this);
    this.refreshData("all").catch((e2) => {
      console.error("error: ", e2);
    });
  }
  /**
   * Обновляет данные DHT
   */
  async refreshData(type) {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode?.libp2pInstance?.libp2p?.services) {
        const services = libp2pNode.libp2pInstance.libp2p.services;
        const dhtConfig = {
          "all": {
            services: ["aminoDHT", "lanDHT", "universeDHT"],
            types: ["amino", "lan", "universe"]
          },
          "amino": {
            services: ["aminoDHT"],
            types: ["amino"]
          },
          "lan": {
            services: ["lanDHT"],
            types: ["lan"]
          },
          "universe": {
            services: ["universeDHT"],
            types: ["universe"]
          }
        };
        const config = dhtConfig[type];
        const state = this.state;
        for (let i2 = 0; i2 < config.services.length; i2++) {
          const serviceName = config.services[i2];
          const dhtType = config.types[i2];
          const dhtInstance = services[serviceName];
          if (dhtInstance) {
            try {
              if (dhtInstance.routingTable?.kb) {
                if (type === "all") {
                  if (i2 === 0) this.visualizeAllDHTs(services);
                } else {
                }
              }
              const stats = await this.collectDHTStats(dhtType, dhtInstance);
              state.dhtStats[dhtType] = stats;
            } catch (dhtError) {
              console.error(`❌ Ошибка обработки ${serviceName}:`, dhtError);
              state.dhtStats[dhtType] = this.createEmptyDHTStats(dhtType, "error");
            }
          } else {
            state.dhtStats[dhtType] = this.createEmptyDHTStats(dhtType, "stopped");
          }
        }
        state.dhtStats.summary = this.calculateSummary(state.dhtStats);
        state.dhtStats.lastUpdated = Date.now();
        this.updateOverallDataQuality(state.dhtStats);
        await this.updateDHTDisplay();
      } else {
        await this.generateMockDHTStats();
      }
    } catch (error) {
      console.error("❌ Error refreshing DHT data:", error);
      await this.showModal({
        title: "Ошибка обновления DHT",
        content: `Не удалось обновить данные DHT: ${error}`,
        buttons: [{ text: "Закрыть", type: "primary" }]
      });
    }
  }
  /**
   * Обработчик обновления статистики DHT
   */
  handleDHTStatsUpdate(data) {
    try {
      if (data.stats) {
        const state = this.state;
        state.connectionStatus = "connected";
        state.sseConnectionState = "active";
        const processedData = this.processDHTStatsData(data.stats);
        state.dhtStats = processedData;
        state.dhtStatsUpdated = true;
        this.updateOverallDataQuality(processedData);
        this.postMessage({
          type: "UPDATE_DISPLAY",
          data: { stats: processedData }
        });
        this.logStatsUpdate(processedData);
      }
    } catch (dhtError) {
      console.error("❌ Error processing DHT SSE:", dhtError);
      this.handleDataProcessingError(dhtError, data);
    }
  }
  /**
   * Обработка и нормализация данных статистики
   */
  processDHTStatsData(stats) {
    const processed = { ...stats };
    ["lan", "amino", "universe"].forEach((type) => {
      if (processed[type]) {
        processed[type] = this.normalizeDHTInstanceStats(processed[type]);
      }
    });
    processed.summary = this.calculateSummary(processed);
    processed.lastUpdated = Date.now();
    return processed;
  }
  /**
   * Нормализация статистики отдельного экземпляра DHT
   */
  normalizeDHTInstanceStats(instanceStats) {
    const normalized = {
      ...instanceStats,
      peerCount: Math.max(0, parseInt(instanceStats.peerCount) || 0),
      routingTableSize: Math.max(0, parseInt(instanceStats.routingTableSize) || 0),
      queries: {
        total: Math.max(0, parseInt(instanceStats.queries?.total) || 0),
        successful: Math.max(0, parseInt(instanceStats.queries?.successful) || 0),
        failed: Math.max(0, parseInt(instanceStats.queries?.failed) || 0),
        pending: Math.max(0, parseInt(instanceStats.queries?.pending) || 0)
      },
      records: {
        stored: Math.max(0, parseInt(instanceStats.records?.stored) || 0),
        provided: Math.max(0, parseInt(instanceStats.records?.provided) || 0),
        received: Math.max(0, parseInt(instanceStats.records?.received) || 0)
      },
      buckets: {
        total: Math.max(0, parseInt(instanceStats.buckets?.total) || 0),
        full: Math.max(0, parseInt(instanceStats.buckets?.full) || 0),
        depth: Math.max(0, parseInt(instanceStats.buckets?.depth) || 0)
      },
      metrics: {
        queryLatency: Math.max(0, parseFloat(instanceStats.metrics?.queryLatency) || 0),
        successRate: Math.max(0, Math.min(100, parseFloat(instanceStats.metrics?.successRate) || 0)),
        peersPerBucket: Math.max(0, parseFloat(instanceStats.metrics?.peersPerBucket) || 0)
      },
      dataQuality: {
        score: 0,
        issues: [],
        lastValidated: null,
        status: "unknown"
      }
    };
    normalized.dataQuality = this.calculateDataQuality(normalized);
    return normalized;
  }
  logStatsUpdate(stats) {
    const summary = stats.summary;
    const state = this.state;
    log3("✅ DHT Stats Updated:", {
      totalPeers: summary.totalPeers,
      totalQueries: summary.totalQueries,
      activeDHTs: summary.activeDHTs,
      overallHealth: summary.overallHealth,
      dataQuality: state.dataQuality.score,
      timestamp: new Date(stats.lastUpdated).toLocaleTimeString()
    });
  }
  /**
   * Обработка ошибок обработки данных
   */
  handleDataProcessingError(error, data) {
    console.error("❌ Data processing error:", error);
    const state = this.state;
    state.dhtStats = {
      lan: this.createEmptyDHTStats("lan", "error"),
      amino: this.createEmptyDHTStats("amino", "error"),
      universe: this.createEmptyDHTStats("universe", "error"),
      summary: {
        totalPeers: 0,
        totalQueries: 0,
        totalRecords: 0,
        activeDHTs: 0,
        overallHealth: "error",
        dataQuality: 0
      },
      lastUpdated: Date.now()
    };
    state.dataQuality = {
      score: 0,
      lastValidation: Date.now(),
      issues: [`Data processing error: ${error.message}`],
      status: "error"
    };
    this.addError({
      componentName: "DHTManager",
      source: "handleDHTStatsUpdate",
      message: `Ошибка обработки данных DHT: ${error.message}`,
      details: { error, originalData: data }
    });
  }
  async postMessage(event) {
    try {
      const state = this.state;
      switch (event.type) {
        case "REFRESH_STATS":
          await this.refreshData("all");
          return { success: true, message: "DHT stats refresh initiated" };
        case "GET_STATS":
          return {
            success: true,
            stats: state.dhtStats,
            state: this.state
          };
        case "GET_BUCKETS":
          const dhtType = event.data?.type || "lan";
          if (dhtType === "all") {
            const buckets = ["lan", "amino", "universe"].map((type2) => ({
              type: type2,
              totalBuckets: 10,
              fullBuckets: Math.floor(Math.random() * 3),
              totalPeers: state.dhtStats[type2]?.peerCount || 0,
              averagePeersPerBucket: Math.round((state.dhtStats[type2]?.peerCount || 0) / 10),
              routingTableDepth: 5
            }));
            return { success: true, buckets };
          } else {
            const bucketInfo = {
              totalBuckets: 10,
              fullBuckets: Math.floor(Math.random() * 3),
              totalPeers: state.dhtStats[dhtType]?.peerCount || 0,
              averagePeersPerBucket: Math.round((state.dhtStats[dhtType]?.peerCount || 0) / 10),
              routingTableDepth: 5,
              metrics: {
                successRate: state.dhtStats[dhtType]?.metrics?.successRate || "0%"
              },
              buckets: Array.from({ length: 10 }, (_, i2) => ({
                index: i2,
                size: Math.floor(Math.random() * 5),
                capacity: 20,
                full: false,
                peers: []
              }))
            };
            return { success: true, buckets: bucketInfo };
          }
        case "FIND_PEER":
          const peerId = event.data?.peerId;
          const findDHTType = event.data?.dhtType || "all";
          if (!peerId) {
            return { success: false, error: "Peer ID required" };
          }
          return {
            success: true,
            result: {
              status: true,
              results: [
                {
                  success: Math.random() > 0.5,
                  peerId,
                  addresses: ["/ip4/127.0.0.1/tcp/4001/p2p/" + peerId],
                  metadata: { foundIn: findDHTType }
                }
              ]
            }
          };
        case "FIND_PROVIDERS":
          const cid = event.data?.cid;
          const maxProviders = event.data?.maxProviders || 20;
          if (!cid) {
            return { success: false, error: "CID required" };
          }
          return {
            success: true,
            result: {
              status: true,
              totalProviders: Math.floor(Math.random() * maxProviders),
              providers: Array.from({ length: Math.min(5, maxProviders) }, (_, i2) => ({
                peerId: `12D3KooWProvider${i2}`,
                addresses: [`/ip4/192.168.${i2}.1/tcp/4001/p2p/12D3KooWProvider${i2}`]
              }))
            }
          };
        case "PROVIDE_CONTENT":
          const provideCid = event.data?.cid;
          const provideDHTType = event.data?.dhtType || "all";
          if (!provideCid) {
            return { success: false, error: "CID required" };
          }
          return {
            success: true,
            result: {
              status: true,
              results: [
                {
                  success: true,
                  dhtType: provideDHTType,
                  message: `Content ${provideCid} provided successfully`
                }
              ]
            }
          };
        case "SWITCH_TYPE":
          const type = event.data?.type || "all";
          if (["all", "lan", "amino", "universe"].includes(type)) {
            state.activeDHTType = type;
            await this.switchDHTType(type);
            return { success: true, activeType: type };
          }
          return { success: false, error: "Invalid DHT type" };
        case "GET_DIAGNOSTICS":
          return {
            success: true,
            diagnostics: this.getDiagnostics()
          };
        case "UPDATE_DISPLAY":
          await this.updateDHTDisplay(event.data);
          return { success: true, message: "Display updated" };
        default:
          console.warn(`[DHTManager] Unknown message type: ${event.type}`);
          return {
            success: false,
            error: "Unknown message type",
            availableTypes: [
              "REFRESH_STATS",
              "GET_STATS",
              "GET_BUCKETS",
              "FIND_PEER",
              "FIND_PROVIDERS",
              "PROVIDE_CONTENT",
              "SWITCH_TYPE",
              "GET_DIAGNOSTICS",
              "UPDATE_DISPLAY"
            ]
          };
      }
    } catch (error) {
      this.addError({
        componentName: this.constructor.name,
        source: "postMessage",
        message: `Error processing message ${event.type}`,
        details: error
      });
      return { success: false, error: error.message };
    }
  }
  async generateMockDHTStats() {
    const state = this.state;
    const now = Date.now();
    const mockStats = {
      lan: this.createEmptyDHTStats("lan", "error"),
      amino: this.createEmptyDHTStats("amino", "error"),
      universe: this.createEmptyDHTStats("universe", "error"),
      summary: {
        totalPeers: 0,
        totalQueries: 0,
        totalRecords: 0,
        activeDHTs: 0,
        overallHealth: "good",
        dataQuality: 0
      },
      lastUpdated: now
    };
    mockStats.summary = this.calculateSummary(mockStats);
    state.dhtStats = mockStats;
    state.dhtStatsUpdated = true;
    await this.updateDHTDisplay({ stats: mockStats });
    this.showNotification("DHT stats refreshed with mock data", "info");
  }
  async switchDHTType(dhtType) {
    const state = this.state;
    state.activeDHTType = dhtType;
    const buttons = ["all", "lan", "amino", "universe"];
    for (const type of buttons) {
      const isActive = type === dhtType;
      await this.updateElement({
        selector: `#dhtBtn-${type}`,
        value: isActive ? "btn-primary dht-type-btn " : "btn-secondary dht-type-btn ",
        property: "className",
        action: "set"
      });
    }
    await this.updateDHTDisplay();
  }
  async updateDHTDisplay(data) {
    try {
      if (data?.stats) {
        const state = this.state;
        state.dhtStats = data.stats;
        state.dhtStatsUpdated = true;
      }
      console.log("@@@@@@@@@@ renderPart @@@@@@@@@@ 8");
      await this.renderPart({
        partName: "renderDHTStats",
        state: this.state,
        selector: "#dhtStatsContainer"
      });
    } catch (renderError) {
      console.error("❌ Render error in updateDHTDisplay:", renderError);
    }
  }
  async getDHTStats() {
    return this.state.dhtStats;
  }
  async _componentDisconnected() {
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
  getDiagnostics() {
    const state = this.state;
    return {
      component: "DHTManager",
      state: {
        connectionStatus: state.connectionStatus,
        sseConnectionState: state.sseConnectionState,
        activeDHTType: state.activeDHTType,
        dataQuality: state.dataQuality,
        lastUpdate: state.dhtStats.lastUpdated
      },
      stats: {
        totalPeers: state.dhtStats.summary.totalPeers,
        activeDHTs: state.dhtStats.summary.activeDHTs,
        overallHealth: state.dhtStats.summary.overallHealth
      },
      timestamp: Date.now()
    };
  }
  showNotification(message, type = "info") {
    window.dispatchEvent(new CustomEvent("show-notification", {
      detail: {
        message,
        type
      }
    }));
  }
};
if (!customElements.get("dht-manager")) {
  customElements.define("dht-manager", DHTManager);
}
export {
  DHTManager
};
//# sourceMappingURL=index.js.map
