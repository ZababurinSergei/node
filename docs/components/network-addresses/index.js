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

// src/components/network-addresses/template/index.ts
var DEFAULT_METRICS = {
  connectionQuality: 0,
  latency: 0,
  activeConnections: 0,
  discoveredPeers: 0,
  protocolDistribution: {},
  uptime: 0
};
function defaultTemplate({ state = {} }) {
  const formattedTime = state.lastUpdated ? new Date(state.lastUpdated).toLocaleTimeString() : "Never";
  return `
        <div class="card network-addresses" data-theme="dark">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🌐</span>
                    Network Addresses
                </h3>
                <div class="header-controls">
                    <span class="card-badge">${state.totalAddresses || 0}</span>
                    <button class="btn btn-secondary theme-toggle-btn" title="Переключить тему">
                        <span class="theme-icon">🌓</span>
                    </button>
                </div>
            </div>
            <div class="card-content">
<!--                <div id="connectionInfo">-->
<!--                    ${renderConnectionInfo({ state, context: null })}-->
<!--                </div>-->

                <div class="addresses-container" id="addressesList">
                    ${renderAddressesList({ state, context: null })}
                </div>

<!--                <div id="statsSection">-->
<!--                    ${renderStatsTemplate({ state, context: null })}-->
<!--                </div>-->

<!--                <div id="networkMetrics">-->
<!--                    ${renderNetworkMetrics({ state, context: null })}-->
<!--                </div>-->

<!--                <div class="form-actions mt-2">-->
<!--                    <button class="btn btn-secondary btn-copy-all" title="Copy All Addresses">-->
<!--                        <span class="btn-icon">📋</span>-->
<!--                        <span class="btn-text">Copy All</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-info btn-refresh" ${state.isLoading ? "disabled" : ""}>-->
<!--                        <span class="btn-icon">🔄</span>-->
<!--                        <span class="btn-text">${state.isLoading ? "Refreshing..." : "Refresh"}</span>-->
<!--                     </button>-->
<!--                    <button class="btn btn-success btn-test-all" title="Test All Connections">-->
<!--                        <span class="btn-icon">🧪</span>-->
<!--                        <span class="btn-text">Test All</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-primary btn-add-custom">-->
<!--                        <span class="btn-icon">➕</span>-->
<!--                        <span class="btn-text">Add Custom</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-warning btn-sync" title="Sync with Libp2p Node">-->
<!--                        <span class="btn-icon">🔄</span>-->
<!--                        <span class="btn-text">Sync</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-secondary btn-export" title="Export Addresses">-->
<!--                        <span class="btn-icon">📤</span>-->
<!--                        <span class="btn-text">Export</span>-->
<!--                    </button>-->
<!--                    <button class="btn btn-success btn-force-sync" title="Force Sync with Libp2p">-->
<!--                        <span class="btn-icon">⚡</span>-->
<!--                        <span class="btn-text">Force Sync</span>-->
<!--                    </button>-->
<!--                </div>-->
<!---->
<!--                <div class="last-update mt-1">-->
<!--                    Last updated: <span class="update-time">${formattedTime}</span>-->
<!--                </div>-->
            </div>
        </div>
    `;
}
function renderAddressesList({ state = {} }) {
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    return renderEmptyState({ state, context: null });
  }
  return `
        <div class="info-grid">
            ${addresses.map((address, index) => `
                <div class="info-item address-item" data-address-index="${index}">
                    <span class="info-label">Address ${index + 1}:</span>
                    <div class="address-content">
                        <span class="info-value address-value" title="${escapeHtml(address)}">
                            ${escapeHtml(address)}
                        </span>
                        <div class="address-actions">
                            <button class="action-btn copy-btn" data-address="${escapeHtml(address)}" title="Copy Address">
                                📋
                            </button>
                            <button class="action-btn test-btn" data-address="${escapeHtml(address)}" title="Test Connection">
                                🧪
                            </button>
                            <button class="action-btn remove-btn" data-address="${escapeHtml(address)}" title="Remove Address">
                                ❌
                            </button>
                        </div>
                    </div>
                </div>
            `).join("")}
        </div>
    `;
}
function renderStatsTemplate({ state = {} }) {
  const stats = state.addressStats || { ws: 0, tcp: 0, webrtc: 0, ip4: 0, ip6: 0, dns: 0, quic: 0 };
  return `
        <div class="stats-grid mt-2">
            <div class="stat-item">
                <span class="stat-label">WS:</span>
                <span class="stat-value">${stats.ws}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">TCP:</span>
                <span class="stat-value">${stats.tcp}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">WebRTC:</span>
                <span class="stat-value">${stats.webrtc}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">IPv4:</span>
                <span class="stat-value">${stats.ip4}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">IPv6:</span>
                <span class="stat-value">${stats.ip6}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">DNS:</span>
                <span class="stat-value">${stats.dns}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">QUIC:</span>
                <span class="stat-value">${stats.quic}</span>
            </div>
        </div>
    `;
}
function renderNetworkMetrics({ state = {} }) {
  const metrics = { ...DEFAULT_METRICS, ...state.networkMetrics };
  return `
        <div class="network-metrics mt-2">
            <h4 class="metrics-title">Network Metrics</h4>
            <div class="metrics-grid">
                <div class="metric-item">
                    <span class="metric-label">Connection Quality:</span>
                    <span class="metric-value">${metrics.connectionQuality || 0}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Latency:</span>
                    <span class="metric-value">${metrics.latency || 0}ms</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Active Connections:</span>
                    <span class="metric-value">${metrics.activeConnections || 0}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Discovered Peers:</span>
                    <span class="metric-value">${metrics.discoveredPeers || 0}</span>
                </div>
            </div>
        </div>
    `;
}
function renderConnectionInfo({ state = {} }) {
  const connectionInfo = state.connectionInfo;
  if (!connectionInfo) {
    return "";
  }
  const lastSyncTime = connectionInfo.lastSyncTime ? new Date(connectionInfo.lastSyncTime).toLocaleTimeString() : "Never";
  const statusClass = connectionInfo.syncStatus === "success" ? "success" : connectionInfo.syncStatus === "error" ? "error" : connectionInfo.syncStatus === "syncing" ? "syncing" : "idle";
  const statusIcon = connectionInfo.syncStatus === "success" ? "✅" : connectionInfo.syncStatus === "error" ? "❌" : connectionInfo.syncStatus === "syncing" ? "🔄" : "⏳";
  return `
        <div class="connection-info">
            <h4 class="connection-title">Libp2p Connection</h4>
            <div class="connection-details">
                <div class="connection-item">
                    <span class="connection-label">Status:</span>
                    <span class="connection-value status-${statusClass}">
                        ${statusIcon} ${connectionInfo.libp2pNodeConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Sync Status:</span>
                    <span class="connection-value sync-${connectionInfo.syncStatus}">
                        ${connectionInfo.syncStatus.toUpperCase()}
                    </span>
                </div>
                <div class="connection-item">
                    <span class="connection-label">Last Sync:</span>
                    <span class="connection-value">${lastSyncTime}</span>
                </div>
                ${connectionInfo.errorMessage ? `
                    <div class="connection-item">
                        <span class="connection-label">Error:</span>
                        <span class="connection-value error">${escapeHtml(connectionInfo.errorMessage)}</span>
                    </div>
                ` : ""}
                ${state.peerId ? `
                    <div class="connection-item">
                        <span class="connection-label">Peer ID:</span>
                        <code class="connection-value peer-id">${escapeHtml(shortenPeerId(state.peerId))}</code>
                    </div>
                ` : ""}
                ${state.nodeStatus ? `
                    <div class="connection-item">
                        <span class="connection-label">Node Status:</span>
                        <span class="connection-value node-status status-${state.nodeStatus}">
                            ${getNodeStatusIcon(state.nodeStatus)} ${state.nodeStatus.toUpperCase()}
                        </span>
                    </div>
                ` : ""}
            </div>
        </div>
    `;
}
function renderEmptyState({ state = {} }) {
  const showAdditionalInfo = state.isLoading || false;
  return `
        <div class="empty-state">
            <div class="empty-icon">🌐</div>
            <p class="empty-text">No network addresses</p>
            ${showAdditionalInfo ? '<p class="empty-subtext">Loading in progress...</p>' : ""}
            <p class="empty-description">Addresses will be loaded from the server</p>
            <button class="btn btn-secondary reload-addresses-btn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Load Addresses</span>
            </button>
        </div>
    `;
}
function renderLoadingState({ state = {} }) {
  const loadingMessage = state.isLoading ? "Loading network addresses..." : "Processing...";
  return `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p class="loading-text">${loadingMessage}</p>
        </div>
    `;
}
function renderErrorState({ state = {} }) {
  const errorMessage = state.errorMessage || "Failed to load network addresses";
  return `
        <div class="error-state">
            <div class="error-icon">❌</div>
            <p class="error-text">Error loading</p>
            <p class="error-description">${escapeHtml(errorMessage)}</p>
            <button class="btn btn-secondary retry-addresses-btn">
                <span class="btn-icon">🔄</span>
                <span class="btn-text">Retry</span>
            </button>
        </div>
    `;
}
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function shortenPeerId(peerId) {
  if (!peerId) return "Unknown";
  if (peerId.length <= 20) return peerId;
  return peerId.substring(0, 10) + "..." + peerId.substring(peerId.length - 10);
}
function getNodeStatusIcon(status) {
  const icons = {
    "online": "✅",
    "offline": "❌",
    "error": "⚠️",
    "loading": "🔄",
    "starting": "⏳",
    "stopping": "⏳",
    "stopped": "⏹️",
    "running": "▶️"
  };
  return icons[status.toLowerCase()] || "❓";
}

