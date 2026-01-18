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

// src/components/peers-manager/template/index.ts
function defaultTemplate({ state = {} }) {
  const { peers = [], searchQuery = "", totalPeers = 0, totalConnections = 0 } = state;
  return `
    <div class="peers-manager">
      <div class="card full-width">
        <div class="card-header">
          <h3 class="card-title">
            <span class="card-icon">👥</span>
            Connected Peers
          </h3>
          <span class="card-badge">${totalPeers}</span>
        </div>
        <div class="card-content">
          ${renderActionBar()}
          ${renderSearchSection(searchQuery)}
          <div class="peers-list" id="peersList">
            ${renderPeersList(peers)}
          </div>
          ${renderStatsSection(totalPeers, totalConnections)}
        </div>
      </div>
    </div>
  `;
}
function renderActionBar() {
  return `
    <div class="action-bar">
      <button class="btn btn-success" id="get-all-peers">
        <span>📋</span> Get Detailed Peers Info
      </button>
      <button class="btn btn-warning" id="get-blocked-peers">
        <span>🚫</span> Get Blocked Peers
      </button>
      <button class="btn btn-info" id="get-ping-status">
        <span>📊</span> Ping Status
      </button>
      <button class="btn btn-secondary" id="refresh-peers">
        <span>🔄</span> Refresh
      </button>
      <button class="btn btn-danger" id="disconnect-all-peers">
        <span>🚫</span> Disconnect All
      </button>
    </div>
  `;
}
function renderSearchSection(searchQuery = "") {
  return `
    <div class="search-section">
      <div class="search-container">
        <input 
          type="text" 
          id="peer-search-input" 
          class="search-input" 
          placeholder="Search peers by ID, address, or protocol..."
          value="${escapeHtml(searchQuery)}"
        >
        <button class="btn btn-secondary" id="clear-search">
          <span>🗑️</span> Clear
        </button>
      </div>
    </div>
  `;
}
function renderPeersList(peers = []) {
  if (peers.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-icon">👥</div>
        <p class="empty-text">No peers connected</p>
        <p class="empty-description">Connect to peers to see them here</p>
      </div>
    `;
  }
  return `${peers.map((peer) => renderPeerItem(peer)).join("")}`;
}
function renderPeerItem(peer) {
  const isBlocked = peer.blocked || peer.permanentlyBlocked;
  const peerId = escapeHtml(peer.peerId);
  return `
    <div class="peer-item ${isBlocked ? "peer-blocked" : ""}" data-peer-id="${peerId}">
      <div class="peer-info">
        <div class="peer-id">${peerId}</div>
        <div class="peer-meta">
          <span class="meta-item">🔗 ${peer.connectionCount || 0} connections</span>
          <span class="meta-item">📊 ${peer.streamCount || 0} streams</span>
          ${peer.autoPing ? '<span class="meta-item ping-active">📡 Auto Ping</span>' : ""}
          ${isBlocked ? '<span class="meta-item blocked">🚫 Blocked</span>' : ""}
          ${peer.permanentlyBlocked ? '<span class="meta-item permanently-blocked">⛔ Permanent</span>' : ""}
        </div>
        ${renderConnectionDetails(peer.connections)}
      </div>
      <div class="peer-actions">
        <button class="peer-btn peer-btn-info peer-btn-info" onclick="this.getRootNode().host.getSpecificPeerInfo('${peerId}')">
          🔍 Info
        </button>
        <button class="peer-btn peer-btn-warning peer-btn-ping" onclick="this.getRootNode().host.pingSpecificPeer('${peerId}')">
          📡 Ping
        </button>
        ${peer.autoPing ? `
          <button class="peer-btn peer-btn-secondary peer-btn-auto-ping-stop" onclick="this.getRootNode().host.stopAutoPing('${peerId}')">
            ⏹️ Stop Ping
          </button>
        ` : `
          <button class="peer-btn peer-btn-success peer-btn-auto-ping-start" onclick="this.getRootNode().host.startAutoPing('${peerId}')">
            ▶️ Start Ping
          </button>
        `}
        <button class="peer-btn peer-btn-danger peer-btn-disconnect" onclick="this.getRootNode().host.disconnectSpecificPeer('${peerId}')">
          🚫 Disconnect
        </button>
        ${isBlocked ? `
          <button class="peer-btn peer-btn-warning peer-btn-unblock" onclick="this.getRootNode().host.unblockPeer('${peerId}')">
            ✅ Unblock
          </button>
        ` : `
          <button class="peer-btn peer-btn-danger peer-btn-block" onclick="this.getRootNode().host.blockPeer('${peerId}')">
            🚫 Block
          </button>
        `}
      </div>
    </div>
  `;
}
function renderConnectionDetails(connections = []) {
  if (!connections || connections.length === 0) {
    return "";
  }
  return `
    <div class="connection-details">
      ${connections.map((conn, index) => `
        <div class="connection-item">
          <span class="connection-id">Connection ${index + 1}</span>
          <span class="connection-status ${conn.status}">${conn.status}</span>
          <span class="connection-addr">${escapeHtml(conn.remoteAddr || "Unknown")}</span>
        </div>
      `).join("")}
    </div>
  `;
}
function renderStatsSection(totalPeers = 0, totalConnections = 0) {
  return `
    <div class="stats-section">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${totalPeers}</div>
          <div class="stat-label">Total Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${totalConnections}</div>
          <div class="stat-label">Total Connections</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="activePeersCount">${totalPeers}</div>
          <div class="stat-label">Active Peers</div>
        </div>
        <div class="stat-item">
          <div class="stat-value" id="blockedPeersCount">0</div>
          <div class="stat-label">Blocked Peers</div>
        </div>
      </div>
    </div>
  `;
}
function renderPeersListPart({ state = {} }) {
  return renderPeersList(state.peers);
}
function renderStatsPart({ state = {} }) {
  const { totalPeers = 0, totalConnections = 0, blockedPeersCount = 0 } = state;
  return `
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Total Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalConnections}</div>
        <div class="stat-label">Total Connections</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${totalPeers}</div>
        <div class="stat-label">Active Peers</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${blockedPeersCount}</div>
        <div class="stat-label">Blocked Peers</div>
      </div>
    </div>
  `;
}
function renderSearchEmptyState({ state = {} }) {
  const { searchQuery = "" } = state;
  return `
    <div class="empty-state">
      <div class="empty-icon">🔍</div>
      <p class="empty-text">No peers found for "${escapeHtml(searchQuery)}"</p>
      <p class="empty-description">Try adjusting your search terms or discover new peers</p>
      <div class="empty-actions">
        <button class="empty-action" onclick="this.getRootNode().host.clearSearch()">
          Clear Search
        </button>
      </div>
    </div>
  `;
}
function renderSearchResults({ state = {} }) {
  const { searchResults = [], searchQuery = "" } = state;
  if (searchResults.length === 0) {
    return renderSearchEmptyState({ state });
  }
  return `
    <div class="search-results">
      <div class="search-header">
        <h4>Search Results for "${escapeHtml(searchQuery)}"</h4>
        <span class="results-count">${searchResults.length} peers found</span>
      </div>
      <div class="peers-list">
        ${searchResults.map((peer) => renderPeerItem(peer)).join("")}
      </div>
    </div>
  `;
}
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// src/components/peers-manager/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler, options = {}) => {
    element.addEventListener(event, handler, options);
    eventListeners.push({ element, event, handler, options });
  };
  return {
    async init() {
      try {
        addEventListener(context.shadowRoot, "click", (e2) => {
          const target = e2.target;
          const actionElement = target.closest("[data-action]");
          if (actionElement) {
            e2.preventDefault();
            e2.stopPropagation();
            const action = actionElement.getAttribute("data-action");
            const peerId2 = actionElement.getAttribute("data-peer-id");
            if (!action) return;
            switch (action) {
              case "refresh-peers":
                context.refreshPeers();
                break;
              case "get-all-peers":
                context._actions.loadAllPeers();
                break;
              case "get-blocked-peers":
                context.getBlockedPeers();
                break;
              case "get-ping-status":
                context.getPingStatus();
                break;
              case "disconnect-all-peers":
                context.disconnectAllPeers();
                break;
              case "clear-search":
                context.clearSearch();
                break;
              case "copy-peer-id":
                if (peerId2) {
                  navigator.clipboard.writeText(peerId2).then(() => {
                    console.log("Peer ID copied to clipboard");
                  });
                }
                break;
            }
          }
          const peerItem = target.closest(".peer-item");
          if (!peerItem) return;
          const peerId = peerItem.getAttribute("data-peer-id");
          if (!peerId) return;
          if (target.classList.contains("peer-btn-info")) {
            context.getSpecificPeerInfo(peerId);
          } else if (target.classList.contains("peer-btn-ping")) {
            context.pingSpecificPeer(peerId);
          } else if (target.classList.contains("peer-btn-disconnect")) {
            context.disconnectSpecificPeer(peerId);
          } else if (target.classList.contains("peer-btn-block")) {
            context._actions.blockPeer(peerId);
          } else if (target.classList.contains("peer-btn-unblock")) {
            context._actions.unblockPeer(peerId);
          } else if (target.classList.contains("peer-btn-auto-ping-start")) {
            context.startAutoPing(peerId);
          } else if (target.classList.contains("peer-btn-auto-ping-stop")) {
            context.stopAutoPing(peerId);
          }
        });
        addEventListener(context.shadowRoot, "input", (e2) => {
          const target = e2.target;
          if (target.id === "peer-search-input") {
            context.handleSearchInput(e2);
          }
        });
        addEventListener(document, "keydown", (e2) => {
          const keyboardEvent = e2;
          if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
            e2.preventDefault();
            context.refreshPeers();
          }
          if (keyboardEvent.key === "Escape") {
            const searchInput = context.shadowRoot?.querySelector("#peer-search-input");
            if (searchInput && searchInput.value) {
              searchInput.value = "";
              context.clearSearch();
            }
          }
          if (keyboardEvent.key === "/" && !keyboardEvent.ctrlKey && !keyboardEvent.altKey) {
            e2.preventDefault();
            const searchInput = context.shadowRoot?.querySelector("#peer-search-input");
            if (searchInput) {
              searchInput.focus();
            }
          }
        });
        addEventListener(document, "visibilitychange", () => {
          const autoRefresh2 = context.getAttribute("data-auto-refresh") === "true";
          if (autoRefresh2 && !document.hidden) {
            setTimeout(() => {
              context.refreshPeers();
            }, 1e3);
          }
        });
        addEventListener(window, "peers-updated", () => {
          context.refreshPeers();
        });
        addEventListener(window, "libp2p:peers-updated", async (e2) => {
          const detail = e2.detail;
          if (detail?.peers) {
            await context.postMessage({
              type: "UPDATE_FROM_LIBP2P",
              data: { peers: detail.peers }
            });
          }
        });
        const autoRefresh = context.getAttribute("data-auto-refresh") === "true";
        if (autoRefresh) {
          setTimeout(() => {
            context.refreshPeers();
          }, 2e3);
        }
      } catch (error) {
        console.error("Error initializing peers manager controller:", error);
        context.addError({
          componentName: "PeersManager",
          source: "controller.init",
          message: "Failed to initialize controller",
          details: error
        });
      }
    },
    async destroy() {
      eventListeners.forEach(({ element, event, handler, options }) => {
        element.removeEventListener(event, handler, options);
      });
      eventListeners = [];
    },
    // Вспомогательные методы для тестирования
    getEventListeners() {
      return [...eventListeners];
    }
  };
};

// src/components/peers-manager/actions/index.ts
async function createActions(context) {
  return {
    loadAllPeers: loadAllPeers.bind(context),
    getPeerInfo: getPeerInfo.bind(context),
    pingPeer: pingPeer.bind(context),
    disconnectPeer: disconnectPeer.bind(context),
    blockPeer: blockPeer.bind(context),
    unblockPeer: unblockPeer.bind(context),
    loadBlockedPeers: loadBlockedPeers.bind(context),
    disconnectAllPeers: disconnectAllPeers.bind(context),
    updatePingStatus: updatePingStatus.bind(context),
    startAutoPing: startAutoPing.bind(context),
    stopAutoPing: stopAutoPing.bind(context),
    cleanup: cleanup.bind(context)
  };
}
async function getConfirmationFromModal(context, config) {
  return new Promise((resolve) => {
    let confirmed = false;
    context.showModal({
      ...config,
      buttons: config.buttons.map((btn) => ({
        ...btn,
        action: () => {
          if (btn.type === "danger" || btn.type === "primary") {
            confirmed = true;
          }
          resolve(confirmed);
        }
      }))
    });
  });
}
async function loadAllPeers() {
  try {
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found. Please start the node first.");
    }
    const response = await libp2pNode.postMessage({ type: "GET_CONNECTED_PEERS" });
    if (response.success && response.peers) {
      await this.postMessage({
        type: "UPDATE_FROM_LIBP2P",
        data: { peers: response.peers }
      });
      this.showNotification(`Loaded ${response.peers.length} peers from libp2p-node`, "success");
    } else {
      throw new Error(response.error || "Failed to get peers from libp2p-node");
    }
  } catch (error) {
    console.error("Error loading all peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } finally {
    await this.hideSkeleton();
  }
}
async function getPeerInfo(peerId) {
  try {
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "GET_PEER_INFO",
      data: { peerId }
    });
    if (response.success && response.peer) {
      const peerInfo = response.peer;
      await this.showModal({
        title: "Peer Information",
        content: `
        <div style="font-family: monospace; font-size: 0.9em;">
          <div><strong>Peer ID:</strong> ${peerInfo.peerId}</div>
          <div><strong>Connections:</strong> ${peerInfo.connectionCount || 0}</div>
          <div><strong>Streams:</strong> ${peerInfo.streamCount || 0}</div>
          <div><strong>Blocked:</strong> ${peerInfo.blocked ? "Yes" : "No"}</div>
          <div><strong>Auto Ping:</strong> ${peerInfo.autoPing ? "Enabled" : "Disabled"}</div>
          ${peerInfo.connections && peerInfo.connections.length > 0 ? `
          <div><strong>Addresses:</strong></div>
          <ul>
            ${peerInfo.connections.map(
          (conn) => `<li>${conn.remoteAddr} (${conn.status})</li>`
        ).join("")}
          </ul>
          ` : ""}
        </div>
      `,
        buttons: [{ text: "Close", type: "primary" }]
      });
    } else {
      const state = this.state;
      const peer = state.peers.find((p2) => p2.peerId === peerId);
      if (peer) {
        await this.showModal({
          title: "Peer Information",
          content: `
          <div style="font-family: monospace; font-size: 0.9em;">
            <div><strong>Peer ID:</strong> ${peer.peerId}</div>
            <div><strong>Connections:</strong> ${peer.connectionCount || 0}</div>
            <div><strong>Streams:</strong> ${peer.streamCount || 0}</div>
            <div><strong>Blocked:</strong> ${peer.blocked ? "Yes" : "No"}</div>
            <div><strong>Auto Ping:</strong> ${peer.autoPing ? "Enabled" : "Disabled"}</div>
            ${peer.connections && peer.connections.length > 0 ? `
            <div><strong>Addresses:</strong></div>
            <ul>
              ${peer.connections.map(
            (conn) => `<li>${conn.remoteAddr} (${conn.status})</li>`
          ).join("")}
            </ul>
            ` : ""}
          </div>
        `,
          buttons: [{ text: "Close", type: "primary" }]
        });
      } else {
        throw new Error("Peer not found");
      }
    }
  } catch (error) {
    console.error(`Error getting peer info for ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to get peer information: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function pingPeer(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .ping-status`,
      value: "Pinging...",
      property: "textContent"
    });
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "PING_PEER",
      data: { peerId }
    });
    if (response.success && response.latency) {
      const latency = response.latency;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-status`,
        value: `${latency}ms`,
        property: "textContent"
      });
      let pingClass = "ping-poor";
      if (latency < 100) pingClass = "ping-good";
      else if (latency < 300) pingClass = "ping-medium";
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-indicator`,
        value: pingClass,
        property: "className",
        action: "set"
      });
      this.showNotification(`Ping to ${peerId}: ${latency}ms`, "success");
      return { success: true, latency };
    } else {
      const latency = Math.floor(Math.random() * 200) + 50;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-status`,
        value: `${latency}ms (simulated)`,
        property: "textContent"
      });
      let pingClass = "ping-poor";
      if (latency < 100) pingClass = "ping-good";
      else if (latency < 300) pingClass = "ping-medium";
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"] .ping-indicator`,
        value: pingClass,
        property: "className",
        action: "set"
      });
      this.showNotification(`Ping to ${peerId}: ${latency}ms (simulated)`, "info");
      return { success: true, latency };
    }
  } catch (error) {
    console.error(`Error pinging peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .ping-status`,
      value: "Error",
      property: "textContent"
    });
    return { success: false, error: error.message };
  }
}
async function disconnectPeer(peerId) {
  try {
    const confirmed = await getConfirmationFromModal(this, {
      title: "Confirm Disconnect",
      content: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 3em; color: #f56565;">⚠️</div>
          <div style="margin: 15px 0;">
            Are you sure you want to disconnect this peer?
          </div>
          <div style="font-family: monospace; background: #fed7d7; padding: 10px; border-radius: 4px; font-size: 0.9em;">
            ${peerId}
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "Disconnect", type: "danger" }
      ]
    });
    if (!confirmed) {
      return { success: false };
    }
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("libp2p-node not found");
    }
    const response = await libp2pNode.postMessage({
      type: "DISCONNECT_PEER",
      data: { peerId }
    });
    if (!response.success) {
      throw new Error(response.error || "Failed to disconnect peer");
    }
    const state = this.state;
    state.peers = state.peers.filter((peer) => peer.peerId !== peerId);
    state.totalPeers = state.peers.length;
    await this.updateStatsDisplay();
    await this.updatePeersList();
    this.showNotification(`Peer ${peerId} disconnected`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error disconnecting peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to disconnect peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function blockPeer(peerId) {
  try {
    const confirmed = await getConfirmationFromModal(this, {
      title: "Block Peer",
      content: `
        <div style="text-align: center; padding: 10px;">
          <div style="font-size: 3em; color: #f56565;">🚫</div>
          <div style="margin: 15px 0;">
            Block this peer?
          </div>
          <div style="font-family: monospace; background: #fed7d7; padding: 10px; border-radius: 4px; font-size: 0.9em;">
            ${peerId}
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "Block", type: "danger" }
      ]
    });
    if (!confirmed) return { success: false };
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].blocked = true;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"]`,
        value: "peer-blocked",
        property: "className",
        action: "add"
      });
      await this.updateStatsDisplay();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "BLOCK_PEER",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support blocking, using local blocking only");
    }
    this.showNotification(`Peer ${peerId} blocked`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error blocking peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to block peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function unblockPeer(peerId) {
  try {
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].blocked = false;
      await this.updateElement({
        selector: `[data-peer-id="${peerId}"]`,
        value: "peer-blocked",
        property: "className",
        action: "remove"
      });
      await this.updateStatsDisplay();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "UNBLOCK_PEER",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support unblocking, using local unblocking only");
    }
    this.showNotification(`Peer ${peerId} unblocked`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error unblocking peer ${peerId}:`, error);
    await this.showModal({
      title: "Error",
      content: `Failed to unblock peer: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function loadBlockedPeers() {
  try {
    const state = this.state;
    const blockedPeers = state.peers.filter((peer) => peer.blocked);
    await this.showModal({
      title: "Blocked Peers",
      content: `
        <div style="max-height: 400px; overflow-y: auto;">
          ${blockedPeers.length > 0 ? blockedPeers.map((peer) => `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 10px; background: #fff5f5;">
                <div style="font-family: monospace; font-weight: bold; margin-bottom: 5px;">${peer.peerId}</div>
                <div style="color: #718096; font-size: 0.9em;">
                  <div>Blocked: Permanent</div>
                </div>
              </div>
            `).join("") : '<div style="text-align: center; padding: 20px; color: #718096;">No blocked peers</div>'}
        </div>
      `,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } catch (error) {
    console.error("Error loading blocked peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load blocked peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function disconnectAllPeers() {
  try {
    const state = this.state;
    const confirmed = await getConfirmationFromModal(this, {
      title: "Disconnect All Peers",
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 4em; color: #f56565;">⚠️</div>
          <div style="margin: 20px 0; font-size: 1.2em; font-weight: bold;">
            ARE YOU SURE?
          </div>
          <div style="background: #fed7d7; padding: 15px; border-radius: 8px; margin: 15px 0;">
            This will disconnect <strong>${state.totalPeers} peers</strong><br>
            and close <strong>${state.totalConnections} connections</strong>
          </div>
        </div>
      `,
      buttons: [
        { text: "Cancel", type: "secondary" },
        { text: "DISCONNECT ALL", type: "danger" }
      ]
    });
    if (!confirmed) return { success: false };
    await this.showSkeleton();
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (libp2pNode) {
      for (const peer of state.peers) {
        try {
          await libp2pNode.postMessage({
            type: "DISCONNECT_PEER",
            data: { peerId: peer.peerId }
          });
        } catch (error) {
          console.error(`Error disconnecting peer ${peer.peerId}:`, error);
        }
      }
    }
    state.peers = [];
    state.totalPeers = 0;
    state.totalConnections = 0;
    await this.updateStatsDisplay();
    await this.updatePeersList();
    this.showNotification("All peers disconnected", "success");
    return { success: true };
  } catch (error) {
    console.error("Error disconnecting all peers:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to disconnect all peers: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function updatePingStatus() {
  try {
    const state = this.state;
    const peersWithAutoPing = state.peers.filter((peer) => peer.autoPing);
    await this.showModal({
      title: "Auto Ping Status",
      content: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 3em; color: #48bb78;">📡</div>
          <div style="margin: 15px 0;">
            <div style="font-size: 1.1em; margin-bottom: 10px;">
              Auto ping: <strong>${peersWithAutoPing.length > 0 ? "ENABLED" : "DISABLED"}</strong>
            </div>
            <div style="background: #f0fff4; padding: 15px; border-radius: 8px;">
              <div>Peers with auto ping: <strong>${peersWithAutoPing.length}</strong></div>
              <div>Total peers: <strong>${state.totalPeers}</strong></div>
            </div>
          </div>
        </div>
      `,
      buttons: [{ text: "Close", type: "primary" }]
    });
  } catch (error) {
    console.error("Error updating ping status:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to update ping status: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
  }
}
async function startAutoPing(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-success`,
      value: "Starting...",
      property: "textContent"
    });
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].autoPing = true;
      await this.updatePeersList();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "START_AUTO_PING",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support auto-ping, using local auto-ping only");
    }
    this.showNotification(`Auto ping started for peer ${peerId}`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error starting auto ping for peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-success`,
      value: "▶️ Start Ping",
      property: "textContent"
    });
    await this.showModal({
      title: "Error",
      content: `Failed to start auto ping: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function stopAutoPing(peerId) {
  try {
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-secondary`,
      value: "Stopping...",
      property: "textContent"
    });
    const state = this.state;
    const peerIndex = state.peers.findIndex((peer) => peer.peerId === peerId);
    if (peerIndex !== -1) {
      state.peers[peerIndex].autoPing = false;
      await this.updatePeersList();
    }
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await libp2pNode.postMessage({
          type: "STOP_AUTO_PING",
          data: { peerId }
        });
      }
    } catch (error) {
      console.log("libp2p-node does not support auto-ping, using local auto-ping only");
    }
    this.showNotification(`Auto ping stopped for peer ${peerId}`, "success");
    return { success: true };
  } catch (error) {
    console.error(`Error stopping auto ping for peer ${peerId}:`, error);
    await this.updateElement({
      selector: `[data-peer-id="${peerId}"] .peer-btn-secondary`,
      value: "⏹️ Stop Ping",
      property: "textContent"
    });
    await this.showModal({
      title: "Error",
      content: `Failed to stop auto ping: ${error.message}`,
      buttons: [{ text: "Close", type: "primary" }]
    });
    return { success: false };
  }
}
async function cleanup() {
  try {
    const state = this.state;
    state.peers = [];
    state.totalPeers = 0;
    state.totalConnections = 0;
  } catch (error) {
    console.error("Error cleaning up:", error);
  }
}

// src/components/peers-manager/index.ts
var logUpdatePeersDisplay = createLogger("peers-manager:updatePeersDisplay");
var PeersManager = class extends BaseComponent {
  static observedAttributes = ["data-auto-refresh", "data-refresh-interval"];
  constructor() {
    super();
    this._templateMethods = {
      defaultTemplate,
      renderPeersListPart: (params) => renderPeersListPart({ state: params.state, context: params.context }),
      renderStatsPart: (params) => renderStatsPart({ state: params.state, context: params.context }),
      renderSearchResults: (params) => renderSearchResults({ state: params.state, context: params.context }),
      renderSearchEmptyState: (params) => renderSearchEmptyState({ state: params.state, context: params.context })
    };
    this.state = {
      peers: [],
      searchQuery: "",
      filteredPeers: [],
      stats: {
        totalPeers: 0,
        totalConnections: 0,
        blockedPeers: 0,
        activePeers: 0
      },
      isLoading: false,
      libp2pNodeConnected: false
    };
  }
  async _componentReady() {
    this._controller = await controller(this);
    this._actions = await createActions(this);
    await this.connectToLibp2pNode();
    await this.fullRender(this.state);
  }
  async _componentAttributeChanged(name, _oldValue, newValue) {
    if (name === "data-auto-refresh") {
      this.showNotification(`Auto refresh ${newValue === "true" ? "enabled" : "disabled"}`, "info");
    }
  }
  async connectToLibp2pNode() {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      let timerId = null;
      if (libp2pNode) {
        const state = this.state;
        state.libp2pNodeConnected = true;
        await libp2pNode.postMessage({
          type: "SET_PEERS_MANAGER_LISTENER",
          data: {
            callback: (peers) => {
              if (timerId) {
                clearTimeout(timerId);
              }
              timerId = setTimeout(() => {
                console.log("@@@@@@@@@@@@@ SET_PEERS_MANAGER_LISTENER callback @@@@@@@@@@@@@", peers);
                this.updateFromLibp2p(peers);
              }, 2e3);
            }
          }
        });
        this.showNotification("Connected to libp2p-node", "success");
      } else {
        this.showNotification("libp2p-node not found", "warning");
      }
    } catch (error) {
      console.error("Error connecting to libp2p-node:", error);
      this.showNotification("Failed to connect to libp2p-node", "error");
    }
  }
  async updateFromLibp2p(peers) {
    const state = this.state;
    const formattedPeers = peers.map((peer) => ({
      peerId: peer.peerId,
      connectionCount: peer.connectionCount || 1,
      streamCount: peer.streamCount || 0,
      blocked: peer.blocked || false,
      autoPing: peer.autoPing || false,
      connections: peer.connections?.map((conn) => ({
        remoteAddr: conn.remoteAddr,
        status: conn.status
      })) || []
    }));
    state.peers = formattedPeers;
    this.updateStats();
    await this.applySearchFilter(state.searchQuery);
    await this.updatePeersDisplay();
  }
  async postMessage(event) {
    const state = this.state;
    try {
      switch (event.type) {
        case "LOAD_PEERS":
          console.log("---------- LOAD_PEERS ----------");
        // await this.loadPeersData();
        // return { success: true, stats: state.stats };
        case "GET_STATS":
          return {
            success: true,
            stats: state.stats,
            state: this.state
          };
        case "REFRESH_PEERS":
          console.log("---------- REFRESH_PEERS ----------");
        // await this.loadPeersData();
        // return { success: true, message: 'Peers refreshed' };
        case "SEARCH_PEERS":
          console.log("SEARCH_PEERS => updatePeersList");
        // const query = event.data?.query || '';
        // await this.applySearchFilter(query);
        // await this.updatePeersList();
        // return { success: true, results: state.filteredPeers.length };
        case "GET_PEER_INFO":
          const peerId = event.data?.peerId;
          if (!peerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.getPeerInfo) {
            await this._actions.getPeerInfo(peerId);
          }
          return { success: true };
        case "PING_PEER":
          const pingPeerId = event.data?.peerId;
          if (!pingPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.pingPeer) {
            const pingResult = await this._actions.pingPeer(pingPeerId);
            return pingResult;
          }
          return { success: false, error: "Actions not initialized" };
        case "DISCONNECT_PEER":
          const disconnectPeerId = event.data?.peerId;
          if (!disconnectPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.disconnectPeer) {
            await this._actions.disconnectPeer(disconnectPeerId);
          }
          return { success: true, message: "Peer disconnected" };
        case "BLOCK_PEER":
          const blockPeerId = event.data?.peerId;
          if (!blockPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.blockPeer) {
            await this._actions.blockPeer(blockPeerId);
          }
          return { success: true, message: "Peer blocked" };
        case "UNBLOCK_PEER":
          const unblockPeerId = event.data?.peerId;
          if (!unblockPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.unblockPeer) {
            await this._actions.unblockPeer(unblockPeerId);
          }
          return { success: true, message: "Peer unblocked" };
        case "GET_BLOCKED_PEERS":
          if (this._actions?.loadBlockedPeers) {
            await this._actions.loadBlockedPeers();
          }
          return { success: true };
        case "DISCONNECT_ALL_PEERS":
          if (this._actions?.disconnectAllPeers) {
            await this._actions.disconnectAllPeers();
          }
          return { success: true, message: "All peers disconnected" };
        case "GET_PING_STATUS":
          if (this._actions?.updatePingStatus) {
            await this._actions.updatePingStatus();
          }
          return { success: true };
        case "START_AUTO_PING":
          const startPeerId = event.data?.peerId;
          if (!startPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.startAutoPing) {
            await this._actions.startAutoPing(startPeerId);
          }
          return { success: true, message: "Auto ping started" };
        case "STOP_AUTO_PING":
          const stopPeerId = event.data?.peerId;
          if (!stopPeerId) {
            return { success: false, error: "Peer ID required" };
          }
          if (this._actions?.stopAutoPing) {
            await this._actions.stopAutoPing(stopPeerId);
          }
          return { success: true, message: "Auto ping stopped" };
        case "CLEAR_LOGS":
          return { success: true, message: "Logs cleared" };
        case "UPDATE_FROM_LIBP2P":
          const libp2pData = event.data;
          if (libp2pData?.peers) {
            await this.updateFromLibp2p(libp2pData.peers);
          }
          return { success: true, message: "Data synchronized from libp2p" };
        case "SET_PEERS_MANAGER_LISTENER":
          const callback = event.data?.callback;
          debugger;
          if (callback && typeof callback === "function") {
            const state2 = this.state;
            state2.libp2pNodeConnected = true;
            return { success: true, message: "PeersManager listener set" };
          }
          return { success: false, error: "Invalid callback" };
        default:
          console.warn(`[PeersManager] Unknown message type: ${event.type}`);
          return {
            success: false,
            error: "Unknown message type",
            availableTypes: [
              "LOAD_PEERS",
              "GET_STATS",
              "REFRESH_PEERS",
              "SEARCH_PEERS",
              "GET_PEER_INFO",
              "PING_PEER",
              "DISCONNECT_PEER",
              "BLOCK_PEER",
              "UNBLOCK_PEER",
              "GET_BLOCKED_PEERS",
              "DISCONNECT_ALL_PEERS",
              "GET_PING_STATUS",
              "START_AUTO_PING",
              "STOP_AUTO_PING",
              "CLEAR_LOGS",
              "UPDATE_FROM_LIBP2P",
              "SET_PEERS_MANAGER_LISTENER"
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
  async loadPeersData() {
    const state = this.state;
    state.isLoading = true;
    try {
      if (state.peers.length === 0) {
        await this.showSkeleton();
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (!libp2pNode) {
        await this.updateElement({
          selector: "#peersList",
          value: `
          <div class="info-state">
            <div class="info-icon">⏳</div>
            <p class="info-text">Libp2p Node not running</p>
            <p class="info-description">Start the Libp2p Node to see connected peers</p>
          </div>
        `,
          property: "innerHTML"
        });
        return;
      }
      const statsResponse = await libp2pNode.postMessage({ type: "GET_STATS" });
      if (!statsResponse.success || statsResponse.stats?.status !== "running") {
        await this.updateElement({
          selector: "#peersList",
          value: `
          <div class="info-state">
            <div class="info-icon">⏸️</div>
            <p class="info-text">Libp2p Node is not running</p>
            <p class="info-description">Start the node to connect to peers</p>
          </div>
        `,
          property: "innerHTML"
        });
        return;
      }
      const response = await libp2pNode.postMessage({ type: "GET_CONNECTED_PEERS" });
      if (response.success && response.peers) {
        await this.updateFromLibp2p(response.peers);
        if (response.peers.length > 0) {
          this.showNotification(`Loaded ${state.peers.length} peers`, "success");
        }
      } else {
        throw new Error(response.error || "Failed to get peers");
      }
    } catch (error) {
      console.error("Error loading peers data:", error);
    } finally {
      state.isLoading = false;
      await this.hideSkeleton();
    }
  }
  updateStats() {
    const state = this.state;
    state.stats = {
      totalPeers: state.peers.length,
      totalConnections: state.peers.reduce((sum, peer) => sum + (peer.connectionCount || 0), 0),
      blockedPeers: state.peers.filter((p2) => p2.blocked).length,
      activePeers: state.peers.filter((p2) => !p2.blocked && (p2.connectionCount || 0) > 0).length
    };
  }
  async applySearchFilter(searchQuery) {
    const state = this.state;
    state.searchQuery = searchQuery;
    if (!searchQuery.trim()) {
      state.filteredPeers = [...state.peers];
    } else {
      const query = searchQuery.toLowerCase();
      state.filteredPeers = state.peers.filter(
        (peer) => peer.peerId.toLowerCase().includes(query) || peer.connections?.some(
          (conn) => conn.remoteAddr.toLowerCase().includes(query)
        )
      );
    }
  }
  async updatePeersDisplay() {
    logUpdatePeersDisplay("------ updatePeersDisplay -------");
    const state = this.state;
    await this.updateElement({
      selector: ".card-badge",
      value: state.stats.totalPeers.toString(),
      property: "textContent"
    });
    await this.updateStatsDisplay();
    await this.updatePeersList();
  }
  async updateStatsDisplay() {
    const state = this.state;
    await this.renderPart({
      partName: "renderStatsPart",
      state: {
        totalPeers: state.stats.totalPeers,
        totalConnections: state.stats.totalConnections,
        blockedPeersCount: state.stats.blockedPeers
      },
      selector: ".stats-section .stats-grid"
    });
  }
  async updatePeersList() {
    const state = this.state;
    if (state.filteredPeers.length === 0) {
      if (state.searchQuery) {
        await this.renderPart({
          partName: "renderSearchEmptyState",
          state: { searchQuery: state.searchQuery },
          selector: "#peersList"
        });
      } else {
        await this.updateElement({
          selector: "#peersList",
          value: renderPeersListPart({ state: { peers: [] } }),
          property: "innerHTML"
        });
      }
      return;
    }
    await this.renderPart({
      partName: "renderPeersListPart",
      state: { peers: state.filteredPeers },
      selector: "#peersList"
    });
  }
  async refreshPeers() {
  }
  async getSpecificPeerInfo(peerId) {
    if (this._actions?.getPeerInfo) {
      await this._actions.getPeerInfo(peerId);
    }
  }
  async pingSpecificPeer(peerId) {
    if (this._actions?.pingPeer) {
      await this._actions.pingPeer(peerId);
    }
  }
  async disconnectSpecificPeer(peerId) {
    if (this._actions?.disconnectPeer) {
      await this._actions.disconnectPeer(peerId);
    }
  }
  async startAutoPing(peerId) {
    if (this._actions?.startAutoPing) {
      await this._actions.startAutoPing(peerId);
    }
  }
  async stopAutoPing(peerId) {
    if (this._actions?.stopAutoPing) {
      await this._actions.stopAutoPing(peerId);
    }
  }
  async getBlockedPeers() {
    if (this._actions?.loadBlockedPeers) {
      await this._actions.loadBlockedPeers();
    }
  }
  async getPingStatus() {
    if (this._actions?.updatePingStatus) {
      await this._actions.updatePingStatus();
    }
  }
  async disconnectAllPeers() {
    if (this._actions?.disconnectAllPeers) {
      await this._actions.disconnectAllPeers();
    }
  }
  async handleSearchInput(event) {
    const input = event.target;
    const query = input.value;
    await this.applySearchFilter(query);
    await this.updatePeersList();
  }
  async clearSearch() {
    const state = this.state;
    state.searchQuery = "";
    await this.applySearchFilter("");
    await this.updatePeersList();
    const searchInput = this.shadowRoot?.querySelector("#peer-search-input");
    if (searchInput) {
      await this.updateElement({
        selector: "#peer-search-input",
        value: "",
        property: "value"
      });
    }
  }
  // Публичный метод для показа уведомлений
  showNotification(message, type = "info") {
    window.dispatchEvent(new CustomEvent("show-notification", {
      detail: {
        message,
        type
      }
    }));
  }
  // Вспомогательные методы
  escapeHtml(text) {
    if (typeof text !== "string") return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  async _componentDisconnected() {
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
};
if (!customElements.get("peers-manager")) {
  customElements.define("peers-manager", PeersManager);
}
export {
  PeersManager
};
//# sourceMappingURL=index.js.map
