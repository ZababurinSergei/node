var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};

// ../../node_modules/multiformats/dist/src/bases/base32.js
var base32_exports = {};
__export(base32_exports, {
  base32: () => base32,
  base32hex: () => base32hex,
  base32hexpad: () => base32hexpad,
  base32hexpadupper: () => base32hexpadupper,
  base32hexupper: () => base32hexupper,
  base32pad: () => base32pad,
  base32padupper: () => base32padupper,
  base32upper: () => base32upper,
  base32z: () => base32z
});

// ../../node_modules/multiformats/dist/src/bytes.js
var empty = new Uint8Array(0);
function equals(aa, bb) {
  if (aa === bb) {
    return true;
  }
  if (aa.byteLength !== bb.byteLength) {
    return false;
  }
  for (let ii = 0; ii < aa.byteLength; ii++) {
    if (aa[ii] !== bb[ii]) {
      return false;
    }
  }
  return true;
}
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
function fromString(str) {
  return new TextEncoder().encode(str);
}
function toString(b) {
  return new TextDecoder().decode(b);
}

// ../../node_modules/multiformats/dist/src/vendor/base-x.js
function base(ALPHABET, name2) {
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
  function encode5(source) {
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
    var length2 = 0;
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
      for (var it1 = size - 1; (carry !== 0 || i3 < length2) && it1 !== -1; it1--, i3++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length2 = i3;
      pbegin++;
    }
    var it2 = size - length2;
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
    var length2 = 0;
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
      for (var it3 = size - 1; (carry !== 0 || i3 < length2) && it3 !== -1; it3--, i3++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length2 = i3;
      psz++;
    }
    if (source[psz] === " ") {
      return;
    }
    var it4 = size - length2;
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
  function decode7(string2) {
    var buffer = decodeUnsafe(string2);
    if (buffer) {
      return buffer;
    }
    throw new Error(`Non-${name2} character`);
  }
  return {
    encode: encode5,
    decodeUnsafe,
    decode: decode7
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
  constructor(name2, prefix, baseEncode) {
    this.name = name2;
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
  constructor(name2, prefix, baseDecode) {
    this.name = name2;
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
  constructor(decoders2) {
    this.decoders = decoders2;
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
  constructor(name2, prefix, baseEncode, baseDecode) {
    this.name = name2;
    this.prefix = prefix;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name2, prefix, baseEncode);
    this.decoder = new Decoder(name2, prefix, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
};
function from({ name: name2, prefix, encode: encode5, decode: decode7 }) {
  return new Codec(name2, prefix, encode5, decode7);
}
function baseX({ name: name2, prefix, alphabet: alphabet2 }) {
  const { encode: encode5, decode: decode7 } = base_x_default(alphabet2, name2);
  return from({
    prefix,
    name: name2,
    encode: encode5,
    decode: (text) => coerce(decode7(text))
  });
}
function decode(string2, alphabetIdx, bitsPerChar, name2) {
  let end = string2.length;
  while (string2[end - 1] === "=") {
    --end;
  }
  const out = new Uint8Array(end * bitsPerChar / 8 | 0);
  let bits = 0;
  let buffer = 0;
  let written = 0;
  for (let i2 = 0; i2 < end; ++i2) {
    const value = alphabetIdx[string2[i2]];
    if (value === void 0) {
      throw new SyntaxError(`Non-${name2} character`);
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
function encode(data, alphabet2, bitsPerChar) {
  const pad = alphabet2[alphabet2.length - 1] === "=";
  const mask = (1 << bitsPerChar) - 1;
  let out = "";
  let bits = 0;
  let buffer = 0;
  for (let i2 = 0; i2 < data.length; ++i2) {
    buffer = buffer << 8 | data[i2];
    bits += 8;
    while (bits > bitsPerChar) {
      bits -= bitsPerChar;
      out += alphabet2[mask & buffer >> bits];
    }
  }
  if (bits !== 0) {
    out += alphabet2[mask & buffer << bitsPerChar - bits];
  }
  if (pad) {
    while ((out.length * bitsPerChar & 7) !== 0) {
      out += "=";
    }
  }
  return out;
}
function createAlphabetIdx(alphabet2) {
  const alphabetIdx = {};
  for (let i2 = 0; i2 < alphabet2.length; ++i2) {
    alphabetIdx[alphabet2[i2]] = i2;
  }
  return alphabetIdx;
}
function rfc4648({ name: name2, prefix, bitsPerChar, alphabet: alphabet2 }) {
  const alphabetIdx = createAlphabetIdx(alphabet2);
  return from({
    prefix,
    name: name2,
    encode(input) {
      return encode(input, alphabet2, bitsPerChar);
    },
    decode(input) {
      return decode(input, alphabetIdx, bitsPerChar, name2);
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
var base58_exports = {};
__export(base58_exports, {
  base58btc: () => base58btc,
  base58flickr: () => base58flickr
});
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
var base64_exports = {};
__export(base64_exports, {
  base64: () => base64,
  base64pad: () => base64pad,
  base64url: () => base64url,
  base64urlpad: () => base64urlpad
});
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
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format2) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug.formatters[format2];
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
  function enabled(name2) {
    if (name2[name2.length - 1] === "*") {
      return true;
    }
    let i2;
    let len;
    for (i2 = 0, len = createDebug.skips.length; i2 < len; i2++) {
      if (createDebug.skips[i2].test(name2)) {
        return false;
      }
    }
    for (i2 = 0, len = createDebug.names.length; i2 < len; i2++) {
      if (createDebug.names[i2].test(name2)) {
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
function logger(name2, options) {
  let trace = createDisabledLogger(`${name2}:trace`);
  if (src_default.enabled(`${name2}:trace`) && src_default.names.map((r2) => r2.toString()).find((n2) => n2.includes(":trace")) != null) {
    trace = src_default(`${name2}:trace`, options);
  }
  return Object.assign(src_default(name2, options), {
    error: src_default(`${name2}:error`, options),
    trace,
    newScope: (scope) => logger(`${name2}:${scope}`, options)
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

// ../../node_modules/uint8arrays/dist/src/equals.js
function equals2(a2, b) {
  if (a2 === b) {
    return true;
  }
  if (a2.byteLength !== b.byteLength) {
    return false;
  }
  for (let i2 = 0; i2 < a2.byteLength; i2++) {
    if (a2[i2] !== b[i2]) {
      return false;
    }
  }
  return true;
}

// ../../node_modules/uint8arrays/dist/src/alloc.js
function allocUnsafe(size = 0) {
  return new Uint8Array(size);
}

// ../../node_modules/uint8-varint/dist/src/index.js
var N1 = Math.pow(2, 7);
var N2 = Math.pow(2, 14);
var N3 = Math.pow(2, 21);
var N4 = Math.pow(2, 28);
var N5 = Math.pow(2, 35);
var N6 = Math.pow(2, 42);
var N7 = Math.pow(2, 49);
var MSB = 128;
var REST = 127;
function encodingLength(value) {
  if (value < N1) {
    return 1;
  }
  if (value < N2) {
    return 2;
  }
  if (value < N3) {
    return 3;
  }
  if (value < N4) {
    return 4;
  }
  if (value < N5) {
    return 5;
  }
  if (value < N6) {
    return 6;
  }
  if (value < N7) {
    return 7;
  }
  if (Number.MAX_SAFE_INTEGER != null && value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Could not encode varint");
  }
  return 8;
}
function encodeUint8Array(value, buf, offset = 0) {
  switch (encodingLength(value)) {
    case 8: {
      buf[offset++] = value & 255 | MSB;
      value /= 128;
    }
    case 7: {
      buf[offset++] = value & 255 | MSB;
      value /= 128;
    }
    case 6: {
      buf[offset++] = value & 255 | MSB;
      value /= 128;
    }
    case 5: {
      buf[offset++] = value & 255 | MSB;
      value /= 128;
    }
    case 4: {
      buf[offset++] = value & 255 | MSB;
      value >>>= 7;
    }
    case 3: {
      buf[offset++] = value & 255 | MSB;
      value >>>= 7;
    }
    case 2: {
      buf[offset++] = value & 255 | MSB;
      value >>>= 7;
    }
    case 1: {
      buf[offset++] = value & 255;
      value >>>= 7;
      break;
    }
    default:
      throw new Error("unreachable");
  }
  return buf;
}
function decodeUint8Array(buf, offset) {
  let b = buf[offset];
  let res = 0;
  res += b & REST;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 1];
  res += (b & REST) << 7;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 2];
  res += (b & REST) << 14;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 3];
  res += (b & REST) << 21;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 4];
  res += (b & REST) * N4;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 5];
  res += (b & REST) * N5;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 6];
  res += (b & REST) * N6;
  if (b < MSB) {
    return res;
  }
  b = buf[offset + 7];
  res += (b & REST) * N7;
  if (b < MSB) {
    return res;
  }
  throw new RangeError("Could not decode varint");
}
function decodeUint8ArrayList(buf, offset) {
  let b = buf.get(offset);
  let res = 0;
  res += b & REST;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 1);
  res += (b & REST) << 7;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 2);
  res += (b & REST) << 14;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 3);
  res += (b & REST) << 21;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 4);
  res += (b & REST) * N4;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 5);
  res += (b & REST) * N5;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 6);
  res += (b & REST) * N6;
  if (b < MSB) {
    return res;
  }
  b = buf.get(offset + 7);
  res += (b & REST) * N7;
  if (b < MSB) {
    return res;
  }
  throw new RangeError("Could not decode varint");
}
function decode2(buf, offset = 0) {
  if (buf instanceof Uint8Array) {
    return decodeUint8Array(buf, offset);
  } else {
    return decodeUint8ArrayList(buf, offset);
  }
}

// ../../node_modules/uint8arrays/dist/src/util/as-uint8array.js
function asUint8Array(buf) {
  return buf;
}

// ../../node_modules/uint8arrays/dist/src/concat.js
function concat(arrays, length2) {
  if (length2 == null) {
    length2 = arrays.reduce((acc, curr) => acc + curr.length, 0);
  }
  const output = allocUnsafe(length2);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return asUint8Array(output);
}

// ../../node_modules/multiformats/dist/src/bases/base10.js
var base10_exports = {};
__export(base10_exports, {
  base10: () => base10
});
var base10 = baseX({
  prefix: "9",
  name: "base10",
  alphabet: "0123456789"
});

// ../../node_modules/multiformats/dist/src/bases/base16.js
var base16_exports = {};
__export(base16_exports, {
  base16: () => base16,
  base16upper: () => base16upper
});
var base16 = rfc4648({
  prefix: "f",
  name: "base16",
  alphabet: "0123456789abcdef",
  bitsPerChar: 4
});
var base16upper = rfc4648({
  prefix: "F",
  name: "base16upper",
  alphabet: "0123456789ABCDEF",
  bitsPerChar: 4
});

// ../../node_modules/multiformats/dist/src/bases/base2.js
var base2_exports = {};
__export(base2_exports, {
  base2: () => base2
});
var base2 = rfc4648({
  prefix: "0",
  name: "base2",
  alphabet: "01",
  bitsPerChar: 1
});

// ../../node_modules/multiformats/dist/src/bases/base256emoji.js
var base256emoji_exports = {};
__export(base256emoji_exports, {
  base256emoji: () => base256emoji
});
var alphabet = Array.from("🚀🪐☄🛰🌌🌑🌒🌓🌔🌕🌖🌗🌘🌍🌏🌎🐉☀💻🖥💾💿😂❤😍🤣😊🙏💕😭😘👍😅👏😁🔥🥰💔💖💙😢🤔😆🙄💪😉☺👌🤗💜😔😎😇🌹🤦🎉💞✌✨🤷😱😌🌸🙌😋💗💚😏💛🙂💓🤩😄😀🖤😃💯🙈👇🎶😒🤭❣😜💋👀😪😑💥🙋😞😩😡🤪👊🥳😥🤤👉💃😳✋😚😝😴🌟😬🙃🍀🌷😻😓⭐✅🥺🌈😈🤘💦✔😣🏃💐☹🎊💘😠☝😕🌺🎂🌻😐🖕💝🙊😹🗣💫💀👑🎵🤞😛🔴😤🌼😫⚽🤙☕🏆🤫👈😮🙆🍻🍃🐶💁😲🌿🧡🎁⚡🌞🎈❌✊👋😰🤨😶🤝🚶💰🍓💢🤟🙁🚨💨🤬✈🎀🍺🤓😙💟🌱😖👶🥴▶➡❓💎💸⬇😨🌚🦋😷🕺⚠🙅😟😵👎🤲🤠🤧📌🔵💅🧐🐾🍒😗🤑🌊🤯🐷☎💧😯💆👆🎤🙇🍑❄🌴💣🐸💌📍🥀🤢👅💡💩👐📸👻🤐🤮🎼🥵🚩🍎🍊👼💍📣🥂");
var alphabetBytesToChars = alphabet.reduce((p2, c2, i2) => {
  p2[i2] = c2;
  return p2;
}, []);
var alphabetCharsToBytes = alphabet.reduce((p2, c2, i2) => {
  const codePoint = c2.codePointAt(0);
  if (codePoint == null) {
    throw new Error(`Invalid character: ${c2}`);
  }
  p2[codePoint] = i2;
  return p2;
}, []);
function encode2(data) {
  return data.reduce((p2, c2) => {
    p2 += alphabetBytesToChars[c2];
    return p2;
  }, "");
}
function decode3(str) {
  const byts = [];
  for (const char of str) {
    const codePoint = char.codePointAt(0);
    if (codePoint == null) {
      throw new Error(`Invalid character: ${char}`);
    }
    const byt = alphabetCharsToBytes[codePoint];
    if (byt == null) {
      throw new Error(`Non-base256emoji character: ${char}`);
    }
    byts.push(byt);
  }
  return new Uint8Array(byts);
}
var base256emoji = from({
  prefix: "🚀",
  name: "base256emoji",
  encode: encode2,
  decode: decode3
});

// ../../node_modules/multiformats/dist/src/bases/base36.js
var base36_exports = {};
__export(base36_exports, {
  base36: () => base36,
  base36upper: () => base36upper
});
var base36 = baseX({
  prefix: "k",
  name: "base36",
  alphabet: "0123456789abcdefghijklmnopqrstuvwxyz"
});
var base36upper = baseX({
  prefix: "K",
  name: "base36upper",
  alphabet: "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
});

// ../../node_modules/multiformats/dist/src/bases/base8.js
var base8_exports = {};
__export(base8_exports, {
  base8: () => base8
});
var base8 = rfc4648({
  prefix: "7",
  name: "base8",
  alphabet: "01234567",
  bitsPerChar: 3
});

// ../../node_modules/multiformats/dist/src/bases/identity.js
var identity_exports = {};
__export(identity_exports, {
  identity: () => identity
});
var identity = from({
  prefix: "\0",
  name: "identity",
  encode: (buf) => toString(buf),
  decode: (str) => fromString(str)
});

// ../../node_modules/multiformats/dist/src/codecs/json.js
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();

// ../../node_modules/multiformats/dist/src/hashes/identity.js
var identity_exports2 = {};
__export(identity_exports2, {
  identity: () => identity2
});

// ../../node_modules/multiformats/dist/src/vendor/varint.js
var encode_1 = encode3;
var MSB2 = 128;
var REST2 = 127;
var MSBALL = ~REST2;
var INT = Math.pow(2, 31);
function encode3(num, out, offset) {
  out = out || [];
  offset = offset || 0;
  var oldOffset = offset;
  while (num >= INT) {
    out[offset++] = num & 255 | MSB2;
    num /= 128;
  }
  while (num & MSBALL) {
    out[offset++] = num & 255 | MSB2;
    num >>>= 7;
  }
  out[offset] = num | 0;
  encode3.bytes = offset - oldOffset + 1;
  return out;
}
var decode4 = read;
var MSB$1 = 128;
var REST$1 = 127;
function read(buf, offset) {
  var res = 0, offset = offset || 0, shift = 0, counter = offset, b, l2 = buf.length;
  do {
    if (counter >= l2) {
      read.bytes = 0;
      throw new RangeError("Could not decode varint");
    }
    b = buf[counter++];
    res += shift < 28 ? (b & REST$1) << shift : (b & REST$1) * Math.pow(2, shift);
    shift += 7;
  } while (b >= MSB$1);
  read.bytes = counter - offset;
  return res;
}
var N12 = Math.pow(2, 7);
var N22 = Math.pow(2, 14);
var N32 = Math.pow(2, 21);
var N42 = Math.pow(2, 28);
var N52 = Math.pow(2, 35);
var N62 = Math.pow(2, 42);
var N72 = Math.pow(2, 49);
var N8 = Math.pow(2, 56);
var N9 = Math.pow(2, 63);
var length = function(value) {
  return value < N12 ? 1 : value < N22 ? 2 : value < N32 ? 3 : value < N42 ? 4 : value < N52 ? 5 : value < N62 ? 6 : value < N72 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
};
var varint = {
  encode: encode_1,
  decode: decode4,
  encodingLength: length
};
var _brrp_varint = varint;
var varint_default = _brrp_varint;

// ../../node_modules/multiformats/dist/src/varint.js
function decode5(data, offset = 0) {
  const code2 = varint_default.decode(data, offset);
  return [code2, varint_default.decode.bytes];
}
function encodeTo(int, target, offset = 0) {
  varint_default.encode(int, target, offset);
  return target;
}
function encodingLength2(int) {
  return varint_default.encodingLength(int);
}

// ../../node_modules/multiformats/dist/src/hashes/digest.js
function create(code2, digest2) {
  const size = digest2.byteLength;
  const sizeOffset = encodingLength2(code2);
  const digestOffset = sizeOffset + encodingLength2(size);
  const bytes = new Uint8Array(digestOffset + size);
  encodeTo(code2, bytes, 0);
  encodeTo(size, bytes, sizeOffset);
  bytes.set(digest2, digestOffset);
  return new Digest(code2, size, digest2, bytes);
}
function decode6(multihash) {
  const bytes = coerce(multihash);
  const [code2, sizeOffset] = decode5(bytes);
  const [size, digestOffset] = decode5(bytes.subarray(sizeOffset));
  const digest2 = bytes.subarray(sizeOffset + digestOffset);
  if (digest2.byteLength !== size) {
    throw new Error("Incorrect length");
  }
  return new Digest(code2, size, digest2, bytes);
}
function equals3(a2, b) {
  if (a2 === b) {
    return true;
  } else {
    const data = b;
    return a2.code === data.code && a2.size === data.size && data.bytes instanceof Uint8Array && equals(a2.bytes, data.bytes);
  }
}
var Digest = class {
  code;
  size;
  digest;
  bytes;
  /**
   * Creates a multihash digest.
   */
  constructor(code2, size, digest2, bytes) {
    this.code = code2;
    this.size = size;
    this.digest = digest2;
    this.bytes = bytes;
  }
};

// ../../node_modules/multiformats/dist/src/hashes/identity.js
var code = 0;
var name = "identity";
var encode4 = coerce;
function digest(input, options) {
  if (options?.truncate != null && options.truncate !== input.byteLength) {
    if (options.truncate < 0 || options.truncate > input.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`);
    }
    input = input.subarray(0, options.truncate);
  }
  return create(code, encode4(input));
}
var identity2 = { code, name, encode: encode4, digest };

// ../../node_modules/multiformats/dist/src/hashes/sha2-browser.js
var sha2_browser_exports = {};
__export(sha2_browser_exports, {
  sha256: () => sha256,
  sha512: () => sha512
});

// ../../node_modules/multiformats/dist/src/hashes/hasher.js
var DEFAULT_MIN_DIGEST_LENGTH = 20;
function from2({ name: name2, code: code2, encode: encode5, minDigestLength, maxDigestLength }) {
  return new Hasher(name2, code2, encode5, minDigestLength, maxDigestLength);
}
var Hasher = class {
  name;
  code;
  encode;
  minDigestLength;
  maxDigestLength;
  constructor(name2, code2, encode5, minDigestLength, maxDigestLength) {
    this.name = name2;
    this.code = code2;
    this.encode = encode5;
    this.minDigestLength = minDigestLength ?? DEFAULT_MIN_DIGEST_LENGTH;
    this.maxDigestLength = maxDigestLength;
  }
  digest(input, options) {
    if (options?.truncate != null) {
      if (options.truncate < this.minDigestLength) {
        throw new Error(`Invalid truncate option, must be greater than or equal to ${this.minDigestLength}`);
      }
      if (this.maxDigestLength != null && options.truncate > this.maxDigestLength) {
        throw new Error(`Invalid truncate option, must be less than or equal to ${this.maxDigestLength}`);
      }
    }
    if (input instanceof Uint8Array) {
      const result = this.encode(input);
      if (result instanceof Uint8Array) {
        return createDigest(result, this.code, options?.truncate);
      }
      return result.then((digest2) => createDigest(digest2, this.code, options?.truncate));
    } else {
      throw Error("Unknown type, must be binary type");
    }
  }
};
function createDigest(digest2, code2, truncate) {
  if (truncate != null && truncate !== digest2.byteLength) {
    if (truncate > digest2.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${digest2.byteLength}`);
    }
    digest2 = digest2.subarray(0, truncate);
  }
  return create(code2, digest2);
}

// ../../node_modules/multiformats/dist/src/hashes/sha2-browser.js
function sha(name2) {
  return async (data) => new Uint8Array(await crypto.subtle.digest(name2, data));
}
var sha256 = from2({
  name: "sha2-256",
  code: 18,
  encode: sha("SHA-256")
});
var sha512 = from2({
  name: "sha2-512",
  code: 19,
  encode: sha("SHA-512")
});

// ../../node_modules/multiformats/dist/src/cid.js
function format(link, base3) {
  const { bytes, version } = link;
  switch (version) {
    case 0:
      return toStringV0(bytes, baseCache(link), base3 ?? base58btc.encoder);
    default:
      return toStringV1(bytes, baseCache(link), base3 ?? base32.encoder);
  }
}
var cache = /* @__PURE__ */ new WeakMap();
function baseCache(cid) {
  const baseCache2 = cache.get(cid);
  if (baseCache2 == null) {
    const baseCache3 = /* @__PURE__ */ new Map();
    cache.set(cid, baseCache3);
    return baseCache3;
  }
  return baseCache2;
}
var CID = class _CID {
  code;
  version;
  multihash;
  bytes;
  "/";
  /**
   * @param version - Version of the CID
   * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param multihash - (Multi)hash of the of the content.
   */
  constructor(version, code2, multihash, bytes) {
    this.code = code2;
    this.version = version;
    this.multihash = multihash;
    this.bytes = bytes;
    this["/"] = bytes;
  }
  /**
   * Signalling `cid.asCID === cid` has been replaced with `cid['/'] === cid.bytes`
   * please either use `CID.asCID(cid)` or switch to new signalling mechanism
   *
   * @deprecated
   */
  get asCID() {
    return this;
  }
  // ArrayBufferView
  get byteOffset() {
    return this.bytes.byteOffset;
  }
  // ArrayBufferView
  get byteLength() {
    return this.bytes.byteLength;
  }
  toV0() {
    switch (this.version) {
      case 0: {
        return this;
      }
      case 1: {
        const { code: code2, multihash } = this;
        if (code2 !== DAG_PB_CODE) {
          throw new Error("Cannot convert a non dag-pb CID to CIDv0");
        }
        if (multihash.code !== SHA_256_CODE) {
          throw new Error("Cannot convert non sha2-256 multihash CID to CIDv0");
        }
        return _CID.createV0(multihash);
      }
      default: {
        throw Error(`Can not convert CID version ${this.version} to version 0. This is a bug please report`);
      }
    }
  }
  toV1() {
    switch (this.version) {
      case 0: {
        const { code: code2, digest: digest2 } = this.multihash;
        const multihash = create(code2, digest2);
        return _CID.createV1(this.code, multihash);
      }
      case 1: {
        return this;
      }
      default: {
        throw Error(`Can not convert CID version ${this.version} to version 1. This is a bug please report`);
      }
    }
  }
  equals(other) {
    return _CID.equals(this, other);
  }
  static equals(self, other) {
    const unknown = other;
    return unknown != null && self.code === unknown.code && self.version === unknown.version && equals3(self.multihash, unknown.multihash);
  }
  toString(base3) {
    return format(this, base3);
  }
  toJSON() {
    return { "/": format(this) };
  }
  link() {
    return this;
  }
  [Symbol.toStringTag] = "CID";
  // Legacy
  [/* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom")]() {
    return `CID(${this.toString()})`;
  }
  /**
   * Takes any input `value` and returns a `CID` instance if it was
   * a `CID` otherwise returns `null`. If `value` is instanceof `CID`
   * it will return value back. If `value` is not instance of this CID
   * class, but is compatible CID it will return new instance of this
   * `CID` class. Otherwise returns null.
   *
   * This allows two different incompatible versions of CID library to
   * co-exist and interop as long as binary interface is compatible.
   */
  static asCID(input) {
    if (input == null) {
      return null;
    }
    const value = input;
    if (value instanceof _CID) {
      return value;
    } else if (value["/"] != null && value["/"] === value.bytes || value.asCID === value) {
      const { version, code: code2, multihash, bytes } = value;
      return new _CID(version, code2, multihash, bytes ?? encodeCID(version, code2, multihash.bytes));
    } else if (value[cidSymbol] === true) {
      const { version, multihash, code: code2 } = value;
      const digest2 = decode6(multihash);
      return _CID.create(version, code2, digest2);
    } else {
      return null;
    }
  }
  /**
   * @param version - Version of the CID
   * @param code - Code of the codec content is encoded in, see https://github.com/multiformats/multicodec/blob/master/table.csv
   * @param digest - (Multi)hash of the of the content.
   */
  static create(version, code2, digest2) {
    if (typeof code2 !== "number") {
      throw new Error("String codecs are no longer supported");
    }
    if (!(digest2.bytes instanceof Uint8Array)) {
      throw new Error("Invalid digest");
    }
    switch (version) {
      case 0: {
        if (code2 !== DAG_PB_CODE) {
          throw new Error(`Version 0 CID must use dag-pb (code: ${DAG_PB_CODE}) block encoding`);
        } else {
          return new _CID(version, code2, digest2, digest2.bytes);
        }
      }
      case 1: {
        const bytes = encodeCID(version, code2, digest2.bytes);
        return new _CID(version, code2, digest2, bytes);
      }
      default: {
        throw new Error("Invalid version");
      }
    }
  }
  /**
   * Simplified version of `create` for CIDv0.
   */
  static createV0(digest2) {
    return _CID.create(0, DAG_PB_CODE, digest2);
  }
  /**
   * Simplified version of `create` for CIDv1.
   *
   * @param code - Content encoding format code.
   * @param digest - Multihash of the content.
   */
  static createV1(code2, digest2) {
    return _CID.create(1, code2, digest2);
  }
  /**
   * Decoded a CID from its binary representation. The byte array must contain
   * only the CID with no additional bytes.
   *
   * An error will be thrown if the bytes provided do not contain a valid
   * binary representation of a CID.
   */
  static decode(bytes) {
    const [cid, remainder] = _CID.decodeFirst(bytes);
    if (remainder.length !== 0) {
      throw new Error("Incorrect length");
    }
    return cid;
  }
  /**
   * Decoded a CID from its binary representation at the beginning of a byte
   * array.
   *
   * Returns an array with the first element containing the CID and the second
   * element containing the remainder of the original byte array. The remainder
   * will be a zero-length byte array if the provided bytes only contained a
   * binary CID representation.
   */
  static decodeFirst(bytes) {
    const specs = _CID.inspectBytes(bytes);
    const prefixSize = specs.size - specs.multihashSize;
    const multihashBytes = coerce(bytes.subarray(prefixSize, prefixSize + specs.multihashSize));
    if (multihashBytes.byteLength !== specs.multihashSize) {
      throw new Error("Incorrect length");
    }
    const digestBytes = multihashBytes.subarray(specs.multihashSize - specs.digestSize);
    const digest2 = new Digest(specs.multihashCode, specs.digestSize, digestBytes, multihashBytes);
    const cid = specs.version === 0 ? _CID.createV0(digest2) : _CID.createV1(specs.codec, digest2);
    return [cid, bytes.subarray(specs.size)];
  }
  /**
   * Inspect the initial bytes of a CID to determine its properties.
   *
   * Involves decoding up to 4 varints. Typically this will require only 4 to 6
   * bytes but for larger multicodec code values and larger multihash digest
   * lengths these varints can be quite large. It is recommended that at least
   * 10 bytes be made available in the `initialBytes` argument for a complete
   * inspection.
   */
  static inspectBytes(initialBytes) {
    let offset = 0;
    const next = () => {
      const [i2, length2] = decode5(initialBytes.subarray(offset));
      offset += length2;
      return i2;
    };
    let version = next();
    let codec = DAG_PB_CODE;
    if (version === 18) {
      version = 0;
      offset = 0;
    } else {
      codec = next();
    }
    if (version !== 0 && version !== 1) {
      throw new RangeError(`Invalid CID version ${version}`);
    }
    const prefixSize = offset;
    const multihashCode = next();
    const digestSize = next();
    const size = offset + digestSize;
    const multihashSize = size - prefixSize;
    return { version, codec, multihashCode, digestSize, multihashSize, size };
  }
  /**
   * Takes cid in a string representation and creates an instance. If `base`
   * decoder is not provided will use a default from the configuration. It will
   * throw an error if encoding of the CID is not compatible with supplied (or
   * a default decoder).
   */
  static parse(source, base3) {
    const [prefix, bytes] = parseCIDtoBytes(source, base3);
    const cid = _CID.decode(bytes);
    if (cid.version === 0 && source[0] !== "Q") {
      throw Error("Version 0 CID string must not include multibase prefix");
    }
    baseCache(cid).set(prefix, source);
    return cid;
  }
};
function parseCIDtoBytes(source, base3) {
  switch (source[0]) {
    // CIDv0 is parsed differently
    case "Q": {
      const decoder = base3 ?? base58btc;
      return [
        base58btc.prefix,
        decoder.decode(`${base58btc.prefix}${source}`)
      ];
    }
    case base58btc.prefix: {
      const decoder = base3 ?? base58btc;
      return [base58btc.prefix, decoder.decode(source)];
    }
    case base32.prefix: {
      const decoder = base3 ?? base32;
      return [base32.prefix, decoder.decode(source)];
    }
    case base36.prefix: {
      const decoder = base3 ?? base36;
      return [base36.prefix, decoder.decode(source)];
    }
    default: {
      if (base3 == null) {
        throw Error("To parse non base32, base36 or base58btc encoded CID multibase decoder must be provided");
      }
      return [source[0], base3.decode(source)];
    }
  }
}
function toStringV0(bytes, cache2, base3) {
  const { prefix } = base3;
  if (prefix !== base58btc.prefix) {
    throw Error(`Cannot string encode V0 in ${base3.name} encoding`);
  }
  const cid = cache2.get(prefix);
  if (cid == null) {
    const cid2 = base3.encode(bytes).slice(1);
    cache2.set(prefix, cid2);
    return cid2;
  } else {
    return cid;
  }
}
function toStringV1(bytes, cache2, base3) {
  const { prefix } = base3;
  const cid = cache2.get(prefix);
  if (cid == null) {
    const cid2 = base3.encode(bytes);
    cache2.set(prefix, cid2);
    return cid2;
  } else {
    return cid;
  }
}
var DAG_PB_CODE = 112;
var SHA_256_CODE = 18;
function encodeCID(version, code2, multihash) {
  const codeOffset = encodingLength2(version);
  const hashOffset = codeOffset + encodingLength2(code2);
  const bytes = new Uint8Array(hashOffset + multihash.byteLength);
  encodeTo(version, bytes, 0);
  encodeTo(code2, bytes, codeOffset);
  bytes.set(multihash, hashOffset);
  return bytes;
}
var cidSymbol = /* @__PURE__ */ Symbol.for("@ipld/js-cid/CID");

// ../../node_modules/multiformats/dist/src/basics.js
var bases = { ...identity_exports, ...base2_exports, ...base8_exports, ...base10_exports, ...base16_exports, ...base32_exports, ...base36_exports, ...base58_exports, ...base64_exports, ...base256emoji_exports };
var hashes = { ...sha2_browser_exports, ...identity_exports2 };

// ../../node_modules/uint8arrays/dist/src/util/bases.js
function createCodec(name2, prefix, encode5, decode7) {
  return {
    name: name2,
    prefix,
    encoder: {
      name: name2,
      prefix,
      encode: encode5
    },
    decoder: {
      decode: decode7
    }
  };
}
var string = createCodec("utf8", "u", (buf) => {
  const decoder = new TextDecoder("utf8");
  return "u" + decoder.decode(buf);
}, (str) => {
  const encoder = new TextEncoder();
  return encoder.encode(str.substring(1));
});
var ascii = createCodec("ascii", "a", (buf) => {
  let string2 = "a";
  for (let i2 = 0; i2 < buf.length; i2++) {
    string2 += String.fromCharCode(buf[i2]);
  }
  return string2;
}, (str) => {
  str = str.substring(1);
  const buf = allocUnsafe(str.length);
  for (let i2 = 0; i2 < str.length; i2++) {
    buf[i2] = str.charCodeAt(i2);
  }
  return buf;
});
var BASES = {
  utf8: string,
  "utf-8": string,
  hex: bases.base16,
  latin1: ascii,
  ascii,
  binary: ascii,
  ...bases
};
var bases_default = BASES;

// ../../node_modules/uint8arrays/dist/src/from-string.js
function fromString2(string2, encoding = "utf8") {
  const base3 = bases_default[encoding];
  if (base3 == null) {
    throw new Error(`Unsupported encoding "${encoding}"`);
  }
  return base3.decoder.decode(`${base3.prefix}${string2}`);
}

// ../../node_modules/uint8arrays/dist/src/to-string.js
function toString2(array, encoding = "utf8") {
  const base3 = bases_default[encoding];
  if (base3 == null) {
    throw new Error(`Unsupported encoding "${encoding}"`);
  }
  return base3.encoder.encode(array).substring(1);
}

// ../../node_modules/@multiformats/multiaddr/dist/src/errors.js
var InvalidMultiaddrError = class extends Error {
  static name = "InvalidMultiaddrError";
  name = "InvalidMultiaddrError";
};
var ValidationError = class extends Error {
  static name = "ValidationError";
  name = "ValidationError";
};
var InvalidParametersError = class extends Error {
  static name = "InvalidParametersError";
  name = "InvalidParametersError";
};
var UnknownProtocolError = class extends Error {
  static name = "UnknownProtocolError";
  name = "UnknownProtocolError";
};

// ../../node_modules/@chainsafe/is-ip/lib/parser.js
var Parser = class {
  index = 0;
  input = "";
  new(input) {
    this.index = 0;
    this.input = input;
    return this;
  }
  /** Run a parser, and restore the pre-parse state if it fails. */
  readAtomically(fn) {
    const index = this.index;
    const result = fn();
    if (result === void 0) {
      this.index = index;
    }
    return result;
  }
  /** Run a parser, but fail if the entire input wasn't consumed. Doesn't run atomically. */
  parseWith(fn) {
    const result = fn();
    if (this.index !== this.input.length) {
      return void 0;
    }
    return result;
  }
  /** Peek the next character from the input */
  peekChar() {
    if (this.index >= this.input.length) {
      return void 0;
    }
    return this.input[this.index];
  }
  /** Read the next character from the input */
  readChar() {
    if (this.index >= this.input.length) {
      return void 0;
    }
    return this.input[this.index++];
  }
  /** Read the next character from the input if it matches the target. */
  readGivenChar(target) {
    return this.readAtomically(() => {
      const char = this.readChar();
      if (char !== target) {
        return void 0;
      }
      return char;
    });
  }
  /**
   * Helper for reading separators in an indexed loop. Reads the separator
   * character iff index > 0, then runs the parser. When used in a loop,
   * the separator character will only be read on index > 0 (see
   * readIPv4Addr for an example)
   */
  readSeparator(sep, index, inner) {
    return this.readAtomically(() => {
      if (index > 0) {
        if (this.readGivenChar(sep) === void 0) {
          return void 0;
        }
      }
      return inner();
    });
  }
  /**
   * Read a number off the front of the input in the given radix, stopping
   * at the first non-digit character or eof. Fails if the number has more
   * digits than max_digits or if there is no number.
   */
  readNumber(radix, maxDigits, allowZeroPrefix, maxBytes) {
    return this.readAtomically(() => {
      let result = 0;
      let digitCount = 0;
      const leadingChar = this.peekChar();
      if (leadingChar === void 0) {
        return void 0;
      }
      const hasLeadingZero = leadingChar === "0";
      const maxValue2 = 2 ** (8 * maxBytes) - 1;
      while (true) {
        const digit = this.readAtomically(() => {
          const char = this.readChar();
          if (char === void 0) {
            return void 0;
          }
          const num = Number.parseInt(char, radix);
          if (Number.isNaN(num)) {
            return void 0;
          }
          return num;
        });
        if (digit === void 0) {
          break;
        }
        result *= radix;
        result += digit;
        if (result > maxValue2) {
          return void 0;
        }
        digitCount += 1;
        if (maxDigits !== void 0) {
          if (digitCount > maxDigits) {
            return void 0;
          }
        }
      }
      if (digitCount === 0) {
        return void 0;
      } else if (!allowZeroPrefix && hasLeadingZero && digitCount > 1) {
        return void 0;
      } else {
        return result;
      }
    });
  }
  /** Read an IPv4 address. */
  readIPv4Addr() {
    return this.readAtomically(() => {
      const out = new Uint8Array(4);
      for (let i2 = 0; i2 < out.length; i2++) {
        const ix = this.readSeparator(".", i2, () => this.readNumber(10, 3, false, 1));
        if (ix === void 0) {
          return void 0;
        }
        out[i2] = ix;
      }
      return out;
    });
  }
  /** Read an IPv6 Address. */
  readIPv6Addr() {
    const readGroups = (groups) => {
      for (let i2 = 0; i2 < groups.length / 2; i2++) {
        const ix = i2 * 2;
        if (i2 < groups.length - 3) {
          const ipv4 = this.readSeparator(":", i2, () => this.readIPv4Addr());
          if (ipv4 !== void 0) {
            groups[ix] = ipv4[0];
            groups[ix + 1] = ipv4[1];
            groups[ix + 2] = ipv4[2];
            groups[ix + 3] = ipv4[3];
            return [ix + 4, true];
          }
        }
        const group = this.readSeparator(":", i2, () => this.readNumber(16, 4, true, 2));
        if (group === void 0) {
          return [ix, false];
        }
        groups[ix] = group >> 8;
        groups[ix + 1] = group & 255;
      }
      return [groups.length, false];
    };
    return this.readAtomically(() => {
      const head = new Uint8Array(16);
      const [headSize, headIp4] = readGroups(head);
      if (headSize === 16) {
        return head;
      }
      if (headIp4) {
        return void 0;
      }
      if (this.readGivenChar(":") === void 0) {
        return void 0;
      }
      if (this.readGivenChar(":") === void 0) {
        return void 0;
      }
      const tail = new Uint8Array(14);
      const limit = 16 - (headSize + 2);
      const [tailSize] = readGroups(tail.subarray(0, limit));
      head.set(tail.subarray(0, tailSize), 16 - tailSize);
      return head;
    });
  }
  /** Read an IP Address, either IPv4 or IPv6. */
  readIPAddr() {
    return this.readIPv4Addr() ?? this.readIPv6Addr();
  }
};

// ../../node_modules/@chainsafe/is-ip/lib/parse.js
var MAX_IPV6_LENGTH = 45;
var MAX_IPV4_LENGTH = 15;
var parser = new Parser();
function parseIPv4(input) {
  if (input.length > MAX_IPV4_LENGTH) {
    return void 0;
  }
  return parser.new(input).parseWith(() => parser.readIPv4Addr());
}
function parseIPv6(input) {
  if (input.includes("%")) {
    input = input.split("%")[0];
  }
  if (input.length > MAX_IPV6_LENGTH) {
    return void 0;
  }
  return parser.new(input).parseWith(() => parser.readIPv6Addr());
}

// ../../node_modules/@chainsafe/is-ip/lib/is-ip.js
function isIPv4(input) {
  return Boolean(parseIPv4(input));
}
function isIPv6(input) {
  return Boolean(parseIPv6(input));
}

// ../../node_modules/@multiformats/multiaddr/dist/src/constants.js
var CODE_IP4 = 4;
var CODE_TCP = 6;
var CODE_UDP = 273;
var CODE_DCCP = 33;
var CODE_IP6 = 41;
var CODE_IP6ZONE = 42;
var CODE_IPCIDR = 43;
var CODE_DNS = 53;
var CODE_DNS4 = 54;
var CODE_DNS6 = 55;
var CODE_DNSADDR = 56;
var CODE_SCTP = 132;
var CODE_UDT = 301;
var CODE_UTP = 302;
var CODE_UNIX = 400;
var CODE_P2P = 421;
var CODE_ONION = 444;
var CODE_ONION3 = 445;
var CODE_GARLIC64 = 446;
var CODE_GARLIC32 = 447;
var CODE_TLS = 448;
var CODE_SNI = 449;
var CODE_NOISE = 454;
var CODE_QUIC = 460;
var CODE_QUIC_V1 = 461;
var CODE_WEBTRANSPORT = 465;
var CODE_CERTHASH = 466;
var CODE_HTTP = 480;
var CODE_HTTP_PATH = 481;
var CODE_HTTPS = 443;
var CODE_WS = 477;
var CODE_WSS = 478;
var CODE_P2P_WEBSOCKET_STAR = 479;
var CODE_P2P_STARDUST = 277;
var CODE_P2P_WEBRTC_STAR = 275;
var CODE_P2P_WEBRTC_DIRECT = 276;
var CODE_WEBRTC_DIRECT = 280;
var CODE_WEBRTC = 281;
var CODE_P2P_CIRCUIT = 290;
var CODE_MEMORY = 777;

// ../../node_modules/@multiformats/multiaddr/dist/src/utils.js
function bytesToString(base3) {
  return (buf) => {
    return toString2(buf, base3);
  };
}
function stringToBytes(base3) {
  return (buf) => {
    return fromString2(buf, base3);
  };
}
function bytes2port(buf) {
  const view = new DataView(buf.buffer);
  return view.getUint16(buf.byteOffset).toString();
}
function port2bytes(port) {
  const buf = new ArrayBuffer(2);
  const view = new DataView(buf);
  view.setUint16(0, typeof port === "string" ? parseInt(port) : port);
  return new Uint8Array(buf);
}
function onion2bytes(str) {
  const addr = str.split(":");
  if (addr.length !== 2) {
    throw new Error(`failed to parse onion addr: ["'${addr.join('", "')}'"]' does not contain a port number`);
  }
  if (addr[0].length !== 16) {
    throw new Error(`failed to parse onion addr: ${addr[0]} not a Tor onion address.`);
  }
  const buf = fromString2(addr[0], "base32");
  const port = parseInt(addr[1], 10);
  if (port < 1 || port > 65536) {
    throw new Error("Port number is not in range(1, 65536)");
  }
  const portBuf = port2bytes(port);
  return concat([buf, portBuf], buf.length + portBuf.length);
}
function onion32bytes(str) {
  const addr = str.split(":");
  if (addr.length !== 2) {
    throw new Error(`failed to parse onion addr: ["'${addr.join('", "')}'"]' does not contain a port number`);
  }
  if (addr[0].length !== 56) {
    throw new Error(`failed to parse onion addr: ${addr[0]} not a Tor onion3 address.`);
  }
  const buf = base32.decode(`b${addr[0]}`);
  const port = parseInt(addr[1], 10);
  if (port < 1 || port > 65536) {
    throw new Error("Port number is not in range(1, 65536)");
  }
  const portBuf = port2bytes(port);
  return concat([buf, portBuf], buf.length + portBuf.length);
}
function bytes2onion(buf) {
  const addrBytes = buf.subarray(0, buf.length - 2);
  const portBytes = buf.subarray(buf.length - 2);
  const addr = toString2(addrBytes, "base32");
  const port = bytes2port(portBytes);
  return `${addr}:${port}`;
}
var ip4ToBytes = function(ip) {
  ip = ip.toString().trim();
  const bytes = new Uint8Array(4);
  ip.split(/\./g).forEach((byte, index) => {
    const value = parseInt(byte, 10);
    if (isNaN(value) || value < 0 || value > 255) {
      throw new InvalidMultiaddrError("Invalid byte value in IP address");
    }
    bytes[index] = value;
  });
  return bytes;
};
var ip6ToBytes = function(ip) {
  let offset = 0;
  ip = ip.toString().trim();
  const sections = ip.split(":", 8);
  let i2;
  for (i2 = 0; i2 < sections.length; i2++) {
    const isv4 = isIPv4(sections[i2]);
    let v4Buffer;
    if (isv4) {
      v4Buffer = ip4ToBytes(sections[i2]);
      sections[i2] = toString2(v4Buffer.subarray(0, 2), "base16");
    }
    if (v4Buffer != null && ++i2 < 8) {
      sections.splice(i2, 0, toString2(v4Buffer.subarray(2, 4), "base16"));
    }
  }
  if (sections[0] === "") {
    while (sections.length < 8) {
      sections.unshift("0");
    }
  } else if (sections[sections.length - 1] === "") {
    while (sections.length < 8) {
      sections.push("0");
    }
  } else if (sections.length < 8) {
    for (i2 = 0; i2 < sections.length && sections[i2] !== ""; i2++) {
    }
    const argv = [i2, 1];
    for (i2 = 9 - sections.length; i2 > 0; i2--) {
      argv.push("0");
    }
    sections.splice.apply(sections, argv);
  }
  const bytes = new Uint8Array(offset + 16);
  for (i2 = 0; i2 < sections.length; i2++) {
    if (sections[i2] === "") {
      sections[i2] = "0";
    }
    const word = parseInt(sections[i2], 16);
    if (isNaN(word) || word < 0 || word > 65535) {
      throw new InvalidMultiaddrError("Invalid byte value in IP address");
    }
    bytes[offset++] = word >> 8 & 255;
    bytes[offset++] = word & 255;
  }
  return bytes;
};
var ip4ToString = function(buf) {
  if (buf.byteLength !== 4) {
    throw new InvalidMultiaddrError("IPv4 address was incorrect length");
  }
  const result = [];
  for (let i2 = 0; i2 < buf.byteLength; i2++) {
    result.push(buf[i2]);
  }
  return result.join(".");
};
var ip6ToString = function(buf) {
  if (buf.byteLength !== 16) {
    throw new InvalidMultiaddrError("IPv6 address was incorrect length");
  }
  const result = [];
  for (let i2 = 0; i2 < buf.byteLength; i2 += 2) {
    const byte1 = buf[i2];
    const byte2 = buf[i2 + 1];
    const tuple = `${byte1.toString(16).padStart(2, "0")}${byte2.toString(16).padStart(2, "0")}`;
    result.push(tuple);
  }
  const ip = result.join(":");
  try {
    const url = new URL(`http://[${ip}]`);
    return url.hostname.substring(1, url.hostname.length - 1);
  } catch {
    throw new InvalidMultiaddrError(`Invalid IPv6 address "${ip}"`);
  }
};
function ip6StringToValue(str) {
  try {
    const url = new URL(`http://[${str}]`);
    return url.hostname.substring(1, url.hostname.length - 1);
  } catch {
    throw new InvalidMultiaddrError(`Invalid IPv6 address "${str}"`);
  }
}
var decoders = Object.values(bases).map((c2) => c2.decoder);
var anybaseDecoder = (function() {
  let acc = decoders[0].or(decoders[1]);
  decoders.slice(2).forEach((d2) => acc = acc.or(d2));
  return acc;
})();
function mb2bytes(mbstr) {
  return anybaseDecoder.decode(mbstr);
}
function bytes2mb(base3) {
  return (buf) => {
    return base3.encoder.encode(buf);
  };
}

// ../../node_modules/@multiformats/multiaddr/dist/src/validation.js
function integer(value) {
  const int = parseInt(value);
  if (int.toString() !== value) {
    throw new ValidationError("Value must be an integer");
  }
}
function positive(value) {
  if (value < 0) {
    throw new ValidationError("Value must be a positive integer, or zero");
  }
}
function maxValue(max) {
  return (value) => {
    if (value > max) {
      throw new ValidationError(`Value must be smaller than or equal to ${max}`);
    }
  };
}
function validate(...funcs) {
  return (value) => {
    for (const fn of funcs) {
      fn(value);
    }
  };
}
var validatePort = validate(integer, positive, maxValue(65535));

// ../../node_modules/@multiformats/multiaddr/dist/src/registry.js
var V = -1;
var Registry = class {
  protocolsByCode = /* @__PURE__ */ new Map();
  protocolsByName = /* @__PURE__ */ new Map();
  getProtocol(key) {
    let codec;
    if (typeof key === "string") {
      codec = this.protocolsByName.get(key);
    } else {
      codec = this.protocolsByCode.get(key);
    }
    if (codec == null) {
      throw new UnknownProtocolError(`Protocol ${key} was unknown`);
    }
    return codec;
  }
  addProtocol(codec) {
    this.protocolsByCode.set(codec.code, codec);
    this.protocolsByName.set(codec.name, codec);
    codec.aliases?.forEach((alias) => {
      this.protocolsByName.set(alias, codec);
    });
  }
  removeProtocol(code2) {
    const codec = this.protocolsByCode.get(code2);
    if (codec == null) {
      return;
    }
    this.protocolsByCode.delete(codec.code);
    this.protocolsByName.delete(codec.name);
    codec.aliases?.forEach((alias) => {
      this.protocolsByName.delete(alias);
    });
  }
};
var registry = new Registry();
var codecs = [{
  code: CODE_IP4,
  name: "ip4",
  size: 32,
  valueToBytes: ip4ToBytes,
  bytesToValue: ip4ToString,
  validate: (value) => {
    if (!isIPv4(value)) {
      throw new ValidationError(`Invalid IPv4 address "${value}"`);
    }
  }
}, {
  code: CODE_TCP,
  name: "tcp",
  size: 16,
  valueToBytes: port2bytes,
  bytesToValue: bytes2port,
  validate: validatePort
}, {
  code: CODE_UDP,
  name: "udp",
  size: 16,
  valueToBytes: port2bytes,
  bytesToValue: bytes2port,
  validate: validatePort
}, {
  code: CODE_DCCP,
  name: "dccp",
  size: 16,
  valueToBytes: port2bytes,
  bytesToValue: bytes2port,
  validate: validatePort
}, {
  code: CODE_IP6,
  name: "ip6",
  size: 128,
  valueToBytes: ip6ToBytes,
  bytesToValue: ip6ToString,
  stringToValue: ip6StringToValue,
  validate: (value) => {
    if (!isIPv6(value)) {
      throw new ValidationError(`Invalid IPv6 address "${value}"`);
    }
  }
}, {
  code: CODE_IP6ZONE,
  name: "ip6zone",
  size: V
}, {
  code: CODE_IPCIDR,
  name: "ipcidr",
  size: 8,
  bytesToValue: bytesToString("base10"),
  valueToBytes: stringToBytes("base10")
}, {
  code: CODE_DNS,
  name: "dns",
  size: V
}, {
  code: CODE_DNS4,
  name: "dns4",
  size: V
}, {
  code: CODE_DNS6,
  name: "dns6",
  size: V
}, {
  code: CODE_DNSADDR,
  name: "dnsaddr",
  size: V
}, {
  code: CODE_SCTP,
  name: "sctp",
  size: 16,
  valueToBytes: port2bytes,
  bytesToValue: bytes2port,
  validate: validatePort
}, {
  code: CODE_UDT,
  name: "udt"
}, {
  code: CODE_UTP,
  name: "utp"
}, {
  code: CODE_UNIX,
  name: "unix",
  size: V,
  stringToValue: (str) => decodeURIComponent(str),
  valueToString: (val) => encodeURIComponent(val)
}, {
  code: CODE_P2P,
  name: "p2p",
  aliases: ["ipfs"],
  size: V,
  bytesToValue: bytesToString("base58btc"),
  valueToBytes: (val) => {
    if (val.startsWith("Q") || val.startsWith("1")) {
      return stringToBytes("base58btc")(val);
    }
    return CID.parse(val).multihash.bytes;
  }
}, {
  code: CODE_ONION,
  name: "onion",
  size: 96,
  bytesToValue: bytes2onion,
  valueToBytes: onion2bytes
}, {
  code: CODE_ONION3,
  name: "onion3",
  size: 296,
  bytesToValue: bytes2onion,
  valueToBytes: onion32bytes
}, {
  code: CODE_GARLIC64,
  name: "garlic64",
  size: V
}, {
  code: CODE_GARLIC32,
  name: "garlic32",
  size: V
}, {
  code: CODE_TLS,
  name: "tls"
}, {
  code: CODE_SNI,
  name: "sni",
  size: V
}, {
  code: CODE_NOISE,
  name: "noise"
}, {
  code: CODE_QUIC,
  name: "quic"
}, {
  code: CODE_QUIC_V1,
  name: "quic-v1"
}, {
  code: CODE_WEBTRANSPORT,
  name: "webtransport"
}, {
  code: CODE_CERTHASH,
  name: "certhash",
  size: V,
  bytesToValue: bytes2mb(base64url),
  valueToBytes: mb2bytes
}, {
  code: CODE_HTTP,
  name: "http"
}, {
  code: CODE_HTTP_PATH,
  name: "http-path",
  size: V,
  stringToValue: (str) => `/${decodeURIComponent(str)}`,
  valueToString: (val) => encodeURIComponent(val.substring(1))
}, {
  code: CODE_HTTPS,
  name: "https"
}, {
  code: CODE_WS,
  name: "ws"
}, {
  code: CODE_WSS,
  name: "wss"
}, {
  code: CODE_P2P_WEBSOCKET_STAR,
  name: "p2p-websocket-star"
}, {
  code: CODE_P2P_STARDUST,
  name: "p2p-stardust"
}, {
  code: CODE_P2P_WEBRTC_STAR,
  name: "p2p-webrtc-star"
}, {
  code: CODE_P2P_WEBRTC_DIRECT,
  name: "p2p-webrtc-direct"
}, {
  code: CODE_WEBRTC_DIRECT,
  name: "webrtc-direct"
}, {
  code: CODE_WEBRTC,
  name: "webrtc"
}, {
  code: CODE_P2P_CIRCUIT,
  name: "p2p-circuit"
}, {
  code: CODE_MEMORY,
  name: "memory",
  size: V
}];
codecs.forEach((codec) => {
  registry.addProtocol(codec);
});

// ../../node_modules/@multiformats/multiaddr/dist/src/components.js
function bytesToComponents(bytes) {
  const components = [];
  let i2 = 0;
  while (i2 < bytes.length) {
    const code2 = decode2(bytes, i2);
    const codec = registry.getProtocol(code2);
    const codeLength = encodingLength(code2);
    const size = sizeForAddr(codec, bytes, i2 + codeLength);
    let sizeLength = 0;
    if (size > 0 && codec.size === V) {
      sizeLength = encodingLength(size);
    }
    const componentLength = codeLength + sizeLength + size;
    const component = {
      code: code2,
      name: codec.name,
      bytes: bytes.subarray(i2, i2 + componentLength)
    };
    if (size > 0) {
      const valueOffset = i2 + codeLength + sizeLength;
      const valueBytes = bytes.subarray(valueOffset, valueOffset + size);
      component.value = codec.bytesToValue?.(valueBytes) ?? toString2(valueBytes);
    }
    components.push(component);
    i2 += componentLength;
  }
  return components;
}
function componentsToBytes(components) {
  let length2 = 0;
  const bytes = [];
  for (const component of components) {
    if (component.bytes == null) {
      const codec = registry.getProtocol(component.code);
      const codecLength = encodingLength(component.code);
      let valueBytes;
      let valueLength = 0;
      let valueLengthLength = 0;
      if (component.value != null) {
        valueBytes = codec.valueToBytes?.(component.value) ?? fromString2(component.value);
        valueLength = valueBytes.byteLength;
        if (codec.size === V) {
          valueLengthLength = encodingLength(valueLength);
        }
      }
      const bytes2 = new Uint8Array(codecLength + valueLengthLength + valueLength);
      let offset = 0;
      encodeUint8Array(component.code, bytes2, offset);
      offset += codecLength;
      if (valueBytes != null) {
        if (codec.size === V) {
          encodeUint8Array(valueLength, bytes2, offset);
          offset += valueLengthLength;
        }
        bytes2.set(valueBytes, offset);
      }
      component.bytes = bytes2;
    }
    bytes.push(component.bytes);
    length2 += component.bytes.byteLength;
  }
  return concat(bytes, length2);
}
function stringToComponents(string2) {
  if (string2.charAt(0) !== "/") {
    throw new InvalidMultiaddrError('String multiaddr must start with "/"');
  }
  const components = [];
  let collecting = "protocol";
  let value = "";
  let protocol = "";
  for (let i2 = 1; i2 < string2.length; i2++) {
    const char = string2.charAt(i2);
    if (char !== "/") {
      if (collecting === "protocol") {
        protocol += string2.charAt(i2);
      } else {
        value += string2.charAt(i2);
      }
    }
    const ended = i2 === string2.length - 1;
    if (char === "/" || ended) {
      const codec = registry.getProtocol(protocol);
      if (collecting === "protocol") {
        if (codec.size == null || codec.size === 0) {
          components.push({
            code: codec.code,
            name: codec.name
          });
          value = "";
          protocol = "";
          collecting = "protocol";
          continue;
        } else if (ended) {
          throw new InvalidMultiaddrError(`Component ${protocol} was missing value`);
        }
        collecting = "value";
      } else if (collecting === "value") {
        const component = {
          code: codec.code,
          name: codec.name
        };
        if (codec.size != null && codec.size !== 0) {
          if (value === "") {
            throw new InvalidMultiaddrError(`Component ${protocol} was missing value`);
          }
          component.value = codec.stringToValue?.(value) ?? value;
        }
        components.push(component);
        value = "";
        protocol = "";
        collecting = "protocol";
      }
    }
  }
  if (protocol !== "" && value !== "") {
    throw new InvalidMultiaddrError("Incomplete multiaddr");
  }
  return components;
}
function componentsToString(components) {
  return `/${components.flatMap((component) => {
    if (component.value == null) {
      return component.name;
    }
    const codec = registry.getProtocol(component.code);
    if (codec == null) {
      throw new InvalidMultiaddrError(`Unknown protocol code ${component.code}`);
    }
    return [
      component.name,
      codec.valueToString?.(component.value) ?? component.value
    ];
  }).join("/")}`;
}
function sizeForAddr(codec, bytes, offset) {
  if (codec.size == null || codec.size === 0) {
    return 0;
  }
  if (codec.size > 0) {
    return codec.size / 8;
  }
  return decode2(bytes, offset);
}

// ../../node_modules/@multiformats/multiaddr/dist/src/multiaddr.js
var inspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var symbol = /* @__PURE__ */ Symbol.for("@multiformats/multiaddr");
function toComponents(addr) {
  if (addr == null) {
    addr = "/";
  }
  if (isMultiaddr(addr)) {
    return addr.getComponents();
  }
  if (addr instanceof Uint8Array) {
    return bytesToComponents(addr);
  }
  if (typeof addr === "string") {
    addr = addr.replace(/\/(\/)+/, "/").replace(/(\/)+$/, "");
    if (addr === "") {
      addr = "/";
    }
    return stringToComponents(addr);
  }
  if (Array.isArray(addr)) {
    return addr;
  }
  throw new InvalidMultiaddrError("Must be a string, Uint8Array, Component[], or another Multiaddr");
}
var Multiaddr = class _Multiaddr {
  [symbol] = true;
  #components;
  // cache string representation
  #string;
  // cache byte representation
  #bytes;
  constructor(addr = "/", options = {}) {
    this.#components = toComponents(addr);
    if (options.validate !== false) {
      validate2(this);
    }
  }
  get bytes() {
    if (this.#bytes == null) {
      this.#bytes = componentsToBytes(this.#components);
    }
    return this.#bytes;
  }
  toString() {
    if (this.#string == null) {
      this.#string = componentsToString(this.#components);
    }
    return this.#string;
  }
  toJSON() {
    return this.toString();
  }
  getComponents() {
    return [
      ...this.#components.map((c2) => ({ ...c2 }))
    ];
  }
  encapsulate(addr) {
    const ma = new _Multiaddr(addr);
    return new _Multiaddr([
      ...this.#components,
      ...ma.getComponents()
    ], {
      validate: false
    });
  }
  decapsulate(addr) {
    const addrString = addr.toString();
    const s2 = this.toString();
    const i2 = s2.lastIndexOf(addrString);
    if (i2 < 0) {
      throw new InvalidParametersError(`Address ${this.toString()} does not contain subaddress: ${addrString}`);
    }
    return new _Multiaddr(s2.slice(0, i2), {
      validate: false
    });
  }
  decapsulateCode(code2) {
    let index;
    for (let i2 = this.#components.length - 1; i2 > -1; i2--) {
      if (this.#components[i2].code === code2) {
        index = i2;
        break;
      }
    }
    return new _Multiaddr(this.#components.slice(0, index), {
      validate: false
    });
  }
  equals(addr) {
    return equals2(this.bytes, addr.bytes);
  }
  /**
   * Returns Multiaddr as a human-readable string
   * https://nodejs.org/api/util.html#utilinspectcustom
   *
   * @example
   * ```js
   * import { multiaddr } from '@multiformats/multiaddr'
   *
   * console.info(multiaddr('/ip4/127.0.0.1/tcp/4001'))
   * // 'Multiaddr(/ip4/127.0.0.1/tcp/4001)'
   * ```
   */
  [inspect]() {
    return `Multiaddr(${this.toString()})`;
  }
};
function validate2(addr) {
  addr.getComponents().forEach((component) => {
    const codec = registry.getProtocol(component.code);
    if (component.value == null) {
      return;
    }
    codec.validate?.(component.value);
  });
}

// ../../node_modules/@multiformats/multiaddr/dist/src/index.js
function isMultiaddr(value) {
  return Boolean(value?.[symbol]);
}
function multiaddr(addr) {
  return new Multiaddr(addr);
}

// src/lib/libp2p/peer-discovery-browser.ts
var log2 = createLogger("peer-discovery-browser");
var PeerDiscoveryBrowser = class {
  discoveredPeers;
  connectionAttempts;
  connectedPeers;
  discoveryInterval;
  libp2p;
  dhtManager;
  connectionManager;
  sendToAllUsers;
  options;
  constructor(libp2p, dhtManager, connectionManager, sendToAllUsers, options = {}) {
    this.libp2p = libp2p;
    this.dhtManager = dhtManager;
    this.connectionManager = connectionManager;
    this.sendToAllUsers = sendToAllUsers;
    this.discoveredPeers = /* @__PURE__ */ new Map();
    this.connectionAttempts = /* @__PURE__ */ new Map();
    this.connectedPeers = /* @__PURE__ */ new Set();
    this.options = {
      onPeerDiscovered: () => {
      },
      onPeerConnected: () => {
      },
      onPeerDisconnected: () => {
      },
      onError: () => {
      },
      autoConnect: true,
      maxConnectionAttempts: 3,
      discoveryInterval: 3e4,
      ...options
    };
    this.setupEventListeners();
    this.logDiagnostics();
  }
  logDiagnostics() {
    log2("🔧 Peer Discovery Browser Diagnostics:", {
      hasLibp2p: !!this.libp2p,
      hasDHTManager: !!this.dhtManager,
      hasConnectionManager: !!this.connectionManager,
      hasSendToAllUsers: !!this.sendToAllUsers,
      options: this.options
    });
  }
  setupEventListeners() {
    if (!this.libp2p) {
      log2.warn("⚠️ Libp2p instance not available for event listeners");
      return;
    }
    try {
      this.libp2p.addEventListener("peer:discovery", (event) => {
        this.handlePeerDiscovery(event.detail);
      });
      this.libp2p.addEventListener("connection:open", (event) => {
        this.handleConnectionOpen(event.detail);
      });
      this.libp2p.addEventListener("connection:close", (event) => {
        this.handleConnectionClose(event.detail);
      });
      log2("✅ Event listeners установлены");
    } catch (error) {
      log2.error("❌ Error setting up event listeners:", error);
      this.options.onError(error, "setupEventListeners");
    }
  }
  handlePeerDiscovery(peerInfo) {
    try {
      const peerId = peerInfo.id.toString();
      const multiaddrs = peerInfo.multiaddrs ? peerInfo.multiaddrs.map((ma) => ma.toString()) : [];
      log2("🎯 Peer discovered:", {
        peerId,
        multiaddrs: multiaddrs.slice(0, 3),
        totalMultiaddrs: multiaddrs.length,
        hasPublicAddress: this.hasPublicAddress(multiaddrs)
      });
      const existingPeer = this.discoveredPeers.get(peerId);
      if (existingPeer) {
        existingPeer.multiaddrs = [.../* @__PURE__ */ new Set([...existingPeer.multiaddrs, ...multiaddrs])];
        existingPeer.lastStatusUpdate = Date.now();
        existingPeer.source = "mdns";
      } else {
        const newPeer = {
          peerId,
          multiaddrs,
          discoveredAt: Date.now(),
          source: "mdns",
          status: "discovered",
          lastStatusUpdate: Date.now(),
          connectionAttempts: 0
        };
        this.discoveredPeers.set(peerId, newPeer);
      }
      this.options.onPeerDiscovered({
        peerId,
        multiaddrs,
        source: "mdns"
      });
      this.sendDiscoveryUpdate();
      if (this.options.autoConnect && this.shouldConnectToPeer(peerId)) {
        this.scheduleConnection(peerId, multiaddrs);
      }
    } catch (error) {
      log2.error("❌ Error handling peer discovery:", error);
      this.options.onError(error, "handlePeerDiscovery");
    }
  }
  handleConnectionOpen(connection) {
    try {
      const peerId = connection.remotePeer.toString();
      const remoteAddr = connection.remoteAddr.toString();
      const peer = this.discoveredPeers.get(peerId);
      if (peer) {
        peer.status = "connected";
        peer.lastStatusUpdate = Date.now();
        if (!peer.multiaddrs.includes(remoteAddr)) {
          peer.multiaddrs.push(remoteAddr);
        }
      } else {
        this.discoveredPeers.set(peerId, {
          peerId,
          multiaddrs: [remoteAddr],
          discoveredAt: Date.now(),
          source: "connection",
          status: "connected",
          lastStatusUpdate: Date.now(),
          connectionAttempts: 0
        });
      }
      this.connectedPeers.add(peerId);
      this.connectionAttempts.delete(peerId);
      this.options.onPeerConnected(peerId, connection);
      this.sendDiscoveryUpdate();
    } catch (error) {
      log2.error("❌ Error handling connection open:", error);
      this.options.onError(error, "handleConnectionOpen");
    }
  }
  handleConnectionClose(connection) {
    try {
      const peerId = connection.remotePeer.toString();
      const peer = this.discoveredPeers.get(peerId);
      if (peer) {
        peer.status = "discovered";
        peer.lastStatusUpdate = Date.now();
      }
      this.connectedPeers.delete(peerId);
      this.options.onPeerDisconnected(peerId);
      this.sendDiscoveryUpdate();
    } catch (error) {
      log2.error("❌ Error handling connection close:", error);
      this.options.onError(error, "handleConnectionClose");
    }
  }
  hasPublicAddress(multiaddrs) {
    return multiaddrs.some((addr) => {
      return !addr.includes("127.0.0.1") && !addr.includes("localhost") && !addr.includes("192.168.") && !addr.includes("10.");
    });
  }
  shouldConnectToPeer(peerId) {
    if (this.libp2p.peerId.toString() === peerId) {
      return false;
    }
    if (this.connectionManager?.isPeerBlocked(peerId)) {
      log2.debug(`Peer ${peerId} is blocked`);
      return false;
    }
    if (this.connectedPeers.has(peerId)) {
      log2.debug(`Already connected to peer ${peerId}`);
      return false;
    }
    const attempts = this.connectionAttempts.get(peerId) || 0;
    if (attempts >= this.options.maxConnectionAttempts) {
      log2.debug(`Max connection attempts reached for peer ${peerId}`);
      return false;
    }
    if (this.connectionManager && !this.connectionManager.canAcceptNewConnection()) {
      log2.debug(`Connection limit reached, skipping peer ${peerId}`);
      return false;
    }
    return true;
  }
  async scheduleConnection(peerId, multiaddrs) {
    try {
      log2(`🔄 Scheduling connection to peer: ${peerId}`);
      const currentAttempts = this.connectionAttempts.get(peerId) || 0;
      this.connectionAttempts.set(peerId, currentAttempts + 1);
      const peer = this.discoveredPeers.get(peerId);
      if (peer) {
        peer.status = "connecting";
        peer.lastAttempt = Date.now();
        peer.lastStatusUpdate = Date.now();
        peer.connectionAttempts = currentAttempts + 1;
      }
      this.sendDiscoveryUpdate();
      await this.connectToPeer(peerId, multiaddrs);
    } catch (error) {
      log2.error(`❌ Error scheduling connection to ${peerId}:`, error);
      this.options.onError(error, "scheduleConnection");
    }
  }
  async connectToPeer(peerId, multiaddrs = []) {
    try {
      log2(`🔌 Connecting to peer: ${peerId}`);
      let addresses = multiaddrs;
      if (addresses.length === 0) {
        const peerInfo = await this.findPeerInDHT(peerId);
        addresses = peerInfo?.multiaddrs || [];
      }
      if (addresses.length === 0) {
        log2.warn(`⚠️ No addresses found for peer: ${peerId}`);
        this.updatePeerStatus(peerId, "failed", "no_addresses");
        return false;
      }
      const supportedAddresses = this.filterBrowserSupportedAddresses(addresses);
      if (supportedAddresses.length === 0) {
        log2.warn(`⚠️ No browser-supported addresses for peer: ${peerId}`);
        this.updatePeerStatus(peerId, "failed", "unsupported_protocols");
        return false;
      }
      log2(`📡 Supported addresses for ${peerId}:`, supportedAddresses);
      for (const addr of supportedAddresses) {
        try {
          log2(`🔗 Attempting connection via: ${addr}`);
          const fullAddr = this.createFullMultiaddr(addr, peerId);
          if (!fullAddr) {
            continue;
          }
          await this.libp2p.dial(fullAddr);
          log2(`✅ Successfully connected to ${peerId} via ${addr}`);
          this.updatePeerStatus(peerId, "connected");
          return true;
        } catch (dialError) {
          log2.warn(`❌ Failed to connect via ${addr}:`, dialError.message);
          continue;
        }
      }
      log2.error(`💥 All connection attempts failed for ${peerId}`);
      this.updatePeerStatus(peerId, "failed", "all_attempts_failed");
      if (this.connectionManager) {
        this.connectionManager.blockPeer(peerId, 6e4);
      }
      return false;
    } catch (error) {
      log2.error(`💥 Critical error connecting to ${peerId}:`, error);
      this.updatePeerStatus(peerId, "error", error.message);
      this.options.onError(error, "connectToPeer");
      return false;
    }
  }
  filterBrowserSupportedAddresses(addresses) {
    const supported = [];
    for (const addr of addresses) {
      if (addr.includes("/wss/") || addr.includes("/ws/") || addr.includes("/webrtc/") || addr.includes("/webtransport/")) {
        supported.push(addr);
      } else {
        log2.debug(`🚫 Browser-unsupported protocol: ${addr}`);
      }
    }
    return supported;
  }
  createFullMultiaddr(addr, peerId) {
    try {
      if (addr.includes("/p2p/") || addr.includes("/ipfs/")) {
        return multiaddr(addr);
      }
      return multiaddr(addr).encapsulate(`/p2p/${peerId}`);
    } catch (error) {
      log2.error(`❌ Error creating MultiAddr for ${addr}:`, error);
      return null;
    }
  }
  async findPeerInDHT(peerId) {
    try {
      if (!this.dhtManager) {
        log2.warn("DHTManager not available for peer lookup");
        return null;
      }
      const results = await this.dhtManager.findPeer(peerId, "all");
      for (const result of results) {
        if (result.success && result.peerInfo?.addresses) {
          return {
            multiaddrs: result.peerInfo.addresses
          };
        }
      }
      return null;
    } catch (error) {
      log2.error(`❌ Error finding peer ${peerId} in DHT:`, error);
      return null;
    }
  }
  updatePeerStatus(peerId, status, reason) {
    const peer = this.discoveredPeers.get(peerId);
    if (!peer) {
      return;
    }
    peer.status = status;
    peer.lastStatusUpdate = Date.now();
    if (reason) {
      log2.debug(`Updated peer ${peerId} status to ${status}: ${reason}`);
    }
    this.sendDiscoveryUpdate();
  }
  sendDiscoveryUpdate() {
    if (!this.sendToAllUsers) {
      return;
    }
    const discoveredPeers = Array.from(this.discoveredPeers.values()).map((peer) => ({
      peerId: peer.peerId,
      source: peer.source,
      status: peer.status,
      discoveredAt: peer.discoveredAt,
      lastStatusUpdate: peer.lastStatusUpdate,
      lastAttempt: peer.lastAttempt,
      multiaddrs: peer.multiaddrs.slice(0, 3),
      connectionAttempts: peer.connectionAttempts
    }));
    const stats = {
      totalDiscovered: discoveredPeers.length,
      connected: discoveredPeers.filter((p2) => p2.status === "connected").length,
      connecting: discoveredPeers.filter((p2) => p2.status === "connecting").length,
      failed: discoveredPeers.filter((p2) => p2.status === "failed" || p2.status === "error").length,
      autoConnect: this.options.autoConnect
    };
    this.sendToAllUsers({
      type: "peer_discovery_update",
      discoveredPeers,
      ...stats,
      timestamp: Date.now()
    });
  }
  async performActiveDiscovery() {
    try {
      log2("🎯 Performing active peer discovery...");
      if (this.dhtManager) {
        const closestPeers = await this.findClosestPeers();
        for (const peerId of closestPeers) {
          if (this.shouldConnectToPeer(peerId)) {
            log2(`🎯 Actively discovered peer via DHT: ${peerId}`);
            await this.scheduleConnection(peerId, []);
          }
        }
      }
      await this.retryFailedConnections();
    } catch (error) {
      log2.error("❌ Error performing active discovery:", error);
      this.options.onError(error, "performActiveDiscovery");
    }
  }
  async findClosestPeers(count = 10) {
    try {
      if (!this.dhtManager) {
        log2.warn("DHTManager not available for peer discovery");
        return [];
      }
      const peers = /* @__PURE__ */ new Set();
      const dhtTypes = ["lan", "amino", "universe"];
      for (const dhtType of dhtTypes) {
        try {
          const dhtInstance = this.getDHTInstance(dhtType);
          if (!dhtInstance) {
            continue;
          }
          const closest = await this.getClosestPeersFromDHT(dhtInstance, count);
          closest.forEach((peer) => peers.add(peer));
        } catch (error) {
          log2.debug(`Error searching in ${dhtType} DHT:`, error.message);
        }
      }
      return Array.from(peers).slice(0, count);
    } catch (error) {
      log2.error("❌ Error finding closest peers:", error);
      return [];
    }
  }
  getDHTInstance(dhtType) {
    if (!this.dhtManager) return null;
    switch (dhtType) {
      case "lan":
        return this.dhtManager.lanDHT;
      case "amino":
        return this.dhtManager.aminoDHT;
      case "universe":
        return this.dhtManager.universeDHT;
      default:
        return null;
    }
  }
  async getClosestPeersFromDHT(dhtInstance, count) {
    try {
      if (!dhtInstance || typeof dhtInstance.getClosestPeers !== "function") {
        return [];
      }
      const ourPeerId = this.libp2p.peerId;
      const peers = [];
      for await (const event of dhtInstance.getClosestPeers(ourPeerId.toBytes())) {
        if (event.name === "FINAL_PEER") {
          const peerId = event.peer.id.toString();
          peers.push(peerId);
          if (peers.length >= count) {
            break;
          }
        }
      }
      return peers;
    } catch (error) {
      log2.debug("Error getting closest peers from DHT:", error.message);
      return [];
    }
  }
  async retryFailedConnections() {
    const failedPeers = Array.from(this.discoveredPeers.entries()).filter(([_, peer]) => peer.status === "failed" || peer.status === "error").filter(([peerId, _]) => {
      const attempts = this.connectionAttempts.get(peerId) || 0;
      return attempts < this.options.maxConnectionAttempts;
    });
    log2.debug(`🔄 Retrying connections for ${failedPeers.length} peers`);
    for (const [peerId, peer] of failedPeers) {
      await this.delay(5e3);
      log2(`🔄 Retrying connection to ${peerId}`);
      await this.connectToPeer(peerId, peer.multiaddrs);
    }
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  startAutoDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = void 0;
    }
    setTimeout(() => {
      this.performActiveDiscovery();
    }, 2e3);
    this.discoveryInterval = setInterval(async () => {
      await this.performActiveDiscovery();
    }, this.options.discoveryInterval);
    log2("🔍 Auto-discovery started");
  }
  stopAutoDiscovery() {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
      this.discoveryInterval = void 0;
    }
    log2("🛑 Auto-discovery stopped");
  }
  getDiscoveryStats() {
    const discoveredPeers = Array.from(this.discoveredPeers.values());
    return {
      totalDiscovered: discoveredPeers.length,
      connected: discoveredPeers.filter((p2) => p2.status === "connected").length,
      connecting: discoveredPeers.filter((p2) => p2.status === "connecting").length,
      discovered: discoveredPeers.filter((p2) => p2.status === "discovered").length,
      failed: discoveredPeers.filter((p2) => p2.status === "failed" || p2.status === "error").length,
      autoConnect: this.options.autoConnect,
      discoverySources: {
        mdns: discoveredPeers.filter((p2) => p2.source === "mdns").length,
        dht: discoveredPeers.filter((p2) => p2.source.startsWith("dht")).length
      },
      connectedPeers: Array.from(this.connectedPeers)
    };
  }
  getDiscoveredPeers() {
    return Array.from(this.discoveredPeers.values());
  }
  async connectToSpecificPeer(peerId) {
    if (!peerId) {
      throw new Error("Peer ID is required");
    }
    log2(`🔧 Manual connection to peer: ${peerId}`);
    this.connectionAttempts.set(peerId, 0);
    return await this.connectToPeer(peerId, []);
  }
  clearDiscoveryList() {
    const count = this.discoveredPeers.size;
    this.discoveredPeers.clear();
    this.connectionAttempts.clear();
    this.connectedPeers.clear();
    log2(`🧹 Cleared discovery list (${count} peers)`);
    this.sendDiscoveryUpdate();
    return count;
  }
  stop() {
    this.stopAutoDiscovery();
    this.clearDiscoveryList();
    log2("🛑 Peer Discovery Browser stopped");
  }
};
export {
  PeerDiscoveryBrowser
};
//# sourceMappingURL=peer-discovery-browser.js.map