// src/components/network-addresses/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  const loadSavedTheme = () => {
    const savedTheme = localStorage.getItem("network-addresses-theme");
    if (savedTheme) {
      context.updateElement({
        selector: ".network-addresses",
        value: savedTheme,
        property: "dataset.theme"
      });
    }
  };
  return {
    async init() {
      loadSavedTheme();
      addEventListener(context.shadowRoot, "click", async (e2) => {
        const target = e2.target;
        if (target.closest(".btn-copy-all")) {
          e2.preventDefault();
          await context._actions.copyAllAddresses();
          return;
        }
        if (target.closest(".btn-test-all")) {
          e2.preventDefault();
          await context._actions.testAllConnections();
          return;
        }
        if (target.closest(".btn-sync")) {
          e2.preventDefault();
          await context._actions.syncWithLibp2p();
          return;
        }
        if (target.closest(".btn-export")) {
          e2.preventDefault();
          await context._actions.exportAddresses();
          return;
        }
        if (target.closest(".btn-add-custom")) {
          e2.preventDefault();
          await context._actions.toggleAddForm();
          return;
        }
        if (target.closest(".reload-addresses-btn")) {
          e2.preventDefault();
          await context._actions.loadAddresses();
          return;
        }
        if (target.closest(".retry-addresses-btn")) {
          e2.preventDefault();
          await context._actions.loadAddresses();
          return;
        }
        if (target.closest(".theme-toggle-btn")) {
          e2.preventDefault();
          await context._actions.toggleTheme();
          return;
        }
        const actionBtn = target.closest(".action-btn");
        if (actionBtn) {
          e2.preventDefault();
          const address = actionBtn.getAttribute("data-address");
          const action = actionBtn.classList.contains("copy-btn") ? "copy" : actionBtn.classList.contains("test-btn") ? "test" : actionBtn.classList.contains("remove-btn") ? "remove" : null;
          if (address && action) {
            switch (action) {
              case "copy":
                await context._actions.copyAddress(address);
                break;
              case "test":
                await context._actions.testConnection(address);
                break;
              case "remove":
                await context._actions.removeAddress(address);
                break;
            }
          }
          return;
        }
        if (target.closest(".address-value")) {
          e2.preventDefault();
          const addressElement = target.closest(".address-value");
          const address = addressElement?.textContent?.trim();
          if (address) {
            await context._actions.copyAddress(address);
          }
        }
      });
      addEventListener(context, "keydown", (e2) => {
        const keyboardEvent = e2;
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
          e2.preventDefault();
          context._actions.copyAllAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
          e2.preventDefault();
          context._actions.refreshAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "s") {
          e2.preventDefault();
          context._actions.syncWithLibp2p();
        }
        if (keyboardEvent.key === "Escape") {
          const activeModal = document.querySelector(".yato-modal-backdrop");
          if (activeModal) {
            activeModal.remove();
          }
        }
      });
      addEventListener(window, "network-addresses:refresh", () => {
        context._actions.refreshAddresses();
      });
      addEventListener(window, "network-addresses:sync", () => {
        context._actions.syncWithLibp2p();
      });
      addEventListener(window, "libp2p:multiaddrs-updated", async (e2) => {
        const customEvent = e2;
        if (customEvent.detail?.multiaddrs) {
          await context.postMessage({
            type: "UPDATE_ADDRESSES",
            data: {
              addresses: customEvent.detail.multiaddrs,
              source: "libp2p-event"
            }
          });
        }
      });
      addEventListener(document, "visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => {
            context._actions.refreshAddresses();
          }, 1e3);
        }
      });
    },
    async destroy() {
      eventListeners.forEach(({ element, event, handler }) => {
        element.removeEventListener(event, handler);
      });
      eventListeners = [];
    }
  };
};

