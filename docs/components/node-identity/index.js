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

// src/components/node-identity/template/index.ts
function defaultTemplate({ state = {} }) {
  const statusClass = `status-${state.nodeStatus || "loading"}`;
  return `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">🆔</span>
                    <span class="node-name">${state.nodeName || "Node Identity"}</span>
                </h3>
                <span class="card-badge">${state.nodeStatus === "online" ? "Active" : "Inactive"}</span>
            </div>
            
            <div class="card-content">
                <div class="identity-main">
                    <div class="identity-item">
                        <span class="identity-label">Peer ID:</span>
                        <div class="identity-value-container">
                            <code class="identity-value peer-id">${state.peerId || "Loading..."}</code>
                            <button class="btn btn-small btn-copy" data-action="copy-peer-id" title="Copy Peer ID">
                                📋
                            </button>
                        </div>
                    </div>
                    
                    <div class="identity-item">
                        <span class="identity-label">Node Status:</span>
                        <span class="identity-value" id="nodeStatusContainer">
                            <span class="status-indicator ${statusClass}"></span>
                            <span class="node-status">${state.nodeStatus || "loading"}</span>
                        </span>
                    </div>
                    
                    <div class="identity-item">
                        <span class="identity-label">Uptime:</span>
                        <span class="identity-value uptime">${state.uptime || "0s"}</span>
                    </div>

                    <div class="identity-item">
                        <span class="identity-label">Connected Peers:</span>
                        <span class="identity-value connected-peers">${state.connectedPeers || 0}</span>
                    </div>

                    <div class="identity-item">
                        <span class="identity-label">Network Address:</span>
                        <span class="identity-value network-address">${state.networkAddress || "Unknown"}</span>
                    </div>
                </div>
                
                <div class="details-section" style="display: none;">
                    <h4 class="details-title">System Details</h4>
                    <div class="details-grid">
                        ${detailsTemplate({ state })}
                    </div>
                </div>
            </div>
        </div>
    `;
}
function detailsTemplate({ state = {} }) {
  return `
        <div class="detail-item">
            <span class="detail-label">Process ID:</span>
            <span class="detail-value process-id">${state.processId || "Unknown"}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Node Port:</span>
            <span class="detail-value node-port">${state.nodePort || "Unknown"}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Platform:</span>
            <span class="detail-value platform">${state.platform || "Unknown"}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Architecture:</span>
            <span class="detail-value arch">${state.arch || "Unknown"}</span>
        </div>
        
        <div class="detail-item">
            <span class="detail-label">Node.js Version:</span>
            <span class="detail-value node-version">${state.nodeVersion || "Unknown"}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">Memory Usage:</span>
            <span class="detail-value memory-usage">${state.memoryUsage || "0 MB"}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">CPU Usage:</span>
            <span class="detail-value cpu-usage">${state.cpuUsage || "0%"}</span>
        </div>

        <div class="detail-item">
            <span class="detail-label">Protocol Version:</span>
            <span class="detail-value protocol-version">${state.protocolVersion || "1.0.0"}</span>
        </div>
    `;
}

// src/components/node-identity/controller/index.ts
var controller = (context) => {
  let intervalId = null;
  return {
    async init() {
      intervalId = setInterval(() => {
        context.updateUptime();
      }, 1e3);
    },
    async destroy() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    }
  };
};

// src/components/node-identity/actions/index.ts
async function createActions(context) {
  return {
    refreshData: () => context.refreshData(),
    copyPeerId: () => context.copyPeerId(),
    toggleDetails: () => {
      const showDetailsAttr = context.getAttribute("data-show-details");
      const newValue = showDetailsAttr === "true" ? "false" : "true";
      context.setAttribute("data-show-details", newValue);
      return Promise.resolve();
    }
  };
}

// src/components/node-identity/index.ts
var log3 = createLogger("libp2p-browser");
var NodeIdentity = class extends BaseComponent {
  static observedAttributes = [
    "title",
    "data-auto-refresh",
    "data-refresh-interval",
    "data-show-details",
    "data-source",
    "data-peer-id",
    "data-node-port"
  ];
  constructor() {
    super();
    this._templateMethods = {
      defaultTemplate,
      detailsTemplate
    };
    this.state = {
      peerId: "Loading...",
      nodeStatus: "loading",
      processId: "Unknown",
      nodePort: "Unknown",
      uptime: "0s",
      platform: "Unknown",
      arch: "Unknown",
      nodeVersion: "Unknown",
      nodeName: "Node Identity",
      lastUpdate: Date.now(),
      memoryUsage: "0 MB",
      cpuUsage: "0%",
      networkAddress: "Unknown",
      protocolVersion: "1.0.0",
      connectedPeers: 0
    };
  }
  formatString(str, prefixLength = 4, suffixLength = 4, separator = "...") {
    if (!str || str.length <= prefixLength + suffixLength) return str;
    return str.substring(0, prefixLength) + separator + str.substring(str.length - suffixLength);
  }
  addLog(message, level = "info") {
    const timestamp = (/* @__PURE__ */ new Date()).toLocaleTimeString();
    const logEntry = `${timestamp} [${level.toUpperCase()}] ${message}`;
    log3(logEntry);
  }
  updateUptime() {
    try {
      if (!window.startTime) {
        window.startTime = Date.now();
      }
      const seconds = Math.floor((Date.now() - window.startTime) / 1e3);
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor(seconds % 86400 / 3600);
      const minutes = Math.floor(seconds % 3600 / 60);
      const secs = seconds % 60;
      let uptime = "";
      if (days > 0) uptime = `${days}d ${hours}h`;
      else if (hours > 0) uptime = `${hours}h ${minutes}m`;
      else if (minutes > 0) uptime = `${minutes}m ${secs}s`;
      else uptime = `${secs}s`;
      const state = this.state;
      if (state.uptime !== uptime) {
        state.uptime = uptime;
        this.updateElement({
          selector: ".uptime",
          value: uptime,
          property: "textContent"
        }).catch((error) => {
          log3.error("Error updating uptime:", error);
        });
      }
    } catch (error) {
      log3.error("Error in updateUptime:", error);
    }
  }
  getState() {
    return this.state;
  }
  async _componentReady() {
    this._controller = controller(this);
    this._actions = await createActions(this);
    await this.fullRender(this.state);
    await this.loadFromAttributes();
    const autoRefresh = this.getAttribute("data-auto-refresh") === "true";
    if (autoRefresh) {
      const interval = parseInt(this.getAttribute("data-refresh-interval") || "5000", 10);
      setTimeout(() => {
        this.refreshData("auto").catch((error) => {
          log3.error("Error in auto refresh:", error);
        });
      }, interval);
    }
    await this.updateDocumentTitle();
    await this.tryConnectToLibp2pNode();
  }
  async _componentAttributeChanged(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    const state = this.state;
    switch (name) {
      case "title":
        if (newValue) {
          state.nodeName = newValue;
          await this.updateElement({
            selector: ".node-name",
            value: newValue,
            property: "textContent"
          });
          await this.updateDocumentTitle();
        }
        break;
      case "data-auto-refresh":
        const autoRefresh = newValue === "true";
        this.addLog(`Auto refresh ${autoRefresh ? "enabled" : "disabled"}`, "info");
        if (this._controller && typeof this._controller.setupAutoRefresh === "function") {
          this._controller.setupAutoRefresh();
        }
        break;
      case "data-refresh-interval":
        this.addLog(`Refresh interval updated to ${newValue}ms`, "info");
        if (this._controller && typeof this._controller.setupAutoRefresh === "function") {
          this._controller.setupAutoRefresh();
        }
        break;
      case "data-show-details":
        const showDetails = newValue === "true";
        await this.updateElement({
          selector: ".details-section",
          value: showDetails ? "block" : "none",
          property: "style.display",
          action: "set"
        });
        await this.updateElement({
          selector: ".btn-toggle-details .btn-text",
          value: showDetails ? "Hide Details" : "Show Details",
          property: "textContent"
        });
        break;
      case "data-peer-id":
        if (newValue) {
          state.peerId = newValue;
          console.log("&&&&&&&&&&&&& state &&&&&&&&&&&&&", state);
          await this.updateDocumentTitle();
        }
        break;
      case "data-node-port":
        if (newValue) {
          state.nodePort = newValue;
          await this.updateElement({
            selector: ".node-port",
            value: state.nodePort,
            property: "textContent"
          });
        }
        break;
      case "data-source":
        this.addLog(`Data source updated to: ${newValue}`, "info");
        if (newValue === "libp2p") {
          await this.tryConnectToLibp2pNode();
        }
        break;
    }
  }
  async postMessage(event) {
    try {
      const state = this.state;
      switch (event.type) {
        case "GET_IDENTITY":
          return {
            success: true,
            identity: {
              peerId: state.peerId,
              nodeStatus: state.nodeStatus,
              nodeName: state.nodeName,
              uptime: state.uptime,
              platform: state.platform,
              arch: state.arch,
              nodeVersion: state.nodeVersion,
              processId: state.processId,
              nodePort: state.nodePort,
              memoryUsage: state.memoryUsage,
              cpuUsage: state.cpuUsage,
              networkAddress: state.networkAddress,
              protocolVersion: state.protocolVersion,
              connectedPeers: state.connectedPeers || 0
            }
          };
        case "REFRESH_DATA":
          await this.refreshData(event.data?.source || "message");
          return {
            success: true,
            message: "Identity data refreshed",
            timestamp: Date.now(),
            state: { ...state }
          };
        case "UPDATE_PEER_ID":
          if (event.data?.peerId) {
            state.peerId = event.data.peerId;
            console.log("$$$$ state $$$$", state);
            await this.updateDocumentTitle();
            this.setAttribute("data-peer-id", state.peerId);
            return { success: true, peerId: state.peerId };
          }
          return { success: false, error: "Peer ID required" };
        case "UPDATE_STATUS":
          const status = event.data?.status;
          if (status && ["online", "offline", "error", "loading"].includes(status)) {
            state.nodeStatus = status;
            await this.updateStatusUI();
            return { success: true, status: state.nodeStatus };
          }
          return { success: false, error: "Invalid status" };
        case "GET_NODE_INFO":
          return {
            success: true,
            info: {
              processId: state.processId,
              nodePort: state.nodePort,
              platform: state.platform,
              arch: state.arch,
              nodeVersion: state.nodeVersion,
              uptime: state.uptime,
              memoryUsage: state.memoryUsage,
              cpuUsage: state.cpuUsage,
              networkAddress: state.networkAddress
            }
          };
        case "COPY_PEER_ID":
          await this.copyPeerId();
          return { success: true, message: "Peer ID copied to clipboard" };
        case "SET_DOCUMENT_TITLE":
          const title = event.data?.title;
          if (title) {
            document.title = title;
            return { success: true, title };
          }
          return { success: false, error: "Title required" };
        case "UPDATE_FROM_LIBP2P":
          return await this.updateFromLibp2p(event.data);
        case "UPDATE_METRICS":
          if (event.data) {
            await this.updateMetrics(event.data);
            return { success: true };
          }
          return { success: false, error: "Metrics data required" };
        case "UPDATE_NETWORK_INFO":
          if (event.data) {
            await this.updateNetworkInfo(event.data);
            return { success: true };
          }
          return { success: false, error: "Network info required" };
        case "RESET_IDENTITY":
          await this.resetIdentity();
          return { success: true, message: "Identity reset to default" };
        case "EXPORT_IDENTITY":
          return {
            success: true,
            identity: { ...state },
            exportTime: Date.now(),
            format: "json"
          };
        case "IMPORT_IDENTITY":
          if (event.data?.identity) {
            await this.importIdentity(event.data.identity);
            return { success: true, message: "Identity imported successfully" };
          }
          return { success: false, error: "Identity data required" };
        default:
          log3.warn(`[NodeIdentity] Unknown message type: ${event.type}`);
          return {
            success: false,
            error: "Unknown message type",
            availableTypes: [
              "GET_IDENTITY",
              "REFRESH_DATA",
              "UPDATE_PEER_ID",
              "UPDATE_STATUS",
              "GET_NODE_INFO",
              "COPY_PEER_ID",
              "SET_DOCUMENT_TITLE",
              "UPDATE_FROM_LIBP2P",
              "UPDATE_METRICS",
              "UPDATE_NETWORK_INFO",
              "RESET_IDENTITY",
              "EXPORT_IDENTITY",
              "IMPORT_IDENTITY"
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
        error: error.message,
        stack: error.stack
      };
    }
  }
  // Публичные методы
  async refreshData(source) {
    try {
      const dataSource = this.getAttribute("data-source");
      if (dataSource === "libp2p") {
        await this.fetchFromLibp2pNode();
      } else if (dataSource === "mock") {
        await this.updateWithMockData(source);
      } else {
        await this.tryConnectToLibp2pNode();
      }
      this.state.lastUpdate = Date.now();
      this.addLog(`Data refreshed from ${source || "auto"} source`, "info");
    } catch (error) {
      log3.error("Error refreshing data:", error);
      await this.updateElement({
        selector: ".node-status",
        value: "error",
        property: "textContent"
      });
      this.addError({
        componentName: this.constructor.name,
        source: "refreshData",
        message: "Failed to refresh identity data",
        details: error
      });
    } finally {
    }
  }
  async copyPeerId() {
    const state = this.state;
    if (state.peerId && state.peerId !== "Loading...") {
      try {
        await navigator.clipboard.writeText(state.peerId);
        await this.showModal({
          title: "Success",
          content: "Peer ID copied to clipboard",
          buttons: [{ text: "OK", type: "primary" }]
        });
        this.addLog("Peer ID copied to clipboard", "info");
      } catch (error) {
        console.error("Failed to copy peer ID:", error);
        await this.showModal({
          title: "Error",
          content: "Failed to copy Peer ID to clipboard. Please check browser permissions.",
          buttons: [{ text: "OK", type: "primary" }]
        });
      }
    } else {
      await this.showModal({
        title: "Error",
        content: "No Peer ID available to copy. Please wait for data to load.",
        buttons: [{ text: "OK", type: "primary" }]
      });
    }
  }
  async updateStatusUI() {
    const state = this.state;
    try {
      const statusElement = this.shadowRoot?.querySelector(".node-status");
      const indicatorElement = this.shadowRoot?.querySelector(".status-indicator");
      const badgeElement = this.shadowRoot?.querySelector(".card-badge");
      if (statusElement) {
        await this.updateElement({
          selector: ".node-status",
          value: state.nodeStatus,
          property: "textContent"
        });
      }
      if (indicatorElement) {
        await this.updateElement({
          selector: ".status-indicator",
          value: `status-${state.nodeStatus}`,
          property: "className",
          action: "set"
        });
      }
      if (badgeElement) {
        const badgeColor = state.nodeStatus === "online" ? "var(--success)" : state.nodeStatus === "error" ? "var(--error)" : state.nodeStatus === "loading" ? "var(--warning)" : "var(--text-secondary)";
        await this.updateElement({
          selector: ".card-badge",
          value: badgeColor,
          property: "style.backgroundColor",
          action: "set"
        });
      }
    } catch (error) {
      console.warn("Warning: Error updating status UI, elements may not be rendered yet:", error);
    }
  }
  async updateDocumentTitle() {
    const state = this.state;
    if (state.peerId && state.peerId !== "Loading...") {
      const shortPeerId = state.peerId.length > 20 ? `${state.peerId.substring(0, 10)}...${state.peerId.substring(state.peerId.length - 10)}` : state.peerId;
      document.title = `${state.nodeName} - ${shortPeerId}`;
    } else {
      document.title = state.nodeName;
    }
  }
  async updateMetrics(metrics) {
    const state = this.state;
    if (metrics.memoryUsage) {
      state.memoryUsage = metrics.memoryUsage;
      await this.updateElement({
        selector: ".memory-usage",
        value: state.memoryUsage,
        property: "textContent"
      });
    }
    if (metrics.cpuUsage) {
      state.cpuUsage = metrics.cpuUsage;
      await this.updateElement({
        selector: ".cpu-usage",
        value: state.cpuUsage,
        property: "textContent"
      });
    }
    if (metrics.connectedPeers !== void 0) {
      state.connectedPeers = metrics.connectedPeers;
      await this.updateElement({
        selector: ".connected-peers",
        value: (state.connectedPeers || 0).toString(),
        property: "textContent"
      });
    }
  }
  async updateNetworkInfo(networkInfo) {
    const state = this.state;
    if (networkInfo.networkAddress) {
      state.networkAddress = networkInfo.networkAddress;
      await this.updateElement({
        selector: ".network-address",
        value: state.networkAddress,
        property: "textContent"
      });
    }
    if (networkInfo.protocolVersion) {
      state.protocolVersion = networkInfo.protocolVersion;
      await this.updateElement({
        selector: ".protocol-version",
        value: state.protocolVersion,
        property: "textContent"
      });
    }
  }
  // Приватные вспомогательные методы
  async loadFromAttributes() {
    const state = this.state;
    const peerId = this.getAttribute("data-peer-id");
    if (peerId) {
      state.peerId = peerId;
    }
    const nodePort = this.getAttribute("data-node-port");
    if (nodePort) {
      state.nodePort = nodePort;
    }
    const title = this.getAttribute("title");
    if (title) {
      state.nodeName = title;
    }
  }
  async tryConnectToLibp2pNode() {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        await this.fetchFromLibp2pNode();
        this.addLog("Connected to libp2p-node", "info");
      } else {
        await this.updateWithMockData("auto-detection");
      }
    } catch (error) {
      console.debug("Libp2p node not available, using mock data:", error);
      await this.updateWithMockData("fallback");
    }
  }
  async fetchFromLibp2pNode() {
    const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
    if (!libp2pNode) {
      throw new Error("Libp2p node not found. Please start the libp2p node first.");
    }
    const [peerResult, statsResult] = await Promise.all([
      libp2pNode.postMessage({ type: "GET_PEER_ID" }),
      libp2pNode.postMessage({ type: "GET_STATS" })
    ]);
    const state = this.state;
    if (peerResult.success && peerResult.peerId) {
      state.peerId = peerResult.peerId;
    } else if (peerResult.peerId) {
      state.peerId = peerResult.peerId;
    }
    if (statsResult.success && statsResult.stats?.status) {
      state.nodeStatus = statsResult.stats.status === "running" ? "online" : "offline";
    } else {
      state.nodeStatus = "online";
    }
    await this.updateElement({
      selector: ".peer-id",
      value: this.formatString(state.peerId) || "Not available",
      property: "textContent"
    });
    await this.updateStatusUI();
    if (statsResult.success && statsResult.stats) {
      const stats = statsResult.stats;
      await this.renderPart({
        partName: "detailsTemplate",
        state: {
          ...state,
          processId: stats.processId || "Browser",
          nodePort: stats.nodePort || "N/A",
          platform: stats.platform || navigator.platform,
          arch: this.detectArchitecture(),
          nodeVersion: stats.nodeVersion || "Browser",
          uptime: stats.uptime || "0s",
          memoryUsage: stats.memoryUsage || "Browser",
          cpuUsage: stats.cpuUsage || "N/A",
          connectedPeers: stats.connections || 0
        },
        selector: ".details-section .details-grid"
      });
    }
    await this.updateDocumentTitle();
  }
  async updateFromLibp2p(data) {
    const state = this.state;
    if (data.peerId) {
      state.peerId = data.peerId;
      await this.updateElement({
        selector: ".peer-id",
        value: this.formatString(state.peerId),
        property: "textContent"
      });
    }
    if (data.status) {
      state.nodeStatus = data.status;
      await this.updateStatusUI();
    }
    if (data.processId) state.processId = data.processId;
    if (data.nodePort) state.nodePort = data.nodePort;
    if (data.platform) state.platform = data.platform;
    if (data.arch) state.arch = data.arch;
    if (data.nodeVersion) state.nodeVersion = data.nodeVersion;
    if (data.uptime !== void 0) {
      state.uptime = this.formatUptime(data.uptime);
      await this.updateElement({
        selector: ".uptime",
        value: state.uptime,
        property: "textContent"
      });
    }
    if (data.metrics) {
      await this.updateMetrics(data.metrics);
    }
    if (data.networkInfo) {
      await this.updateNetworkInfo(data.networkInfo);
    }
    await this.renderPart({
      partName: "detailsTemplate",
      state,
      selector: ".details-section .details-grid"
    });
    await this.updateDocumentTitle();
    return { success: true };
  }
  async updateWithMockData(source) {
    const state = this.state;
    if (state.peerId === "Loading...") {
      state.peerId = `12D3KooW${Math.random().toString(36).substring(2, 22)}`;
    }
    state.nodeStatus = Math.random() > 0.2 ? "online" : "offline";
    state.processId = Math.floor(Math.random() * 1e4).toString();
    state.nodePort = Math.floor(Math.random() * 1e4 + 3e3).toString();
    state.platform = navigator.platform;
    state.arch = this.detectArchitecture();
    state.nodeVersion = "18.0.0";
    state.memoryUsage = `${Math.floor(Math.random() * 1024)} MB`;
    state.cpuUsage = `${Math.floor(Math.random() * 100)}%`;
    state.networkAddress = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    state.protocolVersion = "1.0.0";
    state.connectedPeers = Math.floor(Math.random() * 50);
    const uptimeSeconds = Math.floor(Math.random() * 86400);
    state.uptime = this.formatUptime(uptimeSeconds);
    console.log("$$$$$ !! state !! $$$$$", state);
    await this.updateStatusUI();
    await this.updateElement({
      selector: ".process-id",
      value: state.processId,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".node-port",
      value: state.nodePort,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".platform",
      value: state.platform,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".arch",
      value: state.arch,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".node-version",
      value: state.nodeVersion,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".uptime",
      value: state.uptime,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".memory-usage",
      value: state.memoryUsage,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".cpu-usage",
      value: state.cpuUsage,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".connected-peers",
      value: (state.connectedPeers || 0).toString(),
      property: "textContent"
    });
    await this.updateElement({
      selector: ".network-address",
      value: state.networkAddress,
      property: "textContent"
    });
    await this.updateElement({
      selector: ".protocol-version",
      value: state.protocolVersion,
      property: "textContent"
    });
    await this.updateDocumentTitle();
    this.addLog(`Data loaded from ${source || "mock"} source`, "info");
  }
  async resetIdentity() {
    this.state = {
      peerId: "Loading...",
      nodeStatus: "loading",
      processId: "Unknown",
      nodePort: "Unknown",
      uptime: "0s",
      platform: "Unknown",
      arch: "Unknown",
      nodeVersion: "Unknown",
      nodeName: this.getAttribute("title") || "Node Identity",
      lastUpdate: Date.now(),
      memoryUsage: "0 MB",
      cpuUsage: "0%",
      networkAddress: "Unknown",
      protocolVersion: "1.0.0",
      connectedPeers: 0
    };
    await this.fullRender(this.state);
    await this.updateDocumentTitle();
    this.removeAttribute("data-peer-id");
    this.removeAttribute("data-node-port");
  }
  async importIdentity(identity) {
    const state = this.state;
    if (identity.peerId) state.peerId = identity.peerId;
    if (identity.nodeStatus) state.nodeStatus = identity.nodeStatus;
    if (identity.processId) state.processId = identity.processId;
    if (identity.nodePort) state.nodePort = identity.nodePort;
    if (identity.uptime) state.uptime = identity.uptime;
    if (identity.platform) state.platform = identity.platform;
    if (identity.arch) state.arch = identity.arch;
    if (identity.nodeVersion) state.nodeVersion = identity.nodeVersion;
    if (identity.nodeName) state.nodeName = identity.nodeName;
    if (identity.memoryUsage) state.memoryUsage = identity.memoryUsage;
    if (identity.cpuUsage) state.cpuUsage = identity.cpuUsage;
    if (identity.networkAddress) state.networkAddress = identity.networkAddress;
    if (identity.protocolVersion) state.protocolVersion = identity.protocolVersion;
    if (identity.connectedPeers !== void 0) state.connectedPeers = identity.connectedPeers;
    state.lastUpdate = Date.now();
    await this.fullRender(state);
    await this.updateDocumentTitle();
    if (identity.peerId) {
      this.setAttribute("data-peer-id", identity.peerId);
    }
    if (identity.nodePort) {
      this.setAttribute("data-node-port", identity.nodePort);
    }
  }
  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor(seconds % 86400 / 3600);
    const minutes = Math.floor(seconds % 3600 / 60);
    const secs = seconds % 60;
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  }
  detectArchitecture() {
    const userAgent = navigator.userAgent;
    if (userAgent.includes("x64") || userAgent.includes("x86_64") || userAgent.includes("Win64") || userAgent.includes("WOW64")) {
      return "x64";
    } else if (userAgent.includes("x86") || userAgent.includes("Win32")) {
      return "x86";
    } else if (userAgent.includes("arm") || userAgent.includes("aarch64")) {
      return "ARM";
    } else if (userAgent.includes("Linux")) {
      return "Linux";
    } else if (userAgent.includes("Mac")) {
      return "Darwin";
    }
    return "Unknown";
  }
  async _componentDisconnected() {
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
};
if (!customElements.get("node-identity")) {
  customElements.define("node-identity", NodeIdentity);
}
export {
  NodeIdentity
};
//# sourceMappingURL=index.js.map