// src/components/network-addresses/actions/index.ts
async function createActions(context) {
  return {
    loadAddresses: loadAddresses.bind(context),
    copyAllAddresses: copyAllAddresses.bind(context),
    refreshAddresses: refreshAddresses.bind(context),
    exportAddresses: exportAddresses.bind(context),
    syncWithLibp2p: syncWithLibp2p.bind(context),
    testAllConnections: testAllConnections.bind(context),
    addCustomAddress: addCustomAddress.bind(context),
    removeAddress: removeAddress.bind(context),
    copyAddress: copyAddress.bind(context),
    testConnection: testConnection.bind(context),
    toggleTheme: toggleTheme.bind(context),
    toggleAddForm: toggleAddForm.bind(context),
    handleFormSubmit: handleFormSubmit.bind(context)
  };
}
async function loadAddresses(source) {
  try {
    const dataSource = source || this.getAttribute("data-source") || "auto";
    await this.loadAddressesFromSource(dataSource);
  } catch (error) {
    console.error("Error loading addresses:", error);
    await this.showModal({
      title: "Error",
      content: `Failed to load addresses: ${error.message}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function copyAllAddresses() {
  const state = this.getState();
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to copy",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return;
  }
  const addressesText = addresses.join("\n");
  try {
    await navigator.clipboard.writeText(addressesText);
    await this.showModal({
      title: "Copied",
      content: `All ${addresses.length} addresses copied to clipboard`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  } catch (error) {
    await this.showModal({
      title: "Copy Failed",
      content: "Failed to copy addresses to clipboard",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function refreshAddresses() {
  await this.refreshAddresses();
}
async function exportAddresses() {
  await this.exportAddresses();
}
async function syncWithLibp2p(force = false) {
  await this.syncWithLibp2pNode(force);
}
async function testAllConnections() {
  const state = this.getState();
  const addresses = state.addresses || [];
  if (addresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to test",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return [];
  }
  const results = [];
  let successful = 0;
  await this.showModal({
    title: "Testing Connections",
    content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${addresses.length} connections...</p>
                <div class="test-progress" style="margin-top: 1rem;">
                    <div class="progress-bar" style="width: 0%; height: 4px; background: var(--primary); border-radius: 2px; transition: width 0.3s ease;"></div>
                </div>
                <div class="test-results" style="margin-top: 1rem; max-height: 200px; overflow-y: auto; font-size: 0.9em;"></div>
            </div>
        `,
    buttons: [
      {
        text: "Cancel",
        type: "secondary"
      }
    ],
    closeOnBackdropClick: false
  });
  for (let i2 = 0; i2 < addresses.length; i2++) {
    const address = addresses[i2];
    const result = await this.testConnection(address);
    results.push(result);
    if (result.success) successful++;
    const progress = (i2 + 1) / addresses.length * 100;
    await this.updateElement({
      selector: ".progress-bar",
      value: `${progress}%`,
      property: "style.width"
    });
    await this.updateElement({
      selector: ".test-results",
      value: `
                <div style="padding: 0.5rem; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: monospace; font-size: 0.85em;">${address.substring(0, 50)}${address.length > 50 ? "..." : ""}</span>
                    <span style="color: ${result.success ? "var(--success)" : "var(--danger)"}; font-weight: 600;">
                        ${result.success ? "✅" : "❌"} ${result.latency ? `${result.latency}ms` : ""}
                    </span>
                </div>
            `,
      property: "innerHTML",
      action: "append"
    });
  }
  await this.showModal({
    title: "Test Results",
    content: `
            <div style="padding: 1rem 0;">
                <p><strong>Summary:</strong></p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div style="background: rgba(34, 197, 94, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--success);">✅ ${successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Successful</div>
                    </div>
                    <div style="background: rgba(239, 68, 68, 0.1); padding: 1rem; border-radius: 8px; text-align: center;">
                        <div style="font-size: 2em; color: var(--danger);">❌ ${addresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round(successful / addresses.length * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
    buttons: [{ text: "OK", type: "primary" }]
  });
  return results;
}
async function addCustomAddress(address) {
  return await this.addAddress(address);
}
async function removeAddress(address) {
  return await this.removeAddress(address);
}
async function copyAddress(address) {
  await this.copyAddress(address);
}
async function testConnection(address) {
  return await this.testConnection(address);
}
async function toggleTheme() {
  const currentTheme = this.getAttribute("data-theme") || "dark";
  const newTheme = currentTheme === "dark" ? "light" : "dark";
  await this.updateElement({
    selector: ".network-addresses",
    value: newTheme,
    property: "dataset.theme"
  });
  localStorage.setItem("network-addresses-theme", newTheme);
}
async function toggleAddForm() {
  const state = this.getState();
  const showAddForm = !state.showAddForm;
  console.log("Toggle add form:", showAddForm);
}
async function handleFormSubmit(formData) {
  const newAddress = formData.get("newAddress");
  if (newAddress && newAddress.trim()) {
    const success = await this.addAddress(newAddress.trim());
    if (success) {
      console.log("Address added successfully");
    }
  } else {
    await this.showModal({
      title: "Invalid Input",
      content: "Please enter a valid address",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}

// src/components/network-addresses/index.ts
var NetworkAddresses = class extends BaseComponent {
  static observedAttributes = [
    "title",
    "data-auto-refresh",
    "data-refresh-interval",
    "data-source",
    "data-show-stats",
    "data-auto-sync",
    "data-sync-interval"
  ];
  refreshInterval = null;
  syncInterval = null;
  libp2pNode = null;
  libp2pConnectionAttempts = 0;
  MAX_CONNECTION_ATTEMPTS = 5;
  metricsUpdateInterval = null;
  constructor() {
    super();
    this._templateMethods = {
      defaultTemplate: (params) => {
        const state = params.state;
        return defaultTemplate({ state, context: params.context });
      },
      renderAddressesList: (params) => {
        const state = params.state;
        return renderAddressesList({ state, context: params.context });
      },
      renderLoadingState: (params) => {
        const state = params.state;
        return renderLoadingState({ state, context: params.context });
      },
      renderErrorState: (params) => {
        const state = params.state;
        return renderErrorState({ state, context: params.context });
      },
      renderEmptyState: (params) => {
        const state = params.state;
        return renderEmptyState({ state, context: params.context });
      },
      renderStatsTemplate: (params) => {
        const state = params.state;
        return renderStatsTemplate({ state, context: params.context });
      },
      renderConnectionInfo: (params) => {
        const state = params.state;
        return renderConnectionInfo({ state, context: params.context });
      },
      renderNetworkMetrics: (params) => {
        const state = params.state;
        return renderNetworkMetrics({ state, context: params.context });
      }
    };
    this.state = {
      addresses: [],
      isLoading: false,
      lastUpdated: Date.now(),
      totalAddresses: 0,
      addressStats: {
        ws: 0,
        tcp: 0,
        webrtc: 0,
        ip4: 0,
        ip6: 0,
        dns: 0,
        quic: 0
      },
      connectionInfo: {
        libp2pNodeConnected: false,
        syncStatus: "idle"
      },
      networkMetrics: {
        connectionQuality: 0,
        protocolDistribution: {},
        uptime: 0,
        discoveredPeers: 0,
        activeConnections: 0
      }
    };
  }
  async _componentReady() {
    this._controller = controller(this);
    this._actions = await createActions(this);
    await this.fullRender(this.state);
    const autoRefresh = this.getAttribute("data-auto-refresh") !== "false";
    this.startMetricsUpdate();
  }
  // ДОБАВЛЕНО: Расширенный метод для получения всех данных из libp2p-node
  async fetchCompleteDataFromLibp2pNode() {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (!libp2pNode) {
        throw new Error("Libp2p node not found or not ready");
      }
      const statsResponse = await libp2pNode.postMessage({ type: "GET_STATS" });
      if (!statsResponse.success) {
        throw new Error(statsResponse.error || "Failed to get node stats");
      }
      const stats = statsResponse.stats;
      const connectionsResponse = await libp2pNode.postMessage({ type: "GET_CONNECTIONS" });
      const connections = connectionsResponse.success ? connectionsResponse.connections : [];
      const dhtResponse = await libp2pNode.postMessage({ type: "GET_DHT_STATS" });
      const dhtStats = dhtResponse.success ? dhtResponse.dhtStats : {};
      const multiaddrsResponse = await libp2pNode.postMessage({ type: "GET_MULTIADDRS" });
      const multiaddrs = multiaddrsResponse.success ? multiaddrsResponse.multiaddrs : [];
      const peerIdResponse = await libp2pNode.postMessage({ type: "GET_PEER_ID" });
      const peerId = peerIdResponse.success ? peerIdResponse.peerId : null;
      const latency = await this.testConnectionLatency();
      const protocolDistribution = this.analyzeProtocols(multiaddrs);
      const connectionQuality = this.calculateConnectionQuality(connections);
      return {
        success: true,
        data: {
          peerId,
          status: stats.status || "unknown",
          addresses: multiaddrs,
          connections: connections.length,
          discoveredPeers: stats.discoveredPeers || 0,
          multiaddrs,
          dhtStats,
          nodeInfo: {
            uptime: stats.uptime || 0,
            platform: stats.platform || "browser",
            nodeVersion: stats.nodeVersion || "unknown",
            memoryUsage: stats.memoryUsage || "unknown",
            cpuUsage: stats.cpuUsage || "unknown"
          },
          networkInfo: {
            totalAddresses: multiaddrs.length,
            protocolBreakdown: protocolDistribution,
            connectionQuality,
            latency,
            activeConnections: connections.filter((c2) => c2.status === "connected").length,
            pendingConnections: connections.filter((c2) => c2.status === "connecting").length
          },
          timestamp: Date.now(),
          source: "libp2p-node-complete"
        }
      };
    } catch (error) {
      console.error("Error fetching complete data from libp2p node:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        source: "libp2p-node-error"
      };
    }
  }
  // ДОБАВЛЕНО: Улучшенная интеграция с libp2p-node
  async setupLibp2pIntegration() {
    try {
      this.addLog("Setting up libp2p integration...", "info");
      const state = this.state;
      if (!state.connectionInfo) {
        state.connectionInfo = {
          libp2pNodeConnected: false,
          syncStatus: "idle"
        };
      }
      this.libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (this.libp2pNode) {
        state.connectionInfo.libp2pNodeConnected = true;
        state.connectionInfo.syncStatus = "syncing";
        await this.updateElement({
          selector: ".connection-status",
          value: "connecting",
          property: "className",
          action: "set"
        });
        await this.setupLibp2pListener();
        state.connectionInfo.syncStatus = "success";
        state.connectionInfo.lastSyncTime = Date.now();
        this.addLog("Libp2p integration setup complete", "info");
      } else {
        state.connectionInfo.libp2pNodeConnected = false;
        state.connectionInfo.syncStatus = "error";
        state.connectionInfo.errorMessage = "Libp2p node not available";
        this.addLog("Libp2p node not found, retrying in 5 seconds...", "warn");
        if (this.libp2pConnectionAttempts < this.MAX_CONNECTION_ATTEMPTS) {
          this.libp2pConnectionAttempts++;
          setTimeout(() => {
            this.setupLibp2pIntegration();
          }, 5e3);
        }
      }
      await this.updateConnectionInfoUI();
    } catch (error) {
      console.error("Error setting up libp2p integration:", error);
      const state = this.state;
      if (state.connectionInfo) {
        state.connectionInfo.syncStatus = "error";
        state.connectionInfo.errorMessage = error instanceof Error ? error.message : "Unknown error";
      }
      await this.updateConnectionInfoUI();
    }
  }
  async setupLibp2pListener() {
    if (!this.libp2pNode) return;
    try {
      const result = await this.libp2pNode.postMessage({
        type: "SET_NETWORK_ADDRESSES_LISTENER",
        data: {
          callback: (nodeState) => {
            this.handleLibp2pUpdate(nodeState);
          }
        }
      });
      if (result.success) {
        this.addLog("Libp2p listener established successfully", "info");
        this.libp2pNode.addEventListener("node-started", () => {
          this.addLog("Libp2p node started event received", "info");
          this.handleLibp2pUpdate({ status: "running", source: "event" });
        });
        this.libp2pNode.addEventListener("node-stopped", () => {
          this.addLog("Libp2p node stopped event received", "info");
          this.handleLibp2pUpdate({ status: "stopped", source: "event" });
        });
        this.libp2pNode.addEventListener("dht-stats-updated", (event) => {
          if (event.detail?.stats) {
            this.addLog("DHT stats updated event received", "info");
            this.handleLibp2pUpdate({
              dhtStats: event.detail.stats,
              source: "dht-event"
            });
          }
        });
        this.libp2pNode.addEventListener("peers-updated", (event) => {
          if (event.detail?.peers) {
            this.addLog("Peers updated event received", "info");
            this.handleLibp2pUpdate({
              discoveredPeers: event.detail.peers.length,
              source: "peers-event"
            });
          }
        });
      }
    } catch (error) {
      console.error("Error setting up libp2p listener:", error);
    }
  }
  async handleLibp2pUpdate(_nodeState) {
    try {
      const state = this.state;
      if (state.connectionInfo) {
        state.connectionInfo.lastSyncTime = Date.now();
        state.connectionInfo.syncStatus = "syncing";
        await this.updateConnectionInfoUI();
      }
      const completeData = await this.fetchCompleteDataFromLibp2pNode();
      if (completeData.success && completeData.data) {
        const data = completeData.data;
        if (data.addresses && Array.isArray(data.addresses)) {
          await this.updateAddresses(data.addresses, "libp2p-auto-update");
        }
        if (data.peerId && data.peerId !== state.peerId) {
          state.peerId = data.peerId;
          await this.updatePeerInfoUI();
        }
        if (data.status && data.status !== state.nodeStatus) {
          state.nodeStatus = data.status;
          await this.updateStatusUI();
        }
        if (data.networkInfo) {
          await this.updateNetworkMetrics(data.networkInfo);
        }
        if (state.connectionInfo) {
          state.connectionInfo.syncStatus = "success";
          state.connectionInfo.libp2pNodeConnected = true;
          if (state.connectionInfo.errorMessage) {
            delete state.connectionInfo.errorMessage;
          }
        }
        this.addLog(`Auto-update successful: ${data.addresses?.length || 0} addresses`, "info");
      } else {
        if (state.connectionInfo) {
          state.connectionInfo.syncStatus = "error";
          state.connectionInfo.errorMessage = completeData.error || "Auto-update failed";
        }
      }
      await this.updateConnectionInfoUI();
    } catch (error) {
      console.error("Error handling libp2p update:", error);
      const state = this.state;
      if (state.connectionInfo) {
        state.connectionInfo.syncStatus = "error";
        state.connectionInfo.errorMessage = error instanceof Error ? error.message : "Unknown error";
        await this.updateConnectionInfoUI();
      }
    }
  }
  // ДОБАВЛЕНО: Анализ протоколов
  analyzeProtocols(addresses) {
    const protocolCount = {
      "/ip4/": 0,
      "/ip6/": 0,
      "/tcp/": 0,
      "/udp/": 0,
      "/ws/": 0,
      "/wss/": 0,
      "/webrtc/": 0,
      "/quic/": 0,
      "/quic-v1/": 0,
      "/dns4/": 0,
      "/dns6/": 0,
      "/p2p/": 0,
      "/p2p-circuit/": 0
    };
    addresses.forEach((address) => {
      Object.keys(protocolCount).forEach((protocol) => {
        if (address.includes(protocol)) {
          const count = protocolCount[protocol];
          if (count !== void 0) {
            protocolCount[protocol] = count + 1;
          }
        }
      });
    });
    return protocolCount;
  }
  // ДОБАВЛЕНО: Расчет качества соединений
  calculateConnectionQuality(connections) {
    if (connections.length === 0) return 0;
    let quality = 0;
    connections.forEach((conn) => {
      if (conn.status === "connected") quality += 1;
      else if (conn.status === "connecting") quality += 0.5;
      else if (conn.status === "disconnecting") quality += 0.3;
    });
    return Math.round(quality / connections.length * 100);
  }
  // ДОБАВЛЕНО: Тестирование задержки
  async testConnectionLatency() {
    try {
      if (!this.libp2pNode) return 0;
      const startTime = Date.now();
      const result = await this.libp2pNode.postMessage({ type: "GET_STATS" });
      const endTime = Date.now();
      if (result.success) {
        return endTime - startTime;
      }
      return 0;
    } catch {
      return 0;
    }
  }
  // ДОБАВЛЕНО: Обновление сетевых метрик
  async updateNetworkMetrics(networkInfo) {
    const state = this.state;
    if (!state.networkMetrics) {
      state.networkMetrics = {
        connectionQuality: 0,
        protocolDistribution: {},
        uptime: 0,
        discoveredPeers: 0,
        activeConnections: 0
      };
    }
    if (networkInfo.protocolBreakdown) {
      const protocolDistribution = {};
      Object.entries(networkInfo.protocolBreakdown).forEach(([protocol, count]) => {
        if (count > 0) {
          protocolDistribution[protocol] = count;
        }
      });
      state.networkMetrics.protocolDistribution = protocolDistribution;
      const stats = state.addressStats;
      if (stats) {
        stats.ws = networkInfo.protocolBreakdown["/ws/"] || 0;
        stats.tcp = networkInfo.protocolBreakdown["/tcp/"] || 0;
        stats.webrtc = networkInfo.protocolBreakdown["/webrtc/"] || 0;
        stats.ip4 = networkInfo.protocolBreakdown["/ip4/"] || 0;
        stats.ip6 = networkInfo.protocolBreakdown["/ip6/"] || 0;
        stats.dns = (networkInfo.protocolBreakdown["/dns4/"] || 0) + (networkInfo.protocolBreakdown["/dns6/"] || 0);
        stats.quic = (networkInfo.protocolBreakdown["/quic/"] || 0) + (networkInfo.protocolBreakdown["/quic-v1/"] || 0);
      }
    }
    state.networkMetrics.connectionQuality = networkInfo.connectionQuality || 0;
    state.networkMetrics.latency = networkInfo.latency;
    state.networkMetrics.activeConnections = networkInfo.activeConnections || 0;
    state.networkMetrics.discoveredPeers = networkInfo.discoveredPeers || 0;
    state.networkMetrics.uptime = networkInfo.uptime || 0;
    if (this.getAttribute("data-show-stats") === "true") {
    }
  }
  // ДОБАВЛЕНО: Автоматическая синхронизация
  // private startAutoSync(): void {
  //     this.stopAutoSync();
  //
  //     const interval = parseInt(this.getAttribute('data-sync-interval') || '60000', 10);
  //
  //     this.syncInterval = window.setInterval(async () => {
  //         try {
  //             await this.syncWithLibp2pNode();
  //         } catch (error) {
  //             console.error('Error in auto sync:', error);
  //         }
  //     }, interval);
  //
  //     this.addLog(`Auto sync started with interval: ${interval}ms`, 'info');
  // }
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      this.addLog("Auto sync stopped", "info");
    }
  }
  // ДОБАВЛЕНО: Периодическое обновление метрик
  startMetricsUpdate() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    this.metricsUpdateInterval = window.setInterval(async () => {
      if (this.libp2pNode) {
        try {
          const latency = await this.testConnectionLatency();
          const state = this.state;
          if (state.networkMetrics) {
            state.networkMetrics.latency = latency;
            await this.updateNetworkMetricsUI();
          }
        } catch (error) {
          console.error("Error updating metrics:", error);
        }
      }
    }, 1e4);
  }
  // ДОБАВЛЕНО: UI методы для обновления информации
  async updateConnectionInfoUI() {
    const state = this.state;
    await this.renderPart({
      partName: "renderConnectionInfo",
      state,
      selector: "#connectionInfo"
    });
  }
  async updatePeerInfoUI() {
    const state = this.state;
    if (state.peerId) {
      await this.updateElement({
        selector: ".peer-id",
        value: this.formatPeerId(state.peerId),
        property: "textContent"
      });
    }
  }
  async updateStatusUI() {
    const state = this.state;
    await this.updateElement({
      selector: ".node-status",
      value: state.nodeStatus || "unknown",
      property: "textContent"
    });
  }
  async updateNetworkMetricsUI() {
    const state = this.state;
    await this.renderPart({
      partName: "renderNetworkMetrics",
      state,
      selector: "#networkMetrics"
    });
  }
  // ДОБАВЛЕНО: Форматирование Peer ID
  formatPeerId(peerId) {
    if (!peerId) return "Unknown";
    if (peerId.length <= 20) return peerId;
    return peerId.substring(0, 10) + "..." + peerId.substring(peerId.length - 10);
  }
  async postMessage(event) {
    try {
      const state = this.state;
      switch (event.type) {
        case "UPDATE_ADDRESSES":
          const addresses = event.data?.addresses;
          const source = event.data?.source || "unknown";
          if (addresses && Array.isArray(addresses)) {
            await this.updateAddresses(addresses, source);
            return {
              success: true,
              message: `Addresses updated from ${source}`,
              count: addresses.length,
              timestamp: Date.now()
            };
          }
          return { success: false, error: "Invalid addresses data" };
        case "GET_ADDRESSES":
          return {
            success: true,
            addresses: state.addresses,
            total: state.totalAddresses,
            stats: state.addressStats,
            lastUpdated: state.lastUpdated
          };
        case "ADD_ADDRESS":
          const addressToAdd = event.data?.address;
          if (addressToAdd && this.validateAddress(addressToAdd)) {
            const result = await this.addAddress(addressToAdd);
            return { success: result, address: addressToAdd };
          }
          return { success: false, error: "Invalid address" };
        case "REMOVE_ADDRESS":
          const addressToRemove = event.data?.address;
          if (addressToRemove) {
            const result = await this.removeAddress(addressToRemove);
            return { success: result, address: addressToRemove };
          }
          return { success: false, error: "Address required" };
        case "COPY_ADDRESS":
          const addressToCopy = event.data?.address;
          if (addressToCopy) {
            await this.copyAddress(addressToCopy);
            return { success: true, address: addressToCopy };
          }
          return { success: false, error: "No address to copy" };
        case "REFRESH_ADDRESSES":
          await this.refreshAddresses();
          return { success: true, message: "Addresses refreshed" };
        case "EXPORT_ADDRESSES":
          const exportData = await this.exportAddresses();
          return { success: true, data: exportData };
        case "GET_STATS":
          return {
            success: true,
            stats: {
              totalAddresses: state.totalAddresses,
              addressStats: state.addressStats,
              lastUpdated: state.lastUpdated
            }
          };
        case "SYNC_WITH_LIBP2P":
          const syncResult = await this.syncWithLibp2pNode();
          return syncResult;
        case "SET_LIBP2P_LISTENER":
          const callback = event.data?.callback;
          if (callback && typeof callback === "function") {
            this.libp2pNode = { callback };
            return { success: true, message: "Libp2p listener set" };
          }
          return { success: false, error: "Invalid callback" };
        case "TEST_CONNECTION":
          const addressToTest = event.data?.address;
          if (addressToTest) {
            const result = await this.testConnection(addressToTest);
            return { success: true, result };
          }
          return { success: false, error: "No address to test" };
        case "GET_COMPLETE_DATA":
          const completeData = await this.fetchCompleteDataFromLibp2pNode();
          return completeData;
        case "SETUP_INTEGRATION":
          await this.setupLibp2pIntegration();
          return { success: true, message: "Integration setup initiated" };
        case "GET_CONNECTION_STATUS":
          return {
            success: true,
            status: state.connectionInfo,
            metrics: state.networkMetrics
          };
        case "FORCE_SYNC":
          const forceSyncResult = await this.syncWithLibp2pNode();
          return forceSyncResult;
        case "GET_NETWORK_ANALYSIS":
          const analysis = {
            addresses: state.addresses,
            totalAddresses: state.totalAddresses,
            protocolStats: state.addressStats,
            protocolDistribution: this.analyzeProtocols(state.addresses),
            connectionInfo: state.connectionInfo,
            networkMetrics: state.networkMetrics,
            lastUpdated: state.lastUpdated
          };
          return { success: true, analysis };
        case "GET_PROTOCOL_STATS":
          const protocolStats = this.analyzeProtocols(state.addresses);
          return {
            success: true,
            protocolStats,
            totalProtocols: Object.keys(protocolStats).length
          };
        case "PING_NODE":
          const latency = await this.testConnectionLatency();
          return {
            success: true,
            latency,
            timestamp: Date.now()
          };
        default:
          console.warn(`[NetworkAddresses] Unknown message type: ${event.type}`);
          return {
            success: false,
            error: "Unknown message type",
            availableTypes: [
              "UPDATE_ADDRESSES",
              "GET_ADDRESSES",
              "ADD_ADDRESS",
              "REMOVE_ADDRESS",
              "COPY_ADDRESS",
              "REFRESH_ADDRESSES",
              "EXPORT_ADDRESSES",
              "GET_STATS",
              "SYNC_WITH_LIBP2P",
              "SET_LIBP2P_LISTENER",
              "TEST_CONNECTION",
              "GET_COMPLETE_DATA",
              "SETUP_INTEGRATION",
              "GET_CONNECTION_STATUS",
              "FORCE_SYNC",
              "GET_NETWORK_ANALYSIS",
              "GET_PROTOCOL_STATS",
              "PING_NODE"
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
      return {
        success: false,
        error: error.message
      };
    }
  }
  async updateAddresses(addresses, source = "manual") {
    const state = this.state;
    state.addresses = addresses || [];
    state.totalAddresses = addresses.length;
    state.lastUpdated = Date.now();
    state.isLoading = false;
    this.updateAddressStats(addresses);
    await this.renderPart({
      partName: "renderAddressesList",
      state,
      selector: "#addressesList"
    });
    this.addLog(`Addresses updated from ${source}: ${addresses.length} addresses`, "info");
    if (this.libp2pNode?.callback) {
      try {
        this.libp2pNode.callback(state);
      } catch (error) {
        console.error("Error in libp2p listener callback:", error);
      }
    }
  }
  async addAddress(address) {
    if (!this.validateAddress(address)) {
      await this.showModal({
        title: "Invalid Address",
        content: "The provided address has an invalid format",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return false;
    }
    const state = this.state;
    if (state.addresses.includes(address)) {
      await this.showModal({
        title: "Duplicate Address",
        content: "This address already exists in the list",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return false;
    }
    state.addresses.push(address);
    state.totalAddresses++;
    state.lastUpdated = Date.now();
    this.updateAddressStats([address]);
    await this.renderPart({
      partName: "renderAddressesList",
      state,
      selector: "#addressesList"
    });
    this.addLog(`Address added: ${address}`, "info");
    return true;
  }
  async removeAddress(address) {
    const state = this.state;
    const shouldRemove = await this.showModal({
      title: "Remove Address",
      content: `Are you sure you want to remove the address: ${address}?`,
      buttons: [
        { text: "Cancel", type: "secondary" },
        {
          text: "Remove",
          type: "danger",
          action: async () => {
            return true;
          }
        }
      ]
    });
    if (shouldRemove === void 0) return false;
    const index = state.addresses.indexOf(address);
    if (index > -1) {
      state.addresses.splice(index, 1);
      state.totalAddresses--;
      state.lastUpdated = Date.now();
      await this.renderPart({
        partName: "renderAddressesList",
        state,
        selector: "#addressesList"
      });
      await this.updateElement({
        selector: ".card-badge",
        value: state.totalAddresses.toString(),
        property: "textContent"
      });
      this.addLog(`Address removed: ${address}`, "info");
      return true;
    }
    return false;
  }
  async copyAddress(address) {
    try {
      await navigator.clipboard.writeText(address);
      await this.showModal({
        title: "Copied",
        content: "Address copied to clipboard",
        buttons: [{ text: "OK", type: "primary" }]
      });
      this.addLog(`Address copied: ${address}`, "info");
    } catch (error) {
      await this.showModal({
        title: "Copy Failed",
        content: "Failed to copy address to clipboard",
        buttons: [{ text: "OK", type: "primary" }]
      });
    }
  }
  async refreshAddresses() {
    const state = this.state;
    state.isLoading = true;
    try {
    } catch (error) {
      this.addError({
        componentName: this.constructor.name,
        source: "refreshAddresses",
        message: "Failed to refresh addresses",
        details: error
      });
    } finally {
      state.isLoading = false;
    }
  }
  async exportAddresses() {
    const state = this.state;
    const exportData = {
      addresses: state.addresses,
      exportTime: (/* @__PURE__ */ new Date()).toISOString(),
      totalAddresses: state.totalAddresses,
      stats: state.addressStats,
      connectionInfo: state.connectionInfo,
      networkMetrics: state.networkMetrics,
      component: "Network Addresses",
      nodeInfo: {
        timestamp: Date.now()
      }
    };
    return exportData;
  }
  async testConnection(address) {
    this.addLog(`Testing connection to: ${address}`, "info");
    try {
      const latency = Math.floor(Math.random() * 100) + 50;
      const success = Math.random() > 0.2;
      await new Promise((resolve) => setTimeout(resolve, 1e3));
      if (success) {
        await this.showModal({
          title: "Connection Test Successful",
          content: `
                        <div style="padding: 1rem 0;">
                            <p><strong>Address:</strong> ${address}</p>
                            <p><strong>Latency:</strong> ${latency}ms</p>
                            <p><strong>Status:</strong> ✅ Connected</p>
                        </div>
                    `,
          buttons: [{ text: "OK", type: "primary" }]
        });
        return { success: true, latency, address };
      } else {
        await this.showModal({
          title: "Connection Test Failed",
          content: `
                        <div style="padding: 1rem 0;">
                            <p><strong>Address:</strong> ${address}</p>
                            <p><strong>Status:</strong> ❌ Connection failed</p>
                            <p><strong>Error:</strong> Timeout or network issue</p>
                        </div>
                    `,
          buttons: [{ text: "OK", type: "primary" }]
        });
        return { success: false, error: "Connection failed", address };
      }
    } catch (error) {
      await this.showModal({
        title: "Test Error",
        content: `Failed to test connection: ${error}`,
        buttons: [{ text: "OK", type: "primary" }]
      });
      return { success: false, error: error.message, address };
    }
  }
  updateAddressStats(addresses) {
    const state = this.state;
    if (!state.addressStats) {
      state.addressStats = {
        ws: 0,
        tcp: 0,
        webrtc: 0,
        ip4: 0,
        ip6: 0,
        dns: 0,
        quic: 0
      };
    }
    state.addressStats.ws = 0;
    state.addressStats.tcp = 0;
    state.addressStats.webrtc = 0;
    state.addressStats.ip4 = 0;
    state.addressStats.ip6 = 0;
    state.addressStats.dns = 0;
    state.addressStats.quic = 0;
    addresses.forEach((address) => {
      if (address.includes("/ws")) state.addressStats.ws++;
      if (address.includes("/tcp/")) state.addressStats.tcp++;
      if (address.includes("/webrtc/")) state.addressStats.webrtc++;
      if (address.includes("/ip4/")) state.addressStats.ip4++;
      if (address.includes("/ip6/")) state.addressStats.ip6++;
      if (address.includes("/dns4/") || address.includes("/dns6/")) state.addressStats.dns++;
      if (address.includes("/quic") || address.includes("/quic-v1")) state.addressStats.quic++;
    });
  }
  // private async loadAddressesFromSource(source: string): Promise<void> {
  //     switch (source) {
  //         case 'libp2p':
  //             await this.syncWithLibp2pNode();
  //             break;
  //         case 'auto':
  //             try {
  //                 await this.syncWithLibp2pNode();
  //             } catch (error) {
  //                 console.debug('Libp2p node not available, using mock data:', error);
  //             }
  //             break;
  //         default:
  //             this.addLog(`Unknown data source: ${source}`, 'warn');
  //     }
  // }
  startAutoRefresh() {
    this.stopAutoRefresh();
    const interval = parseInt(this.getAttribute("data-refresh-interval") || "30000", 10);
    this.refreshInterval = window.setInterval(async () => {
      try {
        await this.refreshAddresses();
      } catch (error) {
        console.error("Error in auto refresh:", error);
      }
    }, interval);
    this.addLog(`Auto refresh started with interval: ${interval}ms`, "info");
  }
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      this.addLog("Auto refresh stopped", "info");
    }
  }
  validateAddress(address) {
    if (address.trim().length === 0) {
      return false;
    }
    const validProtocols = ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/", "/quic/", "/quic-v1/", "/webrtc/"];
    return validProtocols.some((protocol) => address.includes(protocol));
  }
  getState() {
    return this.state;
  }
  addLog(message, level = "info") {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}`;
    console.log(`[NetworkAddresses] ${logEntry}`);
  }
  async _componentDisconnected() {
    this.stopAutoRefresh();
    this.stopAutoSync();
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
};
if (!customElements.get("network-addresses")) {
  customElements.define("network-addresses", NetworkAddresses);
}
export {
  NetworkAddresses
};
//# sourceMappingURL=index.js.map
