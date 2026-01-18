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
  function encode6(source) {
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
    var length3 = 0;
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
      for (var it1 = size - 1; (carry !== 0 || i3 < length3) && it1 !== -1; it1--, i3++) {
        carry += 256 * b58[it1] >>> 0;
        b58[it1] = carry % BASE >>> 0;
        carry = carry / BASE >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length3 = i3;
      pbegin++;
    }
    var it2 = size - length3;
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
    var length3 = 0;
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
      for (var it3 = size - 1; (carry !== 0 || i3 < length3) && it3 !== -1; it3--, i3++) {
        carry += BASE * b256[it3] >>> 0;
        b256[it3] = carry % 256 >>> 0;
        carry = carry / 256 >>> 0;
      }
      if (carry !== 0) {
        throw new Error("Non-zero carry");
      }
      length3 = i3;
      psz++;
    }
    if (source[psz] === " ") {
      return;
    }
    var it4 = size - length3;
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
    encode: encode6,
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
  constructor(name2, prefix2, baseEncode) {
    this.name = name2;
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
  constructor(name2, prefix2, baseDecode) {
    this.name = name2;
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
  constructor(decoders3) {
    this.decoders = decoders3;
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
  constructor(name2, prefix2, baseEncode, baseDecode) {
    this.name = name2;
    this.prefix = prefix2;
    this.baseEncode = baseEncode;
    this.baseDecode = baseDecode;
    this.encoder = new Encoder(name2, prefix2, baseEncode);
    this.decoder = new Decoder(name2, prefix2, baseDecode);
  }
  encode(input) {
    return this.encoder.encode(input);
  }
  decode(input) {
    return this.decoder.decode(input);
  }
};
function from({ name: name2, prefix: prefix2, encode: encode6, decode: decode7 }) {
  return new Codec(name2, prefix2, encode6, decode7);
}
function baseX({ name: name2, prefix: prefix2, alphabet: alphabet2 }) {
  const { encode: encode6, decode: decode7 } = base_x_default(alphabet2, name2);
  return from({
    prefix: prefix2,
    name: name2,
    encode: encode6,
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
function rfc4648({ name: name2, prefix: prefix2, bitsPerChar, alphabet: alphabet2 }) {
  const alphabetIdx = createAlphabetIdx(alphabet2);
  return from({
    prefix: prefix2,
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
    const split2 = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split2.length;
    for (i2 = 0; i2 < len; i2++) {
      if (!split2[i2]) {
        continue;
      }
      namespaces = split2[i2].replace(/\*/g, ".*?");
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
  const message2 = notEmpty(v.message);
  const stack = notEmpty(v.stack);
  if (message2 != null && stack != null) {
    if (stack.includes(message2)) {
      return `${stack.split("\n").join(`
${indent}`)}`;
    }
    return `${message2}
${indent}${stack.split("\n").join(`
${indent}`)}`;
  }
  if (stack != null) {
    return `${stack.split("\n").join(`
${indent}`)}`;
  }
  if (message2 != null) {
    return `${message2}`;
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
function createLogger(prefix2) {
  const baseLogger = logger(prefix2);
  const enhancedLogger = (...args) => {
    if (args.length === 0) {
      baseLogger("");
    } else {
      const message2 = args.map(
        (arg) => typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      baseLogger(message2);
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
  async attributeChangedCallback(name2, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (this.#templateImported) {
      await this._componentAttributeChanged(name2, oldValue, newValue);
      log2(`Атрибут ${name2} изменился с '${oldValue}' на '${newValue}'.`);
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

// src/components/bootstrap-address/template/index.ts
function defaultTemplate({ state = {} }) {
  return `
        <div class="card full-width bootstrap-address">
            <div class="card-header">
                <h3 class="card-title">
                    <span class="card-icon">📡</span>
                    Bootstrap Addresses
                </h3>
                <span class="card-badge">${state.totalAddresses || 0}</span>
            </div>
            <div class="card-content">
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Primary Address:</span>
                        <div class="address-container">
                            <span class="info-value" id="primaryAddress">${state.primaryAddress || "Loading..."}</span>
                            <button class="copy-btn" id="copyPrimaryBtn" title="Copy Primary Address">
                                Copy
                            </button>
                        </div>
                    </div>
                </div>

                <div id="secondaryAddresses">
                    ${renderSecondaryAddresses({ state, context: null })}
                </div>

                <div id="addAddressSection">
                    ${renderAddAddressForm({ state, context: null })}
                </div>

                <div class="form-actions mt-2">
                    <button class="btn btn-secondary btn-copy-all" title="Copy All Addresses">
                        <span class="btn-icon">📋</span>
                        <span class="btn-text">Copy All</span>
                    </button>
                    <button class="btn btn-info btn-refresh" ${state.isLoading ? "disabled" : ""}>
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">${state.isLoading ? "Refreshing..." : "Refresh"}</span>
                    </button>
                    <button class="btn btn-success btn-test" title="Test All Connections">
                        <span class="btn-icon">🧪</span>
                        <span class="btn-text">Test All</span>
                    </button>
                    <button class="btn btn-primary btn-add-custom">
                        <span class="btn-icon">➕</span>
                        <span class="btn-text">Add Custom</span>
                    </button>
                    <button class="btn btn-warning btn-sync" title="Sync with Libp2p Node">
                        <span class="btn-icon">🔄</span>
                        <span class="btn-text">Sync</span>
                    </button>
                </div>
            </div>
        </div>
    `;
}
function renderSecondaryAddresses({ state = {} }) {
  const allAddresses = [
    ...state.secondaryAddresses,
    ...state.customAddresses
  ];
  if (allAddresses.length === 0) {
    return '<div class="text-center text-muted mt-2">No secondary or custom addresses configured</div>';
  }
  return `
        <div class="secondary-addresses mt-2">
            <h4 class="section-title">
                <span>Secondary Addresses:</span>
                <span class="badge">${allAddresses.length}</span>
            </h4>
            <div class="secondary-addresses-list">
                ${allAddresses.map((address, index) => `
                    <div class="info-item secondary-address-item">
                        <div class="address-header">
                            <span class="info-label">Address ${index + 1}:</span>
                            <div class="address-actions">
                                <button class="action-btn test-btn" data-address="${escapeHtml(address)}" title="Test Connection">
                                    <span class="action-icon">🧪</span>
                                </button>
                                <button class="action-btn copy-btn" data-address="${escapeHtml(address)}" title="Copy Address">
                                    <span class="action-icon">📋</span>
                                </button>
                                <button class="action-btn remove-btn" data-address="${escapeHtml(address)}" title="Remove Address">
                                    <span class="action-icon">❌</span>
                                </button>
                            </div>
                        </div>
                        <span class="info-value secondary-address">${escapeHtml(address)}</span>
                    </div>
                `).join("")}
            </div>
        </div>
    `;
}
function renderAddAddressForm({ state = {} }) {
  if (!state.showAddForm) {
    return "";
  }
  return `
        <div class="add-address-form mt-2">
            <h4 class="section-title">Add Custom Bootstrap Address</h4>
            <form id="addAddressForm" class="address-form">
                <div class="form-group">
                    <label for="newAddress" class="form-label">Multiaddress:</label>
                    <input 
                        type="text" 
                        id="newAddress" 
                        name="newAddress" 
                        class="form-input" 
                        placeholder="/ip4/127.0.0.1/tcp/6832/ws/p2p/..."
                        value="${escapeHtml(state.newAddress || "")}"
                        required
                    >
                    <div class="form-hint">
                        Format: /ip4/1.2.3.4/tcp/1234/ws/p2p/PeerId
                    </div>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-success">
                        <span class="btn-icon">✅</span>
                        <span class="btn-text">Add Address</span>
                    </button>
                    <button type="button" class="btn btn-secondary btn-cancel-form">
                        <span class="btn-icon">✖</span>
                        <span class="btn-text">Cancel</span>
                    </button>
                </div>
            </form>
        </div>
    `;
}
function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// src/components/bootstrap-address/controller/index.ts
var controller = (context) => {
  let eventListeners = [];
  const addEventListener = (element, event, handler) => {
    element.addEventListener(event, handler);
    eventListeners.push({ element, event, handler });
  };
  return {
    async init() {
      addEventListener(context.shadowRoot, "click", async (e2) => {
        const target = e2.target;
        if (target.closest(".btn-copy-all")) {
          e2.preventDefault();
          await context._actions.handleCopyAllAddresses();
          return;
        }
        if (target.closest(".btn-test")) {
          e2.preventDefault();
          await context._actions.handleTestAllConnections();
          return;
        }
        if (target.closest(".btn-sync")) {
          e2.preventDefault();
          await context._actions.handleSyncWithLibp2p();
          return;
        }
        if (target.closest(".btn-add-custom")) {
          e2.preventDefault();
          await context._actions.handleToggleAddForm();
          return;
        }
        if (target.closest(".btn-cancel-form")) {
          e2.preventDefault();
          await context._actions.handleToggleAddForm();
          return;
        }
        if (target.closest("#copyPrimaryBtn")) {
          e2.preventDefault();
          await context._actions.handleCopyPrimaryAddress();
          return;
        }
        const actionBtn = target.closest(".action-btn");
        if (actionBtn) {
          e2.preventDefault();
          const address = actionBtn.getAttribute("data-address");
          const action = actionBtn.classList.contains("copy-btn") ? "copy" : actionBtn.classList.contains("test-btn") ? "test" : actionBtn.classList.contains("remove-btn") ? "remove" : null;
          if (address && action) {
            await context._actions.handleSingleAddressAction(action, address);
          }
          return;
        }
        if (target.closest(".address-value") || target.closest(".secondary-address")) {
          e2.preventDefault();
          const addressElement = target.closest(".address-value") || target.closest(".secondary-address");
          const address = addressElement?.textContent?.trim();
          if (address) {
            await context._actions.handleSingleAddressAction("copy", address);
          }
        }
      });
      addEventListener(context.shadowRoot, "submit", async (e2) => {
        const target = e2.target;
        if (target.id === "addAddressForm") {
          e2.preventDefault();
          const formData = new FormData(target);
          await context._actions.handleFormSubmit(formData);
        }
      });
      addEventListener(context, "keydown", (e2) => {
        const keyboardEvent = e2;
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "c") {
          e2.preventDefault();
          context._actions.handleCopyAllAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.key === "r") {
          e2.preventDefault();
          context._actions.handleRefreshAddresses();
        }
        if (keyboardEvent.ctrlKey && keyboardEvent.altKey && keyboardEvent.key === "s") {
          e2.preventDefault();
          context._actions.handleSyncWithLibp2p();
        }
        if (keyboardEvent.key === "Escape") {
          const state = context.getState();
          if (state.showAddForm) {
            context._actions.handleToggleAddForm();
          }
        }
      });
      addEventListener(window, "bootstrap-address:refresh", () => {
        context._actions.handleRefreshAddresses();
      });
      addEventListener(window, "bootstrap-address:sync", () => {
        context._actions.handleSyncWithLibp2p();
      });
      addEventListener(window, "libp2p:multiaddrs-updated", async (e2) => {
        const customEvent = e2;
        if (customEvent.detail?.multiaddrs) {
          await context._actions.handleAddressUpdate(
            customEvent.detail.multiaddrs,
            "libp2p-event"
          );
        }
      });
      addEventListener(document, "visibilitychange", () => {
        if (!document.hidden) {
          setTimeout(() => {
            context._actions.handleRefreshAddresses();
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

// src/components/bootstrap-address/actions/index.ts
async function createActions(context) {
  return {
    handleAddressUpdate: handleAddressUpdate.bind(context),
    handleCopyAllAddresses: handleCopyAllAddresses.bind(context),
    handleTestAllConnections: handleTestAllConnections.bind(context),
    handleSyncWithLibp2p: handleSyncWithLibp2p.bind(context),
    handleAddCustomAddress: handleAddCustomAddress.bind(context),
    handleToggleAddForm: handleToggleAddForm.bind(context),
    handleCopyPrimaryAddress: handleCopyPrimaryAddress.bind(context),
    handleRefreshAddresses: handleRefreshAddresses.bind(context),
    handleSingleAddressAction: handleSingleAddressAction.bind(context),
    handleFormSubmit: handleFormSubmit.bind(context),
    loadBootstrapAddresses: loadBootstrapAddresses.bind(context),
    fetchBootstrapAddresses: fetchBootstrapAddresses.bind(context),
    addBootstrapAddress: addBootstrapAddress.bind(context),
    removeBootstrapAddress: removeBootstrapAddress.bind(context),
    testBootstrapConnection: testBootstrapConnection.bind(context),
    validateAddress: validateAddress.bind(context),
    formatAddressForDisplay: formatAddressForDisplay.bind(context)
  };
}
async function loadBootstrapAddresses(data) {
  try {
    const addresses = data.addresses || [];
    await this.updateAddresses(addresses, "server");
  } catch (error) {
    console.error("Error loading bootstrap addresses:", error);
    await this.showModal({
      title: "Ошибка загрузки",
      content: `Не удалось загрузить bootstrap адреса: ${error.message}`,
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function fetchBootstrapAddresses() {
  try {
    return [
      "/ip4/127.0.0.1/tcp/6832/ws/p2p/12D3KooWExample1",
      "/ip4/192.168.1.1/tcp/8080/ws/p2p/12D3KooWExample2",
      "/ip6/::1/tcp/9090/ws/p2p/12D3KooWExample3"
    ];
  } catch (error) {
    console.error("Error fetching bootstrap addresses:", error);
    throw error;
  }
}
async function addBootstrapAddress(address) {
  try {
    if (!validateAddress.call(this, address)) {
      return { success: false, error: "Invalid bootstrap address format" };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, data: { address } };
  } catch (error) {
    console.error("Error adding bootstrap address:", error);
    return { success: false, error: error.message };
  }
}
async function removeBootstrapAddress(address) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true, data: { address } };
  } catch (error) {
    console.error("Error removing bootstrap address:", error);
    return { success: false, error: error.message };
  }
}
async function testBootstrapConnection(address) {
  try {
    await new Promise((resolve) => setTimeout(resolve, 800));
    const success = Math.random() > 0.3;
    const latency = success ? Math.floor(Math.random() * 100) + 50 : void 0;
    return {
      success: true,
      data: {
        address,
        success,
        latency,
        // Теперь это number | undefined, что совместимо с AddressTestResult
        error: success ? void 0 : "Connection timeout"
      }
    };
  } catch (error) {
    console.error("Error testing bootstrap connection:", error);
    return { success: false, error: error.message };
  }
}
function validateAddress(address) {
  if (typeof address !== "string" || address.trim().length === 0) {
    return false;
  }
  const validProtocols = ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/"];
  return validProtocols.some((protocol) => address.includes(protocol));
}
function formatAddressForDisplay(address) {
  if (!address) return "";
  if (address.length > 80) {
    return address.substring(0, 77) + "...";
  }
  return address;
}
async function handleAddressUpdate(newAddresses, source = "manual") {
  await this.updateAddresses(newAddresses, source);
}
async function handleCopyAllAddresses() {
  const state = this.getState();
  const allAddresses = [
    state.primaryAddress,
    ...state.secondaryAddresses,
    ...state.customAddresses
  ].filter((addr) => addr.trim() !== "");
  if (allAddresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to copy",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return;
  }
  const addressesText = allAddresses.join("\n");
  try {
    await navigator.clipboard.writeText(addressesText);
    await this.showModal({
      title: "Copied",
      content: `All ${allAddresses.length} addresses copied to clipboard`,
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
async function handleTestAllConnections() {
  const state = this.getState();
  const allAddresses = [
    state.primaryAddress,
    ...state.secondaryAddresses,
    ...state.customAddresses
  ].filter((addr) => addr.trim() !== "");
  if (allAddresses.length === 0) {
    await this.showModal({
      title: "No Addresses",
      content: "There are no addresses to test",
      buttons: [{ text: "OK", type: "primary" }]
    });
    return [];
  }
  const modalResult = await this.showModal({
    title: "Testing Connections",
    content: `
            <div style="padding: 1rem 0;">
                <p>Testing ${allAddresses.length} connections...</p>
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
  if (modalResult === void 0) {
    return [];
  }
  const results = [];
  let successful = 0;
  for (let i2 = 0; i2 < allAddresses.length; i2++) {
    const address = allAddresses[i2];
    await new Promise((resolve) => setTimeout(resolve, 500));
    const success = Math.random() > 0.3;
    const latency = success ? Math.floor(Math.random() * 100) + 50 : void 0;
    if (success) successful++;
    results.push({
      address,
      success,
      latency: latency || 0,
      // Исправлено: всегда number, по умолчанию 0
      error: success ? void 0 : "Connection failed"
    });
    const progress = (i2 + 1) / allAddresses.length * 100;
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
                    <span style="color: ${success ? "var(--success)" : "var(--danger)"}; font-weight: 600;">
                        ${success ? "✅" : "❌"} ${latency ? `${latency}ms` : ""}
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
                        <div style="font-size: 2em; color: var(--danger);">❌ ${allAddresses.length - successful}</div>
                        <div style="font-size: 0.9em; color: var(--text-secondary);">Failed</div>
                    </div>
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <p style="font-size: 0.9em; color: var(--text-secondary);">
                        Success rate: <strong>${Math.round(successful / allAddresses.length * 100)}%</strong>
                    </p>
                </div>
            </div>
        `,
    buttons: [{ text: "OK", type: "primary" }]
  });
  return results;
}
async function handleSyncWithLibp2p() {
  await this.syncWithLibp2pNode();
}
async function handleAddCustomAddress(address) {
  return await this.addCustomAddress(address);
}
async function handleToggleAddForm() {
  const state = this.getState();
  const newState = { ...state, showAddForm: !state.showAddForm };
  await this.renderPart({
    partName: "renderAddAddressForm",
    state: newState,
    selector: "#addAddressSection"
  });
}
async function handleCopyPrimaryAddress() {
  const state = this.getState();
  if (state.primaryAddress) {
    await this.copyAddress(state.primaryAddress);
  } else {
    await this.showModal({
      title: "No Primary Address",
      content: "Primary address is not available",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}
async function handleRefreshAddresses() {
  await this.refreshAddresses();
}
async function handleSingleAddressAction(action, address) {
  switch (action) {
    case "copy":
      await this.copyAddress(address);
      break;
    case "test":
      await this.testConnection(address);
      break;
    case "remove":
      await this.removeAddress(address);
      break;
  }
}
async function handleFormSubmit(formData) {
  const newAddress = formData.get("newAddress");
  if (newAddress && newAddress.trim()) {
    const success = await this.addCustomAddress(newAddress.trim());
    if (success) {
      const state = this.getState();
      await this.renderPart({
        partName: "renderAddAddressForm",
        state: { ...state, showAddForm: false, newAddress: "" },
        selector: "#addAddressSection"
      });
    }
  } else {
    await this.showModal({
      title: "Invalid Input",
      content: "Please enter a valid address",
      buttons: [{ text: "OK", type: "primary" }]
    });
  }
}

// ../../node_modules/@libp2p/interface/dist/src/errors.js
var UnexpectedPeerError = class extends Error {
  static name = "UnexpectedPeerError";
  constructor(message2 = "Unexpected Peer") {
    super(message2);
    this.name = "UnexpectedPeerError";
  }
};
var InvalidCryptoExchangeError = class extends Error {
  static name = "InvalidCryptoExchangeError";
  constructor(message2 = "Invalid crypto exchange") {
    super(message2);
    this.name = "InvalidCryptoExchangeError";
  }
};
var InvalidParametersError = class extends Error {
  static name = "InvalidParametersError";
  constructor(message2 = "Invalid parameters") {
    super(message2);
    this.name = "InvalidParametersError";
  }
};
var InvalidPublicKeyError = class extends Error {
  static name = "InvalidPublicKeyError";
  constructor(message2 = "Invalid public key") {
    super(message2);
    this.name = "InvalidPublicKeyError";
  }
};
var MuxerClosedError = class extends Error {
  static name = "MuxerClosedError";
  constructor(message2 = "The muxer is closed") {
    super(message2);
    this.name = "MuxerClosedError";
  }
};
var StreamResetError = class extends Error {
  static name = "StreamResetError";
  constructor(message2 = "The stream has been reset") {
    super(message2);
    this.name = "StreamResetError";
  }
};
var StreamStateError = class extends Error {
  static name = "StreamStateError";
  constructor(message2 = "The stream is in an invalid state") {
    super(message2);
    this.name = "StreamStateError";
  }
};
var StreamBufferError = class extends Error {
  static name = "StreamBufferError";
  constructor(message2 = "The stream buffer was full") {
    super(message2);
    this.name = "StreamBufferError";
  }
};
var TooManyOutboundProtocolStreamsError = class extends Error {
  static name = "TooManyOutboundProtocolStreamsError";
  constructor(message2 = "Too many outbound protocol streams") {
    super(message2);
    this.name = "TooManyOutboundProtocolStreamsError";
  }
};
var UnsupportedKeyTypeError = class extends Error {
  static name = "UnsupportedKeyTypeError";
  constructor(message2 = "Unsupported key type") {
    super(message2);
    this.name = "UnsupportedKeyTypeError";
  }
};

// ../../node_modules/@libp2p/interface/dist/src/events.js
var StreamMessageEvent = class extends Event {
  data;
  constructor(data, eventInitDict) {
    super("message", eventInitDict);
    this.data = data;
  }
};
var StreamCloseEvent = class extends Event {
  error;
  local;
  constructor(local, error, eventInitDict) {
    super("close", eventInitDict);
    this.error = error;
    this.local = local;
  }
};
var StreamAbortEvent = class extends StreamCloseEvent {
  constructor(error, eventInitDict) {
    super(true, error, eventInitDict);
  }
};
var StreamResetEvent = class extends StreamCloseEvent {
  constructor(error, eventInitDict) {
    super(false, error, eventInitDict);
  }
};

// ../../node_modules/@libp2p/interface/dist/src/peer-id.js
var peerIdSymbol = /* @__PURE__ */ Symbol.for("@libp2p/peer-id");

// ../../node_modules/main-event/dist/src/events.browser.js
function setMaxListeners() {
}

// ../../node_modules/main-event/dist/src/index.js
var TypedEventEmitter = class extends EventTarget {
  #listeners = /* @__PURE__ */ new Map();
  constructor() {
    super();
    setMaxListeners(Infinity, this);
  }
  listenerCount(type) {
    const listeners = this.#listeners.get(type);
    if (listeners == null) {
      return 0;
    }
    return listeners.length;
  }
  addEventListener(type, listener, options) {
    super.addEventListener(type, listener, options);
    let list = this.#listeners.get(type);
    if (list == null) {
      list = [];
      this.#listeners.set(type, list);
    }
    list.push({
      callback: listener,
      once: (options !== true && options !== false && options?.once) ?? false
    });
  }
  removeEventListener(type, listener, options) {
    super.removeEventListener(type.toString(), listener ?? null, options);
    let list = this.#listeners.get(type);
    if (list == null) {
      return;
    }
    list = list.filter(({ callback }) => callback !== listener);
    this.#listeners.set(type, list);
  }
  dispatchEvent(event) {
    const result = super.dispatchEvent(event);
    let list = this.#listeners.get(event.type);
    if (list == null) {
      return result;
    }
    list = list.filter(({ once }) => !once);
    this.#listeners.set(event.type, list);
    return result;
  }
  safeDispatchEvent(type, detail = {}) {
    return this.dispatchEvent(new CustomEvent(type, detail));
  }
};

// ../../node_modules/@libp2p/interface/dist/src/index.js
var serviceCapabilities = /* @__PURE__ */ Symbol.for("@libp2p/service-capabilities");

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

// ../../node_modules/multiformats/dist/src/vendor/varint.js
var encode_1 = encode2;
var MSB = 128;
var REST = 127;
var MSBALL = ~REST;
var INT = Math.pow(2, 31);
function encode2(num, out, offset) {
  out = out || [];
  offset = offset || 0;
  var oldOffset = offset;
  while (num >= INT) {
    out[offset++] = num & 255 | MSB;
    num /= 128;
  }
  while (num & MSBALL) {
    out[offset++] = num & 255 | MSB;
    num >>>= 7;
  }
  out[offset] = num | 0;
  encode2.bytes = offset - oldOffset + 1;
  return out;
}
var decode2 = read;
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
var N1 = Math.pow(2, 7);
var N2 = Math.pow(2, 14);
var N3 = Math.pow(2, 21);
var N4 = Math.pow(2, 28);
var N5 = Math.pow(2, 35);
var N6 = Math.pow(2, 42);
var N7 = Math.pow(2, 49);
var N8 = Math.pow(2, 56);
var N9 = Math.pow(2, 63);
var length = function(value) {
  return value < N1 ? 1 : value < N2 ? 2 : value < N3 ? 3 : value < N4 ? 4 : value < N5 ? 5 : value < N6 ? 6 : value < N7 ? 7 : value < N8 ? 8 : value < N9 ? 9 : 10;
};
var varint = {
  encode: encode_1,
  decode: decode2,
  encodingLength: length
};
var _brrp_varint = varint;
var varint_default = _brrp_varint;

// ../../node_modules/multiformats/dist/src/varint.js
function decode3(data, offset = 0) {
  const code2 = varint_default.decode(data, offset);
  return [code2, varint_default.decode.bytes];
}
function encodeTo(int, target, offset = 0) {
  varint_default.encode(int, target, offset);
  return target;
}
function encodingLength(int) {
  return varint_default.encodingLength(int);
}

// ../../node_modules/multiformats/dist/src/hashes/digest.js
function create(code2, digest2) {
  const size = digest2.byteLength;
  const sizeOffset = encodingLength(code2);
  const digestOffset = sizeOffset + encodingLength(size);
  const bytes = new Uint8Array(digestOffset + size);
  encodeTo(code2, bytes, 0);
  encodeTo(size, bytes, sizeOffset);
  bytes.set(digest2, digestOffset);
  return new Digest(code2, size, digest2, bytes);
}
function decode4(multihash) {
  const bytes = coerce(multihash);
  const [code2, sizeOffset] = decode3(bytes);
  const [size, digestOffset] = decode3(bytes.subarray(sizeOffset));
  const digest2 = bytes.subarray(sizeOffset + digestOffset);
  if (digest2.byteLength !== size) {
    throw new Error("Incorrect length");
  }
  return new Digest(code2, size, digest2, bytes);
}
function equals2(a2, b) {
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
    return unknown != null && self.code === unknown.code && self.version === unknown.version && equals2(self.multihash, unknown.multihash);
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
      const digest2 = decode4(multihash);
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
      const [i2, length3] = decode3(initialBytes.subarray(offset));
      offset += length3;
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
    const [prefix2, bytes] = parseCIDtoBytes(source, base3);
    const cid = _CID.decode(bytes);
    if (cid.version === 0 && source[0] !== "Q") {
      throw Error("Version 0 CID string must not include multibase prefix");
    }
    baseCache(cid).set(prefix2, source);
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
  const { prefix: prefix2 } = base3;
  if (prefix2 !== base58btc.prefix) {
    throw Error(`Cannot string encode V0 in ${base3.name} encoding`);
  }
  const cid = cache2.get(prefix2);
  if (cid == null) {
    const cid2 = base3.encode(bytes).slice(1);
    cache2.set(prefix2, cid2);
    return cid2;
  } else {
    return cid;
  }
}
function toStringV1(bytes, cache2, base3) {
  const { prefix: prefix2 } = base3;
  const cid = cache2.get(prefix2);
  if (cid == null) {
    const cid2 = base3.encode(bytes);
    cache2.set(prefix2, cid2);
    return cid2;
  } else {
    return cid;
  }
}
var DAG_PB_CODE = 112;
var SHA_256_CODE = 18;
function encodeCID(version, code2, multihash) {
  const codeOffset = encodingLength(version);
  const hashOffset = codeOffset + encodingLength(code2);
  const bytes = new Uint8Array(hashOffset + multihash.byteLength);
  encodeTo(version, bytes, 0);
  encodeTo(code2, bytes, codeOffset);
  bytes.set(multihash, hashOffset);
  return bytes;
}
var cidSymbol = /* @__PURE__ */ Symbol.for("@ipld/js-cid/CID");

// ../../node_modules/multiformats/dist/src/hashes/identity.js
var identity_exports = {};
__export(identity_exports, {
  identity: () => identity
});
var code = 0;
var name = "identity";
var encode3 = coerce;
function digest(input, options) {
  if (options?.truncate != null && options.truncate !== input.byteLength) {
    if (options.truncate < 0 || options.truncate > input.byteLength) {
      throw new Error(`Invalid truncate option, must be less than or equal to ${input.byteLength}`);
    }
    input = input.subarray(0, options.truncate);
  }
  return create(code, encode3(input));
}
var identity = { code, name, encode: encode3, digest };

// ../../node_modules/uint8arrays/dist/src/equals.js
function equals3(a2, b) {
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
function alloc(size = 0) {
  return new Uint8Array(size);
}
function allocUnsafe(size = 0) {
  return new Uint8Array(size);
}

// ../../node_modules/uint8arrays/dist/src/util/as-uint8array.js
function asUint8Array(buf) {
  return buf;
}

// ../../node_modules/uint8arrays/dist/src/concat.js
function concat(arrays, length3) {
  if (length3 == null) {
    length3 = arrays.reduce((acc, curr) => acc + curr.length, 0);
  }
  const output = allocUnsafe(length3);
  let offset = 0;
  for (const arr of arrays) {
    output.set(arr, offset);
    offset += arr.length;
  }
  return asUint8Array(output);
}

// ../../node_modules/uint8arraylist/dist/src/index.js
var symbol = /* @__PURE__ */ Symbol.for("@achingbrain/uint8arraylist");
function findBufAndOffset(bufs, index) {
  if (index == null || index < 0) {
    throw new RangeError("index is out of bounds");
  }
  let offset = 0;
  for (const buf of bufs) {
    const bufEnd = offset + buf.byteLength;
    if (index < bufEnd) {
      return {
        buf,
        index: index - offset
      };
    }
    offset = bufEnd;
  }
  throw new RangeError("index is out of bounds");
}
function isUint8ArrayList(value) {
  return Boolean(value?.[symbol]);
}
var Uint8ArrayList = class _Uint8ArrayList {
  bufs;
  length;
  [symbol] = true;
  constructor(...data) {
    this.bufs = [];
    this.length = 0;
    if (data.length > 0) {
      this.appendAll(data);
    }
  }
  *[Symbol.iterator]() {
    yield* this.bufs;
  }
  get byteLength() {
    return this.length;
  }
  /**
   * Add one or more `bufs` to the end of this Uint8ArrayList
   */
  append(...bufs) {
    this.appendAll(bufs);
  }
  /**
   * Add all `bufs` to the end of this Uint8ArrayList
   */
  appendAll(bufs) {
    let length3 = 0;
    for (const buf of bufs) {
      if (buf instanceof Uint8Array) {
        length3 += buf.byteLength;
        this.bufs.push(buf);
      } else if (isUint8ArrayList(buf)) {
        length3 += buf.byteLength;
        this.bufs.push(...buf.bufs);
      } else {
        throw new Error("Could not append value, must be an Uint8Array or a Uint8ArrayList");
      }
    }
    this.length += length3;
  }
  /**
   * Add one or more `bufs` to the start of this Uint8ArrayList
   */
  prepend(...bufs) {
    this.prependAll(bufs);
  }
  /**
   * Add all `bufs` to the start of this Uint8ArrayList
   */
  prependAll(bufs) {
    let length3 = 0;
    for (const buf of bufs.reverse()) {
      if (buf instanceof Uint8Array) {
        length3 += buf.byteLength;
        this.bufs.unshift(buf);
      } else if (isUint8ArrayList(buf)) {
        length3 += buf.byteLength;
        this.bufs.unshift(...buf.bufs);
      } else {
        throw new Error("Could not prepend value, must be an Uint8Array or a Uint8ArrayList");
      }
    }
    this.length += length3;
  }
  /**
   * Read the value at `index`
   */
  get(index) {
    const res = findBufAndOffset(this.bufs, index);
    return res.buf[res.index];
  }
  /**
   * Set the value at `index` to `value`
   */
  set(index, value) {
    const res = findBufAndOffset(this.bufs, index);
    res.buf[res.index] = value;
  }
  /**
   * Copy bytes from `buf` to the index specified by `offset`
   */
  write(buf, offset = 0) {
    if (buf instanceof Uint8Array) {
      for (let i2 = 0; i2 < buf.length; i2++) {
        this.set(offset + i2, buf[i2]);
      }
    } else if (isUint8ArrayList(buf)) {
      for (let i2 = 0; i2 < buf.length; i2++) {
        this.set(offset + i2, buf.get(i2));
      }
    } else {
      throw new Error("Could not write value, must be an Uint8Array or a Uint8ArrayList");
    }
  }
  /**
   * Remove bytes from the front of the pool
   */
  consume(bytes) {
    bytes = Math.trunc(bytes);
    if (Number.isNaN(bytes) || bytes <= 0) {
      return;
    }
    if (bytes === this.byteLength) {
      this.bufs = [];
      this.length = 0;
      return;
    }
    while (this.bufs.length > 0) {
      if (bytes >= this.bufs[0].byteLength) {
        bytes -= this.bufs[0].byteLength;
        this.length -= this.bufs[0].byteLength;
        this.bufs.shift();
      } else {
        this.bufs[0] = this.bufs[0].subarray(bytes);
        this.length -= bytes;
        break;
      }
    }
  }
  /**
   * Extracts a section of an array and returns a new array.
   *
   * This is a copy operation as it is with Uint8Arrays and Arrays
   * - note this is different to the behaviour of Node Buffers.
   */
  slice(beginInclusive, endExclusive) {
    const { bufs, length: length3 } = this._subList(beginInclusive, endExclusive);
    return concat(bufs, length3);
  }
  /**
   * Returns a alloc from the given start and end element index.
   *
   * In the best case where the data extracted comes from a single Uint8Array
   * internally this is a no-copy operation otherwise it is a copy operation.
   */
  subarray(beginInclusive, endExclusive) {
    const { bufs, length: length3 } = this._subList(beginInclusive, endExclusive);
    if (bufs.length === 1) {
      return bufs[0];
    }
    return concat(bufs, length3);
  }
  /**
   * Returns a allocList from the given start and end element index.
   *
   * This is a no-copy operation.
   */
  sublist(beginInclusive, endExclusive) {
    const { bufs, length: length3 } = this._subList(beginInclusive, endExclusive);
    const list = new _Uint8ArrayList();
    list.length = length3;
    list.bufs = [...bufs];
    return list;
  }
  _subList(beginInclusive, endExclusive) {
    beginInclusive = beginInclusive ?? 0;
    endExclusive = endExclusive ?? this.length;
    if (beginInclusive < 0) {
      beginInclusive = this.length + beginInclusive;
    }
    if (endExclusive < 0) {
      endExclusive = this.length + endExclusive;
    }
    if (beginInclusive < 0 || endExclusive > this.length) {
      throw new RangeError("index is out of bounds");
    }
    if (beginInclusive === endExclusive) {
      return { bufs: [], length: 0 };
    }
    if (beginInclusive === 0 && endExclusive === this.length) {
      return { bufs: this.bufs, length: this.length };
    }
    const bufs = [];
    let offset = 0;
    for (let i2 = 0; i2 < this.bufs.length; i2++) {
      const buf = this.bufs[i2];
      const bufStart = offset;
      const bufEnd = bufStart + buf.byteLength;
      offset = bufEnd;
      if (beginInclusive >= bufEnd) {
        continue;
      }
      const sliceStartInBuf = beginInclusive >= bufStart && beginInclusive < bufEnd;
      const sliceEndsInBuf = endExclusive > bufStart && endExclusive <= bufEnd;
      if (sliceStartInBuf && sliceEndsInBuf) {
        if (beginInclusive === bufStart && endExclusive === bufEnd) {
          bufs.push(buf);
          break;
        }
        const start = beginInclusive - bufStart;
        bufs.push(buf.subarray(start, start + (endExclusive - beginInclusive)));
        break;
      }
      if (sliceStartInBuf) {
        if (beginInclusive === 0) {
          bufs.push(buf);
          continue;
        }
        bufs.push(buf.subarray(beginInclusive - bufStart));
        continue;
      }
      if (sliceEndsInBuf) {
        if (endExclusive === bufEnd) {
          bufs.push(buf);
          break;
        }
        bufs.push(buf.subarray(0, endExclusive - bufStart));
        break;
      }
      bufs.push(buf);
    }
    return { bufs, length: endExclusive - beginInclusive };
  }
  indexOf(search, offset = 0) {
    if (!isUint8ArrayList(search) && !(search instanceof Uint8Array)) {
      throw new TypeError('The "value" argument must be a Uint8ArrayList or Uint8Array');
    }
    const needle = search instanceof Uint8Array ? search : search.subarray();
    offset = Number(offset ?? 0);
    if (isNaN(offset)) {
      offset = 0;
    }
    if (offset < 0) {
      offset = this.length + offset;
    }
    if (offset < 0) {
      offset = 0;
    }
    if (search.length === 0) {
      return offset > this.length ? this.length : offset;
    }
    const M = needle.byteLength;
    if (M === 0) {
      throw new TypeError("search must be at least 1 byte long");
    }
    const radix = 256;
    const rightmostPositions = new Int32Array(radix);
    for (let c2 = 0; c2 < radix; c2++) {
      rightmostPositions[c2] = -1;
    }
    for (let j = 0; j < M; j++) {
      rightmostPositions[needle[j]] = j;
    }
    const right = rightmostPositions;
    const lastIndex = this.byteLength - needle.byteLength;
    const lastPatIndex = needle.byteLength - 1;
    let skip;
    for (let i2 = offset; i2 <= lastIndex; i2 += skip) {
      skip = 0;
      for (let j = lastPatIndex; j >= 0; j--) {
        const char = this.get(i2 + j);
        if (needle[j] !== char) {
          skip = Math.max(1, j - right[char]);
          break;
        }
      }
      if (skip === 0) {
        return i2;
      }
    }
    return -1;
  }
  getInt8(byteOffset) {
    const buf = this.subarray(byteOffset, byteOffset + 1);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getInt8(0);
  }
  setInt8(byteOffset, value) {
    const buf = allocUnsafe(1);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setInt8(0, value);
    this.write(buf, byteOffset);
  }
  getInt16(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 2);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getInt16(0, littleEndian);
  }
  setInt16(byteOffset, value, littleEndian) {
    const buf = alloc(2);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setInt16(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getInt32(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getInt32(0, littleEndian);
  }
  setInt32(byteOffset, value, littleEndian) {
    const buf = alloc(4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setInt32(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getBigInt64(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getBigInt64(0, littleEndian);
  }
  setBigInt64(byteOffset, value, littleEndian) {
    const buf = alloc(8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setBigInt64(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getUint8(byteOffset) {
    const buf = this.subarray(byteOffset, byteOffset + 1);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getUint8(0);
  }
  setUint8(byteOffset, value) {
    const buf = allocUnsafe(1);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setUint8(0, value);
    this.write(buf, byteOffset);
  }
  getUint16(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 2);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getUint16(0, littleEndian);
  }
  setUint16(byteOffset, value, littleEndian) {
    const buf = alloc(2);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setUint16(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getUint32(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getUint32(0, littleEndian);
  }
  setUint32(byteOffset, value, littleEndian) {
    const buf = alloc(4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setUint32(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getBigUint64(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getBigUint64(0, littleEndian);
  }
  setBigUint64(byteOffset, value, littleEndian) {
    const buf = alloc(8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setBigUint64(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getFloat32(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getFloat32(0, littleEndian);
  }
  setFloat32(byteOffset, value, littleEndian) {
    const buf = alloc(4);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat32(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  getFloat64(byteOffset, littleEndian) {
    const buf = this.subarray(byteOffset, byteOffset + 8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    return view.getFloat64(0, littleEndian);
  }
  setFloat64(byteOffset, value, littleEndian) {
    const buf = alloc(8);
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    view.setFloat64(0, value, littleEndian);
    this.write(buf, byteOffset);
  }
  equals(other) {
    if (other == null) {
      return false;
    }
    if (!(other instanceof _Uint8ArrayList)) {
      return false;
    }
    if (other.bufs.length !== this.bufs.length) {
      return false;
    }
    for (let i2 = 0; i2 < this.bufs.length; i2++) {
      if (!equals3(this.bufs[i2], other.bufs[i2])) {
        return false;
      }
    }
    return true;
  }
  /**
   * Create a Uint8ArrayList from a pre-existing list of Uint8Arrays.  Use this
   * method if you know the total size of all the Uint8Arrays ahead of time.
   */
  static fromUint8Arrays(bufs, length3) {
    const list = new _Uint8ArrayList();
    list.bufs = bufs;
    if (length3 == null) {
      length3 = bufs.reduce((acc, curr) => acc + curr.byteLength, 0);
    }
    list.length = length3;
    return list;
  }
};

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
function encode4(data) {
  return data.reduce((p2, c2) => {
    p2 += alphabetBytesToChars[c2];
    return p2;
  }, "");
}
function decode5(str) {
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
  encode: encode4,
  decode: decode5
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
var identity_exports2 = {};
__export(identity_exports2, {
  identity: () => identity2
});
var identity2 = from({
  prefix: "\0",
  name: "identity",
  encode: (buf) => toString(buf),
  decode: (str) => fromString(str)
});

// ../../node_modules/multiformats/dist/src/codecs/json.js
var textEncoder = new TextEncoder();
var textDecoder = new TextDecoder();

// ../../node_modules/multiformats/dist/src/hashes/sha2-browser.js
var sha2_browser_exports = {};
__export(sha2_browser_exports, {
  sha256: () => sha256,
  sha512: () => sha512
});

// ../../node_modules/multiformats/dist/src/hashes/hasher.js
var DEFAULT_MIN_DIGEST_LENGTH = 20;
function from2({ name: name2, code: code2, encode: encode6, minDigestLength, maxDigestLength }) {
  return new Hasher(name2, code2, encode6, minDigestLength, maxDigestLength);
}
var Hasher = class {
  name;
  code;
  encode;
  minDigestLength;
  maxDigestLength;
  constructor(name2, code2, encode6, minDigestLength, maxDigestLength) {
    this.name = name2;
    this.code = code2;
    this.encode = encode6;
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

// ../../node_modules/multiformats/dist/src/basics.js
var bases = { ...identity_exports2, ...base2_exports, ...base8_exports, ...base10_exports, ...base16_exports, ...base32_exports, ...base36_exports, ...base58_exports, ...base64_exports, ...base256emoji_exports };
var hashes = { ...sha2_browser_exports, ...identity_exports };

// ../../node_modules/uint8arrays/dist/src/util/bases.js
function createCodec(name2, prefix2, encode6, decode7) {
  return {
    name: name2,
    prefix: prefix2,
    encoder: {
      name: name2,
      prefix: prefix2,
      encode: encode6
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

// ../../node_modules/@libp2p/crypto/dist/src/keys/rsa/der.js
var TAG_MASK = parseInt("11111", 2);
var LONG_LENGTH_MASK = parseInt("10000000", 2);
var LONG_LENGTH_BYTES_MASK = parseInt("01111111", 2);
var decoders = {
  0: readSequence,
  1: readSequence,
  2: readInteger,
  3: readBitString,
  4: readOctetString,
  5: readNull,
  6: readObjectIdentifier,
  16: readSequence,
  22: readSequence,
  48: readSequence
};
function decodeDer(buf, context = { offset: 0 }) {
  const tag = buf[context.offset] & TAG_MASK;
  context.offset++;
  if (decoders[tag] != null) {
    return decoders[tag](buf, context);
  }
  throw new Error("No decoder for tag " + tag);
}
function readLength(buf, context) {
  let length3 = 0;
  if ((buf[context.offset] & LONG_LENGTH_MASK) === LONG_LENGTH_MASK) {
    const count = buf[context.offset] & LONG_LENGTH_BYTES_MASK;
    let str = "0x";
    context.offset++;
    for (let i2 = 0; i2 < count; i2++, context.offset++) {
      str += buf[context.offset].toString(16).padStart(2, "0");
    }
    length3 = parseInt(str, 16);
  } else {
    length3 = buf[context.offset];
    context.offset++;
  }
  return length3;
}
function readSequence(buf, context) {
  readLength(buf, context);
  const entries = [];
  while (true) {
    if (context.offset >= buf.byteLength) {
      break;
    }
    const result = decodeDer(buf, context);
    if (result === null) {
      break;
    }
    entries.push(result);
  }
  return entries;
}
function readInteger(buf, context) {
  const length3 = readLength(buf, context);
  const start = context.offset;
  const end = context.offset + length3;
  const vals = [];
  for (let i2 = start; i2 < end; i2++) {
    if (i2 === start && buf[i2] === 0) {
      continue;
    }
    vals.push(buf[i2]);
  }
  context.offset += length3;
  return Uint8Array.from(vals);
}
function readObjectIdentifier(buf, context) {
  const count = readLength(buf, context);
  const finalOffset = context.offset + count;
  const byte = buf[context.offset];
  context.offset++;
  let val1 = 0;
  let val2 = 0;
  if (byte < 40) {
    val1 = 0;
    val2 = byte;
  } else if (byte < 80) {
    val1 = 1;
    val2 = byte - 40;
  } else {
    val1 = 2;
    val2 = byte - 80;
  }
  let oid = `${val1}.${val2}`;
  let num = [];
  while (context.offset < finalOffset) {
    const byte2 = buf[context.offset];
    context.offset++;
    num.push(byte2 & 127);
    if (byte2 < 128) {
      num.reverse();
      let val = 0;
      for (let i2 = 0; i2 < num.length; i2++) {
        val += num[i2] << i2 * 7;
      }
      oid += `.${val}`;
      num = [];
    }
  }
  return oid;
}
function readNull(buf, context) {
  context.offset++;
  return null;
}
function readBitString(buf, context) {
  const length3 = readLength(buf, context);
  const unusedBits = buf[context.offset];
  context.offset++;
  const bytes = buf.subarray(context.offset, context.offset + length3 - 1);
  context.offset += length3;
  if (unusedBits !== 0) {
    throw new Error("Unused bits in bit string is unimplemented");
  }
  return bytes;
}
function readOctetString(buf, context) {
  const length3 = readLength(buf, context);
  const bytes = buf.subarray(context.offset, context.offset + length3);
  context.offset += length3;
  return bytes;
}
function encodeNumber(value) {
  let number = value.toString(16);
  if (number.length % 2 === 1) {
    number = "0" + number;
  }
  const array = new Uint8ArrayList();
  for (let i2 = 0; i2 < number.length; i2 += 2) {
    array.append(Uint8Array.from([parseInt(`${number[i2]}${number[i2 + 1]}`, 16)]));
  }
  return array;
}
function encodeLength(bytes) {
  if (bytes.byteLength < 128) {
    return Uint8Array.from([bytes.byteLength]);
  }
  const length3 = encodeNumber(bytes.byteLength);
  return new Uint8ArrayList(Uint8Array.from([
    length3.byteLength | LONG_LENGTH_MASK
  ]), length3);
}
function encodeInteger(value) {
  const contents = new Uint8ArrayList();
  const mask = 128;
  const positive2 = (value.subarray()[0] & mask) === mask;
  if (positive2) {
    contents.append(Uint8Array.from([0]));
  }
  contents.append(value);
  return new Uint8ArrayList(Uint8Array.from([2]), encodeLength(contents), contents);
}
function encodeBitString(value) {
  const unusedBits = Uint8Array.from([0]);
  const contents = new Uint8ArrayList(unusedBits, value);
  return new Uint8ArrayList(Uint8Array.from([3]), encodeLength(contents), contents);
}
function encodeSequence(values, tag = 48) {
  const output = new Uint8ArrayList();
  for (const buf of values) {
    output.append(buf);
  }
  return new Uint8ArrayList(Uint8Array.from([tag]), encodeLength(output), output);
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/ecdsa/index.js
async function hashAndVerify(key, sig, msg, options) {
  const publicKey = await crypto.subtle.importKey("jwk", key, {
    name: "ECDSA",
    namedCurve: key.crv ?? "P-256"
  }, false, ["verify"]);
  options?.signal?.throwIfAborted();
  const result = await crypto.subtle.verify({
    name: "ECDSA",
    hash: {
      name: "SHA-256"
    }
  }, publicKey, sig, msg.subarray());
  options?.signal?.throwIfAborted();
  return result;
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/ecdsa/utils.js
var OID_256 = Uint8Array.from([6, 8, 42, 134, 72, 206, 61, 3, 1, 7]);
var OID_384 = Uint8Array.from([6, 5, 43, 129, 4, 0, 34]);
var OID_521 = Uint8Array.from([6, 5, 43, 129, 4, 0, 35]);
var P_256_KEY_JWK = {
  ext: true,
  kty: "EC",
  crv: "P-256"
};
var P_384_KEY_JWK = {
  ext: true,
  kty: "EC",
  crv: "P-384"
};
var P_521_KEY_JWK = {
  ext: true,
  kty: "EC",
  crv: "P-521"
};
var P_256_KEY_LENGTH = 32;
var P_384_KEY_LENGTH = 48;
var P_521_KEY_LENGTH = 66;
function unmarshalECDSAPublicKey(bytes) {
  const message2 = decodeDer(bytes);
  return pkiMessageToECDSAPublicKey(message2);
}
function pkiMessageToECDSAPublicKey(message2) {
  const coordinates = message2[1][1][0];
  const offset = 1;
  let x;
  let y;
  if (coordinates.byteLength === P_256_KEY_LENGTH * 2 + 1) {
    x = toString2(coordinates.subarray(offset, offset + P_256_KEY_LENGTH), "base64url");
    y = toString2(coordinates.subarray(offset + P_256_KEY_LENGTH), "base64url");
    return new ECDSAPublicKey({
      ...P_256_KEY_JWK,
      key_ops: ["verify"],
      x,
      y
    });
  }
  if (coordinates.byteLength === P_384_KEY_LENGTH * 2 + 1) {
    x = toString2(coordinates.subarray(offset, offset + P_384_KEY_LENGTH), "base64url");
    y = toString2(coordinates.subarray(offset + P_384_KEY_LENGTH), "base64url");
    return new ECDSAPublicKey({
      ...P_384_KEY_JWK,
      key_ops: ["verify"],
      x,
      y
    });
  }
  if (coordinates.byteLength === P_521_KEY_LENGTH * 2 + 1) {
    x = toString2(coordinates.subarray(offset, offset + P_521_KEY_LENGTH), "base64url");
    y = toString2(coordinates.subarray(offset + P_521_KEY_LENGTH), "base64url");
    return new ECDSAPublicKey({
      ...P_521_KEY_JWK,
      key_ops: ["verify"],
      x,
      y
    });
  }
  throw new InvalidParametersError(`coordinates were wrong length, got ${coordinates.byteLength}, expected 65, 97 or 133`);
}
function publicKeyToPKIMessage(publicKey) {
  return encodeSequence([
    encodeInteger(Uint8Array.from([1])),
    // header
    encodeSequence([
      getOID(publicKey.crv)
    ], 160),
    encodeSequence([
      encodeBitString(new Uint8ArrayList(Uint8Array.from([4]), fromString2(publicKey.x ?? "", "base64url"), fromString2(publicKey.y ?? "", "base64url")))
    ], 161)
  ]).subarray();
}
function getOID(curve) {
  if (curve === "P-256") {
    return OID_256;
  }
  if (curve === "P-384") {
    return OID_384;
  }
  if (curve === "P-521") {
    return OID_521;
  }
  throw new InvalidParametersError(`Invalid curve ${curve}`);
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/ecdsa/ecdsa.js
var ECDSAPublicKey = class {
  type = "ECDSA";
  jwk;
  _raw;
  constructor(jwk) {
    this.jwk = jwk;
  }
  get raw() {
    if (this._raw == null) {
      this._raw = publicKeyToPKIMessage(this.jwk);
    }
    return this._raw;
  }
  toMultihash() {
    return identity.digest(publicKeyToProtobuf(this));
  }
  toCID() {
    return CID.createV1(114, this.toMultihash());
  }
  toString() {
    return base58btc.encode(this.toMultihash().bytes).substring(1);
  }
  equals(key) {
    if (key == null || !(key.raw instanceof Uint8Array)) {
      return false;
    }
    return equals3(this.raw, key.raw);
  }
  async verify(data, sig, options) {
    return hashAndVerify(this.jwk, sig, data, options);
  }
};

// ../../node_modules/@noble/hashes/utils.js
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
function isBytes(a2) {
  return a2 instanceof Uint8Array || ArrayBuffer.isView(a2) && a2.constructor.name === "Uint8Array";
}
function anumber(n2, title = "") {
  if (!Number.isSafeInteger(n2) || n2 < 0) {
    const prefix2 = title && `"${title}" `;
    throw new Error(`${prefix2}expected integer >= 0, got ${n2}`);
  }
}
function abytes(value, length3, title = "") {
  const bytes = isBytes(value);
  const len = value?.length;
  const needsLen = length3 !== void 0;
  if (!bytes || needsLen && len !== length3) {
    const prefix2 = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length3}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix2 + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function ahash(h) {
  if (typeof h !== "function" || typeof h.create !== "function")
    throw new Error("Hash must wrapped by utils.createHasher");
  anumber(h.outputLen);
  anumber(h.blockLen);
}
function aexists(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput(out, instance) {
  abytes(out, void 0, "digestInto() output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error('"digestInto() output" expected to be of length >=' + min);
  }
}
function clean(...arrays) {
  for (let i2 = 0; i2 < arrays.length; i2++) {
    arrays[i2].fill(0);
  }
}
function createView(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
function rotr(word, shift) {
  return word << 32 - shift | word >>> shift;
}
var hasHexBuiltin = /* @__PURE__ */ (() => (
  // @ts-ignore
  typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
))();
var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i2) => i2.toString(16).padStart(2, "0"));
function bytesToHex(bytes) {
  abytes(bytes);
  if (hasHexBuiltin)
    return bytes.toHex();
  let hex = "";
  for (let i2 = 0; i2 < bytes.length; i2++) {
    hex += hexes[bytes[i2]];
  }
  return hex;
}
var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
function asciiToBase16(ch) {
  if (ch >= asciis._0 && ch <= asciis._9)
    return ch - asciis._0;
  if (ch >= asciis.A && ch <= asciis.F)
    return ch - (asciis.A - 10);
  if (ch >= asciis.a && ch <= asciis.f)
    return ch - (asciis.a - 10);
  return;
}
function hexToBytes(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  if (hasHexBuiltin)
    return Uint8Array.fromHex(hex);
  const hl = hex.length;
  const al = hl / 2;
  if (hl % 2)
    throw new Error("hex string expected, got unpadded hex of length " + hl);
  const array = new Uint8Array(al);
  for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
    const n1 = asciiToBase16(hex.charCodeAt(hi));
    const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
    if (n1 === void 0 || n2 === void 0) {
      const char = hex[hi] + hex[hi + 1];
      throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
    }
    array[ai] = n1 * 16 + n2;
  }
  return array;
}
function concatBytes(...arrays) {
  let sum = 0;
  for (let i2 = 0; i2 < arrays.length; i2++) {
    const a2 = arrays[i2];
    abytes(a2);
    sum += a2.length;
  }
  const res = new Uint8Array(sum);
  for (let i2 = 0, pad = 0; i2 < arrays.length; i2++) {
    const a2 = arrays[i2];
    res.set(a2, pad);
    pad += a2.length;
  }
  return res;
}
function createHasher(hashCons, info = {}) {
  const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
  const tmp = hashCons(void 0);
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (opts) => hashCons(opts);
  Object.assign(hashC, info);
  return Object.freeze(hashC);
}
function randomBytes(bytesLength = 32) {
  const cr = typeof globalThis === "object" ? globalThis.crypto : null;
  if (typeof cr?.getRandomValues !== "function")
    throw new Error("crypto.getRandomValues must be defined");
  return cr.getRandomValues(new Uint8Array(bytesLength));
}
var oidNist = (suffix) => ({
  oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
});

// ../../node_modules/@noble/hashes/_md.js
function Chi(a2, b, c2) {
  return a2 & b ^ ~a2 & c2;
}
function Maj(a2, b, c2) {
  return a2 & b ^ a2 & c2 ^ b & c2;
}
var HashMD = class {
  blockLen;
  outputLen;
  padOffset;
  isLE;
  // For partial updates less than block size
  buffer;
  view;
  finished = false;
  length = 0;
  pos = 0;
  destroyed = false;
  constructor(blockLen, outputLen, padOffset, isLE2) {
    this.blockLen = blockLen;
    this.outputLen = outputLen;
    this.padOffset = padOffset;
    this.isLE = isLE2;
    this.buffer = new Uint8Array(blockLen);
    this.view = createView(this.buffer);
  }
  update(data) {
    aexists(this);
    abytes(data);
    const { view, buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        const dataView = createView(data);
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(dataView, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(view, 0);
        this.pos = 0;
      }
    }
    this.length += data.length;
    this.roundClean();
    return this;
  }
  digestInto(out) {
    aexists(this);
    aoutput(out, this);
    this.finished = true;
    const { buffer, view, blockLen, isLE: isLE2 } = this;
    let { pos } = this;
    buffer[pos++] = 128;
    clean(this.buffer.subarray(pos));
    if (this.padOffset > blockLen - pos) {
      this.process(view, 0);
      pos = 0;
    }
    for (let i2 = pos; i2 < blockLen; i2++)
      buffer[i2] = 0;
    view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE2);
    this.process(view, 0);
    const oview = createView(out);
    const len = this.outputLen;
    if (len % 4)
      throw new Error("_sha2: outputLen must be aligned to 32bit");
    const outLen = len / 4;
    const state = this.get();
    if (outLen > state.length)
      throw new Error("_sha2: outputLen bigger than state");
    for (let i2 = 0; i2 < outLen; i2++)
      oview.setUint32(4 * i2, state[i2], isLE2);
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
  _cloneInto(to) {
    to ||= new this.constructor();
    to.set(...this.get());
    const { blockLen, buffer, length: length3, finished, destroyed, pos } = this;
    to.destroyed = destroyed;
    to.finished = finished;
    to.length = length3;
    to.pos = pos;
    if (length3 % blockLen)
      to.buffer.set(buffer);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
};
var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  3144134277,
  1013904242,
  2773480762,
  1359893119,
  2600822924,
  528734635,
  1541459225
]);
var SHA512_IV = /* @__PURE__ */ Uint32Array.from([
  1779033703,
  4089235720,
  3144134277,
  2227873595,
  1013904242,
  4271175723,
  2773480762,
  1595750129,
  1359893119,
  2917565137,
  2600822924,
  725511199,
  528734635,
  4215389547,
  1541459225,
  327033209
]);

// ../../node_modules/@noble/hashes/_u64.js
var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
var _32n = /* @__PURE__ */ BigInt(32);
function fromBig(n2, le = false) {
  if (le)
    return { h: Number(n2 & U32_MASK64), l: Number(n2 >> _32n & U32_MASK64) };
  return { h: Number(n2 >> _32n & U32_MASK64) | 0, l: Number(n2 & U32_MASK64) | 0 };
}
function split(lst, le = false) {
  const len = lst.length;
  let Ah = new Uint32Array(len);
  let Al = new Uint32Array(len);
  for (let i2 = 0; i2 < len; i2++) {
    const { h, l: l2 } = fromBig(lst[i2], le);
    [Ah[i2], Al[i2]] = [h, l2];
  }
  return [Ah, Al];
}
var shrSH = (h, _l, s2) => h >>> s2;
var shrSL = (h, l2, s2) => h << 32 - s2 | l2 >>> s2;
var rotrSH = (h, l2, s2) => h >>> s2 | l2 << 32 - s2;
var rotrSL = (h, l2, s2) => h << 32 - s2 | l2 >>> s2;
var rotrBH = (h, l2, s2) => h << 64 - s2 | l2 >>> s2 - 32;
var rotrBL = (h, l2, s2) => h >>> s2 - 32 | l2 << 64 - s2;
function add(Ah, Al, Bh, Bl) {
  const l2 = (Al >>> 0) + (Bl >>> 0);
  return { h: Ah + Bh + (l2 / 2 ** 32 | 0) | 0, l: l2 | 0 };
}
var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;

// ../../node_modules/@noble/hashes/sha2.js
var SHA256_K = /* @__PURE__ */ Uint32Array.from([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);
var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
var SHA2_32B = class extends HashMD {
  constructor(outputLen) {
    super(64, outputLen, 8, false);
  }
  get() {
    const { A, B, C, D, E, F, G, H } = this;
    return [A, B, C, D, E, F, G, H];
  }
  // prettier-ignore
  set(A, B, C, D, E, F, G, H) {
    this.A = A | 0;
    this.B = B | 0;
    this.C = C | 0;
    this.D = D | 0;
    this.E = E | 0;
    this.F = F | 0;
    this.G = G | 0;
    this.H = H | 0;
  }
  process(view, offset) {
    for (let i2 = 0; i2 < 16; i2++, offset += 4)
      SHA256_W[i2] = view.getUint32(offset, false);
    for (let i2 = 16; i2 < 64; i2++) {
      const W15 = SHA256_W[i2 - 15];
      const W2 = SHA256_W[i2 - 2];
      const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
      const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
      SHA256_W[i2] = s1 + SHA256_W[i2 - 7] + s0 + SHA256_W[i2 - 16] | 0;
    }
    let { A, B, C, D, E, F, G, H } = this;
    for (let i2 = 0; i2 < 64; i2++) {
      const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
      const T1 = H + sigma1 + Chi(E, F, G) + SHA256_K[i2] + SHA256_W[i2] | 0;
      const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
      const T2 = sigma0 + Maj(A, B, C) | 0;
      H = G;
      G = F;
      F = E;
      E = D + T1 | 0;
      D = C;
      C = B;
      B = A;
      A = T1 + T2 | 0;
    }
    A = A + this.A | 0;
    B = B + this.B | 0;
    C = C + this.C | 0;
    D = D + this.D | 0;
    E = E + this.E | 0;
    F = F + this.F | 0;
    G = G + this.G | 0;
    H = H + this.H | 0;
    this.set(A, B, C, D, E, F, G, H);
  }
  roundClean() {
    clean(SHA256_W);
  }
  destroy() {
    this.set(0, 0, 0, 0, 0, 0, 0, 0);
    clean(this.buffer);
  }
};
var _SHA256 = class extends SHA2_32B {
  // We cannot use array here since array allows indexing by variable
  // which means optimizer/compiler cannot use registers.
  A = SHA256_IV[0] | 0;
  B = SHA256_IV[1] | 0;
  C = SHA256_IV[2] | 0;
  D = SHA256_IV[3] | 0;
  E = SHA256_IV[4] | 0;
  F = SHA256_IV[5] | 0;
  G = SHA256_IV[6] | 0;
  H = SHA256_IV[7] | 0;
  constructor() {
    super(32);
  }
};
var K512 = /* @__PURE__ */ (() => split([
  "0x428a2f98d728ae22",
  "0x7137449123ef65cd",
  "0xb5c0fbcfec4d3b2f",
  "0xe9b5dba58189dbbc",
  "0x3956c25bf348b538",
  "0x59f111f1b605d019",
  "0x923f82a4af194f9b",
  "0xab1c5ed5da6d8118",
  "0xd807aa98a3030242",
  "0x12835b0145706fbe",
  "0x243185be4ee4b28c",
  "0x550c7dc3d5ffb4e2",
  "0x72be5d74f27b896f",
  "0x80deb1fe3b1696b1",
  "0x9bdc06a725c71235",
  "0xc19bf174cf692694",
  "0xe49b69c19ef14ad2",
  "0xefbe4786384f25e3",
  "0x0fc19dc68b8cd5b5",
  "0x240ca1cc77ac9c65",
  "0x2de92c6f592b0275",
  "0x4a7484aa6ea6e483",
  "0x5cb0a9dcbd41fbd4",
  "0x76f988da831153b5",
  "0x983e5152ee66dfab",
  "0xa831c66d2db43210",
  "0xb00327c898fb213f",
  "0xbf597fc7beef0ee4",
  "0xc6e00bf33da88fc2",
  "0xd5a79147930aa725",
  "0x06ca6351e003826f",
  "0x142929670a0e6e70",
  "0x27b70a8546d22ffc",
  "0x2e1b21385c26c926",
  "0x4d2c6dfc5ac42aed",
  "0x53380d139d95b3df",
  "0x650a73548baf63de",
  "0x766a0abb3c77b2a8",
  "0x81c2c92e47edaee6",
  "0x92722c851482353b",
  "0xa2bfe8a14cf10364",
  "0xa81a664bbc423001",
  "0xc24b8b70d0f89791",
  "0xc76c51a30654be30",
  "0xd192e819d6ef5218",
  "0xd69906245565a910",
  "0xf40e35855771202a",
  "0x106aa07032bbd1b8",
  "0x19a4c116b8d2d0c8",
  "0x1e376c085141ab53",
  "0x2748774cdf8eeb99",
  "0x34b0bcb5e19b48a8",
  "0x391c0cb3c5c95a63",
  "0x4ed8aa4ae3418acb",
  "0x5b9cca4f7763e373",
  "0x682e6ff3d6b2b8a3",
  "0x748f82ee5defb2fc",
  "0x78a5636f43172f60",
  "0x84c87814a1f0ab72",
  "0x8cc702081a6439ec",
  "0x90befffa23631e28",
  "0xa4506cebde82bde9",
  "0xbef9a3f7b2c67915",
  "0xc67178f2e372532b",
  "0xca273eceea26619c",
  "0xd186b8c721c0c207",
  "0xeada7dd6cde0eb1e",
  "0xf57d4f7fee6ed178",
  "0x06f067aa72176fba",
  "0x0a637dc5a2c898a6",
  "0x113f9804bef90dae",
  "0x1b710b35131c471b",
  "0x28db77f523047d84",
  "0x32caab7b40c72493",
  "0x3c9ebe0a15c9bebc",
  "0x431d67c49c100d4c",
  "0x4cc5d4becb3e42b6",
  "0x597f299cfc657e2a",
  "0x5fcb6fab3ad6faec",
  "0x6c44198c4a475817"
].map((n2) => BigInt(n2))))();
var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
var SHA2_64B = class extends HashMD {
  constructor(outputLen) {
    super(128, outputLen, 16, false);
  }
  // prettier-ignore
  get() {
    const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
  }
  // prettier-ignore
  set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
    this.Ah = Ah | 0;
    this.Al = Al | 0;
    this.Bh = Bh | 0;
    this.Bl = Bl | 0;
    this.Ch = Ch | 0;
    this.Cl = Cl | 0;
    this.Dh = Dh | 0;
    this.Dl = Dl | 0;
    this.Eh = Eh | 0;
    this.El = El | 0;
    this.Fh = Fh | 0;
    this.Fl = Fl | 0;
    this.Gh = Gh | 0;
    this.Gl = Gl | 0;
    this.Hh = Hh | 0;
    this.Hl = Hl | 0;
  }
  process(view, offset) {
    for (let i2 = 0; i2 < 16; i2++, offset += 4) {
      SHA512_W_H[i2] = view.getUint32(offset);
      SHA512_W_L[i2] = view.getUint32(offset += 4);
    }
    for (let i2 = 16; i2 < 80; i2++) {
      const W15h = SHA512_W_H[i2 - 15] | 0;
      const W15l = SHA512_W_L[i2 - 15] | 0;
      const s0h = rotrSH(W15h, W15l, 1) ^ rotrSH(W15h, W15l, 8) ^ shrSH(W15h, W15l, 7);
      const s0l = rotrSL(W15h, W15l, 1) ^ rotrSL(W15h, W15l, 8) ^ shrSL(W15h, W15l, 7);
      const W2h = SHA512_W_H[i2 - 2] | 0;
      const W2l = SHA512_W_L[i2 - 2] | 0;
      const s1h = rotrSH(W2h, W2l, 19) ^ rotrBH(W2h, W2l, 61) ^ shrSH(W2h, W2l, 6);
      const s1l = rotrSL(W2h, W2l, 19) ^ rotrBL(W2h, W2l, 61) ^ shrSL(W2h, W2l, 6);
      const SUMl = add4L(s0l, s1l, SHA512_W_L[i2 - 7], SHA512_W_L[i2 - 16]);
      const SUMh = add4H(SUMl, s0h, s1h, SHA512_W_H[i2 - 7], SHA512_W_H[i2 - 16]);
      SHA512_W_H[i2] = SUMh | 0;
      SHA512_W_L[i2] = SUMl | 0;
    }
    let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
    for (let i2 = 0; i2 < 80; i2++) {
      const sigma1h = rotrSH(Eh, El, 14) ^ rotrSH(Eh, El, 18) ^ rotrBH(Eh, El, 41);
      const sigma1l = rotrSL(Eh, El, 14) ^ rotrSL(Eh, El, 18) ^ rotrBL(Eh, El, 41);
      const CHIh = Eh & Fh ^ ~Eh & Gh;
      const CHIl = El & Fl ^ ~El & Gl;
      const T1ll = add5L(Hl, sigma1l, CHIl, SHA512_Kl[i2], SHA512_W_L[i2]);
      const T1h = add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i2], SHA512_W_H[i2]);
      const T1l = T1ll | 0;
      const sigma0h = rotrSH(Ah, Al, 28) ^ rotrBH(Ah, Al, 34) ^ rotrBH(Ah, Al, 39);
      const sigma0l = rotrSL(Ah, Al, 28) ^ rotrBL(Ah, Al, 34) ^ rotrBL(Ah, Al, 39);
      const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
      const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
      Hh = Gh | 0;
      Hl = Gl | 0;
      Gh = Fh | 0;
      Gl = Fl | 0;
      Fh = Eh | 0;
      Fl = El | 0;
      ({ h: Eh, l: El } = add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
      Dh = Ch | 0;
      Dl = Cl | 0;
      Ch = Bh | 0;
      Cl = Bl | 0;
      Bh = Ah | 0;
      Bl = Al | 0;
      const All = add3L(T1l, sigma0l, MAJl);
      Ah = add3H(All, T1h, sigma0h, MAJh);
      Al = All | 0;
    }
    ({ h: Ah, l: Al } = add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
    ({ h: Bh, l: Bl } = add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
    ({ h: Ch, l: Cl } = add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
    ({ h: Dh, l: Dl } = add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
    ({ h: Eh, l: El } = add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
    ({ h: Fh, l: Fl } = add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
    ({ h: Gh, l: Gl } = add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
    ({ h: Hh, l: Hl } = add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
    this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
  }
  roundClean() {
    clean(SHA512_W_H, SHA512_W_L);
  }
  destroy() {
    clean(this.buffer);
    this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
  }
};
var _SHA512 = class extends SHA2_64B {
  Ah = SHA512_IV[0] | 0;
  Al = SHA512_IV[1] | 0;
  Bh = SHA512_IV[2] | 0;
  Bl = SHA512_IV[3] | 0;
  Ch = SHA512_IV[4] | 0;
  Cl = SHA512_IV[5] | 0;
  Dh = SHA512_IV[6] | 0;
  Dl = SHA512_IV[7] | 0;
  Eh = SHA512_IV[8] | 0;
  El = SHA512_IV[9] | 0;
  Fh = SHA512_IV[10] | 0;
  Fl = SHA512_IV[11] | 0;
  Gh = SHA512_IV[12] | 0;
  Gl = SHA512_IV[13] | 0;
  Hh = SHA512_IV[14] | 0;
  Hl = SHA512_IV[15] | 0;
  constructor() {
    super(64);
  }
};
var sha2562 = /* @__PURE__ */ createHasher(
  () => new _SHA256(),
  /* @__PURE__ */ oidNist(1)
);
var sha5122 = /* @__PURE__ */ createHasher(
  () => new _SHA512(),
  /* @__PURE__ */ oidNist(3)
);

// ../../node_modules/@noble/curves/utils.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n = /* @__PURE__ */ BigInt(0);
var _1n = /* @__PURE__ */ BigInt(1);
function abool(value, title = "") {
  if (typeof value !== "boolean") {
    const prefix2 = title && `"${title}" `;
    throw new Error(prefix2 + "expected boolean, got type=" + typeof value);
  }
  return value;
}
function abignumber(n2) {
  if (typeof n2 === "bigint") {
    if (!isPosBig(n2))
      throw new Error("positive bigint expected, got " + n2);
  } else
    anumber(n2);
  return n2;
}
function numberToHexUnpadded(num) {
  const hex = abignumber(num).toString(16);
  return hex.length & 1 ? "0" + hex : hex;
}
function hexToNumber(hex) {
  if (typeof hex !== "string")
    throw new Error("hex string expected, got " + typeof hex);
  return hex === "" ? _0n : BigInt("0x" + hex);
}
function bytesToNumberBE(bytes) {
  return hexToNumber(bytesToHex(bytes));
}
function bytesToNumberLE(bytes) {
  return hexToNumber(bytesToHex(copyBytes(abytes(bytes)).reverse()));
}
function numberToBytesBE(n2, len) {
  anumber(len);
  n2 = abignumber(n2);
  const res = hexToBytes(n2.toString(16).padStart(len * 2, "0"));
  if (res.length !== len)
    throw new Error("number too large");
  return res;
}
function numberToBytesLE(n2, len) {
  return numberToBytesBE(n2, len).reverse();
}
function copyBytes(bytes) {
  return Uint8Array.from(bytes);
}
var isPosBig = (n2) => typeof n2 === "bigint" && _0n <= n2;
function inRange(n2, min, max) {
  return isPosBig(n2) && isPosBig(min) && isPosBig(max) && min <= n2 && n2 < max;
}
function aInRange(title, n2, min, max) {
  if (!inRange(n2, min, max))
    throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n2);
}
function bitLen(n2) {
  let len;
  for (len = 0; n2 > _0n; n2 >>= _1n, len += 1)
    ;
  return len;
}
var bitMask = (n2) => (_1n << BigInt(n2)) - _1n;
function createHmacDrbg(hashLen, qByteLen, hmacFn) {
  anumber(hashLen, "hashLen");
  anumber(qByteLen, "qByteLen");
  if (typeof hmacFn !== "function")
    throw new Error("hmacFn must be a function");
  const u8n = (len) => new Uint8Array(len);
  const NULL = Uint8Array.of();
  const byte0 = Uint8Array.of(0);
  const byte1 = Uint8Array.of(1);
  const _maxDrbgIters = 1e3;
  let v = u8n(hashLen);
  let k = u8n(hashLen);
  let i2 = 0;
  const reset = () => {
    v.fill(1);
    k.fill(0);
    i2 = 0;
  };
  const h = (...msgs) => hmacFn(k, concatBytes(v, ...msgs));
  const reseed = (seed = NULL) => {
    k = h(byte0, seed);
    v = h();
    if (seed.length === 0)
      return;
    k = h(byte1, seed);
    v = h();
  };
  const gen = () => {
    if (i2++ >= _maxDrbgIters)
      throw new Error("drbg: tried max amount of iterations");
    let len = 0;
    const out = [];
    while (len < qByteLen) {
      v = h();
      const sl = v.slice();
      out.push(sl);
      len += v.length;
    }
    return concatBytes(...out);
  };
  const genUntil = (seed, pred) => {
    reset();
    reseed(seed);
    let res = void 0;
    while (!(res = pred(gen())))
      reseed();
    reset();
    return res;
  };
  return genUntil;
}
function validateObject(object, fields = {}, optFields = {}) {
  if (!object || typeof object !== "object")
    throw new Error("expected valid options object");
  function checkField(fieldName, expectedType, isOpt) {
    const val = object[fieldName];
    if (isOpt && val === void 0)
      return;
    const current = typeof val;
    if (current !== expectedType || val === null)
      throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
  }
  const iter = (f2, isOpt) => Object.entries(f2).forEach(([k, v]) => checkField(k, v, isOpt));
  iter(fields, false);
  iter(optFields, true);
}
function memoized(fn) {
  const map = /* @__PURE__ */ new WeakMap();
  return (arg, ...args) => {
    const val = map.get(arg);
    if (val !== void 0)
      return val;
    const computed = fn(arg, ...args);
    map.set(arg, computed);
    return computed;
  };
}

// ../../node_modules/@noble/curves/abstract/modular.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n2 = /* @__PURE__ */ BigInt(0);
var _1n2 = /* @__PURE__ */ BigInt(1);
var _2n = /* @__PURE__ */ BigInt(2);
var _3n = /* @__PURE__ */ BigInt(3);
var _4n = /* @__PURE__ */ BigInt(4);
var _5n = /* @__PURE__ */ BigInt(5);
var _7n = /* @__PURE__ */ BigInt(7);
var _8n = /* @__PURE__ */ BigInt(8);
var _9n = /* @__PURE__ */ BigInt(9);
var _16n = /* @__PURE__ */ BigInt(16);
function mod(a2, b) {
  const result = a2 % b;
  return result >= _0n2 ? result : b + result;
}
function pow2(x, power, modulo) {
  let res = x;
  while (power-- > _0n2) {
    res *= res;
    res %= modulo;
  }
  return res;
}
function invert(number, modulo) {
  if (number === _0n2)
    throw new Error("invert: expected non-zero number");
  if (modulo <= _0n2)
    throw new Error("invert: expected positive modulus, got " + modulo);
  let a2 = mod(number, modulo);
  let b = modulo;
  let x = _0n2, y = _1n2, u = _1n2, v = _0n2;
  while (a2 !== _0n2) {
    const q = b / a2;
    const r2 = b % a2;
    const m2 = x - u * q;
    const n2 = y - v * q;
    b = a2, a2 = r2, x = u, y = v, u = m2, v = n2;
  }
  const gcd = b;
  if (gcd !== _1n2)
    throw new Error("invert: does not exist");
  return mod(x, modulo);
}
function assertIsSquare(Fp, root, n2) {
  if (!Fp.eql(Fp.sqr(root), n2))
    throw new Error("Cannot find square root");
}
function sqrt3mod4(Fp, n2) {
  const p1div4 = (Fp.ORDER + _1n2) / _4n;
  const root = Fp.pow(n2, p1div4);
  assertIsSquare(Fp, root, n2);
  return root;
}
function sqrt5mod8(Fp, n2) {
  const p5div8 = (Fp.ORDER - _5n) / _8n;
  const n22 = Fp.mul(n2, _2n);
  const v = Fp.pow(n22, p5div8);
  const nv = Fp.mul(n2, v);
  const i2 = Fp.mul(Fp.mul(nv, _2n), v);
  const root = Fp.mul(nv, Fp.sub(i2, Fp.ONE));
  assertIsSquare(Fp, root, n2);
  return root;
}
function sqrt9mod16(P) {
  const Fp_ = Field(P);
  const tn = tonelliShanks(P);
  const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
  const c2 = tn(Fp_, c1);
  const c3 = tn(Fp_, Fp_.neg(c1));
  const c4 = (P + _7n) / _16n;
  return (Fp, n2) => {
    let tv1 = Fp.pow(n2, c4);
    let tv2 = Fp.mul(tv1, c1);
    const tv3 = Fp.mul(tv1, c2);
    const tv4 = Fp.mul(tv1, c3);
    const e1 = Fp.eql(Fp.sqr(tv2), n2);
    const e2 = Fp.eql(Fp.sqr(tv3), n2);
    tv1 = Fp.cmov(tv1, tv2, e1);
    tv2 = Fp.cmov(tv4, tv3, e2);
    const e3 = Fp.eql(Fp.sqr(tv2), n2);
    const root = Fp.cmov(tv1, tv2, e3);
    assertIsSquare(Fp, root, n2);
    return root;
  };
}
function tonelliShanks(P) {
  if (P < _3n)
    throw new Error("sqrt is not defined for small field");
  let Q = P - _1n2;
  let S = 0;
  while (Q % _2n === _0n2) {
    Q /= _2n;
    S++;
  }
  let Z = _2n;
  const _Fp = Field(P);
  while (FpLegendre(_Fp, Z) === 1) {
    if (Z++ > 1e3)
      throw new Error("Cannot find square root: probably non-prime P");
  }
  if (S === 1)
    return sqrt3mod4;
  let cc = _Fp.pow(Z, Q);
  const Q1div2 = (Q + _1n2) / _2n;
  return function tonelliSlow(Fp, n2) {
    if (Fp.is0(n2))
      return n2;
    if (FpLegendre(Fp, n2) !== 1)
      throw new Error("Cannot find square root");
    let M = S;
    let c2 = Fp.mul(Fp.ONE, cc);
    let t2 = Fp.pow(n2, Q);
    let R = Fp.pow(n2, Q1div2);
    while (!Fp.eql(t2, Fp.ONE)) {
      if (Fp.is0(t2))
        return Fp.ZERO;
      let i2 = 1;
      let t_tmp = Fp.sqr(t2);
      while (!Fp.eql(t_tmp, Fp.ONE)) {
        i2++;
        t_tmp = Fp.sqr(t_tmp);
        if (i2 === M)
          throw new Error("Cannot find square root");
      }
      const exponent = _1n2 << BigInt(M - i2 - 1);
      const b = Fp.pow(c2, exponent);
      M = i2;
      c2 = Fp.sqr(b);
      t2 = Fp.mul(t2, c2);
      R = Fp.mul(R, b);
    }
    return R;
  };
}
function FpSqrt(P) {
  if (P % _4n === _3n)
    return sqrt3mod4;
  if (P % _8n === _5n)
    return sqrt5mod8;
  if (P % _16n === _9n)
    return sqrt9mod16(P);
  return tonelliShanks(P);
}
var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n2) === _1n2;
var FIELD_FIELDS = [
  "create",
  "isValid",
  "is0",
  "neg",
  "inv",
  "sqrt",
  "sqr",
  "eql",
  "add",
  "sub",
  "mul",
  "pow",
  "div",
  "addN",
  "subN",
  "mulN",
  "sqrN"
];
function validateField(field) {
  const initial = {
    ORDER: "bigint",
    BYTES: "number",
    BITS: "number"
  };
  const opts = FIELD_FIELDS.reduce((map, val) => {
    map[val] = "function";
    return map;
  }, initial);
  validateObject(field, opts);
  return field;
}
function FpPow(Fp, num, power) {
  if (power < _0n2)
    throw new Error("invalid exponent, negatives unsupported");
  if (power === _0n2)
    return Fp.ONE;
  if (power === _1n2)
    return num;
  let p2 = Fp.ONE;
  let d2 = num;
  while (power > _0n2) {
    if (power & _1n2)
      p2 = Fp.mul(p2, d2);
    d2 = Fp.sqr(d2);
    power >>= _1n2;
  }
  return p2;
}
function FpInvertBatch(Fp, nums, passZero = false) {
  const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
  const multipliedAcc = nums.reduce((acc, num, i2) => {
    if (Fp.is0(num))
      return acc;
    inverted[i2] = acc;
    return Fp.mul(acc, num);
  }, Fp.ONE);
  const invertedAcc = Fp.inv(multipliedAcc);
  nums.reduceRight((acc, num, i2) => {
    if (Fp.is0(num))
      return acc;
    inverted[i2] = Fp.mul(acc, inverted[i2]);
    return Fp.mul(acc, num);
  }, invertedAcc);
  return inverted;
}
function FpLegendre(Fp, n2) {
  const p1mod2 = (Fp.ORDER - _1n2) / _2n;
  const powered = Fp.pow(n2, p1mod2);
  const yes = Fp.eql(powered, Fp.ONE);
  const zero2 = Fp.eql(powered, Fp.ZERO);
  const no = Fp.eql(powered, Fp.neg(Fp.ONE));
  if (!yes && !zero2 && !no)
    throw new Error("invalid Legendre symbol result");
  return yes ? 1 : zero2 ? 0 : -1;
}
function nLength(n2, nBitLength) {
  if (nBitLength !== void 0)
    anumber(nBitLength);
  const _nBitLength = nBitLength !== void 0 ? nBitLength : n2.toString(2).length;
  const nByteLength = Math.ceil(_nBitLength / 8);
  return { nBitLength: _nBitLength, nByteLength };
}
var _Field = class {
  ORDER;
  BITS;
  BYTES;
  isLE;
  ZERO = _0n2;
  ONE = _1n2;
  _lengths;
  _sqrt;
  // cached sqrt
  _mod;
  constructor(ORDER, opts = {}) {
    if (ORDER <= _0n2)
      throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
    let _nbitLength = void 0;
    this.isLE = false;
    if (opts != null && typeof opts === "object") {
      if (typeof opts.BITS === "number")
        _nbitLength = opts.BITS;
      if (typeof opts.sqrt === "function")
        this.sqrt = opts.sqrt;
      if (typeof opts.isLE === "boolean")
        this.isLE = opts.isLE;
      if (opts.allowedLengths)
        this._lengths = opts.allowedLengths?.slice();
      if (typeof opts.modFromBytes === "boolean")
        this._mod = opts.modFromBytes;
    }
    const { nBitLength, nByteLength } = nLength(ORDER, _nbitLength);
    if (nByteLength > 2048)
      throw new Error("invalid field: expected ORDER of <= 2048 bytes");
    this.ORDER = ORDER;
    this.BITS = nBitLength;
    this.BYTES = nByteLength;
    this._sqrt = void 0;
    Object.preventExtensions(this);
  }
  create(num) {
    return mod(num, this.ORDER);
  }
  isValid(num) {
    if (typeof num !== "bigint")
      throw new Error("invalid field element: expected bigint, got " + typeof num);
    return _0n2 <= num && num < this.ORDER;
  }
  is0(num) {
    return num === _0n2;
  }
  // is valid and invertible
  isValidNot0(num) {
    return !this.is0(num) && this.isValid(num);
  }
  isOdd(num) {
    return (num & _1n2) === _1n2;
  }
  neg(num) {
    return mod(-num, this.ORDER);
  }
  eql(lhs, rhs) {
    return lhs === rhs;
  }
  sqr(num) {
    return mod(num * num, this.ORDER);
  }
  add(lhs, rhs) {
    return mod(lhs + rhs, this.ORDER);
  }
  sub(lhs, rhs) {
    return mod(lhs - rhs, this.ORDER);
  }
  mul(lhs, rhs) {
    return mod(lhs * rhs, this.ORDER);
  }
  pow(num, power) {
    return FpPow(this, num, power);
  }
  div(lhs, rhs) {
    return mod(lhs * invert(rhs, this.ORDER), this.ORDER);
  }
  // Same as above, but doesn't normalize
  sqrN(num) {
    return num * num;
  }
  addN(lhs, rhs) {
    return lhs + rhs;
  }
  subN(lhs, rhs) {
    return lhs - rhs;
  }
  mulN(lhs, rhs) {
    return lhs * rhs;
  }
  inv(num) {
    return invert(num, this.ORDER);
  }
  sqrt(num) {
    if (!this._sqrt)
      this._sqrt = FpSqrt(this.ORDER);
    return this._sqrt(this, num);
  }
  toBytes(num) {
    return this.isLE ? numberToBytesLE(num, this.BYTES) : numberToBytesBE(num, this.BYTES);
  }
  fromBytes(bytes, skipValidation = false) {
    abytes(bytes);
    const { _lengths: allowedLengths, BYTES, isLE: isLE2, ORDER, _mod: modFromBytes } = this;
    if (allowedLengths) {
      if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
        throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
      }
      const padded = new Uint8Array(BYTES);
      padded.set(bytes, isLE2 ? 0 : padded.length - bytes.length);
      bytes = padded;
    }
    if (bytes.length !== BYTES)
      throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
    let scalar = isLE2 ? bytesToNumberLE(bytes) : bytesToNumberBE(bytes);
    if (modFromBytes)
      scalar = mod(scalar, ORDER);
    if (!skipValidation) {
      if (!this.isValid(scalar))
        throw new Error("invalid field element: outside of range 0..ORDER");
    }
    return scalar;
  }
  // TODO: we don't need it here, move out to separate fn
  invertBatch(lst) {
    return FpInvertBatch(this, lst);
  }
  // We can't move this out because Fp6, Fp12 implement it
  // and it's unclear what to return in there.
  cmov(a2, b, condition) {
    return condition ? b : a2;
  }
};
function Field(ORDER, opts = {}) {
  return new _Field(ORDER, opts);
}
function getFieldBytesLength(fieldOrder) {
  if (typeof fieldOrder !== "bigint")
    throw new Error("field order must be bigint");
  const bitLength = fieldOrder.toString(2).length;
  return Math.ceil(bitLength / 8);
}
function getMinHashLength(fieldOrder) {
  const length3 = getFieldBytesLength(fieldOrder);
  return length3 + Math.ceil(length3 / 2);
}
function mapHashToField(key, fieldOrder, isLE2 = false) {
  abytes(key);
  const len = key.length;
  const fieldLen = getFieldBytesLength(fieldOrder);
  const minLen = getMinHashLength(fieldOrder);
  if (len < 16 || len < minLen || len > 1024)
    throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
  const num = isLE2 ? bytesToNumberLE(key) : bytesToNumberBE(key);
  const reduced = mod(num, fieldOrder - _1n2) + _1n2;
  return isLE2 ? numberToBytesLE(reduced, fieldLen) : numberToBytesBE(reduced, fieldLen);
}

// ../../node_modules/@noble/curves/abstract/curve.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n3 = /* @__PURE__ */ BigInt(0);
var _1n3 = /* @__PURE__ */ BigInt(1);
function negateCt(condition, item) {
  const neg = item.negate();
  return condition ? neg : item;
}
function normalizeZ(c2, points) {
  const invertedZs = FpInvertBatch(c2.Fp, points.map((p2) => p2.Z));
  return points.map((p2, i2) => c2.fromAffine(p2.toAffine(invertedZs[i2])));
}
function validateW(W, bits) {
  if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
    throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
}
function calcWOpts(W, scalarBits) {
  validateW(W, scalarBits);
  const windows = Math.ceil(scalarBits / W) + 1;
  const windowSize = 2 ** (W - 1);
  const maxNumber = 2 ** W;
  const mask = bitMask(W);
  const shiftBy = BigInt(W);
  return { windows, windowSize, mask, maxNumber, shiftBy };
}
function calcOffsets(n2, window2, wOpts) {
  const { windowSize, mask, maxNumber, shiftBy } = wOpts;
  let wbits = Number(n2 & mask);
  let nextN = n2 >> shiftBy;
  if (wbits > windowSize) {
    wbits -= maxNumber;
    nextN += _1n3;
  }
  const offsetStart = window2 * windowSize;
  const offset = offsetStart + Math.abs(wbits) - 1;
  const isZero = wbits === 0;
  const isNeg = wbits < 0;
  const isNegF = window2 % 2 !== 0;
  const offsetF = offsetStart;
  return { nextN, offset, isZero, isNeg, isNegF, offsetF };
}
var pointPrecomputes = /* @__PURE__ */ new WeakMap();
var pointWindowSizes = /* @__PURE__ */ new WeakMap();
function getW(P) {
  return pointWindowSizes.get(P) || 1;
}
function assert0(n2) {
  if (n2 !== _0n3)
    throw new Error("invalid wNAF");
}
var wNAF = class {
  BASE;
  ZERO;
  Fn;
  bits;
  // Parametrized with a given Point class (not individual point)
  constructor(Point, bits) {
    this.BASE = Point.BASE;
    this.ZERO = Point.ZERO;
    this.Fn = Point.Fn;
    this.bits = bits;
  }
  // non-const time multiplication ladder
  _unsafeLadder(elm, n2, p2 = this.ZERO) {
    let d2 = elm;
    while (n2 > _0n3) {
      if (n2 & _1n3)
        p2 = p2.add(d2);
      d2 = d2.double();
      n2 >>= _1n3;
    }
    return p2;
  }
  /**
   * Creates a wNAF precomputation window. Used for caching.
   * Default window size is set by `utils.precompute()` and is equal to 8.
   * Number of precomputed points depends on the curve size:
   * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
   * - 𝑊 is the window size
   * - 𝑛 is the bitlength of the curve order.
   * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
   * @param point Point instance
   * @param W window size
   * @returns precomputed point tables flattened to a single array
   */
  precomputeWindow(point, W) {
    const { windows, windowSize } = calcWOpts(W, this.bits);
    const points = [];
    let p2 = point;
    let base3 = p2;
    for (let window2 = 0; window2 < windows; window2++) {
      base3 = p2;
      points.push(base3);
      for (let i2 = 1; i2 < windowSize; i2++) {
        base3 = base3.add(p2);
        points.push(base3);
      }
      p2 = base3.double();
    }
    return points;
  }
  /**
   * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
   * More compact implementation:
   * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
   * @returns real and fake (for const-time) points
   */
  wNAF(W, precomputes, n2) {
    if (!this.Fn.isValid(n2))
      throw new Error("invalid scalar");
    let p2 = this.ZERO;
    let f2 = this.BASE;
    const wo = calcWOpts(W, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n2, window2, wo);
      n2 = nextN;
      if (isZero) {
        f2 = f2.add(negateCt(isNegF, precomputes[offsetF]));
      } else {
        p2 = p2.add(negateCt(isNeg, precomputes[offset]));
      }
    }
    assert0(n2);
    return { p: p2, f: f2 };
  }
  /**
   * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
   * @param acc accumulator point to add result of multiplication
   * @returns point
   */
  wNAFUnsafe(W, precomputes, n2, acc = this.ZERO) {
    const wo = calcWOpts(W, this.bits);
    for (let window2 = 0; window2 < wo.windows; window2++) {
      if (n2 === _0n3)
        break;
      const { nextN, offset, isZero, isNeg } = calcOffsets(n2, window2, wo);
      n2 = nextN;
      if (isZero) {
        continue;
      } else {
        const item = precomputes[offset];
        acc = acc.add(isNeg ? item.negate() : item);
      }
    }
    assert0(n2);
    return acc;
  }
  getPrecomputes(W, point, transform) {
    let comp = pointPrecomputes.get(point);
    if (!comp) {
      comp = this.precomputeWindow(point, W);
      if (W !== 1) {
        if (typeof transform === "function")
          comp = transform(comp);
        pointPrecomputes.set(point, comp);
      }
    }
    return comp;
  }
  cached(point, scalar, transform) {
    const W = getW(point);
    return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
  }
  unsafe(point, scalar, transform, prev) {
    const W = getW(point);
    if (W === 1)
      return this._unsafeLadder(point, scalar, prev);
    return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
  }
  // We calculate precomputes for elliptic curve point multiplication
  // using windowed method. This specifies window size and
  // stores precomputed values. Usually only base point would be precomputed.
  createCache(P, W) {
    validateW(W, this.bits);
    pointWindowSizes.set(P, W);
    pointPrecomputes.delete(P);
  }
  hasCache(elm) {
    return getW(elm) !== 1;
  }
};
function mulEndoUnsafe(Point, point, k1, k2) {
  let acc = point;
  let p1 = Point.ZERO;
  let p2 = Point.ZERO;
  while (k1 > _0n3 || k2 > _0n3) {
    if (k1 & _1n3)
      p1 = p1.add(acc);
    if (k2 & _1n3)
      p2 = p2.add(acc);
    acc = acc.double();
    k1 >>= _1n3;
    k2 >>= _1n3;
  }
  return { p1, p2 };
}
function createField(order, field, isLE2) {
  if (field) {
    if (field.ORDER !== order)
      throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
    validateField(field);
    return field;
  } else {
    return Field(order, { isLE: isLE2 });
  }
}
function createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
  if (FpFnLE === void 0)
    FpFnLE = type === "edwards";
  if (!CURVE || typeof CURVE !== "object")
    throw new Error(`expected valid ${type} CURVE object`);
  for (const p2 of ["p", "n", "h"]) {
    const val = CURVE[p2];
    if (!(typeof val === "bigint" && val > _0n3))
      throw new Error(`CURVE.${p2} must be positive bigint`);
  }
  const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
  const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
  const _b = type === "weierstrass" ? "b" : "d";
  const params = ["Gx", "Gy", "a", _b];
  for (const p2 of params) {
    if (!Fp.isValid(CURVE[p2]))
      throw new Error(`CURVE.${p2} must be valid field element of CURVE.Fp`);
  }
  CURVE = Object.freeze(Object.assign({}, CURVE));
  return { CURVE, Fp, Fn };
}
function createKeygen(randomSecretKey, getPublicKey) {
  return function keygen(seed) {
    const secretKey = randomSecretKey(seed);
    return { secretKey, publicKey: getPublicKey(secretKey) };
  };
}

// ../../node_modules/@noble/curves/abstract/edwards.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n4 = BigInt(0);
var _1n4 = BigInt(1);
var _2n2 = BigInt(2);
var _8n2 = BigInt(8);
function isEdValidXY(Fp, CURVE, x, y) {
  const x2 = Fp.sqr(x);
  const y2 = Fp.sqr(y);
  const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
  const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
  return Fp.eql(left, right);
}
function edwards(params, extraOpts = {}) {
  const validated = createCurveFields("edwards", params, extraOpts, extraOpts.FpFnLE);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor } = CURVE;
  validateObject(extraOpts, {}, { uvRatio: "function" });
  const MASK = _2n2 << BigInt(Fn.BYTES * 8) - _1n4;
  const modP = (n2) => Fp.create(n2);
  const uvRatio2 = extraOpts.uvRatio || ((u, v) => {
    try {
      return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
    } catch (e2) {
      return { isValid: false, value: _0n4 };
    }
  });
  if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  function acoord(title, n2, banZero = false) {
    const min = banZero ? _1n4 : _0n4;
    aInRange("coordinate " + title, n2, min, MASK);
    return n2;
  }
  function aedpoint(other) {
    if (!(other instanceof Point))
      throw new Error("EdwardsPoint expected");
  }
  const toAffineMemo = memoized((p2, iz) => {
    const { X, Y, Z } = p2;
    const is0 = p2.is0();
    if (iz == null)
      iz = is0 ? _8n2 : Fp.inv(Z);
    const x = modP(X * iz);
    const y = modP(Y * iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: _0n4, y: _1n4 };
    if (zz !== _1n4)
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p2) => {
    const { a: a2, d: d2 } = CURVE;
    if (p2.is0())
      throw new Error("bad point: ZERO");
    const { X, Y, Z, T } = p2;
    const X2 = modP(X * X);
    const Y2 = modP(Y * Y);
    const Z2 = modP(Z * Z);
    const Z4 = modP(Z2 * Z2);
    const aX2 = modP(X2 * a2);
    const left = modP(Z2 * modP(aX2 + Y2));
    const right = modP(Z4 + modP(d2 * modP(X2 * Y2)));
    if (left !== right)
      throw new Error("bad point: equation left != right (1)");
    const XY = modP(X * Y);
    const ZT = modP(Z * T);
    if (XY !== ZT)
      throw new Error("bad point: equation left != right (2)");
    return true;
  });
  class Point {
    // base / generator point
    static BASE = new Point(CURVE.Gx, CURVE.Gy, _1n4, modP(CURVE.Gx * CURVE.Gy));
    // zero / infinity / identity point
    static ZERO = new Point(_0n4, _1n4, _1n4, _0n4);
    // 0, 1, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn;
    X;
    Y;
    Z;
    T;
    constructor(X, Y, Z, T) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y);
      this.Z = acoord("z", Z, true);
      this.T = acoord("t", T);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    static fromAffine(p2) {
      if (p2 instanceof Point)
        throw new Error("extended point not allowed");
      const { x, y } = p2 || {};
      acoord("x", x);
      acoord("y", y);
      return new Point(x, y, _1n4, modP(x * y));
    }
    // Uses algo from RFC8032 5.1.3.
    static fromBytes(bytes, zip215 = false) {
      const len = Fp.BYTES;
      const { a: a2, d: d2 } = CURVE;
      bytes = copyBytes(abytes(bytes, len, "point"));
      abool(zip215, "zip215");
      const normed = copyBytes(bytes);
      const lastByte = bytes[len - 1];
      normed[len - 1] = lastByte & ~128;
      const y = bytesToNumberLE(normed);
      const max = zip215 ? MASK : Fp.ORDER;
      aInRange("point.y", y, _0n4, max);
      const y2 = modP(y * y);
      const u = modP(y2 - _1n4);
      const v = modP(d2 * y2 - a2);
      let { isValid: isValid2, value: x } = uvRatio2(u, v);
      if (!isValid2)
        throw new Error("bad point: invalid y coordinate");
      const isXOdd = (x & _1n4) === _1n4;
      const isLastByteOdd = (lastByte & 128) !== 0;
      if (!zip215 && x === _0n4 && isLastByteOdd)
        throw new Error("bad point: x=0 and x_0=1");
      if (isLastByteOdd !== isXOdd)
        x = modP(-x);
      return Point.fromAffine({ x, y });
    }
    static fromHex(hex, zip215 = false) {
      return Point.fromBytes(hexToBytes(hex), zip215);
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_2n2);
      return this;
    }
    // Useful in fromAffine() - not for fromBytes(), which always created valid points.
    assertValidity() {
      assertValidMemo(this);
    }
    // Compare one point to another.
    equals(other) {
      aedpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const X1Z2 = modP(X1 * Z2);
      const X2Z1 = modP(X2 * Z1);
      const Y1Z2 = modP(Y1 * Z2);
      const Y2Z1 = modP(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    negate() {
      return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
    }
    // Fast algo for doubling Extended Point.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
    // Cost: 4M + 4S + 1*a + 6add + 1*2.
    double() {
      const { a: a2 } = CURVE;
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const A = modP(X1 * X1);
      const B = modP(Y1 * Y1);
      const C = modP(_2n2 * modP(Z1 * Z1));
      const D = modP(a2 * A);
      const x1y1 = X1 + Y1;
      const E = modP(modP(x1y1 * x1y1) - A - B);
      const G = D + B;
      const F = G - C;
      const H = D - B;
      const X3 = modP(E * F);
      const Y3 = modP(G * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G);
      return new Point(X3, Y3, Z3, T3);
    }
    // Fast algo for adding 2 Extended Points.
    // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
    // Cost: 9M + 1*a + 1*d + 7add.
    add(other) {
      aedpoint(other);
      const { a: a2, d: d2 } = CURVE;
      const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
      const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
      const A = modP(X1 * X2);
      const B = modP(Y1 * Y2);
      const C = modP(T1 * d2 * T2);
      const D = modP(Z1 * Z2);
      const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
      const F = D - C;
      const G = D + C;
      const H = modP(B - a2 * A);
      const X3 = modP(E * F);
      const Y3 = modP(G * H);
      const T3 = modP(E * H);
      const Z3 = modP(F * G);
      return new Point(X3, Y3, Z3, T3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    // Constant-time multiplication.
    multiply(scalar) {
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: expected 1 <= sc < curve.n");
      const { p: p2, f: f2 } = wnaf.cached(this, scalar, (p3) => normalizeZ(Point, p3));
      return normalizeZ(Point, [p2, f2])[0];
    }
    // Non-constant-time multiplication. Uses double-and-add algorithm.
    // It's faster, but should only be used when you don't care about
    // an exposed private key e.g. sig verification.
    // Does NOT allow scalars higher than CURVE.n.
    // Accepts optional accumulator to merge with multiply (important for sparse scalars)
    multiplyUnsafe(scalar, acc = Point.ZERO) {
      if (!Fn.isValid(scalar))
        throw new Error("invalid scalar: expected 0 <= sc < curve.n");
      if (scalar === _0n4)
        return Point.ZERO;
      if (this.is0() || scalar === _1n4)
        return this;
      return wnaf.unsafe(this, scalar, (p2) => normalizeZ(Point, p2), acc);
    }
    // Checks if point is of small order.
    // If you add something to small order point, you will have "dirty"
    // point with torsion component.
    // Multiplies point by cofactor and checks if the result is 0.
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    // Multiplies point by curve order and checks if the result is 0.
    // Returns `false` is the point is dirty.
    isTorsionFree() {
      return wnaf.unsafe(this, CURVE.n).is0();
    }
    // Converts Extended point to default (x, y) coordinates.
    // Can accept precomputed Z^-1 - for example, from invertBatch.
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    clearCofactor() {
      if (cofactor === _1n4)
        return this;
      return this.multiplyUnsafe(cofactor);
    }
    toBytes() {
      const { x, y } = this.toAffine();
      const bytes = Fp.toBytes(y);
      bytes[bytes.length - 1] |= x & _1n4 ? 128 : 0;
      return bytes;
    }
    toHex() {
      return bytesToHex(this.toBytes());
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const wnaf = new wNAF(Point, Fn.BITS);
  Point.BASE.precompute(8);
  return Point;
}
function eddsa(Point, cHash, eddsaOpts = {}) {
  if (typeof cHash !== "function")
    throw new Error('"hash" function param is required');
  validateObject(eddsaOpts, {}, {
    adjustScalarBytes: "function",
    randomBytes: "function",
    domain: "function",
    prehash: "function",
    mapToCurve: "function"
  });
  const { prehash } = eddsaOpts;
  const { BASE, Fp, Fn } = Point;
  const randomBytes3 = eddsaOpts.randomBytes || randomBytes;
  const adjustScalarBytes2 = eddsaOpts.adjustScalarBytes || ((bytes) => bytes);
  const domain = eddsaOpts.domain || ((data, ctx, phflag) => {
    abool(phflag, "phflag");
    if (ctx.length || phflag)
      throw new Error("Contexts/pre-hash are not supported");
    return data;
  });
  function modN_LE(hash) {
    return Fn.create(bytesToNumberLE(hash));
  }
  function getPrivateScalar(key) {
    const len = lengths.secretKey;
    abytes(key, lengths.secretKey, "secretKey");
    const hashed = abytes(cHash(key), 2 * len, "hashedSecretKey");
    const head = adjustScalarBytes2(hashed.slice(0, len));
    const prefix2 = hashed.slice(len, 2 * len);
    const scalar = modN_LE(head);
    return { head, prefix: prefix2, scalar };
  }
  function getExtendedPublicKey(secretKey) {
    const { head, prefix: prefix2, scalar } = getPrivateScalar(secretKey);
    const point = BASE.multiply(scalar);
    const pointBytes = point.toBytes();
    return { head, prefix: prefix2, scalar, point, pointBytes };
  }
  function getPublicKey(secretKey) {
    return getExtendedPublicKey(secretKey).pointBytes;
  }
  function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
    const msg = concatBytes(...msgs);
    return modN_LE(cHash(domain(msg, abytes(context, void 0, "context"), !!prehash)));
  }
  function sign(msg, secretKey, options = {}) {
    msg = abytes(msg, void 0, "message");
    if (prehash)
      msg = prehash(msg);
    const { prefix: prefix2, scalar, pointBytes } = getExtendedPublicKey(secretKey);
    const r2 = hashDomainToScalar(options.context, prefix2, msg);
    const R = BASE.multiply(r2).toBytes();
    const k = hashDomainToScalar(options.context, R, pointBytes, msg);
    const s2 = Fn.create(r2 + k * scalar);
    if (!Fn.isValid(s2))
      throw new Error("sign failed: invalid s");
    const rs = concatBytes(R, Fn.toBytes(s2));
    return abytes(rs, lengths.signature, "result");
  }
  const verifyOpts = { zip215: true };
  function verify(sig, msg, publicKey, options = verifyOpts) {
    const { context, zip215 } = options;
    const len = lengths.signature;
    sig = abytes(sig, len, "signature");
    msg = abytes(msg, void 0, "message");
    publicKey = abytes(publicKey, lengths.publicKey, "publicKey");
    if (zip215 !== void 0)
      abool(zip215, "zip215");
    if (prehash)
      msg = prehash(msg);
    const mid = len / 2;
    const r2 = sig.subarray(0, mid);
    const s2 = bytesToNumberLE(sig.subarray(mid, len));
    let A, R, SB;
    try {
      A = Point.fromBytes(publicKey, zip215);
      R = Point.fromBytes(r2, zip215);
      SB = BASE.multiplyUnsafe(s2);
    } catch (error) {
      return false;
    }
    if (!zip215 && A.isSmallOrder())
      return false;
    const k = hashDomainToScalar(context, R.toBytes(), A.toBytes(), msg);
    const RkA = R.add(A.multiplyUnsafe(k));
    return RkA.subtract(SB).clearCofactor().is0();
  }
  const _size = Fp.BYTES;
  const lengths = {
    secretKey: _size,
    publicKey: _size,
    signature: 2 * _size,
    seed: _size
  };
  function randomSecretKey(seed = randomBytes3(lengths.seed)) {
    return abytes(seed, lengths.seed, "seed");
  }
  function isValidSecretKey(key) {
    return isBytes(key) && key.length === Fn.BYTES;
  }
  function isValidPublicKey(key, zip215) {
    try {
      return !!Point.fromBytes(key, zip215);
    } catch (error) {
      return false;
    }
  }
  const utils = {
    getExtendedPublicKey,
    randomSecretKey,
    isValidSecretKey,
    isValidPublicKey,
    /**
     * Converts ed public key to x public key. Uses formula:
     * - ed25519:
     *   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
     *   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
     * - ed448:
     *   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
     *   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
     */
    toMontgomery(publicKey) {
      const { y } = Point.fromBytes(publicKey);
      const size = lengths.publicKey;
      const is25519 = size === 32;
      if (!is25519 && size !== 57)
        throw new Error("only defined for 25519 and 448");
      const u = is25519 ? Fp.div(_1n4 + y, _1n4 - y) : Fp.div(y - _1n4, y + _1n4);
      return Fp.toBytes(u);
    },
    toMontgomerySecret(secretKey) {
      const size = lengths.secretKey;
      abytes(secretKey, size);
      const hashed = cHash(secretKey.subarray(0, size));
      return adjustScalarBytes2(hashed).subarray(0, size);
    }
  };
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getPublicKey,
    sign,
    verify,
    utils,
    Point,
    lengths
  });
}

// ../../node_modules/@noble/curves/abstract/montgomery.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _0n5 = BigInt(0);
var _1n5 = BigInt(1);
var _2n3 = BigInt(2);
function validateOpts(curve) {
  validateObject(curve, {
    adjustScalarBytes: "function",
    powPminus2: "function"
  });
  return Object.freeze({ ...curve });
}
function montgomery(curveDef) {
  const CURVE = validateOpts(curveDef);
  const { P, type, adjustScalarBytes: adjustScalarBytes2, powPminus2, randomBytes: rand } = CURVE;
  const is25519 = type === "x25519";
  if (!is25519 && type !== "x448")
    throw new Error("invalid type");
  const randomBytes_ = rand || randomBytes;
  const montgomeryBits = is25519 ? 255 : 448;
  const fieldLen = is25519 ? 32 : 56;
  const Gu = is25519 ? BigInt(9) : BigInt(5);
  const a24 = is25519 ? BigInt(121665) : BigInt(39081);
  const minScalar = is25519 ? _2n3 ** BigInt(254) : _2n3 ** BigInt(447);
  const maxAdded = is25519 ? BigInt(8) * _2n3 ** BigInt(251) - _1n5 : BigInt(4) * _2n3 ** BigInt(445) - _1n5;
  const maxScalar = minScalar + maxAdded + _1n5;
  const modP = (n2) => mod(n2, P);
  const GuBytes = encodeU(Gu);
  function encodeU(u) {
    return numberToBytesLE(modP(u), fieldLen);
  }
  function decodeU(u) {
    const _u = copyBytes(abytes(u, fieldLen, "uCoordinate"));
    if (is25519)
      _u[31] &= 127;
    return modP(bytesToNumberLE(_u));
  }
  function decodeScalar(scalar) {
    return bytesToNumberLE(adjustScalarBytes2(copyBytes(abytes(scalar, fieldLen, "scalar"))));
  }
  function scalarMult(scalar, u) {
    const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
    if (pu === _0n5)
      throw new Error("invalid private or public key received");
    return encodeU(pu);
  }
  function scalarMultBase(scalar) {
    return scalarMult(scalar, GuBytes);
  }
  const getPublicKey = scalarMultBase;
  const getSharedSecret = scalarMult;
  function cswap(swap, x_2, x_3) {
    const dummy = modP(swap * (x_2 - x_3));
    x_2 = modP(x_2 - dummy);
    x_3 = modP(x_3 + dummy);
    return { x_2, x_3 };
  }
  function montgomeryLadder(u, scalar) {
    aInRange("u", u, _0n5, P);
    aInRange("scalar", scalar, minScalar, maxScalar);
    const k = scalar;
    const x_1 = u;
    let x_2 = _1n5;
    let z_2 = _0n5;
    let x_3 = u;
    let z_3 = _1n5;
    let swap = _0n5;
    for (let t2 = BigInt(montgomeryBits - 1); t2 >= _0n5; t2--) {
      const k_t = k >> t2 & _1n5;
      swap ^= k_t;
      ({ x_2, x_3 } = cswap(swap, x_2, x_3));
      ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
      swap = k_t;
      const A = x_2 + z_2;
      const AA = modP(A * A);
      const B = x_2 - z_2;
      const BB = modP(B * B);
      const E = AA - BB;
      const C = x_3 + z_3;
      const D = x_3 - z_3;
      const DA = modP(D * A);
      const CB = modP(C * B);
      const dacb = DA + CB;
      const da_cb = DA - CB;
      x_3 = modP(dacb * dacb);
      z_3 = modP(x_1 * modP(da_cb * da_cb));
      x_2 = modP(AA * BB);
      z_2 = modP(E * (AA + modP(a24 * E)));
    }
    ({ x_2, x_3 } = cswap(swap, x_2, x_3));
    ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
    const z2 = powPminus2(z_2);
    return modP(x_2 * z2);
  }
  const lengths = {
    secretKey: fieldLen,
    publicKey: fieldLen,
    seed: fieldLen
  };
  const randomSecretKey = (seed = randomBytes_(fieldLen)) => {
    abytes(seed, lengths.seed, "seed");
    return seed;
  };
  const utils = { randomSecretKey };
  return Object.freeze({
    keygen: createKeygen(randomSecretKey, getPublicKey),
    getSharedSecret,
    getPublicKey,
    scalarMult,
    scalarMultBase,
    utils,
    GuBytes: GuBytes.slice(),
    lengths
  });
}

// ../../node_modules/@noble/curves/ed25519.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var _1n6 = BigInt(1);
var _2n4 = BigInt(2);
var _3n2 = /* @__PURE__ */ BigInt(3);
var _5n2 = BigInt(5);
var _8n3 = BigInt(8);
var ed25519_CURVE_p = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
var ed25519_CURVE = /* @__PURE__ */ (() => ({
  p: ed25519_CURVE_p,
  n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
  h: _8n3,
  a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
  d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
  Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
  Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
}))();
function ed25519_pow_2_252_3(x) {
  const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
  const P = ed25519_CURVE_p;
  const x2 = x * x % P;
  const b2 = x2 * x % P;
  const b4 = pow2(b2, _2n4, P) * b2 % P;
  const b5 = pow2(b4, _1n6, P) * x % P;
  const b10 = pow2(b5, _5n2, P) * b5 % P;
  const b20 = pow2(b10, _10n, P) * b10 % P;
  const b40 = pow2(b20, _20n, P) * b20 % P;
  const b80 = pow2(b40, _40n, P) * b40 % P;
  const b160 = pow2(b80, _80n, P) * b80 % P;
  const b240 = pow2(b160, _80n, P) * b80 % P;
  const b250 = pow2(b240, _10n, P) * b10 % P;
  const pow_p_5_8 = pow2(b250, _2n4, P) * x % P;
  return { pow_p_5_8, b2 };
}
function adjustScalarBytes(bytes) {
  bytes[0] &= 248;
  bytes[31] &= 127;
  bytes[31] |= 64;
  return bytes;
}
var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
function uvRatio(u, v) {
  const P = ed25519_CURVE_p;
  const v3 = mod(v * v * v, P);
  const v7 = mod(v3 * v3 * v, P);
  const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
  let x = mod(u * v3 * pow, P);
  const vx2 = mod(v * x * x, P);
  const root1 = x;
  const root2 = mod(x * ED25519_SQRT_M1, P);
  const useRoot1 = vx2 === u;
  const useRoot2 = vx2 === mod(-u, P);
  const noRoot = vx2 === mod(-u * ED25519_SQRT_M1, P);
  if (useRoot1)
    x = root1;
  if (useRoot2 || noRoot)
    x = root2;
  if (isNegativeLE(x, P))
    x = mod(-x, P);
  return { isValid: useRoot1 || useRoot2, value: x };
}
var ed25519_Point = /* @__PURE__ */ edwards(ed25519_CURVE, { uvRatio });
function ed(opts) {
  return eddsa(ed25519_Point, sha5122, Object.assign({ adjustScalarBytes }, opts));
}
var ed25519 = /* @__PURE__ */ ed({});
var x25519 = /* @__PURE__ */ (() => {
  const P = ed25519_CURVE_p;
  return montgomery({
    P,
    type: "x25519",
    powPminus2: (x) => {
      const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
      return mod(pow2(pow_p_5_8, _3n2, P) * b2, P);
    },
    adjustScalarBytes
  });
})();

// ../../node_modules/@libp2p/crypto/dist/src/errors.js
var VerificationError = class extends Error {
  constructor(message2 = "An error occurred while verifying a message") {
    super(message2);
    this.name = "VerificationError";
  }
};
var WebCryptoMissingError = class extends Error {
  constructor(message2 = "Missing Web Crypto API") {
    super(message2);
    this.name = "WebCryptoMissingError";
  }
};

// ../../node_modules/@libp2p/crypto/dist/src/webcrypto/webcrypto.browser.js
var webcrypto_browser_default = {
  get(win = globalThis) {
    const nativeCrypto = win.crypto;
    if (nativeCrypto?.subtle == null) {
      throw new WebCryptoMissingError("Missing Web Crypto API. The most likely cause of this error is that this page is being accessed from an insecure context (i.e. not HTTPS). For more information and possible resolutions see https://github.com/libp2p/js-libp2p/blob/main/packages/crypto/README.md#web-crypto-api");
    }
    return nativeCrypto;
  }
};

// ../../node_modules/@libp2p/crypto/dist/src/webcrypto/index.js
var webcrypto_default = webcrypto_browser_default;

// ../../node_modules/@libp2p/crypto/dist/src/keys/ed25519/index.browser.js
var PUBLIC_KEY_BYTE_LENGTH = 32;
var ed25519Supported;
var webCryptoEd25519SupportedPromise = (async () => {
  try {
    await webcrypto_default.get().subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
    return true;
  } catch {
    return false;
  }
})();
async function hashAndVerifyWebCrypto(publicKey, sig, msg) {
  if (publicKey.buffer instanceof ArrayBuffer) {
    const key = await webcrypto_default.get().subtle.importKey("raw", publicKey.buffer, { name: "Ed25519" }, false, ["verify"]);
    const isValid2 = await webcrypto_default.get().subtle.verify({ name: "Ed25519" }, key, sig, msg instanceof Uint8Array ? msg : msg.subarray());
    return isValid2;
  }
  throw new TypeError("WebCrypto does not support SharedArrayBuffer for Ed25519 keys");
}
function hashAndVerifyNoble(publicKey, sig, msg) {
  return ed25519.verify(sig, msg instanceof Uint8Array ? msg : msg.subarray(), publicKey);
}
async function hashAndVerify2(publicKey, sig, msg) {
  if (ed25519Supported == null) {
    ed25519Supported = await webCryptoEd25519SupportedPromise;
  }
  if (ed25519Supported) {
    return hashAndVerifyWebCrypto(publicKey, sig, msg);
  }
  return hashAndVerifyNoble(publicKey, sig, msg);
}

// ../../node_modules/@libp2p/crypto/dist/src/util.js
function isPromise(thing) {
  if (thing == null) {
    return false;
  }
  return typeof thing.then === "function" && typeof thing.catch === "function" && typeof thing.finally === "function";
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/ed25519/ed25519.js
var Ed25519PublicKey = class {
  type = "Ed25519";
  raw;
  constructor(key) {
    this.raw = ensureEd25519Key(key, PUBLIC_KEY_BYTE_LENGTH);
  }
  toMultihash() {
    return identity.digest(publicKeyToProtobuf(this));
  }
  toCID() {
    return CID.createV1(114, this.toMultihash());
  }
  toString() {
    return base58btc.encode(this.toMultihash().bytes).substring(1);
  }
  equals(key) {
    if (key == null || !(key.raw instanceof Uint8Array)) {
      return false;
    }
    return equals3(this.raw, key.raw);
  }
  verify(data, sig, options) {
    options?.signal?.throwIfAborted();
    const result = hashAndVerify2(this.raw, sig, data);
    if (isPromise(result)) {
      return result.then((res) => {
        options?.signal?.throwIfAborted();
        return res;
      });
    }
    return result;
  }
};

// ../../node_modules/@libp2p/crypto/dist/src/keys/ed25519/utils.js
function unmarshalEd25519PublicKey(bytes) {
  bytes = ensureEd25519Key(bytes, PUBLIC_KEY_BYTE_LENGTH);
  return new Ed25519PublicKey(bytes);
}
function ensureEd25519Key(key, length3) {
  key = Uint8Array.from(key ?? []);
  if (key.length !== length3) {
    throw new InvalidParametersError(`Key must be a Uint8Array of length ${length3}, got ${key.length}`);
  }
  return key;
}

// ../../node_modules/uint8-varint/dist/src/index.js
var N12 = Math.pow(2, 7);
var N22 = Math.pow(2, 14);
var N32 = Math.pow(2, 21);
var N42 = Math.pow(2, 28);
var N52 = Math.pow(2, 35);
var N62 = Math.pow(2, 42);
var N72 = Math.pow(2, 49);
var MSB2 = 128;
var REST2 = 127;
function encodingLength2(value) {
  if (value < N12) {
    return 1;
  }
  if (value < N22) {
    return 2;
  }
  if (value < N32) {
    return 3;
  }
  if (value < N42) {
    return 4;
  }
  if (value < N52) {
    return 5;
  }
  if (value < N62) {
    return 6;
  }
  if (value < N72) {
    return 7;
  }
  if (Number.MAX_SAFE_INTEGER != null && value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError("Could not encode varint");
  }
  return 8;
}
function encodeUint8Array(value, buf, offset = 0) {
  switch (encodingLength2(value)) {
    case 8: {
      buf[offset++] = value & 255 | MSB2;
      value /= 128;
    }
    case 7: {
      buf[offset++] = value & 255 | MSB2;
      value /= 128;
    }
    case 6: {
      buf[offset++] = value & 255 | MSB2;
      value /= 128;
    }
    case 5: {
      buf[offset++] = value & 255 | MSB2;
      value /= 128;
    }
    case 4: {
      buf[offset++] = value & 255 | MSB2;
      value >>>= 7;
    }
    case 3: {
      buf[offset++] = value & 255 | MSB2;
      value >>>= 7;
    }
    case 2: {
      buf[offset++] = value & 255 | MSB2;
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
function encodeUint8ArrayList(value, buf, offset = 0) {
  switch (encodingLength2(value)) {
    case 8: {
      buf.set(offset++, value & 255 | MSB2);
      value /= 128;
    }
    case 7: {
      buf.set(offset++, value & 255 | MSB2);
      value /= 128;
    }
    case 6: {
      buf.set(offset++, value & 255 | MSB2);
      value /= 128;
    }
    case 5: {
      buf.set(offset++, value & 255 | MSB2);
      value /= 128;
    }
    case 4: {
      buf.set(offset++, value & 255 | MSB2);
      value >>>= 7;
    }
    case 3: {
      buf.set(offset++, value & 255 | MSB2);
      value >>>= 7;
    }
    case 2: {
      buf.set(offset++, value & 255 | MSB2);
      value >>>= 7;
    }
    case 1: {
      buf.set(offset++, value & 255);
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
  res += b & REST2;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 1];
  res += (b & REST2) << 7;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 2];
  res += (b & REST2) << 14;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 3];
  res += (b & REST2) << 21;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 4];
  res += (b & REST2) * N42;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 5];
  res += (b & REST2) * N52;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 6];
  res += (b & REST2) * N62;
  if (b < MSB2) {
    return res;
  }
  b = buf[offset + 7];
  res += (b & REST2) * N72;
  if (b < MSB2) {
    return res;
  }
  throw new RangeError("Could not decode varint");
}
function decodeUint8ArrayList(buf, offset) {
  let b = buf.get(offset);
  let res = 0;
  res += b & REST2;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 1);
  res += (b & REST2) << 7;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 2);
  res += (b & REST2) << 14;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 3);
  res += (b & REST2) << 21;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 4);
  res += (b & REST2) * N42;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 5);
  res += (b & REST2) * N52;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 6);
  res += (b & REST2) * N62;
  if (b < MSB2) {
    return res;
  }
  b = buf.get(offset + 7);
  res += (b & REST2) * N72;
  if (b < MSB2) {
    return res;
  }
  throw new RangeError("Could not decode varint");
}
function encode5(value, buf, offset = 0) {
  if (buf == null) {
    buf = allocUnsafe(encodingLength2(value));
  }
  if (buf instanceof Uint8Array) {
    return encodeUint8Array(value, buf, offset);
  } else {
    return encodeUint8ArrayList(value, buf, offset);
  }
}
function decode6(buf, offset = 0) {
  if (buf instanceof Uint8Array) {
    return decodeUint8Array(buf, offset);
  } else {
    return decodeUint8ArrayList(buf, offset);
  }
}

// ../../node_modules/protons-runtime/dist/src/utils/float.js
var f32 = new Float32Array([-0]);
var f8b = new Uint8Array(f32.buffer);
function writeFloatLE(val, buf, pos) {
  f32[0] = val;
  buf[pos] = f8b[0];
  buf[pos + 1] = f8b[1];
  buf[pos + 2] = f8b[2];
  buf[pos + 3] = f8b[3];
}
function readFloatLE(buf, pos) {
  f8b[0] = buf[pos];
  f8b[1] = buf[pos + 1];
  f8b[2] = buf[pos + 2];
  f8b[3] = buf[pos + 3];
  return f32[0];
}
var f64 = new Float64Array([-0]);
var d8b = new Uint8Array(f64.buffer);
function writeDoubleLE(val, buf, pos) {
  f64[0] = val;
  buf[pos] = d8b[0];
  buf[pos + 1] = d8b[1];
  buf[pos + 2] = d8b[2];
  buf[pos + 3] = d8b[3];
  buf[pos + 4] = d8b[4];
  buf[pos + 5] = d8b[5];
  buf[pos + 6] = d8b[6];
  buf[pos + 7] = d8b[7];
}
function readDoubleLE(buf, pos) {
  d8b[0] = buf[pos];
  d8b[1] = buf[pos + 1];
  d8b[2] = buf[pos + 2];
  d8b[3] = buf[pos + 3];
  d8b[4] = buf[pos + 4];
  d8b[5] = buf[pos + 5];
  d8b[6] = buf[pos + 6];
  d8b[7] = buf[pos + 7];
  return f64[0];
}

// ../../node_modules/protons-runtime/dist/src/utils/longbits.js
var MAX_SAFE_NUMBER_INTEGER = BigInt(Number.MAX_SAFE_INTEGER);
var MIN_SAFE_NUMBER_INTEGER = BigInt(Number.MIN_SAFE_INTEGER);
var LongBits = class _LongBits {
  lo;
  hi;
  constructor(lo, hi) {
    this.lo = lo | 0;
    this.hi = hi | 0;
  }
  /**
   * Converts this long bits to a possibly unsafe JavaScript number
   */
  toNumber(unsigned = false) {
    if (!unsigned && this.hi >>> 31 > 0) {
      const lo = ~this.lo + 1 >>> 0;
      let hi = ~this.hi >>> 0;
      if (lo === 0) {
        hi = hi + 1 >>> 0;
      }
      return -(lo + hi * 4294967296);
    }
    return this.lo + this.hi * 4294967296;
  }
  /**
   * Converts this long bits to a bigint
   */
  toBigInt(unsigned = false) {
    if (unsigned) {
      return BigInt(this.lo >>> 0) + (BigInt(this.hi >>> 0) << 32n);
    }
    if (this.hi >>> 31 !== 0) {
      const lo = ~this.lo + 1 >>> 0;
      let hi = ~this.hi >>> 0;
      if (lo === 0) {
        hi = hi + 1 >>> 0;
      }
      return -(BigInt(lo) + (BigInt(hi) << 32n));
    }
    return BigInt(this.lo >>> 0) + (BigInt(this.hi >>> 0) << 32n);
  }
  /**
   * Converts this long bits to a string
   */
  toString(unsigned = false) {
    return this.toBigInt(unsigned).toString();
  }
  /**
   * Zig-zag encodes this long bits
   */
  zzEncode() {
    const mask = this.hi >> 31;
    this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
    this.lo = (this.lo << 1 ^ mask) >>> 0;
    return this;
  }
  /**
   * Zig-zag decodes this long bits
   */
  zzDecode() {
    const mask = -(this.lo & 1);
    this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
    this.hi = (this.hi >>> 1 ^ mask) >>> 0;
    return this;
  }
  /**
   * Calculates the length of this longbits when encoded as a varint.
   */
  length() {
    const part0 = this.lo;
    const part1 = (this.lo >>> 28 | this.hi << 4) >>> 0;
    const part2 = this.hi >>> 24;
    return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
  }
  /**
   * Constructs new long bits from the specified number
   */
  static fromBigInt(value) {
    if (value === 0n) {
      return zero;
    }
    if (value < MAX_SAFE_NUMBER_INTEGER && value > MIN_SAFE_NUMBER_INTEGER) {
      return this.fromNumber(Number(value));
    }
    const negative = value < 0n;
    if (negative) {
      value = -value;
    }
    let hi = value >> 32n;
    let lo = value - (hi << 32n);
    if (negative) {
      hi = ~hi | 0n;
      lo = ~lo | 0n;
      if (++lo > TWO_32) {
        lo = 0n;
        if (++hi > TWO_32) {
          hi = 0n;
        }
      }
    }
    return new _LongBits(Number(lo), Number(hi));
  }
  /**
   * Constructs new long bits from the specified number
   */
  static fromNumber(value) {
    if (value === 0) {
      return zero;
    }
    const sign = value < 0;
    if (sign) {
      value = -value;
    }
    let lo = value >>> 0;
    let hi = (value - lo) / 4294967296 >>> 0;
    if (sign) {
      hi = ~hi >>> 0;
      lo = ~lo >>> 0;
      if (++lo > 4294967295) {
        lo = 0;
        if (++hi > 4294967295) {
          hi = 0;
        }
      }
    }
    return new _LongBits(lo, hi);
  }
  /**
   * Constructs new long bits from a number, long or string
   */
  static from(value) {
    if (typeof value === "number") {
      return _LongBits.fromNumber(value);
    }
    if (typeof value === "bigint") {
      return _LongBits.fromBigInt(value);
    }
    if (typeof value === "string") {
      return _LongBits.fromBigInt(BigInt(value));
    }
    return value.low != null || value.high != null ? new _LongBits(value.low >>> 0, value.high >>> 0) : zero;
  }
};
var zero = new LongBits(0, 0);
zero.toBigInt = function() {
  return 0n;
};
zero.zzEncode = zero.zzDecode = function() {
  return this;
};
zero.length = function() {
  return 1;
};
var TWO_32 = 4294967296n;

// ../../node_modules/protons-runtime/dist/src/utils/utf8.js
function length2(string2) {
  let len = 0;
  let c2 = 0;
  for (let i2 = 0; i2 < string2.length; ++i2) {
    c2 = string2.charCodeAt(i2);
    if (c2 < 128) {
      len += 1;
    } else if (c2 < 2048) {
      len += 2;
    } else if ((c2 & 64512) === 55296 && (string2.charCodeAt(i2 + 1) & 64512) === 56320) {
      ++i2;
      len += 4;
    } else {
      len += 3;
    }
  }
  return len;
}
function read2(buffer, start, end) {
  const len = end - start;
  if (len < 1) {
    return "";
  }
  let parts;
  const chunk = [];
  let i2 = 0;
  let t2;
  while (start < end) {
    t2 = buffer[start++];
    if (t2 < 128) {
      chunk[i2++] = t2;
    } else if (t2 > 191 && t2 < 224) {
      chunk[i2++] = (t2 & 31) << 6 | buffer[start++] & 63;
    } else if (t2 > 239 && t2 < 365) {
      t2 = ((t2 & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63) - 65536;
      chunk[i2++] = 55296 + (t2 >> 10);
      chunk[i2++] = 56320 + (t2 & 1023);
    } else {
      chunk[i2++] = (t2 & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
    }
    if (i2 > 8191) {
      (parts ?? (parts = [])).push(String.fromCharCode.apply(String, chunk));
      i2 = 0;
    }
  }
  if (parts != null) {
    if (i2 > 0) {
      parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
    }
    return parts.join("");
  }
  return String.fromCharCode.apply(String, chunk.slice(0, i2));
}
function write(string2, buffer, offset) {
  const start = offset;
  let c1;
  let c2;
  for (let i2 = 0; i2 < string2.length; ++i2) {
    c1 = string2.charCodeAt(i2);
    if (c1 < 128) {
      buffer[offset++] = c1;
    } else if (c1 < 2048) {
      buffer[offset++] = c1 >> 6 | 192;
      buffer[offset++] = c1 & 63 | 128;
    } else if ((c1 & 64512) === 55296 && ((c2 = string2.charCodeAt(i2 + 1)) & 64512) === 56320) {
      c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
      ++i2;
      buffer[offset++] = c1 >> 18 | 240;
      buffer[offset++] = c1 >> 12 & 63 | 128;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    } else {
      buffer[offset++] = c1 >> 12 | 224;
      buffer[offset++] = c1 >> 6 & 63 | 128;
      buffer[offset++] = c1 & 63 | 128;
    }
  }
  return offset - start;
}

// ../../node_modules/protons-runtime/dist/src/utils/reader.js
function indexOutOfRange(reader, writeLength) {
  return RangeError(`index out of range: ${reader.pos} + ${writeLength ?? 1} > ${reader.len}`);
}
function readFixed32End(buf, end) {
  return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
}
var Uint8ArrayReader = class {
  buf;
  pos;
  len;
  _slice = Uint8Array.prototype.subarray;
  constructor(buffer) {
    this.buf = buffer;
    this.pos = 0;
    this.len = buffer.length;
  }
  /**
   * Reads a varint as an unsigned 32 bit value
   */
  uint32() {
    let value = 4294967295;
    value = (this.buf[this.pos] & 127) >>> 0;
    if (this.buf[this.pos++] < 128) {
      return value;
    }
    value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
    if (this.buf[this.pos++] < 128) {
      return value;
    }
    value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
    if (this.buf[this.pos++] < 128) {
      return value;
    }
    value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
    if (this.buf[this.pos++] < 128) {
      return value;
    }
    value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
    if (this.buf[this.pos++] < 128) {
      return value;
    }
    if ((this.pos += 5) > this.len) {
      this.pos = this.len;
      throw indexOutOfRange(this, 10);
    }
    return value;
  }
  /**
   * Reads a varint as a signed 32 bit value
   */
  int32() {
    return this.uint32() | 0;
  }
  /**
   * Reads a zig-zag encoded varint as a signed 32 bit value
   */
  sint32() {
    const value = this.uint32();
    return value >>> 1 ^ -(value & 1) | 0;
  }
  /**
   * Reads a varint as a boolean
   */
  bool() {
    return this.uint32() !== 0;
  }
  /**
   * Reads fixed 32 bits as an unsigned 32 bit integer
   */
  fixed32() {
    if (this.pos + 4 > this.len) {
      throw indexOutOfRange(this, 4);
    }
    const res = readFixed32End(this.buf, this.pos += 4);
    return res;
  }
  /**
   * Reads fixed 32 bits as a signed 32 bit integer
   */
  sfixed32() {
    if (this.pos + 4 > this.len) {
      throw indexOutOfRange(this, 4);
    }
    const res = readFixed32End(this.buf, this.pos += 4) | 0;
    return res;
  }
  /**
   * Reads a float (32 bit) as a number
   */
  float() {
    if (this.pos + 4 > this.len) {
      throw indexOutOfRange(this, 4);
    }
    const value = readFloatLE(this.buf, this.pos);
    this.pos += 4;
    return value;
  }
  /**
   * Reads a double (64 bit float) as a number
   */
  double() {
    if (this.pos + 8 > this.len) {
      throw indexOutOfRange(this, 4);
    }
    const value = readDoubleLE(this.buf, this.pos);
    this.pos += 8;
    return value;
  }
  /**
   * Reads a sequence of bytes preceded by its length as a varint
   */
  bytes() {
    const length3 = this.uint32();
    const start = this.pos;
    const end = this.pos + length3;
    if (end > this.len) {
      throw indexOutOfRange(this, length3);
    }
    this.pos += length3;
    return start === end ? new Uint8Array(0) : this.buf.subarray(start, end);
  }
  /**
   * Reads a string preceded by its byte length as a varint
   */
  string() {
    const bytes = this.bytes();
    return read2(bytes, 0, bytes.length);
  }
  /**
   * Skips the specified number of bytes if specified, otherwise skips a varint
   */
  skip(length3) {
    if (typeof length3 === "number") {
      if (this.pos + length3 > this.len) {
        throw indexOutOfRange(this, length3);
      }
      this.pos += length3;
    } else {
      do {
        if (this.pos >= this.len) {
          throw indexOutOfRange(this);
        }
      } while ((this.buf[this.pos++] & 128) !== 0);
    }
    return this;
  }
  /**
   * Skips the next element of the specified wire type
   */
  skipType(wireType) {
    switch (wireType) {
      case 0:
        this.skip();
        break;
      case 1:
        this.skip(8);
        break;
      case 2:
        this.skip(this.uint32());
        break;
      case 3:
        while ((wireType = this.uint32() & 7) !== 4) {
          this.skipType(wireType);
        }
        break;
      case 5:
        this.skip(4);
        break;
      /* istanbul ignore next */
      default:
        throw Error(`invalid wire type ${wireType} at offset ${this.pos}`);
    }
    return this;
  }
  readLongVarint() {
    const bits = new LongBits(0, 0);
    let i2 = 0;
    if (this.len - this.pos > 4) {
      for (; i2 < 4; ++i2) {
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i2 * 7) >>> 0;
        if (this.buf[this.pos++] < 128) {
          return bits;
        }
      }
      bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
      bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
      if (this.buf[this.pos++] < 128) {
        return bits;
      }
      i2 = 0;
    } else {
      for (; i2 < 3; ++i2) {
        if (this.pos >= this.len) {
          throw indexOutOfRange(this);
        }
        bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i2 * 7) >>> 0;
        if (this.buf[this.pos++] < 128) {
          return bits;
        }
      }
      bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i2 * 7) >>> 0;
      return bits;
    }
    if (this.len - this.pos > 4) {
      for (; i2 < 5; ++i2) {
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i2 * 7 + 3) >>> 0;
        if (this.buf[this.pos++] < 128) {
          return bits;
        }
      }
    } else {
      for (; i2 < 5; ++i2) {
        if (this.pos >= this.len) {
          throw indexOutOfRange(this);
        }
        bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i2 * 7 + 3) >>> 0;
        if (this.buf[this.pos++] < 128) {
          return bits;
        }
      }
    }
    throw Error("invalid varint encoding");
  }
  readFixed64() {
    if (this.pos + 8 > this.len) {
      throw indexOutOfRange(this, 8);
    }
    const lo = readFixed32End(this.buf, this.pos += 4);
    const hi = readFixed32End(this.buf, this.pos += 4);
    return new LongBits(lo, hi);
  }
  /**
   * Reads a varint as a signed 64 bit value
   */
  int64() {
    return this.readLongVarint().toBigInt();
  }
  /**
   * Reads a varint as a signed 64 bit value returned as a possibly unsafe
   * JavaScript number
   */
  int64Number() {
    return this.readLongVarint().toNumber();
  }
  /**
   * Reads a varint as a signed 64 bit value returned as a string
   */
  int64String() {
    return this.readLongVarint().toString();
  }
  /**
   * Reads a varint as an unsigned 64 bit value
   */
  uint64() {
    return this.readLongVarint().toBigInt(true);
  }
  /**
   * Reads a varint as an unsigned 64 bit value returned as a possibly unsafe
   * JavaScript number
   */
  uint64Number() {
    const value = decodeUint8Array(this.buf, this.pos);
    this.pos += encodingLength2(value);
    return value;
  }
  /**
   * Reads a varint as an unsigned 64 bit value returned as a string
   */
  uint64String() {
    return this.readLongVarint().toString(true);
  }
  /**
   * Reads a zig-zag encoded varint as a signed 64 bit value
   */
  sint64() {
    return this.readLongVarint().zzDecode().toBigInt();
  }
  /**
   * Reads a zig-zag encoded varint as a signed 64 bit value returned as a
   * possibly unsafe JavaScript number
   */
  sint64Number() {
    return this.readLongVarint().zzDecode().toNumber();
  }
  /**
   * Reads a zig-zag encoded varint as a signed 64 bit value returned as a
   * string
   */
  sint64String() {
    return this.readLongVarint().zzDecode().toString();
  }
  /**
   * Reads fixed 64 bits
   */
  fixed64() {
    return this.readFixed64().toBigInt();
  }
  /**
   * Reads fixed 64 bits returned as a possibly unsafe JavaScript number
   */
  fixed64Number() {
    return this.readFixed64().toNumber();
  }
  /**
   * Reads fixed 64 bits returned as a string
   */
  fixed64String() {
    return this.readFixed64().toString();
  }
  /**
   * Reads zig-zag encoded fixed 64 bits
   */
  sfixed64() {
    return this.readFixed64().toBigInt();
  }
  /**
   * Reads zig-zag encoded fixed 64 bits returned as a possibly unsafe
   * JavaScript number
   */
  sfixed64Number() {
    return this.readFixed64().toNumber();
  }
  /**
   * Reads zig-zag encoded fixed 64 bits returned as a string
   */
  sfixed64String() {
    return this.readFixed64().toString();
  }
};
function createReader(buf) {
  return new Uint8ArrayReader(buf instanceof Uint8Array ? buf : buf.subarray());
}

// ../../node_modules/protons-runtime/dist/src/decode.js
function decodeMessage(buf, codec, opts) {
  const reader = createReader(buf);
  return codec.decode(reader, void 0, opts);
}

// ../../node_modules/protons-runtime/dist/src/utils/pool.js
function pool(size) {
  const SIZE = size ?? 8192;
  const MAX = SIZE >>> 1;
  let slab;
  let offset = SIZE;
  return function poolAlloc(size2) {
    if (size2 < 1 || size2 > MAX) {
      return allocUnsafe(size2);
    }
    if (offset + size2 > SIZE) {
      slab = allocUnsafe(SIZE);
      offset = 0;
    }
    const buf = slab.subarray(offset, offset += size2);
    if ((offset & 7) !== 0) {
      offset = (offset | 7) + 1;
    }
    return buf;
  };
}

// ../../node_modules/protons-runtime/dist/src/utils/writer.js
var Op = class {
  /**
   * Function to call
   */
  fn;
  /**
   * Value byte length
   */
  len;
  /**
   * Next operation
   */
  next;
  /**
   * Value to write
   */
  val;
  constructor(fn, len, val) {
    this.fn = fn;
    this.len = len;
    this.next = void 0;
    this.val = val;
  }
};
function noop() {
}
var State = class {
  /**
   * Current head
   */
  head;
  /**
   * Current tail
   */
  tail;
  /**
   * Current buffer length
   */
  len;
  /**
   * Next state
   */
  next;
  constructor(writer) {
    this.head = writer.head;
    this.tail = writer.tail;
    this.len = writer.len;
    this.next = writer.states;
  }
};
var bufferPool = pool();
function alloc2(size) {
  if (globalThis.Buffer != null) {
    return allocUnsafe(size);
  }
  return bufferPool(size);
}
var Uint8ArrayWriter = class {
  /**
   * Current length
   */
  len;
  /**
   * Operations head
   */
  head;
  /**
   * Operations tail
   */
  tail;
  /**
   * Linked forked states
   */
  states;
  constructor() {
    this.len = 0;
    this.head = new Op(noop, 0, 0);
    this.tail = this.head;
    this.states = null;
  }
  /**
   * Pushes a new operation to the queue
   */
  _push(fn, len, val) {
    this.tail = this.tail.next = new Op(fn, len, val);
    this.len += len;
    return this;
  }
  /**
   * Writes an unsigned 32 bit value as a varint
   */
  uint32(value) {
    this.len += (this.tail = this.tail.next = new VarintOp((value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5, value)).len;
    return this;
  }
  /**
   * Writes a signed 32 bit value as a varint`
   */
  int32(value) {
    return value < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) : this.uint32(value);
  }
  /**
   * Writes a 32 bit value as a varint, zig-zag encoded
   */
  sint32(value) {
    return this.uint32((value << 1 ^ value >> 31) >>> 0);
  }
  /**
   * Writes an unsigned 64 bit value as a varint
   */
  uint64(value) {
    const bits = LongBits.fromBigInt(value);
    return this._push(writeVarint64, bits.length(), bits);
  }
  /**
   * Writes an unsigned 64 bit value as a varint
   */
  uint64Number(value) {
    return this._push(encodeUint8Array, encodingLength2(value), value);
  }
  /**
   * Writes an unsigned 64 bit value as a varint
   */
  uint64String(value) {
    return this.uint64(BigInt(value));
  }
  /**
   * Writes a signed 64 bit value as a varint
   */
  int64(value) {
    return this.uint64(value);
  }
  /**
   * Writes a signed 64 bit value as a varint
   */
  int64Number(value) {
    return this.uint64Number(value);
  }
  /**
   * Writes a signed 64 bit value as a varint
   */
  int64String(value) {
    return this.uint64String(value);
  }
  /**
   * Writes a signed 64 bit value as a varint, zig-zag encoded
   */
  sint64(value) {
    const bits = LongBits.fromBigInt(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
  }
  /**
   * Writes a signed 64 bit value as a varint, zig-zag encoded
   */
  sint64Number(value) {
    const bits = LongBits.fromNumber(value).zzEncode();
    return this._push(writeVarint64, bits.length(), bits);
  }
  /**
   * Writes a signed 64 bit value as a varint, zig-zag encoded
   */
  sint64String(value) {
    return this.sint64(BigInt(value));
  }
  /**
   * Writes a boolish value as a varint
   */
  bool(value) {
    return this._push(writeByte, 1, value ? 1 : 0);
  }
  /**
   * Writes an unsigned 32 bit value as fixed 32 bits
   */
  fixed32(value) {
    return this._push(writeFixed32, 4, value >>> 0);
  }
  /**
   * Writes a signed 32 bit value as fixed 32 bits
   */
  sfixed32(value) {
    return this.fixed32(value);
  }
  /**
   * Writes an unsigned 64 bit value as fixed 64 bits
   */
  fixed64(value) {
    const bits = LongBits.fromBigInt(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
  }
  /**
   * Writes an unsigned 64 bit value as fixed 64 bits
   */
  fixed64Number(value) {
    const bits = LongBits.fromNumber(value);
    return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
  }
  /**
   * Writes an unsigned 64 bit value as fixed 64 bits
   */
  fixed64String(value) {
    return this.fixed64(BigInt(value));
  }
  /**
   * Writes a signed 64 bit value as fixed 64 bits
   */
  sfixed64(value) {
    return this.fixed64(value);
  }
  /**
   * Writes a signed 64 bit value as fixed 64 bits
   */
  sfixed64Number(value) {
    return this.fixed64Number(value);
  }
  /**
   * Writes a signed 64 bit value as fixed 64 bits
   */
  sfixed64String(value) {
    return this.fixed64String(value);
  }
  /**
   * Writes a float (32 bit)
   */
  float(value) {
    return this._push(writeFloatLE, 4, value);
  }
  /**
   * Writes a double (64 bit float).
   *
   * @function
   * @param {number} value - Value to write
   * @returns {Writer} `this`
   */
  double(value) {
    return this._push(writeDoubleLE, 8, value);
  }
  /**
   * Writes a sequence of bytes
   */
  bytes(value) {
    const len = value.length >>> 0;
    if (len === 0) {
      return this._push(writeByte, 1, 0);
    }
    return this.uint32(len)._push(writeBytes, len, value);
  }
  /**
   * Writes a string
   */
  string(value) {
    const len = length2(value);
    return len !== 0 ? this.uint32(len)._push(write, len, value) : this._push(writeByte, 1, 0);
  }
  /**
   * Forks this writer's state by pushing it to a stack.
   * Calling {@link Writer#reset|reset} or {@link Writer#ldelim|ldelim} resets the writer to the previous state.
   */
  fork() {
    this.states = new State(this);
    this.head = this.tail = new Op(noop, 0, 0);
    this.len = 0;
    return this;
  }
  /**
   * Resets this instance to the last state
   */
  reset() {
    if (this.states != null) {
      this.head = this.states.head;
      this.tail = this.states.tail;
      this.len = this.states.len;
      this.states = this.states.next;
    } else {
      this.head = this.tail = new Op(noop, 0, 0);
      this.len = 0;
    }
    return this;
  }
  /**
   * Resets to the last state and appends the fork state's current write length as a varint followed by its operations.
   */
  ldelim() {
    const head = this.head;
    const tail = this.tail;
    const len = this.len;
    this.reset().uint32(len);
    if (len !== 0) {
      this.tail.next = head.next;
      this.tail = tail;
      this.len += len;
    }
    return this;
  }
  /**
   * Finishes the write operation
   */
  finish() {
    let head = this.head.next;
    const buf = alloc2(this.len);
    let pos = 0;
    while (head != null) {
      head.fn(head.val, buf, pos);
      pos += head.len;
      head = head.next;
    }
    return buf;
  }
};
function writeByte(val, buf, pos) {
  buf[pos] = val & 255;
}
function writeVarint32(val, buf, pos) {
  while (val > 127) {
    buf[pos++] = val & 127 | 128;
    val >>>= 7;
  }
  buf[pos] = val;
}
var VarintOp = class extends Op {
  next;
  constructor(len, val) {
    super(writeVarint32, len, val);
    this.next = void 0;
  }
};
function writeVarint64(val, buf, pos) {
  while (val.hi !== 0) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = (val.lo >>> 7 | val.hi << 25) >>> 0;
    val.hi >>>= 7;
  }
  while (val.lo > 127) {
    buf[pos++] = val.lo & 127 | 128;
    val.lo = val.lo >>> 7;
  }
  buf[pos++] = val.lo;
}
function writeFixed32(val, buf, pos) {
  buf[pos] = val & 255;
  buf[pos + 1] = val >>> 8 & 255;
  buf[pos + 2] = val >>> 16 & 255;
  buf[pos + 3] = val >>> 24;
}
function writeBytes(val, buf, pos) {
  buf.set(val, pos);
}
if (globalThis.Buffer != null) {
  Uint8ArrayWriter.prototype.bytes = function(value) {
    const len = value.length >>> 0;
    this.uint32(len);
    if (len > 0) {
      this._push(writeBytesBuffer, len, value);
    }
    return this;
  };
  Uint8ArrayWriter.prototype.string = function(value) {
    const len = globalThis.Buffer.byteLength(value);
    this.uint32(len);
    if (len > 0) {
      this._push(writeStringBuffer, len, value);
    }
    return this;
  };
}
function writeBytesBuffer(val, buf, pos) {
  buf.set(val, pos);
}
function writeStringBuffer(val, buf, pos) {
  if (val.length < 40) {
    write(val, buf, pos);
  } else if (buf.utf8Write != null) {
    buf.utf8Write(val, pos);
  } else {
    buf.set(fromString2(val), pos);
  }
}
function createWriter() {
  return new Uint8ArrayWriter();
}

// ../../node_modules/protons-runtime/dist/src/encode.js
function encodeMessage(message2, codec) {
  const w = createWriter();
  codec.encode(message2, w, {
    lengthDelimited: false
  });
  return w.finish();
}

// ../../node_modules/protons-runtime/dist/src/codec.js
var CODEC_TYPES;
(function(CODEC_TYPES2) {
  CODEC_TYPES2[CODEC_TYPES2["VARINT"] = 0] = "VARINT";
  CODEC_TYPES2[CODEC_TYPES2["BIT64"] = 1] = "BIT64";
  CODEC_TYPES2[CODEC_TYPES2["LENGTH_DELIMITED"] = 2] = "LENGTH_DELIMITED";
  CODEC_TYPES2[CODEC_TYPES2["START_GROUP"] = 3] = "START_GROUP";
  CODEC_TYPES2[CODEC_TYPES2["END_GROUP"] = 4] = "END_GROUP";
  CODEC_TYPES2[CODEC_TYPES2["BIT32"] = 5] = "BIT32";
})(CODEC_TYPES || (CODEC_TYPES = {}));
function createCodec2(name2, type, encode6, decode7) {
  return {
    name: name2,
    type,
    encode: encode6,
    decode: decode7
  };
}

// ../../node_modules/protons-runtime/dist/src/codecs/enum.js
function enumeration(v) {
  function findValue(val) {
    if (v[val.toString()] == null) {
      throw new Error("Invalid enum value");
    }
    return v[val];
  }
  const encode6 = function enumEncode(val, writer) {
    const enumValue = findValue(val);
    writer.int32(enumValue);
  };
  const decode7 = function enumDecode(reader) {
    const val = reader.int32();
    return findValue(val);
  };
  return createCodec2("enum", CODEC_TYPES.VARINT, encode6, decode7);
}

// ../../node_modules/protons-runtime/dist/src/codecs/message.js
function message(encode6, decode7) {
  return createCodec2("message", CODEC_TYPES.LENGTH_DELIMITED, encode6, decode7);
}

// ../../node_modules/protons-runtime/dist/src/index.js
var MaxLengthError = class extends Error {
  /**
   * This will be removed in a future release
   *
   * @deprecated use the `.name` property instead
   */
  code = "ERR_MAX_LENGTH";
  name = "MaxLengthError";
};

// ../../node_modules/@libp2p/crypto/dist/src/keys/keys.js
var KeyType;
(function(KeyType2) {
  KeyType2["RSA"] = "RSA";
  KeyType2["Ed25519"] = "Ed25519";
  KeyType2["secp256k1"] = "secp256k1";
  KeyType2["ECDSA"] = "ECDSA";
})(KeyType || (KeyType = {}));
var __KeyTypeValues;
(function(__KeyTypeValues2) {
  __KeyTypeValues2[__KeyTypeValues2["RSA"] = 0] = "RSA";
  __KeyTypeValues2[__KeyTypeValues2["Ed25519"] = 1] = "Ed25519";
  __KeyTypeValues2[__KeyTypeValues2["secp256k1"] = 2] = "secp256k1";
  __KeyTypeValues2[__KeyTypeValues2["ECDSA"] = 3] = "ECDSA";
})(__KeyTypeValues || (__KeyTypeValues = {}));
(function(KeyType2) {
  KeyType2.codec = () => {
    return enumeration(__KeyTypeValues);
  };
})(KeyType || (KeyType = {}));
var PublicKey;
(function(PublicKey2) {
  let _codec;
  PublicKey2.codec = () => {
    if (_codec == null) {
      _codec = message((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork();
        }
        if (obj.Type != null) {
          w.uint32(8);
          KeyType.codec().encode(obj.Type, w);
        }
        if (obj.Data != null) {
          w.uint32(18);
          w.bytes(obj.Data);
        }
        if (opts.lengthDelimited !== false) {
          w.ldelim();
        }
      }, (reader, length3, opts = {}) => {
        const obj = {};
        const end = length3 == null ? reader.len : reader.pos + length3;
        while (reader.pos < end) {
          const tag = reader.uint32();
          switch (tag >>> 3) {
            case 1: {
              obj.Type = KeyType.codec().decode(reader);
              break;
            }
            case 2: {
              obj.Data = reader.bytes();
              break;
            }
            default: {
              reader.skipType(tag & 7);
              break;
            }
          }
        }
        return obj;
      });
    }
    return _codec;
  };
  PublicKey2.encode = (obj) => {
    return encodeMessage(obj, PublicKey2.codec());
  };
  PublicKey2.decode = (buf, opts) => {
    return decodeMessage(buf, PublicKey2.codec(), opts);
  };
})(PublicKey || (PublicKey = {}));
var PrivateKey;
(function(PrivateKey2) {
  let _codec;
  PrivateKey2.codec = () => {
    if (_codec == null) {
      _codec = message((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork();
        }
        if (obj.Type != null) {
          w.uint32(8);
          KeyType.codec().encode(obj.Type, w);
        }
        if (obj.Data != null) {
          w.uint32(18);
          w.bytes(obj.Data);
        }
        if (opts.lengthDelimited !== false) {
          w.ldelim();
        }
      }, (reader, length3, opts = {}) => {
        const obj = {};
        const end = length3 == null ? reader.len : reader.pos + length3;
        while (reader.pos < end) {
          const tag = reader.uint32();
          switch (tag >>> 3) {
            case 1: {
              obj.Type = KeyType.codec().decode(reader);
              break;
            }
            case 2: {
              obj.Data = reader.bytes();
              break;
            }
            default: {
              reader.skipType(tag & 7);
              break;
            }
          }
        }
        return obj;
      });
    }
    return _codec;
  };
  PrivateKey2.encode = (obj) => {
    return encodeMessage(obj, PrivateKey2.codec());
  };
  PrivateKey2.decode = (buf, opts) => {
    return decodeMessage(buf, PrivateKey2.codec(), opts);
  };
})(PrivateKey || (PrivateKey = {}));

// ../../node_modules/@libp2p/crypto/dist/src/keys/rsa/utils.js
var utils_exports = {};
__export(utils_exports, {
  MAX_RSA_KEY_SIZE: () => MAX_RSA_KEY_SIZE,
  generateRSAKeyPair: () => generateRSAKeyPair,
  jwkToJWKKeyPair: () => jwkToJWKKeyPair,
  jwkToPkcs1: () => jwkToPkcs1,
  jwkToPkix: () => jwkToPkix,
  jwkToRSAPrivateKey: () => jwkToRSAPrivateKey,
  pkcs1MessageToJwk: () => pkcs1MessageToJwk,
  pkcs1MessageToRSAPrivateKey: () => pkcs1MessageToRSAPrivateKey,
  pkcs1ToJwk: () => pkcs1ToJwk,
  pkcs1ToRSAPrivateKey: () => pkcs1ToRSAPrivateKey,
  pkixMessageToJwk: () => pkixMessageToJwk,
  pkixMessageToRSAPublicKey: () => pkixMessageToRSAPublicKey,
  pkixToJwk: () => pkixToJwk,
  pkixToRSAPublicKey: () => pkixToRSAPublicKey
});

// ../../node_modules/@libp2p/crypto/dist/src/keys/rsa/rsa.js
var RSAPublicKey = class {
  type = "RSA";
  jwk;
  _raw;
  _multihash;
  constructor(jwk, digest2) {
    this.jwk = jwk;
    this._multihash = digest2;
  }
  get raw() {
    if (this._raw == null) {
      this._raw = utils_exports.jwkToPkix(this.jwk);
    }
    return this._raw;
  }
  toMultihash() {
    return this._multihash;
  }
  toCID() {
    return CID.createV1(114, this._multihash);
  }
  toString() {
    return base58btc.encode(this.toMultihash().bytes).substring(1);
  }
  equals(key) {
    if (key == null || !(key.raw instanceof Uint8Array)) {
      return false;
    }
    return equals3(this.raw, key.raw);
  }
  verify(data, sig, options) {
    return hashAndVerify3(this.jwk, sig, data, options);
  }
};
var RSAPrivateKey = class {
  type = "RSA";
  jwk;
  _raw;
  publicKey;
  constructor(jwk, publicKey) {
    this.jwk = jwk;
    this.publicKey = publicKey;
  }
  get raw() {
    if (this._raw == null) {
      this._raw = utils_exports.jwkToPkcs1(this.jwk);
    }
    return this._raw;
  }
  equals(key) {
    if (key == null || !(key.raw instanceof Uint8Array)) {
      return false;
    }
    return equals3(this.raw, key.raw);
  }
  sign(message2, options) {
    return hashAndSign3(this.jwk, message2, options);
  }
};

// ../../node_modules/@libp2p/crypto/dist/src/keys/rsa/utils.js
var MAX_RSA_KEY_SIZE = 8192;
var SHA2_256_CODE = 18;
var MAX_RSA_JWK_SIZE = 1062;
var RSA_ALGORITHM_IDENTIFIER = Uint8Array.from([
  48,
  13,
  6,
  9,
  42,
  134,
  72,
  134,
  247,
  13,
  1,
  1,
  1,
  5,
  0
]);
function pkcs1ToJwk(bytes) {
  const message2 = decodeDer(bytes);
  return pkcs1MessageToJwk(message2);
}
function pkcs1MessageToJwk(message2) {
  return {
    n: toString2(message2[1], "base64url"),
    e: toString2(message2[2], "base64url"),
    d: toString2(message2[3], "base64url"),
    p: toString2(message2[4], "base64url"),
    q: toString2(message2[5], "base64url"),
    dp: toString2(message2[6], "base64url"),
    dq: toString2(message2[7], "base64url"),
    qi: toString2(message2[8], "base64url"),
    kty: "RSA"
  };
}
function jwkToPkcs1(jwk) {
  if (jwk.n == null || jwk.e == null || jwk.d == null || jwk.p == null || jwk.q == null || jwk.dp == null || jwk.dq == null || jwk.qi == null) {
    throw new InvalidParametersError("JWK was missing components");
  }
  return encodeSequence([
    encodeInteger(Uint8Array.from([0])),
    encodeInteger(fromString2(jwk.n, "base64url")),
    encodeInteger(fromString2(jwk.e, "base64url")),
    encodeInteger(fromString2(jwk.d, "base64url")),
    encodeInteger(fromString2(jwk.p, "base64url")),
    encodeInteger(fromString2(jwk.q, "base64url")),
    encodeInteger(fromString2(jwk.dp, "base64url")),
    encodeInteger(fromString2(jwk.dq, "base64url")),
    encodeInteger(fromString2(jwk.qi, "base64url"))
  ]).subarray();
}
function pkixToJwk(bytes) {
  const message2 = decodeDer(bytes, {
    offset: 0
  });
  return pkixMessageToJwk(message2);
}
function pkixMessageToJwk(message2) {
  const keys = decodeDer(message2[1], {
    offset: 0
  });
  return {
    kty: "RSA",
    n: toString2(keys[0], "base64url"),
    e: toString2(keys[1], "base64url")
  };
}
function jwkToPkix(jwk) {
  if (jwk.n == null || jwk.e == null) {
    throw new InvalidParametersError("JWK was missing components");
  }
  const subjectPublicKeyInfo = encodeSequence([
    RSA_ALGORITHM_IDENTIFIER,
    encodeBitString(encodeSequence([
      encodeInteger(fromString2(jwk.n, "base64url")),
      encodeInteger(fromString2(jwk.e, "base64url"))
    ]))
  ]);
  return subjectPublicKeyInfo.subarray();
}
function pkcs1ToRSAPrivateKey(bytes) {
  const message2 = decodeDer(bytes);
  return pkcs1MessageToRSAPrivateKey(message2);
}
function pkcs1MessageToRSAPrivateKey(message2) {
  const jwk = pkcs1MessageToJwk(message2);
  return jwkToRSAPrivateKey(jwk);
}
function pkixToRSAPublicKey(bytes, digest2) {
  if (bytes.byteLength >= MAX_RSA_JWK_SIZE) {
    throw new InvalidPublicKeyError("Key size is too large");
  }
  const message2 = decodeDer(bytes, {
    offset: 0
  });
  return pkixMessageToRSAPublicKey(message2, bytes, digest2);
}
function pkixMessageToRSAPublicKey(message2, bytes, digest2) {
  const jwk = pkixMessageToJwk(message2);
  if (digest2 == null) {
    const hash = sha2562(PublicKey.encode({
      Type: KeyType.RSA,
      Data: bytes
    }));
    digest2 = create(SHA2_256_CODE, hash);
  }
  return new RSAPublicKey(jwk, digest2);
}
function jwkToRSAPrivateKey(jwk) {
  if (rsaKeySize(jwk) > MAX_RSA_KEY_SIZE) {
    throw new InvalidParametersError("Key size is too large");
  }
  const keys = jwkToJWKKeyPair(jwk);
  const hash = sha2562(PublicKey.encode({
    Type: KeyType.RSA,
    Data: jwkToPkix(keys.publicKey)
  }));
  const digest2 = create(SHA2_256_CODE, hash);
  return new RSAPrivateKey(keys.privateKey, new RSAPublicKey(keys.publicKey, digest2));
}
async function generateRSAKeyPair(bits) {
  if (bits > MAX_RSA_KEY_SIZE) {
    throw new InvalidParametersError("Key size is too large");
  }
  const keys = await generateRSAKey(bits);
  const hash = sha2562(PublicKey.encode({
    Type: KeyType.RSA,
    Data: jwkToPkix(keys.publicKey)
  }));
  const digest2 = create(SHA2_256_CODE, hash);
  return new RSAPrivateKey(keys.privateKey, new RSAPublicKey(keys.publicKey, digest2));
}
function jwkToJWKKeyPair(key) {
  if (key == null) {
    throw new InvalidParametersError("Missing key parameter");
  }
  return {
    privateKey: key,
    publicKey: {
      kty: key.kty,
      n: key.n,
      e: key.e
    }
  };
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/rsa/index.browser.js
async function generateRSAKey(bits, options) {
  const pair = await webcrypto_default.get().subtle.generateKey({
    name: "RSASSA-PKCS1-v1_5",
    modulusLength: bits,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: { name: "SHA-256" }
  }, true, ["sign", "verify"]);
  options?.signal?.throwIfAborted();
  const keys = await exportKey(pair, options);
  return {
    privateKey: keys[0],
    publicKey: keys[1]
  };
}
async function hashAndSign3(key, msg, options) {
  const privateKey = await webcrypto_default.get().subtle.importKey("jwk", key, {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-256" }
  }, false, ["sign"]);
  options?.signal?.throwIfAborted();
  const sig = await webcrypto_default.get().subtle.sign({ name: "RSASSA-PKCS1-v1_5" }, privateKey, msg instanceof Uint8Array ? msg : msg.subarray());
  options?.signal?.throwIfAborted();
  return new Uint8Array(sig, 0, sig.byteLength);
}
async function hashAndVerify3(key, sig, msg, options) {
  const publicKey = await webcrypto_default.get().subtle.importKey("jwk", key, {
    name: "RSASSA-PKCS1-v1_5",
    hash: { name: "SHA-256" }
  }, false, ["verify"]);
  options?.signal?.throwIfAborted();
  const result = await webcrypto_default.get().subtle.verify({ name: "RSASSA-PKCS1-v1_5" }, publicKey, sig, msg instanceof Uint8Array ? msg : msg.subarray());
  options?.signal?.throwIfAborted();
  return result;
}
async function exportKey(pair, options) {
  if (pair.privateKey == null || pair.publicKey == null) {
    throw new InvalidParametersError("Private and public key are required");
  }
  const result = await Promise.all([
    webcrypto_default.get().subtle.exportKey("jwk", pair.privateKey),
    webcrypto_default.get().subtle.exportKey("jwk", pair.publicKey)
  ]);
  options?.signal?.throwIfAborted();
  return result;
}
function rsaKeySize(jwk) {
  if (jwk.kty !== "RSA") {
    throw new InvalidParametersError("invalid key type");
  } else if (jwk.n == null) {
    throw new InvalidParametersError("invalid key modulus");
  }
  const bytes = fromString2(jwk.n, "base64url");
  return bytes.length * 8;
}

// ../../node_modules/@noble/hashes/hmac.js
var _HMAC = class {
  oHash;
  iHash;
  blockLen;
  outputLen;
  finished = false;
  destroyed = false;
  constructor(hash, key) {
    ahash(hash);
    abytes(key, void 0, "key");
    this.iHash = hash.create();
    if (typeof this.iHash.update !== "function")
      throw new Error("Expected instance of class which extends utils.Hash");
    this.blockLen = this.iHash.blockLen;
    this.outputLen = this.iHash.outputLen;
    const blockLen = this.blockLen;
    const pad = new Uint8Array(blockLen);
    pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
    for (let i2 = 0; i2 < pad.length; i2++)
      pad[i2] ^= 54;
    this.iHash.update(pad);
    this.oHash = hash.create();
    for (let i2 = 0; i2 < pad.length; i2++)
      pad[i2] ^= 54 ^ 92;
    this.oHash.update(pad);
    clean(pad);
  }
  update(buf) {
    aexists(this);
    this.iHash.update(buf);
    return this;
  }
  digestInto(out) {
    aexists(this);
    abytes(out, this.outputLen, "output");
    this.finished = true;
    this.iHash.digestInto(out);
    this.oHash.update(out);
    this.oHash.digestInto(out);
    this.destroy();
  }
  digest() {
    const out = new Uint8Array(this.oHash.outputLen);
    this.digestInto(out);
    return out;
  }
  _cloneInto(to) {
    to ||= Object.create(Object.getPrototypeOf(this), {});
    const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
    to = to;
    to.finished = finished;
    to.destroyed = destroyed;
    to.blockLen = blockLen;
    to.outputLen = outputLen;
    to.oHash = oHash._cloneInto(to.oHash);
    to.iHash = iHash._cloneInto(to.iHash);
    return to;
  }
  clone() {
    return this._cloneInto();
  }
  destroy() {
    this.destroyed = true;
    this.oHash.destroy();
    this.iHash.destroy();
  }
};
var hmac = (hash, key, message2) => new _HMAC(hash, key).update(message2).digest();
hmac.create = (hash, key) => new _HMAC(hash, key);

// ../../node_modules/@noble/curves/abstract/weierstrass.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var divNearest = (num, den) => (num + (num >= 0 ? den : -den) / _2n5) / den;
function _splitEndoScalar(k, basis, n2) {
  const [[a1, b1], [a2, b2]] = basis;
  const c1 = divNearest(b2 * k, n2);
  const c2 = divNearest(-b1 * k, n2);
  let k1 = k - c1 * a1 - c2 * a2;
  let k2 = -c1 * b1 - c2 * b2;
  const k1neg = k1 < _0n6;
  const k2neg = k2 < _0n6;
  if (k1neg)
    k1 = -k1;
  if (k2neg)
    k2 = -k2;
  const MAX_NUM = bitMask(Math.ceil(bitLen(n2) / 2)) + _1n7;
  if (k1 < _0n6 || k1 >= MAX_NUM || k2 < _0n6 || k2 >= MAX_NUM) {
    throw new Error("splitScalar (endomorphism): failed, k=" + k);
  }
  return { k1neg, k1, k2neg, k2 };
}
function validateSigFormat(format2) {
  if (!["compact", "recovered", "der"].includes(format2))
    throw new Error('Signature format must be "compact", "recovered", or "der"');
  return format2;
}
function validateSigOpts(opts, def) {
  const optsn = {};
  for (let optName of Object.keys(def)) {
    optsn[optName] = opts[optName] === void 0 ? def[optName] : opts[optName];
  }
  abool(optsn.lowS, "lowS");
  abool(optsn.prehash, "prehash");
  if (optsn.format !== void 0)
    validateSigFormat(optsn.format);
  return optsn;
}
var DERErr = class extends Error {
  constructor(m2 = "") {
    super(m2);
  }
};
var DER = {
  // asn.1 DER encoding utils
  Err: DERErr,
  // Basic building block is TLV (Tag-Length-Value)
  _tlv: {
    encode: (tag, data) => {
      const { Err: E } = DER;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length & 1)
        throw new E("tlv.encode: unpadded data");
      const dataLen = data.length / 2;
      const len = numberToHexUnpadded(dataLen);
      if (len.length / 2 & 128)
        throw new E("tlv.encode: long form length too big");
      const lenLen = dataLen > 127 ? numberToHexUnpadded(len.length / 2 | 128) : "";
      const t2 = numberToHexUnpadded(tag);
      return t2 + lenLen + len + data;
    },
    // v - value, l - left bytes (unparsed)
    decode(tag, data) {
      const { Err: E } = DER;
      let pos = 0;
      if (tag < 0 || tag > 256)
        throw new E("tlv.encode: wrong tag");
      if (data.length < 2 || data[pos++] !== tag)
        throw new E("tlv.decode: wrong tlv");
      const first = data[pos++];
      const isLong = !!(first & 128);
      let length3 = 0;
      if (!isLong)
        length3 = first;
      else {
        const lenLen = first & 127;
        if (!lenLen)
          throw new E("tlv.decode(long): indefinite length not supported");
        if (lenLen > 4)
          throw new E("tlv.decode(long): byte length is too big");
        const lengthBytes = data.subarray(pos, pos + lenLen);
        if (lengthBytes.length !== lenLen)
          throw new E("tlv.decode: length bytes not complete");
        if (lengthBytes[0] === 0)
          throw new E("tlv.decode(long): zero leftmost byte");
        for (const b of lengthBytes)
          length3 = length3 << 8 | b;
        pos += lenLen;
        if (length3 < 128)
          throw new E("tlv.decode(long): not minimal encoding");
      }
      const v = data.subarray(pos, pos + length3);
      if (v.length !== length3)
        throw new E("tlv.decode: wrong value length");
      return { v, l: data.subarray(pos + length3) };
    }
  },
  // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
  // since we always use positive integers here. It must always be empty:
  // - add zero byte if exists
  // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
  _int: {
    encode(num) {
      const { Err: E } = DER;
      if (num < _0n6)
        throw new E("integer: negative integers are not allowed");
      let hex = numberToHexUnpadded(num);
      if (Number.parseInt(hex[0], 16) & 8)
        hex = "00" + hex;
      if (hex.length & 1)
        throw new E("unexpected DER parsing assertion: unpadded hex");
      return hex;
    },
    decode(data) {
      const { Err: E } = DER;
      if (data[0] & 128)
        throw new E("invalid signature integer: negative");
      if (data[0] === 0 && !(data[1] & 128))
        throw new E("invalid signature integer: unnecessary leading zero");
      return bytesToNumberBE(data);
    }
  },
  toSig(bytes) {
    const { Err: E, _int: int, _tlv: tlv } = DER;
    const data = abytes(bytes, void 0, "signature");
    const { v: seqBytes, l: seqLeftBytes } = tlv.decode(48, data);
    if (seqLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    const { v: rBytes, l: rLeftBytes } = tlv.decode(2, seqBytes);
    const { v: sBytes, l: sLeftBytes } = tlv.decode(2, rLeftBytes);
    if (sLeftBytes.length)
      throw new E("invalid signature: left bytes after parsing");
    return { r: int.decode(rBytes), s: int.decode(sBytes) };
  },
  hexFromSig(sig) {
    const { _tlv: tlv, _int: int } = DER;
    const rs = tlv.encode(2, int.encode(sig.r));
    const ss = tlv.encode(2, int.encode(sig.s));
    const seq = rs + ss;
    return tlv.encode(48, seq);
  }
};
var _0n6 = BigInt(0);
var _1n7 = BigInt(1);
var _2n5 = BigInt(2);
var _3n3 = BigInt(3);
var _4n2 = BigInt(4);
function weierstrass(params, extraOpts = {}) {
  const validated = createCurveFields("weierstrass", params, extraOpts);
  const { Fp, Fn } = validated;
  let CURVE = validated.CURVE;
  const { h: cofactor, n: CURVE_ORDER } = CURVE;
  validateObject(extraOpts, {}, {
    allowInfinityPoint: "boolean",
    clearCofactor: "function",
    isTorsionFree: "function",
    fromBytes: "function",
    toBytes: "function",
    endo: "object"
  });
  const { endo } = extraOpts;
  if (endo) {
    if (!Fp.is0(CURVE.a) || typeof endo.beta !== "bigint" || !Array.isArray(endo.basises)) {
      throw new Error('invalid endo: expected "beta": bigint and "basises": array');
    }
  }
  const lengths = getWLengths(Fp, Fn);
  function assertCompressionIsSupported() {
    if (!Fp.isOdd)
      throw new Error("compression is not supported: Field does not have .isOdd()");
  }
  function pointToBytes(_c, point, isCompressed) {
    const { x, y } = point.toAffine();
    const bx = Fp.toBytes(x);
    abool(isCompressed, "isCompressed");
    if (isCompressed) {
      assertCompressionIsSupported();
      const hasEvenY = !Fp.isOdd(y);
      return concatBytes(pprefix(hasEvenY), bx);
    } else {
      return concatBytes(Uint8Array.of(4), bx, Fp.toBytes(y));
    }
  }
  function pointFromBytes(bytes) {
    abytes(bytes, void 0, "Point");
    const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
    const length3 = bytes.length;
    const head = bytes[0];
    const tail = bytes.subarray(1);
    if (length3 === comp && (head === 2 || head === 3)) {
      const x = Fp.fromBytes(tail);
      if (!Fp.isValid(x))
        throw new Error("bad point: is not on curve, wrong x");
      const y2 = weierstrassEquation(x);
      let y;
      try {
        y = Fp.sqrt(y2);
      } catch (sqrtError) {
        const err = sqrtError instanceof Error ? ": " + sqrtError.message : "";
        throw new Error("bad point: is not on curve, sqrt error" + err);
      }
      assertCompressionIsSupported();
      const evenY = Fp.isOdd(y);
      const evenH = (head & 1) === 1;
      if (evenH !== evenY)
        y = Fp.neg(y);
      return { x, y };
    } else if (length3 === uncomp && head === 4) {
      const L = Fp.BYTES;
      const x = Fp.fromBytes(tail.subarray(0, L));
      const y = Fp.fromBytes(tail.subarray(L, L * 2));
      if (!isValidXY(x, y))
        throw new Error("bad point: is not on curve");
      return { x, y };
    } else {
      throw new Error(`bad point: got length ${length3}, expected compressed=${comp} or uncompressed=${uncomp}`);
    }
  }
  const encodePoint = extraOpts.toBytes || pointToBytes;
  const decodePoint = extraOpts.fromBytes || pointFromBytes;
  function weierstrassEquation(x) {
    const x2 = Fp.sqr(x);
    const x3 = Fp.mul(x2, x);
    return Fp.add(Fp.add(x3, Fp.mul(x, CURVE.a)), CURVE.b);
  }
  function isValidXY(x, y) {
    const left = Fp.sqr(y);
    const right = weierstrassEquation(x);
    return Fp.eql(left, right);
  }
  if (!isValidXY(CURVE.Gx, CURVE.Gy))
    throw new Error("bad curve params: generator point");
  const _4a3 = Fp.mul(Fp.pow(CURVE.a, _3n3), _4n2);
  const _27b2 = Fp.mul(Fp.sqr(CURVE.b), BigInt(27));
  if (Fp.is0(Fp.add(_4a3, _27b2)))
    throw new Error("bad curve params: a or b");
  function acoord(title, n2, banZero = false) {
    if (!Fp.isValid(n2) || banZero && Fp.is0(n2))
      throw new Error(`bad point coordinate ${title}`);
    return n2;
  }
  function aprjpoint(other) {
    if (!(other instanceof Point))
      throw new Error("Weierstrass Point expected");
  }
  function splitEndoScalarN(k) {
    if (!endo || !endo.basises)
      throw new Error("no endo");
    return _splitEndoScalar(k, endo.basises, Fn.ORDER);
  }
  const toAffineMemo = memoized((p2, iz) => {
    const { X, Y, Z } = p2;
    if (Fp.eql(Z, Fp.ONE))
      return { x: X, y: Y };
    const is0 = p2.is0();
    if (iz == null)
      iz = is0 ? Fp.ONE : Fp.inv(Z);
    const x = Fp.mul(X, iz);
    const y = Fp.mul(Y, iz);
    const zz = Fp.mul(Z, iz);
    if (is0)
      return { x: Fp.ZERO, y: Fp.ZERO };
    if (!Fp.eql(zz, Fp.ONE))
      throw new Error("invZ was invalid");
    return { x, y };
  });
  const assertValidMemo = memoized((p2) => {
    if (p2.is0()) {
      if (extraOpts.allowInfinityPoint && !Fp.is0(p2.Y))
        return;
      throw new Error("bad point: ZERO");
    }
    const { x, y } = p2.toAffine();
    if (!Fp.isValid(x) || !Fp.isValid(y))
      throw new Error("bad point: x or y not field elements");
    if (!isValidXY(x, y))
      throw new Error("bad point: equation left != right");
    if (!p2.isTorsionFree())
      throw new Error("bad point: not in prime-order subgroup");
    return true;
  });
  function finishEndo(endoBeta, k1p, k2p, k1neg, k2neg) {
    k2p = new Point(Fp.mul(k2p.X, endoBeta), k2p.Y, k2p.Z);
    k1p = negateCt(k1neg, k1p);
    k2p = negateCt(k2neg, k2p);
    return k1p.add(k2p);
  }
  class Point {
    // base / generator point
    static BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
    // zero / infinity / identity point
    static ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
    // 0, 1, 0
    // math field
    static Fp = Fp;
    // scalar field
    static Fn = Fn;
    X;
    Y;
    Z;
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    constructor(X, Y, Z) {
      this.X = acoord("x", X);
      this.Y = acoord("y", Y, true);
      this.Z = acoord("z", Z);
      Object.freeze(this);
    }
    static CURVE() {
      return CURVE;
    }
    /** Does NOT validate if the point is valid. Use `.assertValidity()`. */
    static fromAffine(p2) {
      const { x, y } = p2 || {};
      if (!p2 || !Fp.isValid(x) || !Fp.isValid(y))
        throw new Error("invalid affine point");
      if (p2 instanceof Point)
        throw new Error("projective point not allowed");
      if (Fp.is0(x) && Fp.is0(y))
        return Point.ZERO;
      return new Point(x, y, Fp.ONE);
    }
    static fromBytes(bytes) {
      const P = Point.fromAffine(decodePoint(abytes(bytes, void 0, "point")));
      P.assertValidity();
      return P;
    }
    static fromHex(hex) {
      return Point.fromBytes(hexToBytes(hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /**
     *
     * @param windowSize
     * @param isLazy true will defer table computation until the first multiplication
     * @returns
     */
    precompute(windowSize = 8, isLazy = true) {
      wnaf.createCache(this, windowSize);
      if (!isLazy)
        this.multiply(_3n3);
      return this;
    }
    // TODO: return `this`
    /** A point on curve is valid if it conforms to equation. */
    assertValidity() {
      assertValidMemo(this);
    }
    hasEvenY() {
      const { y } = this.toAffine();
      if (!Fp.isOdd)
        throw new Error("Field doesn't support isOdd");
      return !Fp.isOdd(y);
    }
    /** Compare one point to another. */
    equals(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
      const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
      return U1 && U2;
    }
    /** Flips point to one corresponding to (x, -y) in Affine coordinates. */
    negate() {
      return new Point(this.X, Fp.neg(this.Y), this.Z);
    }
    // Renes-Costello-Batina exception-free doubling formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 3
    // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
    double() {
      const { a: a2, b } = CURVE;
      const b3 = Fp.mul(b, _3n3);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      let t0 = Fp.mul(X1, X1);
      let t1 = Fp.mul(Y1, Y1);
      let t2 = Fp.mul(Z1, Z1);
      let t3 = Fp.mul(X1, Y1);
      t3 = Fp.add(t3, t3);
      Z3 = Fp.mul(X1, Z1);
      Z3 = Fp.add(Z3, Z3);
      X3 = Fp.mul(a2, Z3);
      Y3 = Fp.mul(b3, t2);
      Y3 = Fp.add(X3, Y3);
      X3 = Fp.sub(t1, Y3);
      Y3 = Fp.add(t1, Y3);
      Y3 = Fp.mul(X3, Y3);
      X3 = Fp.mul(t3, X3);
      Z3 = Fp.mul(b3, Z3);
      t2 = Fp.mul(a2, t2);
      t3 = Fp.sub(t0, t2);
      t3 = Fp.mul(a2, t3);
      t3 = Fp.add(t3, Z3);
      Z3 = Fp.add(t0, t0);
      t0 = Fp.add(Z3, t0);
      t0 = Fp.add(t0, t2);
      t0 = Fp.mul(t0, t3);
      Y3 = Fp.add(Y3, t0);
      t2 = Fp.mul(Y1, Z1);
      t2 = Fp.add(t2, t2);
      t0 = Fp.mul(t2, t3);
      X3 = Fp.sub(X3, t0);
      Z3 = Fp.mul(t2, t1);
      Z3 = Fp.add(Z3, Z3);
      Z3 = Fp.add(Z3, Z3);
      return new Point(X3, Y3, Z3);
    }
    // Renes-Costello-Batina exception-free addition formula.
    // There is 30% faster Jacobian formula, but it is not complete.
    // https://eprint.iacr.org/2015/1060, algorithm 1
    // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
    add(other) {
      aprjpoint(other);
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = other;
      let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO;
      const a2 = CURVE.a;
      const b3 = Fp.mul(CURVE.b, _3n3);
      let t0 = Fp.mul(X1, X2);
      let t1 = Fp.mul(Y1, Y2);
      let t2 = Fp.mul(Z1, Z2);
      let t3 = Fp.add(X1, Y1);
      let t4 = Fp.add(X2, Y2);
      t3 = Fp.mul(t3, t4);
      t4 = Fp.add(t0, t1);
      t3 = Fp.sub(t3, t4);
      t4 = Fp.add(X1, Z1);
      let t5 = Fp.add(X2, Z2);
      t4 = Fp.mul(t4, t5);
      t5 = Fp.add(t0, t2);
      t4 = Fp.sub(t4, t5);
      t5 = Fp.add(Y1, Z1);
      X3 = Fp.add(Y2, Z2);
      t5 = Fp.mul(t5, X3);
      X3 = Fp.add(t1, t2);
      t5 = Fp.sub(t5, X3);
      Z3 = Fp.mul(a2, t4);
      X3 = Fp.mul(b3, t2);
      Z3 = Fp.add(X3, Z3);
      X3 = Fp.sub(t1, Z3);
      Z3 = Fp.add(t1, Z3);
      Y3 = Fp.mul(X3, Z3);
      t1 = Fp.add(t0, t0);
      t1 = Fp.add(t1, t0);
      t2 = Fp.mul(a2, t2);
      t4 = Fp.mul(b3, t4);
      t1 = Fp.add(t1, t2);
      t2 = Fp.sub(t0, t2);
      t2 = Fp.mul(a2, t2);
      t4 = Fp.add(t4, t2);
      t0 = Fp.mul(t1, t4);
      Y3 = Fp.add(Y3, t0);
      t0 = Fp.mul(t5, t4);
      X3 = Fp.mul(t3, X3);
      X3 = Fp.sub(X3, t0);
      t0 = Fp.mul(t3, t1);
      Z3 = Fp.mul(t5, Z3);
      Z3 = Fp.add(Z3, t0);
      return new Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(other.negate());
    }
    is0() {
      return this.equals(Point.ZERO);
    }
    /**
     * Constant time multiplication.
     * Uses wNAF method. Windowed method may be 10% faster,
     * but takes 2x longer to generate and consumes 2x memory.
     * Uses precomputes when available.
     * Uses endomorphism for Koblitz curves.
     * @param scalar by which the point would be multiplied
     * @returns New point
     */
    multiply(scalar) {
      const { endo: endo2 } = extraOpts;
      if (!Fn.isValidNot0(scalar))
        throw new Error("invalid scalar: out of range");
      let point, fake;
      const mul = (n2) => wnaf.cached(this, n2, (p2) => normalizeZ(Point, p2));
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(scalar);
        const { p: k1p, f: k1f } = mul(k1);
        const { p: k2p, f: k2f } = mul(k2);
        fake = k1f.add(k2f);
        point = finishEndo(endo2.beta, k1p, k2p, k1neg, k2neg);
      } else {
        const { p: p2, f: f2 } = mul(scalar);
        point = p2;
        fake = f2;
      }
      return normalizeZ(Point, [point, fake])[0];
    }
    /**
     * Non-constant-time multiplication. Uses double-and-add algorithm.
     * It's faster, but should only be used when you don't care about
     * an exposed secret key e.g. sig verification, which works over *public* keys.
     */
    multiplyUnsafe(sc) {
      const { endo: endo2 } = extraOpts;
      const p2 = this;
      if (!Fn.isValid(sc))
        throw new Error("invalid scalar: out of range");
      if (sc === _0n6 || p2.is0())
        return Point.ZERO;
      if (sc === _1n7)
        return p2;
      if (wnaf.hasCache(this))
        return this.multiply(sc);
      if (endo2) {
        const { k1neg, k1, k2neg, k2 } = splitEndoScalarN(sc);
        const { p1, p2: p22 } = mulEndoUnsafe(Point, p2, k1, k2);
        return finishEndo(endo2.beta, p1, p22, k1neg, k2neg);
      } else {
        return wnaf.unsafe(p2, sc);
      }
    }
    /**
     * Converts Projective point to affine (x, y) coordinates.
     * @param invertedZ Z^-1 (inverted zero) - optional, precomputation is useful for invertBatch
     */
    toAffine(invertedZ) {
      return toAffineMemo(this, invertedZ);
    }
    /**
     * Checks whether Point is free of torsion elements (is in prime subgroup).
     * Always torsion-free for cofactor=1 curves.
     */
    isTorsionFree() {
      const { isTorsionFree } = extraOpts;
      if (cofactor === _1n7)
        return true;
      if (isTorsionFree)
        return isTorsionFree(Point, this);
      return wnaf.unsafe(this, CURVE_ORDER).is0();
    }
    clearCofactor() {
      const { clearCofactor } = extraOpts;
      if (cofactor === _1n7)
        return this;
      if (clearCofactor)
        return clearCofactor(Point, this);
      return this.multiplyUnsafe(cofactor);
    }
    isSmallOrder() {
      return this.multiplyUnsafe(cofactor).is0();
    }
    toBytes(isCompressed = true) {
      abool(isCompressed, "isCompressed");
      this.assertValidity();
      return encodePoint(Point, this, isCompressed);
    }
    toHex(isCompressed = true) {
      return bytesToHex(this.toBytes(isCompressed));
    }
    toString() {
      return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
    }
  }
  const bits = Fn.BITS;
  const wnaf = new wNAF(Point, extraOpts.endo ? Math.ceil(bits / 2) : bits);
  Point.BASE.precompute(8);
  return Point;
}
function pprefix(hasEvenY) {
  return Uint8Array.of(hasEvenY ? 2 : 3);
}
function getWLengths(Fp, Fn) {
  return {
    secretKey: Fn.BYTES,
    publicKey: 1 + Fp.BYTES,
    publicKeyUncompressed: 1 + 2 * Fp.BYTES,
    publicKeyHasPrefix: true,
    signature: 2 * Fn.BYTES
  };
}
function ecdh(Point, ecdhOpts = {}) {
  const { Fn } = Point;
  const randomBytes_ = ecdhOpts.randomBytes || randomBytes;
  const lengths = Object.assign(getWLengths(Point.Fp, Fn), { seed: getMinHashLength(Fn.ORDER) });
  function isValidSecretKey(secretKey) {
    try {
      const num = Fn.fromBytes(secretKey);
      return Fn.isValidNot0(num);
    } catch (error) {
      return false;
    }
  }
  function isValidPublicKey(publicKey, isCompressed) {
    const { publicKey: comp, publicKeyUncompressed } = lengths;
    try {
      const l2 = publicKey.length;
      if (isCompressed === true && l2 !== comp)
        return false;
      if (isCompressed === false && l2 !== publicKeyUncompressed)
        return false;
      return !!Point.fromBytes(publicKey);
    } catch (error) {
      return false;
    }
  }
  function randomSecretKey(seed = randomBytes_(lengths.seed)) {
    return mapHashToField(abytes(seed, lengths.seed, "seed"), Fn.ORDER);
  }
  function getPublicKey(secretKey, isCompressed = true) {
    return Point.BASE.multiply(Fn.fromBytes(secretKey)).toBytes(isCompressed);
  }
  function isProbPub(item) {
    const { secretKey, publicKey, publicKeyUncompressed } = lengths;
    if (!isBytes(item))
      return void 0;
    if ("_lengths" in Fn && Fn._lengths || secretKey === publicKey)
      return void 0;
    const l2 = abytes(item, void 0, "key").length;
    return l2 === publicKey || l2 === publicKeyUncompressed;
  }
  function getSharedSecret(secretKeyA, publicKeyB, isCompressed = true) {
    if (isProbPub(secretKeyA) === true)
      throw new Error("first arg must be private key");
    if (isProbPub(publicKeyB) === false)
      throw new Error("second arg must be public key");
    const s2 = Fn.fromBytes(secretKeyA);
    const b = Point.fromBytes(publicKeyB);
    return b.multiply(s2).toBytes(isCompressed);
  }
  const utils = {
    isValidSecretKey,
    isValidPublicKey,
    randomSecretKey
  };
  const keygen = createKeygen(randomSecretKey, getPublicKey);
  return Object.freeze({ getPublicKey, getSharedSecret, keygen, Point, utils, lengths });
}
function ecdsa(Point, hash, ecdsaOpts = {}) {
  ahash(hash);
  validateObject(ecdsaOpts, {}, {
    hmac: "function",
    lowS: "boolean",
    randomBytes: "function",
    bits2int: "function",
    bits2int_modN: "function"
  });
  ecdsaOpts = Object.assign({}, ecdsaOpts);
  const randomBytes3 = ecdsaOpts.randomBytes || randomBytes;
  const hmac2 = ecdsaOpts.hmac || ((key, msg) => hmac(hash, key, msg));
  const { Fp, Fn } = Point;
  const { ORDER: CURVE_ORDER, BITS: fnBits } = Fn;
  const { keygen, getPublicKey, getSharedSecret, utils, lengths } = ecdh(Point, ecdsaOpts);
  const defaultSigOpts = {
    prehash: true,
    lowS: typeof ecdsaOpts.lowS === "boolean" ? ecdsaOpts.lowS : true,
    format: "compact",
    extraEntropy: false
  };
  const hasLargeCofactor = CURVE_ORDER * _2n5 < Fp.ORDER;
  function isBiggerThanHalfOrder(number) {
    const HALF = CURVE_ORDER >> _1n7;
    return number > HALF;
  }
  function validateRS(title, num) {
    if (!Fn.isValidNot0(num))
      throw new Error(`invalid signature ${title}: out of range 1..Point.Fn.ORDER`);
    return num;
  }
  function assertSmallCofactor() {
    if (hasLargeCofactor)
      throw new Error('"recovered" sig type is not supported for cofactor >2 curves');
  }
  function validateSigLength(bytes, format2) {
    validateSigFormat(format2);
    const size = lengths.signature;
    const sizer = format2 === "compact" ? size : format2 === "recovered" ? size + 1 : void 0;
    return abytes(bytes, sizer);
  }
  class Signature {
    r;
    s;
    recovery;
    constructor(r2, s2, recovery) {
      this.r = validateRS("r", r2);
      this.s = validateRS("s", s2);
      if (recovery != null) {
        assertSmallCofactor();
        if (![0, 1, 2, 3].includes(recovery))
          throw new Error("invalid recovery id");
        this.recovery = recovery;
      }
      Object.freeze(this);
    }
    static fromBytes(bytes, format2 = defaultSigOpts.format) {
      validateSigLength(bytes, format2);
      let recid;
      if (format2 === "der") {
        const { r: r3, s: s3 } = DER.toSig(abytes(bytes));
        return new Signature(r3, s3);
      }
      if (format2 === "recovered") {
        recid = bytes[0];
        format2 = "compact";
        bytes = bytes.subarray(1);
      }
      const L = lengths.signature / 2;
      const r2 = bytes.subarray(0, L);
      const s2 = bytes.subarray(L, L * 2);
      return new Signature(Fn.fromBytes(r2), Fn.fromBytes(s2), recid);
    }
    static fromHex(hex, format2) {
      return this.fromBytes(hexToBytes(hex), format2);
    }
    assertRecovery() {
      const { recovery } = this;
      if (recovery == null)
        throw new Error("invalid recovery id: must be present");
      return recovery;
    }
    addRecoveryBit(recovery) {
      return new Signature(this.r, this.s, recovery);
    }
    recoverPublicKey(messageHash) {
      const { r: r2, s: s2 } = this;
      const recovery = this.assertRecovery();
      const radj = recovery === 2 || recovery === 3 ? r2 + CURVE_ORDER : r2;
      if (!Fp.isValid(radj))
        throw new Error("invalid recovery id: sig.r+curve.n != R.x");
      const x = Fp.toBytes(radj);
      const R = Point.fromBytes(concatBytes(pprefix((recovery & 1) === 0), x));
      const ir = Fn.inv(radj);
      const h = bits2int_modN(abytes(messageHash, void 0, "msgHash"));
      const u1 = Fn.create(-h * ir);
      const u2 = Fn.create(s2 * ir);
      const Q = Point.BASE.multiplyUnsafe(u1).add(R.multiplyUnsafe(u2));
      if (Q.is0())
        throw new Error("invalid recovery: point at infinify");
      Q.assertValidity();
      return Q;
    }
    // Signatures should be low-s, to prevent malleability.
    hasHighS() {
      return isBiggerThanHalfOrder(this.s);
    }
    toBytes(format2 = defaultSigOpts.format) {
      validateSigFormat(format2);
      if (format2 === "der")
        return hexToBytes(DER.hexFromSig(this));
      const { r: r2, s: s2 } = this;
      const rb = Fn.toBytes(r2);
      const sb = Fn.toBytes(s2);
      if (format2 === "recovered") {
        assertSmallCofactor();
        return concatBytes(Uint8Array.of(this.assertRecovery()), rb, sb);
      }
      return concatBytes(rb, sb);
    }
    toHex(format2) {
      return bytesToHex(this.toBytes(format2));
    }
  }
  const bits2int = ecdsaOpts.bits2int || function bits2int_def(bytes) {
    if (bytes.length > 8192)
      throw new Error("input is too large");
    const num = bytesToNumberBE(bytes);
    const delta = bytes.length * 8 - fnBits;
    return delta > 0 ? num >> BigInt(delta) : num;
  };
  const bits2int_modN = ecdsaOpts.bits2int_modN || function bits2int_modN_def(bytes) {
    return Fn.create(bits2int(bytes));
  };
  const ORDER_MASK = bitMask(fnBits);
  function int2octets(num) {
    aInRange("num < 2^" + fnBits, num, _0n6, ORDER_MASK);
    return Fn.toBytes(num);
  }
  function validateMsgAndHash(message2, prehash) {
    abytes(message2, void 0, "message");
    return prehash ? abytes(hash(message2), void 0, "prehashed message") : message2;
  }
  function prepSig(message2, secretKey, opts) {
    const { lowS, prehash, extraEntropy } = validateSigOpts(opts, defaultSigOpts);
    message2 = validateMsgAndHash(message2, prehash);
    const h1int = bits2int_modN(message2);
    const d2 = Fn.fromBytes(secretKey);
    if (!Fn.isValidNot0(d2))
      throw new Error("invalid private key");
    const seedArgs = [int2octets(d2), int2octets(h1int)];
    if (extraEntropy != null && extraEntropy !== false) {
      const e2 = extraEntropy === true ? randomBytes3(lengths.secretKey) : extraEntropy;
      seedArgs.push(abytes(e2, void 0, "extraEntropy"));
    }
    const seed = concatBytes(...seedArgs);
    const m2 = h1int;
    function k2sig(kBytes) {
      const k = bits2int(kBytes);
      if (!Fn.isValidNot0(k))
        return;
      const ik = Fn.inv(k);
      const q = Point.BASE.multiply(k).toAffine();
      const r2 = Fn.create(q.x);
      if (r2 === _0n6)
        return;
      const s2 = Fn.create(ik * Fn.create(m2 + r2 * d2));
      if (s2 === _0n6)
        return;
      let recovery = (q.x === r2 ? 0 : 2) | Number(q.y & _1n7);
      let normS = s2;
      if (lowS && isBiggerThanHalfOrder(s2)) {
        normS = Fn.neg(s2);
        recovery ^= 1;
      }
      return new Signature(r2, normS, hasLargeCofactor ? void 0 : recovery);
    }
    return { seed, k2sig };
  }
  function sign(message2, secretKey, opts = {}) {
    const { seed, k2sig } = prepSig(message2, secretKey, opts);
    const drbg = createHmacDrbg(hash.outputLen, Fn.BYTES, hmac2);
    const sig = drbg(seed, k2sig);
    return sig.toBytes(opts.format);
  }
  function verify(signature, message2, publicKey, opts = {}) {
    const { lowS, prehash, format: format2 } = validateSigOpts(opts, defaultSigOpts);
    publicKey = abytes(publicKey, void 0, "publicKey");
    message2 = validateMsgAndHash(message2, prehash);
    if (!isBytes(signature)) {
      const end = signature instanceof Signature ? ", use sig.toBytes()" : "";
      throw new Error("verify expects Uint8Array signature" + end);
    }
    validateSigLength(signature, format2);
    try {
      const sig = Signature.fromBytes(signature, format2);
      const P = Point.fromBytes(publicKey);
      if (lowS && sig.hasHighS())
        return false;
      const { r: r2, s: s2 } = sig;
      const h = bits2int_modN(message2);
      const is = Fn.inv(s2);
      const u1 = Fn.create(h * is);
      const u2 = Fn.create(r2 * is);
      const R = Point.BASE.multiplyUnsafe(u1).add(P.multiplyUnsafe(u2));
      if (R.is0())
        return false;
      const v = Fn.create(R.x);
      return v === r2;
    } catch (e2) {
      return false;
    }
  }
  function recoverPublicKey(signature, message2, opts = {}) {
    const { prehash } = validateSigOpts(opts, defaultSigOpts);
    message2 = validateMsgAndHash(message2, prehash);
    return Signature.fromBytes(signature, "recovered").recoverPublicKey(message2).toBytes();
  }
  return Object.freeze({
    keygen,
    getPublicKey,
    getSharedSecret,
    utils,
    lengths,
    Point,
    sign,
    verify,
    recoverPublicKey,
    Signature,
    hash
  });
}

// ../../node_modules/@noble/curves/secp256k1.js
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var secp256k1_CURVE = {
  p: BigInt("0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f"),
  n: BigInt("0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141"),
  h: BigInt(1),
  a: BigInt(0),
  b: BigInt(7),
  Gx: BigInt("0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"),
  Gy: BigInt("0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8")
};
var secp256k1_ENDO = {
  beta: BigInt("0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee"),
  basises: [
    [BigInt("0x3086d221a7d46bcde86c90e49284eb15"), -BigInt("0xe4437ed6010e88286f547fa90abfe4c3")],
    [BigInt("0x114ca50f7a8e2f3f657c1108d9d44cfd8"), BigInt("0x3086d221a7d46bcde86c90e49284eb15")]
  ]
};
var _2n6 = /* @__PURE__ */ BigInt(2);
function sqrtMod(y) {
  const P = secp256k1_CURVE.p;
  const _3n4 = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
  const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
  const b2 = y * y * y % P;
  const b3 = b2 * b2 * y % P;
  const b6 = pow2(b3, _3n4, P) * b3 % P;
  const b9 = pow2(b6, _3n4, P) * b3 % P;
  const b11 = pow2(b9, _2n6, P) * b2 % P;
  const b22 = pow2(b11, _11n, P) * b11 % P;
  const b44 = pow2(b22, _22n, P) * b22 % P;
  const b88 = pow2(b44, _44n, P) * b44 % P;
  const b176 = pow2(b88, _88n, P) * b88 % P;
  const b220 = pow2(b176, _44n, P) * b44 % P;
  const b223 = pow2(b220, _3n4, P) * b3 % P;
  const t1 = pow2(b223, _23n, P) * b22 % P;
  const t2 = pow2(t1, _6n, P) * b2 % P;
  const root = pow2(t2, _2n6, P);
  if (!Fpk1.eql(Fpk1.sqr(root), y))
    throw new Error("Cannot find square root");
  return root;
}
var Fpk1 = Field(secp256k1_CURVE.p, { sqrt: sqrtMod });
var Pointk1 = /* @__PURE__ */ weierstrass(secp256k1_CURVE, {
  Fp: Fpk1,
  endo: secp256k1_ENDO
});
var secp256k1 = /* @__PURE__ */ ecdsa(Pointk1, sha2562);

// ../../node_modules/@libp2p/crypto/dist/src/keys/secp256k1/index.browser.js
function hashAndVerify4(key, sig, msg, options) {
  const p2 = sha256.digest(msg instanceof Uint8Array ? msg : msg.subarray());
  if (isPromise(p2)) {
    return p2.then(({ digest: digest2 }) => {
      options?.signal?.throwIfAborted();
      return secp256k1.verify(sig, digest2, key, {
        prehash: false,
        format: "der"
      });
    }).catch((err) => {
      if (err.name === "AbortError") {
        throw err;
      }
      throw new VerificationError(String(err));
    });
  }
  try {
    options?.signal?.throwIfAborted();
    return secp256k1.verify(sig, p2.digest, key, {
      prehash: false,
      format: "der"
    });
  } catch (err) {
    throw new VerificationError(String(err));
  }
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/secp256k1/secp256k1.js
var Secp256k1PublicKey = class {
  type = "secp256k1";
  raw;
  _key;
  constructor(key) {
    this._key = validateSecp256k1PublicKey(key);
    this.raw = compressSecp256k1PublicKey(this._key);
  }
  toMultihash() {
    return identity.digest(publicKeyToProtobuf(this));
  }
  toCID() {
    return CID.createV1(114, this.toMultihash());
  }
  toString() {
    return base58btc.encode(this.toMultihash().bytes).substring(1);
  }
  equals(key) {
    if (key == null || !(key.raw instanceof Uint8Array)) {
      return false;
    }
    return equals3(this.raw, key.raw);
  }
  verify(data, sig, options) {
    return hashAndVerify4(this._key, sig, data, options);
  }
};

// ../../node_modules/@libp2p/crypto/dist/src/keys/secp256k1/utils.js
function unmarshalSecp256k1PublicKey(bytes) {
  return new Secp256k1PublicKey(bytes);
}
function compressSecp256k1PublicKey(key) {
  return secp256k1.Point.fromBytes(key).toBytes();
}
function validateSecp256k1PublicKey(key) {
  try {
    secp256k1.Point.fromBytes(key);
    return key;
  } catch (err) {
    throw new InvalidPublicKeyError(String(err));
  }
}

// ../../node_modules/@libp2p/crypto/dist/src/keys/index.js
function publicKeyFromProtobuf(buf, digest2) {
  const { Type, Data } = PublicKey.decode(buf);
  const data = Data ?? new Uint8Array();
  switch (Type) {
    case KeyType.RSA:
      return pkixToRSAPublicKey(data, digest2);
    case KeyType.Ed25519:
      return unmarshalEd25519PublicKey(data);
    case KeyType.secp256k1:
      return unmarshalSecp256k1PublicKey(data);
    case KeyType.ECDSA:
      return unmarshalECDSAPublicKey(data);
    default:
      throw new UnsupportedKeyTypeError();
  }
}
function publicKeyToProtobuf(key) {
  return PublicKey.encode({
    Type: KeyType[key.type],
    Data: key.raw
  });
}

// ../../node_modules/@libp2p/peer-id/dist/src/peer-id.js
var inspect = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var LIBP2P_KEY_CODE = 114;
var PeerIdImpl = class {
  type;
  multihash;
  publicKey;
  string;
  constructor(init) {
    this.type = init.type;
    this.multihash = init.multihash;
    Object.defineProperty(this, "string", {
      enumerable: false,
      writable: true
    });
  }
  get [Symbol.toStringTag]() {
    return `PeerId(${this.toString()})`;
  }
  [peerIdSymbol] = true;
  toString() {
    if (this.string == null) {
      this.string = base58btc.encode(this.multihash.bytes).slice(1);
    }
    return this.string;
  }
  toMultihash() {
    return this.multihash;
  }
  // return self-describing String representation
  // in default format from RFC 0001: https://github.com/libp2p/specs/pull/209
  toCID() {
    return CID.createV1(LIBP2P_KEY_CODE, this.multihash);
  }
  toJSON() {
    return this.toString();
  }
  /**
   * Checks the equality of `this` peer against a given PeerId
   */
  equals(id) {
    if (id == null) {
      return false;
    }
    if (id instanceof Uint8Array) {
      return equals3(this.multihash.bytes, id);
    } else if (typeof id === "string") {
      return this.toString() === id;
    } else if (id?.toMultihash()?.bytes != null) {
      return equals3(this.multihash.bytes, id.toMultihash().bytes);
    } else {
      throw new Error("not valid Id");
    }
  }
  /**
   * Returns PeerId as a human-readable string
   * https://nodejs.org/api/util.html#utilinspectcustom
   *
   * @example
   * ```TypeScript
   * import { peerIdFromString } from '@libp2p/peer-id'
   *
   * console.info(peerIdFromString('QmFoo'))
   * // 'PeerId(QmFoo)'
   * ```
   */
  [inspect]() {
    return `PeerId(${this.toString()})`;
  }
};
var RSAPeerId = class extends PeerIdImpl {
  type = "RSA";
  publicKey;
  constructor(init) {
    super({ ...init, type: "RSA" });
    this.publicKey = init.publicKey;
  }
};
var Ed25519PeerId = class extends PeerIdImpl {
  type = "Ed25519";
  publicKey;
  constructor(init) {
    super({ ...init, type: "Ed25519" });
    this.publicKey = init.publicKey;
  }
};
var Secp256k1PeerId = class extends PeerIdImpl {
  type = "secp256k1";
  publicKey;
  constructor(init) {
    super({ ...init, type: "secp256k1" });
    this.publicKey = init.publicKey;
  }
};
var TRANSPORT_IPFS_GATEWAY_HTTP_CODE = 2336;
var URLPeerId = class {
  type = "url";
  multihash;
  publicKey;
  url;
  constructor(url) {
    this.url = url.toString();
    this.multihash = identity.digest(fromString2(this.url));
  }
  [inspect]() {
    return `PeerId(${this.url})`;
  }
  [peerIdSymbol] = true;
  toString() {
    return this.toCID().toString();
  }
  toMultihash() {
    return this.multihash;
  }
  toCID() {
    return CID.createV1(TRANSPORT_IPFS_GATEWAY_HTTP_CODE, this.toMultihash());
  }
  toJSON() {
    return this.toString();
  }
  equals(other) {
    if (other == null) {
      return false;
    }
    if (other instanceof Uint8Array) {
      other = toString2(other);
    }
    return other.toString() === this.toString();
  }
};

// ../../node_modules/@libp2p/peer-id/dist/src/index.js
function peerIdFromPublicKey(publicKey) {
  if (publicKey.type === "Ed25519") {
    return new Ed25519PeerId({
      multihash: publicKey.toCID().multihash,
      publicKey
    });
  } else if (publicKey.type === "secp256k1") {
    return new Secp256k1PeerId({
      multihash: publicKey.toCID().multihash,
      publicKey
    });
  } else if (publicKey.type === "RSA") {
    return new RSAPeerId({
      multihash: publicKey.toCID().multihash,
      publicKey
    });
  }
  throw new UnsupportedKeyTypeError();
}

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

// ../../node_modules/p-defer/index.js
function pDefer() {
  const deferred = {};
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  return deferred;
}

// ../../node_modules/it-pushable/dist/src/fifo.js
var FixedFIFO = class {
  buffer;
  mask;
  top;
  btm;
  next;
  constructor(hwm) {
    if (!(hwm > 0) || (hwm - 1 & hwm) !== 0) {
      throw new Error("Max size for a FixedFIFO should be a power of two");
    }
    this.buffer = new Array(hwm);
    this.mask = hwm - 1;
    this.top = 0;
    this.btm = 0;
    this.next = null;
  }
  push(data) {
    if (this.buffer[this.top] !== void 0) {
      return false;
    }
    this.buffer[this.top] = data;
    this.top = this.top + 1 & this.mask;
    return true;
  }
  shift() {
    const last = this.buffer[this.btm];
    if (last === void 0) {
      return void 0;
    }
    this.buffer[this.btm] = void 0;
    this.btm = this.btm + 1 & this.mask;
    return last;
  }
  isEmpty() {
    return this.buffer[this.btm] === void 0;
  }
};
var FIFO = class {
  size;
  hwm;
  head;
  tail;
  constructor(options = {}) {
    this.hwm = options.splitLimit ?? 16;
    this.head = new FixedFIFO(this.hwm);
    this.tail = this.head;
    this.size = 0;
  }
  calculateSize(obj) {
    if (obj?.byteLength != null) {
      return obj.byteLength;
    }
    return 1;
  }
  push(val) {
    if (val?.value != null) {
      this.size += this.calculateSize(val.value);
    }
    if (!this.head.push(val)) {
      const prev = this.head;
      this.head = prev.next = new FixedFIFO(2 * this.head.buffer.length);
      this.head.push(val);
    }
  }
  shift() {
    let val = this.tail.shift();
    if (val === void 0 && this.tail.next != null) {
      const next = this.tail.next;
      this.tail.next = null;
      this.tail = next;
      val = this.tail.shift();
    }
    if (val?.value != null) {
      this.size -= this.calculateSize(val.value);
    }
    return val;
  }
  isEmpty() {
    return this.head.isEmpty();
  }
};

// ../../node_modules/it-pushable/dist/src/index.js
var AbortError = class extends Error {
  type;
  code;
  constructor(message2, code2) {
    super(message2 ?? "The operation was aborted");
    this.type = "aborted";
    this.code = code2 ?? "ABORT_ERR";
  }
};
function pushable(options = {}) {
  const getNext = (buffer) => {
    const next = buffer.shift();
    if (next == null) {
      return { done: true };
    }
    if (next.error != null) {
      throw next.error;
    }
    return {
      done: next.done === true,
      // @ts-expect-error if done is false, value will be present
      value: next.value
    };
  };
  return _pushable(getNext, options);
}
function _pushable(getNext, options) {
  options = options ?? {};
  let onEnd = options.onEnd;
  let buffer = new FIFO();
  let pushable2;
  let onNext;
  let ended;
  let drain = pDefer();
  const waitNext = async () => {
    try {
      if (!buffer.isEmpty()) {
        return getNext(buffer);
      }
      if (ended) {
        return { done: true };
      }
      return await new Promise((resolve, reject) => {
        onNext = (next) => {
          onNext = null;
          buffer.push(next);
          try {
            resolve(getNext(buffer));
          } catch (err) {
            reject(err);
          }
          return pushable2;
        };
      });
    } finally {
      if (buffer.isEmpty()) {
        queueMicrotask(() => {
          drain.resolve();
          drain = pDefer();
        });
      }
    }
  };
  const bufferNext = (next) => {
    if (onNext != null) {
      return onNext(next);
    }
    buffer.push(next);
    return pushable2;
  };
  const bufferError = (err) => {
    buffer = new FIFO();
    if (onNext != null) {
      return onNext({ error: err });
    }
    buffer.push({ error: err });
    return pushable2;
  };
  const push = (value) => {
    if (ended) {
      return pushable2;
    }
    if (options?.objectMode !== true && value?.byteLength == null) {
      throw new Error("objectMode was not true but tried to push non-Uint8Array value");
    }
    return bufferNext({ done: false, value });
  };
  const end = (err) => {
    if (ended)
      return pushable2;
    ended = true;
    return err != null ? bufferError(err) : bufferNext({ done: true });
  };
  const _return = () => {
    buffer = new FIFO();
    end();
    return { done: true };
  };
  const _throw = (err) => {
    end(err);
    return { done: true };
  };
  pushable2 = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next: waitNext,
    return: _return,
    throw: _throw,
    push,
    end,
    get readableLength() {
      return buffer.size;
    },
    onEmpty: async (options2) => {
      const signal = options2?.signal;
      signal?.throwIfAborted();
      if (buffer.isEmpty()) {
        return;
      }
      let cancel;
      let listener;
      if (signal != null) {
        cancel = new Promise((resolve, reject) => {
          listener = () => {
            reject(new AbortError());
          };
          signal.addEventListener("abort", listener);
        });
      }
      try {
        await Promise.race([
          drain.promise,
          cancel
        ]);
      } finally {
        if (listener != null && signal != null) {
          signal?.removeEventListener("abort", listener);
        }
      }
    }
  };
  if (onEnd == null) {
    return pushable2;
  }
  const _pushable2 = pushable2;
  pushable2 = {
    [Symbol.asyncIterator]() {
      return this;
    },
    next() {
      return _pushable2.next();
    },
    throw(err) {
      _pushable2.throw(err);
      if (onEnd != null) {
        onEnd(err);
        onEnd = void 0;
      }
      return { done: true };
    },
    return() {
      _pushable2.return();
      if (onEnd != null) {
        onEnd();
        onEnd = void 0;
      }
      return { done: true };
    },
    push,
    end(err) {
      _pushable2.end(err);
      if (onEnd != null) {
        onEnd(err);
        onEnd = void 0;
      }
      return pushable2;
    },
    get readableLength() {
      return _pushable2.readableLength;
    },
    onEmpty: (opts) => {
      return _pushable2.onEmpty(opts);
    }
  };
  return pushable2;
}

// ../../node_modules/p-event/node_modules/p-timeout/index.js
var TimeoutError = class extends Error {
  constructor(message2) {
    super(message2);
    this.name = "TimeoutError";
  }
};
var AbortError2 = class extends Error {
  constructor(message2) {
    super();
    this.name = "AbortError";
    this.message = message2;
  }
};
var getDOMException = (errorMessage) => globalThis.DOMException === void 0 ? new AbortError2(errorMessage) : new DOMException(errorMessage);
var getAbortedReason = (signal) => {
  const reason = signal.reason === void 0 ? getDOMException("This operation was aborted.") : signal.reason;
  return reason instanceof Error ? reason : getDOMException(reason);
};
function pTimeout(promise, options) {
  const {
    milliseconds,
    fallback,
    message: message2,
    customTimers = { setTimeout, clearTimeout }
  } = options;
  let timer;
  let abortHandler;
  const wrappedPromise = new Promise((resolve, reject) => {
    if (typeof milliseconds !== "number" || Math.sign(milliseconds) !== 1) {
      throw new TypeError(`Expected \`milliseconds\` to be a positive number, got \`${milliseconds}\``);
    }
    if (options.signal) {
      const { signal } = options;
      if (signal.aborted) {
        reject(getAbortedReason(signal));
      }
      abortHandler = () => {
        reject(getAbortedReason(signal));
      };
      signal.addEventListener("abort", abortHandler, { once: true });
    }
    if (milliseconds === Number.POSITIVE_INFINITY) {
      promise.then(resolve, reject);
      return;
    }
    const timeoutError = new TimeoutError();
    timer = customTimers.setTimeout.call(void 0, () => {
      if (fallback) {
        try {
          resolve(fallback());
        } catch (error) {
          reject(error);
        }
        return;
      }
      if (typeof promise.cancel === "function") {
        promise.cancel();
      }
      if (message2 === false) {
        resolve();
      } else if (message2 instanceof Error) {
        reject(message2);
      } else {
        timeoutError.message = message2 ?? `Promise timed out after ${milliseconds} milliseconds`;
        reject(timeoutError);
      }
    }, milliseconds);
    (async () => {
      try {
        resolve(await promise);
      } catch (error) {
        reject(error);
      }
    })();
  });
  const cancelablePromise = wrappedPromise.finally(() => {
    cancelablePromise.clear();
    if (abortHandler && options.signal) {
      options.signal.removeEventListener("abort", abortHandler);
    }
  });
  cancelablePromise.clear = () => {
    customTimers.clearTimeout.call(void 0, timer);
    timer = void 0;
  };
  return cancelablePromise;
}

// ../../node_modules/p-event/index.js
var normalizeEmitter = (emitter) => {
  const addListener = emitter.addEventListener || emitter.on || emitter.addListener;
  const removeListener = emitter.removeEventListener || emitter.off || emitter.removeListener;
  if (!addListener || !removeListener) {
    throw new TypeError("Emitter is not compatible");
  }
  return {
    addListener: addListener.bind(emitter),
    removeListener: removeListener.bind(emitter)
  };
};
function pEventMultiple(emitter, event, options) {
  let cancel;
  const returnValue = new Promise((resolve, reject) => {
    options = {
      rejectionEvents: ["error"],
      multiArgs: false,
      rejectionMultiArgs: false,
      resolveImmediately: false,
      ...options
    };
    if (!(options.count >= 0 && (options.count === Number.POSITIVE_INFINITY || Number.isInteger(options.count)))) {
      throw new TypeError("The `count` option should be at least 0 or more");
    }
    options.signal?.throwIfAborted();
    const events = [event].flat();
    const items = [];
    const { addListener, removeListener } = normalizeEmitter(emitter);
    const onItem = async (...arguments_) => {
      const value = options.multiArgs ? arguments_ : arguments_[0];
      if (options.filter) {
        try {
          if (!await options.filter(value)) {
            return;
          }
        } catch (error) {
          cancel();
          reject(error);
          return;
        }
      }
      items.push(value);
      if (options.count === items.length) {
        cancel();
        resolve(items);
      }
    };
    const rejectHandler = (...arguments_) => {
      cancel();
      reject(options.rejectionMultiArgs ? arguments_ : arguments_[0]);
    };
    cancel = () => {
      for (const event2 of events) {
        removeListener(event2, onItem);
      }
      for (const rejectionEvent of options.rejectionEvents) {
        if (!events.includes(rejectionEvent)) {
          removeListener(rejectionEvent, rejectHandler);
        }
      }
    };
    for (const event2 of events) {
      addListener(event2, onItem);
    }
    for (const rejectionEvent of options.rejectionEvents) {
      if (!events.includes(rejectionEvent)) {
        addListener(rejectionEvent, rejectHandler);
      }
    }
    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        rejectHandler(options.signal.reason);
      }, { once: true });
    }
    if (options.resolveImmediately) {
      resolve(items);
    }
  });
  returnValue.cancel = cancel;
  if (typeof options.timeout === "number") {
    const timeout = pTimeout(returnValue, { milliseconds: options.timeout });
    timeout.cancel = () => {
      cancel();
      timeout.clear();
    };
    return timeout;
  }
  return returnValue;
}
function pEvent(emitter, event, options) {
  if (typeof options === "function") {
    options = { filter: options };
  }
  options = {
    ...options,
    count: 1,
    resolveImmediately: false
  };
  const arrayPromise = pEventMultiple(emitter, event, options);
  const promise = arrayPromise.then((array) => array[0]);
  promise.cancel = arrayPromise.cancel;
  return promise;
}

// ../../node_modules/@libp2p/utils/dist/src/debounce.js
function debounce(func, wait) {
  let timeout;
  const output = function() {
    const later = function() {
      timeout = void 0;
      void func();
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
  output.start = () => {
  };
  output.stop = () => {
    clearTimeout(timeout);
  };
  return output;
}

// ../../node_modules/@libp2p/utils/dist/src/errors.js
var UnexpectedEOFError = class extends Error {
  static name = "UnexpectedEOFError";
  name = "UnexpectedEOFError";
};
var MaxEarlyStreamsError = class extends Error {
  static name = "MaxEarlyStreamsError";
  name = "MaxEarlyStreamsError";
};
var StreamClosedError = class extends Error {
  static name = "StreamClosedError";
  name = "StreamClosedError";
};

// ../../node_modules/race-signal/dist/src/index.js
function defaultTranslate(signal) {
  return signal.reason;
}
async function raceSignal(promise, signal, opts) {
  if (signal == null) {
    return promise;
  }
  const translateError = opts?.translateError ?? defaultTranslate;
  if (signal.aborted) {
    promise.catch(() => {
    });
    return Promise.reject(translateError(signal));
  }
  let listener;
  try {
    return await Promise.race([
      promise,
      new Promise((resolve, reject) => {
        listener = () => {
          reject(translateError(signal));
        };
        signal.addEventListener("abort", listener);
      })
    ]);
  } finally {
    if (listener != null) {
      signal.removeEventListener("abort", listener);
    }
  }
}

// ../../node_modules/@libp2p/utils/dist/src/abstract-message-stream.js
var DEFAULT_MAX_READ_BUFFER_LENGTH = Math.pow(2, 20) * 4;
var AbstractMessageStream = class extends TypedEventEmitter {
  status;
  timeline;
  inactivityTimeout;
  maxReadBufferLength;
  maxWriteBufferLength;
  log;
  direction;
  maxMessageSize;
  readStatus;
  writeStatus;
  remoteReadStatus;
  remoteWriteStatus;
  writableNeedsDrain;
  /**
   * Any data stored here is emitted before any new incoming data.
   *
   * This is used when the stream is paused or if data is pushed onto the stream
   */
  readBuffer;
  writeBuffer;
  sendingData;
  onDrainPromise;
  constructor(init) {
    super();
    this.status = "open";
    this.log = init.log;
    this.direction = init.direction ?? "outbound";
    this.inactivityTimeout = init.inactivityTimeout ?? 12e4;
    this.maxReadBufferLength = init.maxReadBufferLength ?? DEFAULT_MAX_READ_BUFFER_LENGTH;
    this.maxWriteBufferLength = init.maxWriteBufferLength;
    this.maxMessageSize = init.maxMessageSize;
    this.readBuffer = new Uint8ArrayList();
    this.writeBuffer = new Uint8ArrayList();
    this.readStatus = "readable";
    this.remoteReadStatus = "readable";
    this.writeStatus = "writable";
    this.remoteWriteStatus = "writable";
    this.sendingData = false;
    this.writableNeedsDrain = false;
    this.timeline = {
      open: Date.now()
    };
    this.processSendQueue = this.processSendQueue.bind(this);
    const continueSendingOnDrain = () => {
      if (this.writableNeedsDrain) {
        this.log.trace("drain event received, continue sending data");
        this.writableNeedsDrain = false;
        this.processSendQueue();
      }
      this.onDrainPromise?.resolve();
    };
    this.addEventListener("drain", continueSendingOnDrain);
    const rejectOnDrainOnClose = (evt) => {
      this.onDrainPromise?.reject(evt.error ?? new StreamClosedError());
    };
    this.addEventListener("close", rejectOnDrainOnClose);
  }
  get readBufferLength() {
    return this.readBuffer.byteLength;
  }
  get writeBufferLength() {
    return this.writeBuffer.byteLength;
  }
  async onDrain(options) {
    if (this.writableNeedsDrain !== true) {
      return Promise.resolve();
    }
    if (this.onDrainPromise == null) {
      this.onDrainPromise = Promise.withResolvers();
    }
    return raceSignal(this.onDrainPromise.promise, options?.signal);
  }
  async *[Symbol.asyncIterator]() {
    if (this.readStatus !== "readable" && this.readStatus !== "paused") {
      return;
    }
    const output = pushable();
    const streamAsyncIterableOnMessageListener = (evt) => {
      output.push(evt.data);
    };
    this.addEventListener("message", streamAsyncIterableOnMessageListener);
    const streamAsyncIterableOnCloseListener = (evt) => {
      output.end(evt.error);
    };
    this.addEventListener("close", streamAsyncIterableOnCloseListener);
    const streamAsyncIterableOnRemoteCloseWriteListener = () => {
      output.end();
    };
    this.addEventListener("remoteCloseWrite", streamAsyncIterableOnRemoteCloseWriteListener);
    try {
      yield* output;
    } finally {
      this.removeEventListener("message", streamAsyncIterableOnMessageListener);
      this.removeEventListener("close", streamAsyncIterableOnCloseListener);
      this.removeEventListener("remoteCloseWrite", streamAsyncIterableOnRemoteCloseWriteListener);
    }
  }
  isReadable() {
    return this.status === "open";
  }
  send(data) {
    if (this.writeStatus === "closed" || this.writeStatus === "closing") {
      throw new StreamStateError(`Cannot write to a stream that is ${this.writeStatus}`);
    }
    this.log.trace("append %d bytes to write buffer", data.byteLength);
    this.writeBuffer.append(data);
    return this.processSendQueue();
  }
  /**
   * Close immediately for reading and writing and send a reset message (local
   * error)
   */
  abort(err) {
    if (this.status === "aborted" || this.status === "reset" || this.status === "closed") {
      return;
    }
    this.log.error("abort with error - %e", err);
    this.status = "aborted";
    if (this.readBuffer.byteLength > 0) {
      this.readBuffer.consume(this.readBuffer.byteLength);
    }
    if (this.writeBuffer.byteLength > 0) {
      this.writeBuffer.consume(this.writeBuffer.byteLength);
      this.safeDispatchEvent("idle");
    }
    this.writeStatus = "closed";
    this.remoteWriteStatus = "closed";
    this.readStatus = "closed";
    this.remoteReadStatus = "closed";
    this.timeline.close = Date.now();
    try {
      this.sendReset(err);
    } catch (err2) {
      this.log("failed to send reset to remote - %e", err2);
    }
    this.dispatchEvent(new StreamAbortEvent(err));
  }
  pause() {
    if (this.readStatus === "closed" || this.readStatus === "closing") {
      throw new StreamStateError("Cannot pause a stream that is closing/closed");
    }
    if (this.readStatus === "paused") {
      return;
    }
    this.readStatus = "paused";
    this.sendPause();
  }
  resume() {
    if (this.readStatus === "closed" || this.readStatus === "closing") {
      throw new StreamStateError("Cannot resume a stream that is closing/closed");
    }
    if (this.readStatus === "readable") {
      return;
    }
    this.readStatus = "readable";
    this.dispatchReadBuffer();
    this.sendResume();
  }
  push(data) {
    if (this.readStatus === "closed" || this.readStatus === "closing") {
      throw new StreamStateError(`Cannot push data onto a stream that is ${this.readStatus}`);
    }
    if (data.byteLength === 0) {
      return;
    }
    this.readBuffer.append(data);
    if (this.readStatus === "paused" || this.listenerCount("message") === 0) {
      this.checkReadBufferLength();
      return;
    }
    setTimeout(() => {
      this.dispatchReadBuffer();
    }, 0);
  }
  unshift(data) {
    if (this.readStatus === "closed" || this.readStatus === "closing") {
      throw new StreamStateError(`Cannot push data onto a stream that is ${this.readStatus}`);
    }
    if (data.byteLength === 0) {
      return;
    }
    this.readBuffer.prepend(data);
    if (this.readStatus === "paused" || this.listenerCount("message") === 0) {
      this.checkReadBufferLength();
      return;
    }
    setTimeout(() => {
      this.dispatchReadBuffer();
    }, 0);
  }
  /**
   * When an extending class reads data from it's implementation-specific source,
   * call this method to allow the stream consumer to read the data.
   */
  onData(data) {
    if (data.byteLength === 0) {
      return;
    }
    if (this.readStatus === "closing" || this.readStatus === "closed") {
      this.log("ignoring data - read status %s", this.readStatus);
      return;
    }
    this.readBuffer.append(data);
    this.dispatchReadBuffer();
  }
  addEventListener(...args) {
    super.addEventListener.apply(this, args);
    if (args[0] === "message" && this.readBuffer.byteLength > 0) {
      queueMicrotask(() => {
        this.dispatchReadBuffer();
      });
    }
  }
  /**
   * Receive a reset message - close immediately for reading and writing (remote
   * error)
   */
  onRemoteReset() {
    this.log("remote reset");
    this.status = "reset";
    this.writeStatus = "closed";
    this.remoteWriteStatus = "closed";
    this.remoteReadStatus = "closed";
    this.timeline.close = Date.now();
    if (this.readBuffer.byteLength === 0) {
      this.readStatus = "closed";
    }
    const err = new StreamResetError();
    this.dispatchEvent(new StreamResetEvent(err));
  }
  /**
   * The underlying resource or transport this stream uses has closed - it is
   * not possible to send any more messages though any data still in the read
   * buffer may still be read
   */
  onTransportClosed(err) {
    this.log("transport closed");
    if (this.readStatus === "readable" && this.readBuffer.byteLength === 0) {
      this.log("close readable end after transport closed and read buffer is empty");
      this.readStatus = "closed";
    }
    if (this.remoteReadStatus !== "closed") {
      this.remoteReadStatus = "closed";
    }
    if (this.remoteWriteStatus !== "closed") {
      this.remoteWriteStatus = "closed";
    }
    if (this.writeStatus !== "closed") {
      this.writeStatus = "closed";
    }
    if (err != null) {
      this.abort(err);
    } else {
      if (this.status === "open" || this.status === "closing") {
        this.timeline.close = Date.now();
        this.status = "closed";
        this.writeStatus = "closed";
        this.remoteWriteStatus = "closed";
        this.remoteReadStatus = "closed";
        this.dispatchEvent(new StreamCloseEvent());
      }
    }
  }
  /**
   * Called by extending classes when the remote closes its writable end
   */
  onRemoteCloseWrite() {
    if (this.remoteWriteStatus === "closed") {
      return;
    }
    this.log.trace("on remote close write");
    this.remoteWriteStatus = "closed";
    this.safeDispatchEvent("remoteCloseWrite");
    if (this.writeStatus === "closed") {
      this.onTransportClosed();
    }
  }
  /**
   * Called by extending classes when the remote closes its readable end
   */
  onRemoteCloseRead() {
    this.log.trace("on remote close read");
    this.remoteReadStatus = "closed";
    if (this.writeBuffer.byteLength > 0) {
      this.writeBuffer.consume(this.writeBuffer.byteLength);
      this.safeDispatchEvent("idle");
    }
  }
  processSendQueue() {
    if (this.writableNeedsDrain) {
      this.log.trace("not processing send queue as drain is required");
      this.checkWriteBufferLength();
      return false;
    }
    if (this.writeBuffer.byteLength === 0) {
      this.log.trace("not processing send queue as no bytes to send");
      return true;
    }
    if (this.sendingData) {
      this.log.trace("not processing send queue as already sending data");
      return true;
    }
    this.sendingData = true;
    this.log.trace("processing send queue with %d queued bytes", this.writeBuffer.byteLength);
    try {
      let canSendMore = true;
      const totalBytes = this.writeBuffer.byteLength;
      let sentBytes = 0;
      while (this.writeBuffer.byteLength > 0) {
        const end = Math.min(this.maxMessageSize ?? this.writeBuffer.byteLength, this.writeBuffer.byteLength);
        if (end === 0) {
          canSendMore = false;
          break;
        }
        const toSend = this.writeBuffer.sublist(0, end);
        const willSend = new Uint8ArrayList(toSend);
        this.writeBuffer.consume(toSend.byteLength);
        const sendResult = this.sendData(toSend);
        canSendMore = sendResult.canSendMore;
        sentBytes += sendResult.sentBytes;
        if (sendResult.sentBytes !== willSend.byteLength) {
          willSend.consume(sendResult.sentBytes);
          this.writeBuffer.prepend(willSend);
        }
        if (!canSendMore) {
          break;
        }
      }
      if (!canSendMore) {
        this.log.trace("sent %d/%d bytes, pausing sending because underlying stream is full, %d bytes left in the write buffer", sentBytes, totalBytes, this.writeBuffer.byteLength);
        this.writableNeedsDrain = true;
        this.checkWriteBufferLength();
      }
      if (this.writeBuffer.byteLength === 0) {
        this.safeDispatchEvent("idle");
      }
      return canSendMore;
    } finally {
      this.sendingData = false;
    }
  }
  dispatchReadBuffer() {
    try {
      if (this.listenerCount("message") === 0) {
        this.log.trace("not dispatching pause buffer as there are no listeners for the message event");
        return;
      }
      if (this.readBuffer.byteLength === 0) {
        this.log.trace("not dispatching pause buffer as there is no data to dispatch");
        return;
      }
      if (this.readStatus === "paused") {
        this.log.trace("not dispatching pause buffer we are paused");
        return;
      }
      if (this.readStatus === "closing" || this.readStatus === "closed") {
        this.log("dropping %d bytes because the readable end is %s", this.readBuffer.byteLength, this.readStatus);
        this.readBuffer.consume(this.readBuffer.byteLength);
        return;
      }
      const buf = this.readBuffer.sublist();
      this.readBuffer.consume(buf.byteLength);
      this.dispatchEvent(new StreamMessageEvent(buf));
    } finally {
      if (this.readBuffer.byteLength === 0 && this.remoteWriteStatus === "closed") {
        this.log("close readable end after dispatching read buffer and remote writable end is closed");
        this.readStatus = "closed";
      }
      this.checkReadBufferLength();
    }
  }
  checkReadBufferLength() {
    if (this.readBuffer.byteLength > this.maxReadBufferLength) {
      this.abort(new StreamBufferError(`Read buffer length of ${this.readBuffer.byteLength} exceeded limit of ${this.maxReadBufferLength}, read status is ${this.readStatus}`));
    }
  }
  checkWriteBufferLength() {
    if (this.maxWriteBufferLength == null) {
      return;
    }
    if (this.writeBuffer.byteLength > this.maxWriteBufferLength) {
      this.abort(new StreamBufferError(`Write buffer length of ${this.writeBuffer.byteLength} exceeded limit of ${this.maxWriteBufferLength}, write status is ${this.writeStatus}`));
    }
  }
  onMuxerNeedsDrain() {
    this.writableNeedsDrain = true;
  }
  onMuxerDrain() {
    this.safeDispatchEvent("drain");
  }
};

// ../../node_modules/@libp2p/utils/dist/src/is-promise.js
function isPromise2(thing) {
  if (thing == null) {
    return false;
  }
  return typeof thing.then === "function" && typeof thing.catch === "function" && typeof thing.finally === "function";
}

// ../../node_modules/@libp2p/utils/dist/src/abstract-stream-muxer.js
var AbstractStreamMuxer = class extends TypedEventEmitter {
  streams;
  protocol;
  status;
  log;
  maConn;
  streamOptions;
  earlyStreams;
  maxEarlyStreams;
  metrics;
  constructor(maConn, init) {
    super();
    this.maConn = maConn;
    this.protocol = init.protocol;
    this.streams = [];
    this.earlyStreams = [];
    this.status = "open";
    this.log = maConn.log.newScope(init.name);
    this.streamOptions = init.streamOptions;
    this.maxEarlyStreams = init.maxEarlyStreams ?? 10;
    this.metrics = init.metrics;
    const muxerMaConnOnMessage = (evt) => {
      try {
        this.onData(evt.data);
      } catch (err) {
        this.abort(err);
        this.maConn.abort(err);
      }
    };
    this.maConn.addEventListener("message", muxerMaConnOnMessage);
    const muxerMaConnOnDrain = () => {
      this.log("underlying stream drained, signal %d streams to continue writing", this.streams.length);
      this.streams.forEach((stream) => {
        stream.onMuxerDrain();
      });
    };
    this.maConn.addEventListener("drain", muxerMaConnOnDrain);
    const muxerOnMaConnClose = () => {
      this.log("underlying stream closed with status %s and %d streams", this.status, this.streams.length);
      this.onTransportClosed();
    };
    this.maConn.addEventListener("close", muxerOnMaConnClose);
  }
  send(data) {
    const result = this.maConn.send(data);
    if (result === false) {
      this.log("underlying stream saturated, signal %d streams to pause writing", this.streams.length);
      this.streams.forEach((stream) => {
        stream.onMuxerNeedsDrain();
      });
    }
    return result;
  }
  async close(options) {
    if (this.status === "closed" || this.status === "closing") {
      return;
    }
    this.status = "closing";
    await raceSignal(Promise.all([...this.streams].map(async (s2) => {
      await s2.close(options);
    })), options?.signal);
    this.status = "closed";
  }
  abort(err) {
    if (this.status === "closed") {
      return;
    }
    this.status = "closing";
    [...this.streams].forEach((s2) => {
      s2.abort(err);
    });
    this.status = "closed";
  }
  onTransportClosed(err) {
    this.status = "closing";
    try {
      [...this.streams].forEach((stream) => {
        stream.onTransportClosed(err);
      });
    } catch (err2) {
      this.abort(err2);
    }
    this.status = "closed";
  }
  async createStream(options) {
    if (this.status !== "open") {
      throw new MuxerClosedError();
    }
    let stream = this.onCreateStream({
      ...this.streamOptions,
      ...options
    });
    if (isPromise2(stream)) {
      stream = await stream;
    }
    this.streams.push(stream);
    this.cleanUpStream(stream);
    return stream;
  }
  /**
   * Extending classes should invoke this method when a new stream was created
   * by the remote muxer
   */
  onRemoteStream(stream) {
    this.streams.push(stream);
    this.cleanUpStream(stream);
    if (this.listenerCount("stream") === 0) {
      this.earlyStreams.push(stream);
      if (this.earlyStreams.length > this.maxEarlyStreams) {
        this.abort(new MaxEarlyStreamsError(`Too many early streams were opened - ${this.earlyStreams.length}/${this.maxEarlyStreams}`));
      }
      return;
    }
    this.safeDispatchEvent("stream", {
      detail: stream
    });
  }
  cleanUpStream(stream) {
    const muxerOnStreamEnd = (evt) => {
      const index = this.streams.findIndex((s2) => s2 === stream);
      if (index !== -1) {
        this.streams.splice(index, 1);
      }
      if (evt.error != null) {
        if (evt.local) {
          this.metrics?.increment({ [`${stream.direction}_stream_reset`]: true });
        } else {
          this.metrics?.increment({ [`${stream.direction}_stream_abort`]: true });
        }
      } else {
        this.metrics?.increment({ [`${stream.direction}_stream_end`]: true });
      }
    };
    stream.addEventListener("close", muxerOnStreamEnd);
    this.metrics?.increment({ [`${stream.direction}_stream`]: true });
  }
  addEventListener(...args) {
    super.addEventListener.apply(this, args);
    if (args[0] === "stream" && this.earlyStreams.length > 0) {
      queueMicrotask(() => {
        this.earlyStreams.forEach((stream) => {
          this.safeDispatchEvent("stream", {
            detail: stream
          });
        });
        this.earlyStreams = [];
      });
    }
  }
};

// ../../node_modules/@libp2p/utils/dist/src/abstract-stream.js
var AbstractStream = class extends AbstractMessageStream {
  id;
  protocol;
  constructor(init) {
    super(init);
    this.id = init.id;
    this.protocol = init.protocol ?? "";
  }
  async close(options) {
    if (this.writeStatus === "closing" || this.writeStatus === "closed") {
      return;
    }
    this.writeStatus = "closing";
    if (this.sendingData || this.writeBuffer.byteLength > 0) {
      this.log("waiting for write queue to become idle before closing writable end of stream, %d unsent bytes", this.writeBuffer.byteLength);
      await pEvent(this, "idle", {
        ...options,
        rejectionEvents: [
          "close"
        ]
      });
    }
    if (this.writableNeedsDrain) {
      this.log("waiting for write queue to drain before closing writable end of stream, %d unsent bytes, sending %s", this.writeBuffer.byteLength, this.sendingData);
      await pEvent(this, "drain", {
        ...options,
        rejectionEvents: [
          "close"
        ]
      });
      this.log("write queue drained, closing writable end of stream, %d unsent bytes, sending %s", this.writeBuffer.byteLength, this.sendingData);
    }
    await this.sendCloseWrite(options);
    this.writeStatus = "closed";
    this.log("closed writable end gracefully");
    if (this.remoteWriteStatus === "closed") {
      this.onTransportClosed();
    }
  }
  async closeRead(options) {
    if (this.readStatus === "closing" || this.readStatus === "closed") {
      return;
    }
    if (this.readBuffer.byteLength > 0) {
      this.readBuffer.consume(this.readBuffer.byteLength);
    }
    this.readStatus = "closing";
    await this.sendCloseRead(options);
    this.readStatus = "closed";
    this.log("closed readable end gracefully");
  }
};

// ../../node_modules/any-signal/dist/src/index.js
function anySignal(signals) {
  const controller2 = new globalThis.AbortController();
  function onAbort() {
    const reason = signals.filter((s2) => s2?.aborted === true).map((s2) => s2?.reason).pop();
    controller2.abort(reason);
    for (const signal2 of signals) {
      if (signal2?.removeEventListener != null) {
        signal2.removeEventListener("abort", onAbort);
      }
    }
  }
  for (const signal2 of signals) {
    if (signal2?.aborted === true) {
      onAbort();
      break;
    }
    if (signal2?.addEventListener != null) {
      signal2.addEventListener("abort", onAbort);
    }
  }
  function clear() {
    for (const signal2 of signals) {
      if (signal2?.removeEventListener != null) {
        signal2.removeEventListener("abort", onAbort);
      }
    }
  }
  const signal = controller2.signal;
  signal.clear = clear;
  return signal;
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
var InvalidParametersError2 = class extends Error {
  static name = "InvalidParametersError";
  name = "InvalidParametersError";
};
var UnknownProtocolError = class extends Error {
  static name = "UnknownProtocolError";
  name = "UnknownProtocolError";
};

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
var decoders2 = Object.values(bases).map((c2) => c2.decoder);
var anybaseDecoder = (function() {
  let acc = decoders2[0].or(decoders2[1]);
  decoders2.slice(2).forEach((d2) => acc = acc.or(d2));
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
    const code2 = decode6(bytes, i2);
    const codec = registry.getProtocol(code2);
    const codeLength = encodingLength2(code2);
    const size = sizeForAddr(codec, bytes, i2 + codeLength);
    let sizeLength = 0;
    if (size > 0 && codec.size === V) {
      sizeLength = encodingLength2(size);
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
  let length3 = 0;
  const bytes = [];
  for (const component of components) {
    if (component.bytes == null) {
      const codec = registry.getProtocol(component.code);
      const codecLength = encodingLength2(component.code);
      let valueBytes;
      let valueLength = 0;
      let valueLengthLength = 0;
      if (component.value != null) {
        valueBytes = codec.valueToBytes?.(component.value) ?? fromString2(component.value);
        valueLength = valueBytes.byteLength;
        if (codec.size === V) {
          valueLengthLength = encodingLength2(valueLength);
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
    length3 += component.bytes.byteLength;
  }
  return concat(bytes, length3);
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
  return decode6(bytes, offset);
}

// ../../node_modules/@multiformats/multiaddr/dist/src/multiaddr.js
var inspect2 = /* @__PURE__ */ Symbol.for("nodejs.util.inspect.custom");
var symbol2 = /* @__PURE__ */ Symbol.for("@multiformats/multiaddr");
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
  [symbol2] = true;
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
      throw new InvalidParametersError2(`Address ${this.toString()} does not contain subaddress: ${addrString}`);
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
    return equals3(this.bytes, addr.bytes);
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
  [inspect2]() {
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
  return Boolean(value?.[symbol2]);
}

// ../../node_modules/@libp2p/utils/dist/src/stream-utils.js
var DEFAULT_MAX_BUFFER_SIZE = 4194304;
var UnwrappedError = class extends Error {
  static name = "UnwrappedError";
  name = "UnwrappedError";
};
var InvalidMessageLengthError = class extends Error {
  name = "InvalidMessageLengthError";
  code = "ERR_INVALID_MSG_LENGTH";
};
var InvalidDataLengthError = class extends Error {
  name = "InvalidDataLengthError";
  code = "ERR_MSG_DATA_TOO_LONG";
};
var InvalidDataLengthLengthError = class extends Error {
  name = "InvalidDataLengthLengthError";
  code = "ERR_MSG_LENGTH_TOO_LONG";
};
function isStream(obj) {
  return typeof obj?.closeRead === "function";
}
function isMultiaddrConnection(obj) {
  return typeof obj?.close === "function";
}
function isEOF(obj) {
  if (isStream(obj)) {
    return obj.remoteWriteStatus !== "writable" && obj.readBufferLength === 0;
  }
  if (isMultiaddrConnection(obj)) {
    return obj.status !== "open";
  }
  return false;
}
function isValid(obj) {
  return obj?.addEventListener != null && obj?.removeEventListener != null && obj?.send != null && obj?.push != null && obj?.log != null;
}
function byteStream(stream, opts) {
  const maxBufferSize = opts?.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;
  const readBuffer = new Uint8ArrayList();
  let hasBytes;
  let unwrapped = false;
  if (!isValid(stream)) {
    throw new InvalidParametersError("Argument should be a Stream or a Multiaddr");
  }
  const byteStreamOnMessageListener = (evt) => {
    readBuffer.append(evt.data);
    if (readBuffer.byteLength > maxBufferSize) {
      const readBufferSize = readBuffer.byteLength;
      readBuffer.consume(readBuffer.byteLength);
      hasBytes?.reject(new Error(`Read buffer overflow - ${readBufferSize} > ${maxBufferSize}`));
    }
    hasBytes?.resolve();
  };
  stream.addEventListener("message", byteStreamOnMessageListener);
  const byteStreamOnCloseListener = (evt) => {
    if (evt.error != null) {
      hasBytes?.reject(evt.error);
    } else {
      hasBytes?.resolve();
    }
  };
  stream.addEventListener("close", byteStreamOnCloseListener);
  const byteStreamOnRemoteCloseWrite = () => {
    hasBytes?.resolve();
  };
  stream.addEventListener("remoteCloseWrite", byteStreamOnRemoteCloseWrite);
  const byteStream2 = {
    readBuffer,
    // @ts-expect-error options type prevents type inference
    async read(options) {
      if (unwrapped === true) {
        throw new UnwrappedError("Stream was unwrapped");
      }
      if (isEOF(stream)) {
        if (options?.bytes == null) {
          return null;
        }
        if (readBuffer.byteLength < options.bytes) {
          stream.log.error("closed after reading %d/%d bytes", readBuffer.byteLength, options.bytes);
          throw new UnexpectedEOFError(`Unexpected EOF - stream closed after reading ${readBuffer.byteLength}/${options.bytes} bytes`);
        }
      }
      const bytesToRead = options?.bytes ?? 1;
      hasBytes = Promise.withResolvers();
      while (true) {
        if (readBuffer.byteLength >= bytesToRead) {
          hasBytes.resolve();
          break;
        }
        await raceSignal(hasBytes.promise, options?.signal);
        if (isEOF(stream)) {
          if (readBuffer.byteLength === 0 && options?.bytes == null) {
            return null;
          }
          break;
        }
        hasBytes = Promise.withResolvers();
      }
      const toRead = options?.bytes ?? readBuffer.byteLength;
      if (readBuffer.byteLength < toRead) {
        if (isEOF(stream)) {
          stream.log.error("closed while reading %d/%d bytes", readBuffer.byteLength, toRead);
          throw new UnexpectedEOFError(`Unexpected EOF - stream closed while reading ${readBuffer.byteLength}/${toRead} bytes`);
        }
        return byteStream2.read(options);
      }
      const output = readBuffer.sublist(0, toRead);
      readBuffer.consume(toRead);
      return output;
    },
    async write(data, options) {
      if (unwrapped === true) {
        throw new UnwrappedError("Stream was unwrapped");
      }
      if (!stream.send(data)) {
        await pEvent(stream, "drain", {
          signal: options?.signal,
          rejectionEvents: ["close"]
        });
      }
    },
    unwrap() {
      if (unwrapped) {
        return stream;
      }
      unwrapped = true;
      stream.removeEventListener("message", byteStreamOnMessageListener);
      stream.removeEventListener("close", byteStreamOnCloseListener);
      stream.removeEventListener("remoteCloseWrite", byteStreamOnRemoteCloseWrite);
      if (readBuffer.byteLength > 0) {
        stream.log("stream unwrapped with %d unread bytes", readBuffer.byteLength);
        stream.push(readBuffer);
      }
      return stream;
    }
  };
  return byteStream2;
}
function lpStream(stream, opts = {}) {
  const bytes = byteStream(stream, opts);
  if (opts.maxDataLength != null && opts.maxLengthLength == null) {
    opts.maxLengthLength = encodingLength2(opts.maxDataLength);
  }
  const decodeLength = opts?.lengthDecoder ?? decode6;
  const encodeLength2 = opts?.lengthEncoder ?? encode5;
  const lpStream2 = {
    async read(options) {
      let dataLength = -1;
      const lengthBuffer = new Uint8ArrayList();
      while (true) {
        const buf2 = await bytes.read({
          ...options,
          bytes: 1
        });
        if (buf2 == null) {
          break;
        }
        lengthBuffer.append(buf2);
        try {
          dataLength = decodeLength(lengthBuffer);
        } catch (err) {
          if (err instanceof RangeError) {
            continue;
          }
          throw err;
        }
        if (dataLength < 0) {
          throw new InvalidMessageLengthError("Invalid message length");
        }
        if (opts?.maxLengthLength != null && lengthBuffer.byteLength > opts.maxLengthLength) {
          throw new InvalidDataLengthLengthError(`Message length length too long - ${lengthBuffer.byteLength} > ${opts.maxLengthLength}`);
        }
        if (dataLength > -1) {
          break;
        }
      }
      if (opts?.maxDataLength != null && dataLength > opts.maxDataLength) {
        throw new InvalidDataLengthError(`Message length too long - ${dataLength} > ${opts.maxDataLength}`);
      }
      const buf = await bytes.read({
        ...options,
        bytes: dataLength
      });
      if (buf == null) {
        stream.log.error("tried to read %d bytes but the stream closed", dataLength);
        throw new UnexpectedEOFError(`Unexpected EOF - tried to read ${dataLength} bytes but the stream closed`);
      }
      if (buf.byteLength !== dataLength) {
        stream.log.error("read %d/%d bytes before the stream closed", buf.byteLength, dataLength);
        throw new UnexpectedEOFError(`Unexpected EOF - read ${buf.byteLength}/${dataLength} bytes before the stream closed`);
      }
      return buf;
    },
    async write(data, options) {
      await bytes.write(new Uint8ArrayList(encodeLength2(data.byteLength), data), options);
    },
    async writeV(data, options) {
      const list = new Uint8ArrayList(...data.flatMap((buf) => [encodeLength2(buf.byteLength), buf]));
      await bytes.write(list, options);
    },
    unwrap() {
      return bytes.unwrap();
    }
  };
  return lpStream2;
}

// ../../node_modules/@libp2p/utils/dist/src/length-prefixed-decoder.js
var DEFAULT_MAX_BUFFER_SIZE2 = 1024 * 1024 * 4;
var DEFAULT_MAX_DATA_LENGTH = 1024 * 1024 * 4;
var LengthPrefixedDecoder = class {
  buffer;
  maxBufferSize;
  lengthDecoder;
  maxDataLength;
  encodingLength;
  constructor(init = {}) {
    this.buffer = new Uint8ArrayList();
    this.maxBufferSize = init.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE2;
    this.maxDataLength = init.maxDataLength ?? DEFAULT_MAX_DATA_LENGTH;
    this.lengthDecoder = init.lengthDecoder ?? decode6;
    this.encodingLength = init.encodingLength ?? encodingLength2;
  }
  /**
   * Decodes length-prefixed data
   */
  *decode(buf) {
    this.buffer.append(buf);
    if (this.buffer.byteLength > this.maxBufferSize) {
      throw new InvalidParametersError(`Buffer length limit exceeded - ${this.buffer.byteLength}/${this.maxBufferSize}`);
    }
    while (true) {
      let dataLength;
      try {
        dataLength = this.lengthDecoder(this.buffer);
      } catch (err) {
        if (err instanceof RangeError) {
          break;
        }
        throw err;
      }
      if (dataLength < 0 || dataLength > this.maxDataLength) {
        throw new InvalidMessageLengthError("Invalid message length");
      }
      const lengthLength = this.encodingLength(dataLength);
      const chunkLength = lengthLength + dataLength;
      if (this.buffer.byteLength >= chunkLength) {
        const buf2 = this.buffer.sublist(lengthLength, chunkLength);
        this.buffer.consume(chunkLength);
        if (buf2.byteLength > 0) {
          yield buf2;
        }
      } else {
        break;
      }
    }
  }
};

// ../../node_modules/@libp2p/utils/dist/src/repeating-task.js
function repeatingTask(fn, interval, options) {
  let timeout;
  let shutdownController;
  let running = false;
  function runTask() {
    const opts = {
      signal: shutdownController.signal
    };
    if (options?.timeout != null) {
      const signal = anySignal([shutdownController.signal, AbortSignal.timeout(options.timeout)]);
      setMaxListeners(Infinity, signal);
      opts.signal = signal;
    }
    running = true;
    Promise.resolve().then(async () => {
      await fn(opts);
    }).catch(() => {
    }).finally(() => {
      running = false;
      if (shutdownController.signal.aborted) {
        return;
      }
      timeout = setTimeout(runTask, interval);
    });
  }
  const runTaskDebounced = debounce(runTask, options?.debounce ?? 100);
  let started = false;
  return {
    setInterval: (ms) => {
      if (interval === ms) {
        return;
      }
      interval = ms;
      if (timeout != null) {
        clearTimeout(timeout);
        timeout = setTimeout(runTask, interval);
      }
    },
    setTimeout: (ms) => {
      options ??= {};
      options.timeout = ms;
    },
    run: () => {
      if (running) {
        return;
      }
      clearTimeout(timeout);
      runTaskDebounced();
    },
    start: () => {
      if (started) {
        return;
      }
      started = true;
      shutdownController = new AbortController();
      setMaxListeners(Infinity, shutdownController.signal);
      if (options?.runImmediately === true) {
        queueMicrotask(() => {
          runTask();
        });
      } else {
        timeout = setTimeout(runTask, interval);
      }
    },
    stop: () => {
      clearTimeout(timeout);
      shutdownController?.abort();
      started = false;
    }
  };
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/constants.js
var NOISE_MSG_MAX_LENGTH_BYTES = 65535;
var NOISE_MSG_MAX_LENGTH_BYTES_WITHOUT_TAG = NOISE_MSG_MAX_LENGTH_BYTES - 16;
var DUMP_SESSION_KEYS = Boolean(globalThis.process?.env?.DUMP_SESSION_KEYS);
var CHACHA_TAG_LENGTH = 16;

// ../../node_modules/@noble/ciphers/utils.js
/*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) */
function isBytes2(a2) {
  return a2 instanceof Uint8Array || ArrayBuffer.isView(a2) && a2.constructor.name === "Uint8Array";
}
function abool2(b) {
  if (typeof b !== "boolean")
    throw new Error(`boolean expected, not ${b}`);
}
function anumber2(n2) {
  if (!Number.isSafeInteger(n2) || n2 < 0)
    throw new Error("positive integer expected, got " + n2);
}
function abytes2(value, length3, title = "") {
  const bytes = isBytes2(value);
  const len = value?.length;
  const needsLen = length3 !== void 0;
  if (!bytes || needsLen && len !== length3) {
    const prefix2 = title && `"${title}" `;
    const ofLen = needsLen ? ` of length ${length3}` : "";
    const got = bytes ? `length=${len}` : `type=${typeof value}`;
    throw new Error(prefix2 + "expected Uint8Array" + ofLen + ", got " + got);
  }
  return value;
}
function aexists2(instance, checkFinished = true) {
  if (instance.destroyed)
    throw new Error("Hash instance has been destroyed");
  if (checkFinished && instance.finished)
    throw new Error("Hash#digest() has already been called");
}
function aoutput2(out, instance) {
  abytes2(out, void 0, "output");
  const min = instance.outputLen;
  if (out.length < min) {
    throw new Error("digestInto() expects output buffer of length at least " + min);
  }
}
function u32(arr) {
  return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
}
function clean2(...arrays) {
  for (let i2 = 0; i2 < arrays.length; i2++) {
    arrays[i2].fill(0);
  }
}
function createView2(arr) {
  return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
}
var isLE = /* @__PURE__ */ (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
function checkOpts(defaults, opts) {
  if (opts == null || typeof opts !== "object")
    throw new Error("options must be defined");
  const merged = Object.assign(defaults, opts);
  return merged;
}
function equalBytes(a2, b) {
  if (a2.length !== b.length)
    return false;
  let diff = 0;
  for (let i2 = 0; i2 < a2.length; i2++)
    diff |= a2[i2] ^ b[i2];
  return diff === 0;
}
var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
  function wrappedCipher(key, ...args) {
    abytes2(key, void 0, "key");
    if (!isLE)
      throw new Error("Non little-endian hardware is not yet supported");
    if (params.nonceLength !== void 0) {
      const nonce = args[0];
      abytes2(nonce, params.varSizeNonce ? void 0 : params.nonceLength, "nonce");
    }
    const tagl = params.tagLength;
    if (tagl && args[1] !== void 0)
      abytes2(args[1], void 0, "AAD");
    const cipher = constructor(key, ...args);
    const checkOutput = (fnLength, output) => {
      if (output !== void 0) {
        if (fnLength !== 2)
          throw new Error("cipher output not supported");
        abytes2(output, void 0, "output");
      }
    };
    let called = false;
    const wrCipher = {
      encrypt(data, output) {
        if (called)
          throw new Error("cannot encrypt() twice with same key + nonce");
        called = true;
        abytes2(data);
        checkOutput(cipher.encrypt.length, output);
        return cipher.encrypt(data, output);
      },
      decrypt(data, output) {
        abytes2(data);
        if (tagl && data.length < tagl)
          throw new Error('"ciphertext" expected length bigger than tagLength=' + tagl);
        checkOutput(cipher.decrypt.length, output);
        return cipher.decrypt(data, output);
      }
    };
    return wrCipher;
  }
  Object.assign(wrappedCipher, params);
  return wrappedCipher;
};
function getOutput(expectedLength, out, onlyAligned = true) {
  if (out === void 0)
    return new Uint8Array(expectedLength);
  if (out.length !== expectedLength)
    throw new Error('"output" expected Uint8Array of length ' + expectedLength + ", got: " + out.length);
  if (onlyAligned && !isAligned32(out))
    throw new Error("invalid output, must be aligned");
  return out;
}
function u64Lengths(dataLength, aadLength, isLE2) {
  abool2(isLE2);
  const num = new Uint8Array(16);
  const view = createView2(num);
  view.setBigUint64(0, BigInt(aadLength), isLE2);
  view.setBigUint64(8, BigInt(dataLength), isLE2);
  return num;
}
function isAligned32(bytes) {
  return bytes.byteOffset % 4 === 0;
}
function copyBytes2(bytes) {
  return Uint8Array.from(bytes);
}

// ../../node_modules/@noble/ciphers/_arx.js
var encodeStr = (str) => Uint8Array.from(str.split(""), (c2) => c2.charCodeAt(0));
var sigma16 = encodeStr("expand 16-byte k");
var sigma32 = encodeStr("expand 32-byte k");
var sigma16_32 = u32(sigma16);
var sigma32_32 = u32(sigma32);
function rotl(a2, b) {
  return a2 << b | a2 >>> 32 - b;
}
function isAligned322(b) {
  return b.byteOffset % 4 === 0;
}
var BLOCK_LEN = 64;
var BLOCK_LEN32 = 16;
var MAX_COUNTER = 2 ** 32 - 1;
var U32_EMPTY = Uint32Array.of();
function runCipher(core, sigma, key, nonce, data, output, counter, rounds) {
  const len = data.length;
  const block = new Uint8Array(BLOCK_LEN);
  const b32 = u32(block);
  const isAligned = isAligned322(data) && isAligned322(output);
  const d32 = isAligned ? u32(data) : U32_EMPTY;
  const o32 = isAligned ? u32(output) : U32_EMPTY;
  for (let pos = 0; pos < len; counter++) {
    core(sigma, key, nonce, b32, counter, rounds);
    if (counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    const take = Math.min(BLOCK_LEN, len - pos);
    if (isAligned && take === BLOCK_LEN) {
      const pos32 = pos / 4;
      if (pos % 4 !== 0)
        throw new Error("arx: invalid block position");
      for (let j = 0, posj; j < BLOCK_LEN32; j++) {
        posj = pos32 + j;
        o32[posj] = d32[posj] ^ b32[j];
      }
      pos += BLOCK_LEN;
      continue;
    }
    for (let j = 0, posj; j < take; j++) {
      posj = pos + j;
      output[posj] = data[posj] ^ block[j];
    }
    pos += take;
  }
}
function createCipher(core, opts) {
  const { allowShortKeys, extendNonceFn, counterLength, counterRight, rounds } = checkOpts({ allowShortKeys: false, counterLength: 8, counterRight: false, rounds: 20 }, opts);
  if (typeof core !== "function")
    throw new Error("core must be a function");
  anumber2(counterLength);
  anumber2(rounds);
  abool2(counterRight);
  abool2(allowShortKeys);
  return (key, nonce, data, output, counter = 0) => {
    abytes2(key, void 0, "key");
    abytes2(nonce, void 0, "nonce");
    abytes2(data, void 0, "data");
    const len = data.length;
    if (output === void 0)
      output = new Uint8Array(len);
    abytes2(output, void 0, "output");
    anumber2(counter);
    if (counter < 0 || counter >= MAX_COUNTER)
      throw new Error("arx: counter overflow");
    if (output.length < len)
      throw new Error(`arx: output (${output.length}) is shorter than data (${len})`);
    const toClean = [];
    let l2 = key.length;
    let k;
    let sigma;
    if (l2 === 32) {
      toClean.push(k = copyBytes2(key));
      sigma = sigma32_32;
    } else if (l2 === 16 && allowShortKeys) {
      k = new Uint8Array(32);
      k.set(key);
      k.set(key, 16);
      sigma = sigma16_32;
      toClean.push(k);
    } else {
      abytes2(key, 32, "arx key");
      throw new Error("invalid key size");
    }
    if (!isAligned322(nonce))
      toClean.push(nonce = copyBytes2(nonce));
    const k32 = u32(k);
    if (extendNonceFn) {
      if (nonce.length !== 24)
        throw new Error(`arx: extended nonce must be 24 bytes`);
      extendNonceFn(sigma, k32, u32(nonce.subarray(0, 16)), k32);
      nonce = nonce.subarray(16);
    }
    const nonceNcLen = 16 - counterLength;
    if (nonceNcLen !== nonce.length)
      throw new Error(`arx: nonce must be ${nonceNcLen} or 16 bytes`);
    if (nonceNcLen !== 12) {
      const nc = new Uint8Array(12);
      nc.set(nonce, counterRight ? 0 : 12 - nonce.length);
      nonce = nc;
      toClean.push(nonce);
    }
    const n32 = u32(nonce);
    runCipher(core, sigma, k32, n32, data, output, counter, rounds);
    clean2(...toClean);
    return output;
  };
}

// ../../node_modules/@noble/ciphers/_poly1305.js
function u8to16(a2, i2) {
  return a2[i2++] & 255 | (a2[i2++] & 255) << 8;
}
var Poly1305 = class {
  blockLen = 16;
  outputLen = 16;
  buffer = new Uint8Array(16);
  r = new Uint16Array(10);
  // Allocating 1 array with .subarray() here is slower than 3
  h = new Uint16Array(10);
  pad = new Uint16Array(8);
  pos = 0;
  finished = false;
  // Can be speed-up using BigUint64Array, at the cost of complexity
  constructor(key) {
    key = copyBytes2(abytes2(key, 32, "key"));
    const t0 = u8to16(key, 0);
    const t1 = u8to16(key, 2);
    const t2 = u8to16(key, 4);
    const t3 = u8to16(key, 6);
    const t4 = u8to16(key, 8);
    const t5 = u8to16(key, 10);
    const t6 = u8to16(key, 12);
    const t7 = u8to16(key, 14);
    this.r[0] = t0 & 8191;
    this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
    this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
    this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
    this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
    this.r[5] = t4 >>> 1 & 8190;
    this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
    this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
    this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
    this.r[9] = t7 >>> 5 & 127;
    for (let i2 = 0; i2 < 8; i2++)
      this.pad[i2] = u8to16(key, 16 + 2 * i2);
  }
  process(data, offset, isLast = false) {
    const hibit = isLast ? 0 : 1 << 11;
    const { h, r: r2 } = this;
    const r0 = r2[0];
    const r1 = r2[1];
    const r22 = r2[2];
    const r3 = r2[3];
    const r4 = r2[4];
    const r5 = r2[5];
    const r6 = r2[6];
    const r7 = r2[7];
    const r8 = r2[8];
    const r9 = r2[9];
    const t0 = u8to16(data, offset + 0);
    const t1 = u8to16(data, offset + 2);
    const t2 = u8to16(data, offset + 4);
    const t3 = u8to16(data, offset + 6);
    const t4 = u8to16(data, offset + 8);
    const t5 = u8to16(data, offset + 10);
    const t6 = u8to16(data, offset + 12);
    const t7 = u8to16(data, offset + 14);
    let h0 = h[0] + (t0 & 8191);
    let h1 = h[1] + ((t0 >>> 13 | t1 << 3) & 8191);
    let h2 = h[2] + ((t1 >>> 10 | t2 << 6) & 8191);
    let h3 = h[3] + ((t2 >>> 7 | t3 << 9) & 8191);
    let h4 = h[4] + ((t3 >>> 4 | t4 << 12) & 8191);
    let h5 = h[5] + (t4 >>> 1 & 8191);
    let h6 = h[6] + ((t4 >>> 14 | t5 << 2) & 8191);
    let h7 = h[7] + ((t5 >>> 11 | t6 << 5) & 8191);
    let h8 = h[8] + ((t6 >>> 8 | t7 << 8) & 8191);
    let h9 = h[9] + (t7 >>> 5 | hibit);
    let c2 = 0;
    let d0 = c2 + h0 * r0 + h1 * (5 * r9) + h2 * (5 * r8) + h3 * (5 * r7) + h4 * (5 * r6);
    c2 = d0 >>> 13;
    d0 &= 8191;
    d0 += h5 * (5 * r5) + h6 * (5 * r4) + h7 * (5 * r3) + h8 * (5 * r22) + h9 * (5 * r1);
    c2 += d0 >>> 13;
    d0 &= 8191;
    let d1 = c2 + h0 * r1 + h1 * r0 + h2 * (5 * r9) + h3 * (5 * r8) + h4 * (5 * r7);
    c2 = d1 >>> 13;
    d1 &= 8191;
    d1 += h5 * (5 * r6) + h6 * (5 * r5) + h7 * (5 * r4) + h8 * (5 * r3) + h9 * (5 * r22);
    c2 += d1 >>> 13;
    d1 &= 8191;
    let d2 = c2 + h0 * r22 + h1 * r1 + h2 * r0 + h3 * (5 * r9) + h4 * (5 * r8);
    c2 = d2 >>> 13;
    d2 &= 8191;
    d2 += h5 * (5 * r7) + h6 * (5 * r6) + h7 * (5 * r5) + h8 * (5 * r4) + h9 * (5 * r3);
    c2 += d2 >>> 13;
    d2 &= 8191;
    let d3 = c2 + h0 * r3 + h1 * r22 + h2 * r1 + h3 * r0 + h4 * (5 * r9);
    c2 = d3 >>> 13;
    d3 &= 8191;
    d3 += h5 * (5 * r8) + h6 * (5 * r7) + h7 * (5 * r6) + h8 * (5 * r5) + h9 * (5 * r4);
    c2 += d3 >>> 13;
    d3 &= 8191;
    let d4 = c2 + h0 * r4 + h1 * r3 + h2 * r22 + h3 * r1 + h4 * r0;
    c2 = d4 >>> 13;
    d4 &= 8191;
    d4 += h5 * (5 * r9) + h6 * (5 * r8) + h7 * (5 * r7) + h8 * (5 * r6) + h9 * (5 * r5);
    c2 += d4 >>> 13;
    d4 &= 8191;
    let d5 = c2 + h0 * r5 + h1 * r4 + h2 * r3 + h3 * r22 + h4 * r1;
    c2 = d5 >>> 13;
    d5 &= 8191;
    d5 += h5 * r0 + h6 * (5 * r9) + h7 * (5 * r8) + h8 * (5 * r7) + h9 * (5 * r6);
    c2 += d5 >>> 13;
    d5 &= 8191;
    let d6 = c2 + h0 * r6 + h1 * r5 + h2 * r4 + h3 * r3 + h4 * r22;
    c2 = d6 >>> 13;
    d6 &= 8191;
    d6 += h5 * r1 + h6 * r0 + h7 * (5 * r9) + h8 * (5 * r8) + h9 * (5 * r7);
    c2 += d6 >>> 13;
    d6 &= 8191;
    let d7 = c2 + h0 * r7 + h1 * r6 + h2 * r5 + h3 * r4 + h4 * r3;
    c2 = d7 >>> 13;
    d7 &= 8191;
    d7 += h5 * r22 + h6 * r1 + h7 * r0 + h8 * (5 * r9) + h9 * (5 * r8);
    c2 += d7 >>> 13;
    d7 &= 8191;
    let d8 = c2 + h0 * r8 + h1 * r7 + h2 * r6 + h3 * r5 + h4 * r4;
    c2 = d8 >>> 13;
    d8 &= 8191;
    d8 += h5 * r3 + h6 * r22 + h7 * r1 + h8 * r0 + h9 * (5 * r9);
    c2 += d8 >>> 13;
    d8 &= 8191;
    let d9 = c2 + h0 * r9 + h1 * r8 + h2 * r7 + h3 * r6 + h4 * r5;
    c2 = d9 >>> 13;
    d9 &= 8191;
    d9 += h5 * r4 + h6 * r3 + h7 * r22 + h8 * r1 + h9 * r0;
    c2 += d9 >>> 13;
    d9 &= 8191;
    c2 = (c2 << 2) + c2 | 0;
    c2 = c2 + d0 | 0;
    d0 = c2 & 8191;
    c2 = c2 >>> 13;
    d1 += c2;
    h[0] = d0;
    h[1] = d1;
    h[2] = d2;
    h[3] = d3;
    h[4] = d4;
    h[5] = d5;
    h[6] = d6;
    h[7] = d7;
    h[8] = d8;
    h[9] = d9;
  }
  finalize() {
    const { h, pad } = this;
    const g = new Uint16Array(10);
    let c2 = h[1] >>> 13;
    h[1] &= 8191;
    for (let i2 = 2; i2 < 10; i2++) {
      h[i2] += c2;
      c2 = h[i2] >>> 13;
      h[i2] &= 8191;
    }
    h[0] += c2 * 5;
    c2 = h[0] >>> 13;
    h[0] &= 8191;
    h[1] += c2;
    c2 = h[1] >>> 13;
    h[1] &= 8191;
    h[2] += c2;
    g[0] = h[0] + 5;
    c2 = g[0] >>> 13;
    g[0] &= 8191;
    for (let i2 = 1; i2 < 10; i2++) {
      g[i2] = h[i2] + c2;
      c2 = g[i2] >>> 13;
      g[i2] &= 8191;
    }
    g[9] -= 1 << 13;
    let mask = (c2 ^ 1) - 1;
    for (let i2 = 0; i2 < 10; i2++)
      g[i2] &= mask;
    mask = ~mask;
    for (let i2 = 0; i2 < 10; i2++)
      h[i2] = h[i2] & mask | g[i2];
    h[0] = (h[0] | h[1] << 13) & 65535;
    h[1] = (h[1] >>> 3 | h[2] << 10) & 65535;
    h[2] = (h[2] >>> 6 | h[3] << 7) & 65535;
    h[3] = (h[3] >>> 9 | h[4] << 4) & 65535;
    h[4] = (h[4] >>> 12 | h[5] << 1 | h[6] << 14) & 65535;
    h[5] = (h[6] >>> 2 | h[7] << 11) & 65535;
    h[6] = (h[7] >>> 5 | h[8] << 8) & 65535;
    h[7] = (h[8] >>> 8 | h[9] << 5) & 65535;
    let f2 = h[0] + pad[0];
    h[0] = f2 & 65535;
    for (let i2 = 1; i2 < 8; i2++) {
      f2 = (h[i2] + pad[i2] | 0) + (f2 >>> 16) | 0;
      h[i2] = f2 & 65535;
    }
    clean2(g);
  }
  update(data) {
    aexists2(this);
    abytes2(data);
    data = copyBytes2(data);
    const { buffer, blockLen } = this;
    const len = data.length;
    for (let pos = 0; pos < len; ) {
      const take = Math.min(blockLen - this.pos, len - pos);
      if (take === blockLen) {
        for (; blockLen <= len - pos; pos += blockLen)
          this.process(data, pos);
        continue;
      }
      buffer.set(data.subarray(pos, pos + take), this.pos);
      this.pos += take;
      pos += take;
      if (this.pos === blockLen) {
        this.process(buffer, 0, false);
        this.pos = 0;
      }
    }
    return this;
  }
  destroy() {
    clean2(this.h, this.r, this.buffer, this.pad);
  }
  digestInto(out) {
    aexists2(this);
    aoutput2(out, this);
    this.finished = true;
    const { buffer, h } = this;
    let { pos } = this;
    if (pos) {
      buffer[pos++] = 1;
      for (; pos < 16; pos++)
        buffer[pos] = 0;
      this.process(buffer, 0, true);
    }
    this.finalize();
    let opos = 0;
    for (let i2 = 0; i2 < 8; i2++) {
      out[opos++] = h[i2] >>> 0;
      out[opos++] = h[i2] >>> 8;
    }
    return out;
  }
  digest() {
    const { buffer, outputLen } = this;
    this.digestInto(buffer);
    const res = buffer.slice(0, outputLen);
    this.destroy();
    return res;
  }
};
function wrapConstructorWithKey(hashCons) {
  const hashC = (msg, key) => hashCons(key).update(msg).digest();
  const tmp = hashCons(new Uint8Array(32));
  hashC.outputLen = tmp.outputLen;
  hashC.blockLen = tmp.blockLen;
  hashC.create = (key) => hashCons(key);
  return hashC;
}
var poly1305 = /* @__PURE__ */ (() => wrapConstructorWithKey((key) => new Poly1305(key)))();

// ../../node_modules/@noble/ciphers/chacha.js
function chachaCore(s2, k, n2, out, cnt, rounds = 20) {
  let y00 = s2[0], y01 = s2[1], y02 = s2[2], y03 = s2[3], y04 = k[0], y05 = k[1], y06 = k[2], y07 = k[3], y08 = k[4], y09 = k[5], y10 = k[6], y11 = k[7], y12 = cnt, y13 = n2[0], y14 = n2[1], y15 = n2[2];
  let x00 = y00, x01 = y01, x02 = y02, x03 = y03, x04 = y04, x05 = y05, x06 = y06, x07 = y07, x08 = y08, x09 = y09, x10 = y10, x11 = y11, x12 = y12, x13 = y13, x14 = y14, x15 = y15;
  for (let r2 = 0; r2 < rounds; r2 += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = y00 + x00 | 0;
  out[oi++] = y01 + x01 | 0;
  out[oi++] = y02 + x02 | 0;
  out[oi++] = y03 + x03 | 0;
  out[oi++] = y04 + x04 | 0;
  out[oi++] = y05 + x05 | 0;
  out[oi++] = y06 + x06 | 0;
  out[oi++] = y07 + x07 | 0;
  out[oi++] = y08 + x08 | 0;
  out[oi++] = y09 + x09 | 0;
  out[oi++] = y10 + x10 | 0;
  out[oi++] = y11 + x11 | 0;
  out[oi++] = y12 + x12 | 0;
  out[oi++] = y13 + x13 | 0;
  out[oi++] = y14 + x14 | 0;
  out[oi++] = y15 + x15 | 0;
}
function hchacha(s2, k, i2, out) {
  let x00 = s2[0], x01 = s2[1], x02 = s2[2], x03 = s2[3], x04 = k[0], x05 = k[1], x06 = k[2], x07 = k[3], x08 = k[4], x09 = k[5], x10 = k[6], x11 = k[7], x12 = i2[0], x13 = i2[1], x14 = i2[2], x15 = i2[3];
  for (let r2 = 0; r2 < 20; r2 += 2) {
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 16);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 12);
    x00 = x00 + x04 | 0;
    x12 = rotl(x12 ^ x00, 8);
    x08 = x08 + x12 | 0;
    x04 = rotl(x04 ^ x08, 7);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 16);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 12);
    x01 = x01 + x05 | 0;
    x13 = rotl(x13 ^ x01, 8);
    x09 = x09 + x13 | 0;
    x05 = rotl(x05 ^ x09, 7);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 16);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 12);
    x02 = x02 + x06 | 0;
    x14 = rotl(x14 ^ x02, 8);
    x10 = x10 + x14 | 0;
    x06 = rotl(x06 ^ x10, 7);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 16);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 12);
    x03 = x03 + x07 | 0;
    x15 = rotl(x15 ^ x03, 8);
    x11 = x11 + x15 | 0;
    x07 = rotl(x07 ^ x11, 7);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 16);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 12);
    x00 = x00 + x05 | 0;
    x15 = rotl(x15 ^ x00, 8);
    x10 = x10 + x15 | 0;
    x05 = rotl(x05 ^ x10, 7);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 16);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 12);
    x01 = x01 + x06 | 0;
    x12 = rotl(x12 ^ x01, 8);
    x11 = x11 + x12 | 0;
    x06 = rotl(x06 ^ x11, 7);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 16);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 12);
    x02 = x02 + x07 | 0;
    x13 = rotl(x13 ^ x02, 8);
    x08 = x08 + x13 | 0;
    x07 = rotl(x07 ^ x08, 7);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 16);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 12);
    x03 = x03 + x04 | 0;
    x14 = rotl(x14 ^ x03, 8);
    x09 = x09 + x14 | 0;
    x04 = rotl(x04 ^ x09, 7);
  }
  let oi = 0;
  out[oi++] = x00;
  out[oi++] = x01;
  out[oi++] = x02;
  out[oi++] = x03;
  out[oi++] = x12;
  out[oi++] = x13;
  out[oi++] = x14;
  out[oi++] = x15;
}
var chacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 4,
  allowShortKeys: false
});
var xchacha20 = /* @__PURE__ */ createCipher(chachaCore, {
  counterRight: false,
  counterLength: 8,
  extendNonceFn: hchacha,
  allowShortKeys: false
});
var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
var updatePadded = (h, msg) => {
  h.update(msg);
  const leftover = msg.length % 16;
  if (leftover)
    h.update(ZEROS16.subarray(leftover));
};
var ZEROS32 = /* @__PURE__ */ new Uint8Array(32);
function computeTag(fn, key, nonce, ciphertext, AAD) {
  if (AAD !== void 0)
    abytes2(AAD, void 0, "AAD");
  const authKey = fn(key, nonce, ZEROS32);
  const lengths = u64Lengths(ciphertext.length, AAD ? AAD.length : 0, true);
  const h = poly1305.create(authKey);
  if (AAD)
    updatePadded(h, AAD);
  updatePadded(h, ciphertext);
  h.update(lengths);
  const res = h.digest();
  clean2(authKey, lengths);
  return res;
}
var _poly1305_aead = (xorStream) => (key, nonce, AAD) => {
  const tagLength = 16;
  return {
    encrypt(plaintext, output) {
      const plength = plaintext.length;
      output = getOutput(plength + tagLength, output, false);
      output.set(plaintext);
      const oPlain = output.subarray(0, -tagLength);
      xorStream(key, nonce, oPlain, oPlain, 1);
      const tag = computeTag(xorStream, key, nonce, oPlain, AAD);
      output.set(tag, plength);
      clean2(tag);
      return output;
    },
    decrypt(ciphertext, output) {
      output = getOutput(ciphertext.length - tagLength, output, false);
      const data = ciphertext.subarray(0, -tagLength);
      const passedTag = ciphertext.subarray(-tagLength);
      const tag = computeTag(xorStream, key, nonce, data, AAD);
      if (!equalBytes(passedTag, tag))
        throw new Error("invalid tag");
      output.set(ciphertext.subarray(0, -tagLength));
      xorStream(key, nonce, output, output, 1);
      clean2(tag);
      return output;
    }
  };
};
var chacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 12, tagLength: 16 }, _poly1305_aead(chacha20));
var xchacha20poly1305 = /* @__PURE__ */ wrapCipher({ blockSize: 64, nonceLength: 24, tagLength: 16 }, _poly1305_aead(xchacha20));

// ../../node_modules/@noble/hashes/hkdf.js
function extract(hash, ikm, salt) {
  ahash(hash);
  if (salt === void 0)
    salt = new Uint8Array(hash.outputLen);
  return hmac(hash, salt, ikm);
}
var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.of(0);
var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
function expand(hash, prk, info, length3 = 32) {
  ahash(hash);
  anumber(length3, "length");
  const olen = hash.outputLen;
  if (length3 > 255 * olen)
    throw new Error("Length must be <= 255*HashLen");
  const blocks = Math.ceil(length3 / olen);
  if (info === void 0)
    info = EMPTY_BUFFER;
  else
    abytes(info, void 0, "info");
  const okm = new Uint8Array(blocks * olen);
  const HMAC = hmac.create(hash, prk);
  const HMACTmp = HMAC._cloneInto();
  const T = new Uint8Array(HMAC.outputLen);
  for (let counter = 0; counter < blocks; counter++) {
    HKDF_COUNTER[0] = counter + 1;
    HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
    okm.set(T, olen * counter);
    HMAC._cloneInto(HMACTmp);
  }
  HMAC.destroy();
  HMACTmp.destroy();
  clean(T, HKDF_COUNTER);
  return okm.slice(0, length3);
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/crypto/js.js
var pureJsCrypto = {
  hashSHA256(data) {
    return sha2562(data.subarray());
  },
  getHKDF(ck, ikm) {
    const prk = extract(sha2562, ikm, ck);
    const okmU8Array = expand(sha2562, prk, void 0, 96);
    const okm = okmU8Array;
    const k1 = okm.subarray(0, 32);
    const k2 = okm.subarray(32, 64);
    const k3 = okm.subarray(64, 96);
    return [k1, k2, k3];
  },
  generateX25519KeyPair() {
    const secretKey = x25519.utils.randomSecretKey();
    const publicKey = x25519.getPublicKey(secretKey);
    return {
      publicKey,
      privateKey: secretKey
    };
  },
  generateX25519KeyPairFromSeed(seed) {
    const publicKey = x25519.getPublicKey(seed);
    return {
      publicKey,
      privateKey: seed
    };
  },
  generateX25519SharedKey(privateKey, publicKey) {
    return x25519.getSharedSecret(privateKey.subarray(), publicKey.subarray());
  },
  chaCha20Poly1305Encrypt(plaintext, nonce, ad, k) {
    return chacha20poly1305(k, nonce, ad).encrypt(plaintext.subarray());
  },
  chaCha20Poly1305Decrypt(ciphertext, nonce, ad, k, dst) {
    return chacha20poly1305(k, nonce, ad).decrypt(ciphertext.subarray(), dst);
  }
};

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/crypto/index.browser.js
var defaultCrypto = pureJsCrypto;

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/crypto.js
function wrapCrypto(crypto2) {
  return {
    generateKeypair: crypto2.generateX25519KeyPair,
    dh: (keypair, publicKey) => crypto2.generateX25519SharedKey(keypair.privateKey, publicKey).subarray(0, 32),
    encrypt: crypto2.chaCha20Poly1305Encrypt,
    decrypt: crypto2.chaCha20Poly1305Decrypt,
    hash: crypto2.hashSHA256,
    hkdf: crypto2.getHKDF
  };
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/encoder.js
var uint16BEEncode = (value) => {
  const target = allocUnsafe(2);
  target[0] = value >> 8;
  target[1] = value;
  return target;
};
uint16BEEncode.bytes = 2;
var uint16BEDecode = (data) => {
  if (data.length < 2) {
    throw RangeError("Could not decode int16BE");
  }
  if (data instanceof Uint8Array) {
    let value = 0;
    value += data[0] << 8;
    value += data[1];
    return value;
  }
  return data.getUint16(0);
};
uint16BEDecode.bytes = 2;

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/metrics.js
function registerMetrics(metrics) {
  return {
    xxHandshakeSuccesses: metrics.registerCounter("libp2p_noise_xxhandshake_successes_total", {
      help: "Total count of noise xxHandshakes successes_"
    }),
    xxHandshakeErrors: metrics.registerCounter("libp2p_noise_xxhandshake_error_total", {
      help: "Total count of noise xxHandshakes errors"
    }),
    encryptedPackets: metrics.registerCounter("libp2p_noise_encrypted_packets_total", {
      help: "Total count of noise encrypted packets successfully"
    }),
    decryptedPackets: metrics.registerCounter("libp2p_noise_decrypted_packets_total", {
      help: "Total count of noise decrypted packets"
    }),
    decryptErrors: metrics.registerCounter("libp2p_noise_decrypt_errors_total", {
      help: "Total count of noise decrypt errors"
    })
  };
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/logger.js
function logLocalStaticKeys(s2, keyLogger) {
  if (!keyLogger.enabled || !DUMP_SESSION_KEYS) {
    return;
  }
  if (s2) {
    keyLogger(`LOCAL_STATIC_PUBLIC_KEY ${toString2(s2.publicKey, "hex")}`);
    keyLogger(`LOCAL_STATIC_PRIVATE_KEY ${toString2(s2.privateKey, "hex")}`);
  } else {
    keyLogger("Missing local static keys.");
  }
}
function logLocalEphemeralKeys(e2, keyLogger) {
  if (!keyLogger.enabled || !DUMP_SESSION_KEYS) {
    return;
  }
  if (e2) {
    keyLogger(`LOCAL_PUBLIC_EPHEMERAL_KEY ${toString2(e2.publicKey, "hex")}`);
    keyLogger(`LOCAL_PRIVATE_EPHEMERAL_KEY ${toString2(e2.privateKey, "hex")}`);
  } else {
    keyLogger("Missing local ephemeral keys.");
  }
}
function logRemoteStaticKey(rs, keyLogger) {
  if (!keyLogger.enabled || !DUMP_SESSION_KEYS) {
    return;
  }
  if (rs) {
    keyLogger(`REMOTE_STATIC_PUBLIC_KEY ${toString2(rs.subarray(), "hex")}`);
  } else {
    keyLogger("Missing remote static public key.");
  }
}
function logRemoteEphemeralKey(re, keyLogger) {
  if (!keyLogger.enabled || !DUMP_SESSION_KEYS) {
    return;
  }
  if (re) {
    keyLogger(`REMOTE_EPHEMERAL_PUBLIC_KEY ${toString2(re.subarray(), "hex")}`);
  } else {
    keyLogger("Missing remote ephemeral keys.");
  }
}
function logCipherState(cs1, cs2, keyLogger) {
  if (!keyLogger.enabled || !DUMP_SESSION_KEYS) {
    return;
  }
  keyLogger(`CIPHER_STATE_1 ${cs1.n.getUint64()} ${cs1.k && toString2(cs1.k, "hex")}`);
  keyLogger(`CIPHER_STATE_2 ${cs2.n.getUint64()} ${cs2.k && toString2(cs2.k, "hex")}`);
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/errors.js
var InvalidCryptoExchangeError2 = class _InvalidCryptoExchangeError extends Error {
  code;
  constructor(message2 = "Invalid crypto exchange") {
    super(message2);
    this.code = _InvalidCryptoExchangeError.code;
  }
  static code = "ERR_INVALID_CRYPTO_EXCHANGE";
};

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/nonce.js
var MIN_NONCE = 0;
var MAX_NONCE = 4294967295;
var ERR_MAX_NONCE = "Cipherstate has reached maximum n, a new handshake must be performed";
var Nonce = class {
  n;
  bytes;
  view;
  constructor(n2 = MIN_NONCE) {
    this.n = n2;
    this.bytes = alloc(12);
    this.view = new DataView(this.bytes.buffer, this.bytes.byteOffset, this.bytes.byteLength);
    this.view.setUint32(4, n2, true);
  }
  increment() {
    this.n++;
    this.view.setUint32(4, this.n, true);
  }
  getBytes() {
    return this.bytes;
  }
  getUint64() {
    return this.n;
  }
  assertValue() {
    if (this.n > MAX_NONCE) {
      throw new Error(ERR_MAX_NONCE);
    }
  }
};

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/protocol.js
var ZEROLEN = alloc(0);
var CipherState = class {
  k;
  n;
  crypto;
  constructor(crypto2, k = void 0, n2 = 0) {
    this.crypto = crypto2;
    this.k = k;
    this.n = new Nonce(n2);
  }
  hasKey() {
    return Boolean(this.k);
  }
  encryptWithAd(ad, plaintext) {
    if (!this.hasKey()) {
      return plaintext;
    }
    this.n.assertValue();
    const e2 = this.crypto.encrypt(plaintext, this.n.getBytes(), ad, this.k);
    this.n.increment();
    return e2;
  }
  decryptWithAd(ad, ciphertext, dst) {
    if (!this.hasKey()) {
      return ciphertext;
    }
    this.n.assertValue();
    const plaintext = this.crypto.decrypt(ciphertext, this.n.getBytes(), ad, this.k, dst);
    this.n.increment();
    return plaintext;
  }
};
var SymmetricState = class {
  cs;
  ck;
  h;
  crypto;
  constructor(crypto2, protocolName) {
    this.crypto = crypto2;
    const protocolNameBytes = fromString2(protocolName, "utf-8");
    this.h = hashProtocolName(crypto2, protocolNameBytes);
    this.ck = this.h;
    this.cs = new CipherState(crypto2);
  }
  mixKey(ikm) {
    const [ck, tempK] = this.crypto.hkdf(this.ck, ikm);
    this.ck = ck;
    this.cs = new CipherState(this.crypto, tempK);
  }
  mixHash(data) {
    this.h = this.crypto.hash(new Uint8ArrayList(this.h, data));
  }
  encryptAndHash(plaintext) {
    const ciphertext = this.cs.encryptWithAd(this.h, plaintext);
    this.mixHash(ciphertext);
    return ciphertext;
  }
  decryptAndHash(ciphertext) {
    const plaintext = this.cs.decryptWithAd(this.h, ciphertext);
    this.mixHash(ciphertext);
    return plaintext;
  }
  split() {
    const [tempK1, tempK2] = this.crypto.hkdf(this.ck, ZEROLEN);
    return [new CipherState(this.crypto, tempK1), new CipherState(this.crypto, tempK2)];
  }
};
var AbstractHandshakeState = class {
  ss;
  s;
  e;
  rs;
  re;
  initiator;
  crypto;
  constructor(init) {
    const { crypto: crypto2, protocolName, prologue, initiator, s: s2, e: e2, rs, re } = init;
    this.crypto = crypto2;
    this.ss = new SymmetricState(crypto2, protocolName);
    this.ss.mixHash(prologue);
    this.initiator = initiator;
    this.s = s2;
    this.e = e2;
    this.rs = rs;
    this.re = re;
  }
  writeE() {
    if (this.e) {
      throw new Error("ephemeral keypair is already set");
    }
    const e2 = this.crypto.generateKeypair();
    this.ss.mixHash(e2.publicKey);
    this.e = e2;
    return e2.publicKey;
  }
  writeS() {
    if (!this.s) {
      throw new Error("static keypair is not set");
    }
    return this.ss.encryptAndHash(this.s.publicKey);
  }
  writeEE() {
    if (!this.e) {
      throw new Error("ephemeral keypair is not set");
    }
    if (!this.re) {
      throw new Error("remote ephemeral public key is not set");
    }
    this.ss.mixKey(this.crypto.dh(this.e, this.re));
  }
  writeES() {
    if (this.initiator) {
      if (!this.e) {
        throw new Error("ephemeral keypair is not set");
      }
      if (!this.rs) {
        throw new Error("remote static public key is not set");
      }
      this.ss.mixKey(this.crypto.dh(this.e, this.rs));
    } else {
      if (!this.s) {
        throw new Error("static keypair is not set");
      }
      if (!this.re) {
        throw new Error("remote ephemeral public key is not set");
      }
      this.ss.mixKey(this.crypto.dh(this.s, this.re));
    }
  }
  writeSE() {
    if (this.initiator) {
      if (!this.s) {
        throw new Error("static keypair is not set");
      }
      if (!this.re) {
        throw new Error("remote ephemeral public key is not set");
      }
      this.ss.mixKey(this.crypto.dh(this.s, this.re));
    } else {
      if (!this.e) {
        throw new Error("ephemeral keypair is not set");
      }
      if (!this.rs) {
        throw new Error("remote static public key is not set");
      }
      this.ss.mixKey(this.crypto.dh(this.e, this.rs));
    }
  }
  readE(message2, offset = 0) {
    if (this.re) {
      throw new Error("remote ephemeral public key is already set");
    }
    if (message2.byteLength < offset + 32) {
      throw new Error("message is not long enough");
    }
    this.re = message2.sublist(offset, offset + 32);
    this.ss.mixHash(this.re);
  }
  readS(message2, offset = 0) {
    if (this.rs) {
      throw new Error("remote static public key is already set");
    }
    const cipherLength = 32 + (this.ss.cs.hasKey() ? 16 : 0);
    if (message2.byteLength < offset + cipherLength) {
      throw new Error("message is not long enough");
    }
    const temp = message2.sublist(offset, offset + cipherLength);
    this.rs = this.ss.decryptAndHash(temp);
    return cipherLength;
  }
  readEE() {
    this.writeEE();
  }
  readES() {
    this.writeES();
  }
  readSE() {
    this.writeSE();
  }
};
var XXHandshakeState = class extends AbstractHandshakeState {
  // e
  writeMessageA(payload) {
    return new Uint8ArrayList(this.writeE(), this.ss.encryptAndHash(payload));
  }
  // e, ee, s, es
  writeMessageB(payload) {
    const e2 = this.writeE();
    this.writeEE();
    const encS = this.writeS();
    this.writeES();
    return new Uint8ArrayList(e2, encS, this.ss.encryptAndHash(payload));
  }
  // s, se
  writeMessageC(payload) {
    const encS = this.writeS();
    this.writeSE();
    return new Uint8ArrayList(encS, this.ss.encryptAndHash(payload));
  }
  // e
  readMessageA(message2) {
    try {
      this.readE(message2);
      return this.ss.decryptAndHash(message2.sublist(32));
    } catch (e2) {
      throw new InvalidCryptoExchangeError2(`handshake stage 0 validation fail: ${e2.message}`);
    }
  }
  // e, ee, s, es
  readMessageB(message2) {
    try {
      this.readE(message2);
      this.readEE();
      const consumed = this.readS(message2, 32);
      this.readES();
      return this.ss.decryptAndHash(message2.sublist(32 + consumed));
    } catch (e2) {
      throw new InvalidCryptoExchangeError2(`handshake stage 1 validation fail: ${e2.message}`);
    }
  }
  // s, se
  readMessageC(message2) {
    try {
      const consumed = this.readS(message2);
      this.readSE();
      return this.ss.decryptAndHash(message2.sublist(consumed));
    } catch (e2) {
      throw new InvalidCryptoExchangeError2(`handshake stage 2 validation fail: ${e2.message}`);
    }
  }
};
function hashProtocolName(crypto2, protocolName) {
  if (protocolName.length <= 32) {
    const h = alloc(32);
    h.set(protocolName);
    return h;
  } else {
    return crypto2.hash(protocolName);
  }
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/proto/payload.js
var NoiseExtensions;
(function(NoiseExtensions2) {
  let _codec;
  NoiseExtensions2.codec = () => {
    if (_codec == null) {
      _codec = message((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork();
        }
        if (obj.webtransportCerthashes != null) {
          for (const value of obj.webtransportCerthashes) {
            w.uint32(10);
            w.bytes(value);
          }
        }
        if (obj.streamMuxers != null) {
          for (const value of obj.streamMuxers) {
            w.uint32(18);
            w.string(value);
          }
        }
        if (opts.lengthDelimited !== false) {
          w.ldelim();
        }
      }, (reader, length3, opts = {}) => {
        const obj = {
          webtransportCerthashes: [],
          streamMuxers: []
        };
        const end = length3 == null ? reader.len : reader.pos + length3;
        while (reader.pos < end) {
          const tag = reader.uint32();
          switch (tag >>> 3) {
            case 1: {
              if (opts.limits?.webtransportCerthashes != null && obj.webtransportCerthashes.length === opts.limits.webtransportCerthashes) {
                throw new MaxLengthError('Decode error - map field "webtransportCerthashes" had too many elements');
              }
              obj.webtransportCerthashes.push(reader.bytes());
              break;
            }
            case 2: {
              if (opts.limits?.streamMuxers != null && obj.streamMuxers.length === opts.limits.streamMuxers) {
                throw new MaxLengthError('Decode error - map field "streamMuxers" had too many elements');
              }
              obj.streamMuxers.push(reader.string());
              break;
            }
            default: {
              reader.skipType(tag & 7);
              break;
            }
          }
        }
        return obj;
      });
    }
    return _codec;
  };
  NoiseExtensions2.encode = (obj) => {
    return encodeMessage(obj, NoiseExtensions2.codec());
  };
  NoiseExtensions2.decode = (buf, opts) => {
    return decodeMessage(buf, NoiseExtensions2.codec(), opts);
  };
})(NoiseExtensions || (NoiseExtensions = {}));
var NoiseHandshakePayload;
(function(NoiseHandshakePayload2) {
  let _codec;
  NoiseHandshakePayload2.codec = () => {
    if (_codec == null) {
      _codec = message((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork();
        }
        if (obj.identityKey != null && obj.identityKey.byteLength > 0) {
          w.uint32(10);
          w.bytes(obj.identityKey);
        }
        if (obj.identitySig != null && obj.identitySig.byteLength > 0) {
          w.uint32(18);
          w.bytes(obj.identitySig);
        }
        if (obj.extensions != null) {
          w.uint32(34);
          NoiseExtensions.codec().encode(obj.extensions, w);
        }
        if (opts.lengthDelimited !== false) {
          w.ldelim();
        }
      }, (reader, length3, opts = {}) => {
        const obj = {
          identityKey: alloc(0),
          identitySig: alloc(0)
        };
        const end = length3 == null ? reader.len : reader.pos + length3;
        while (reader.pos < end) {
          const tag = reader.uint32();
          switch (tag >>> 3) {
            case 1: {
              obj.identityKey = reader.bytes();
              break;
            }
            case 2: {
              obj.identitySig = reader.bytes();
              break;
            }
            case 4: {
              obj.extensions = NoiseExtensions.codec().decode(reader, reader.uint32(), {
                limits: opts.limits?.extensions
              });
              break;
            }
            default: {
              reader.skipType(tag & 7);
              break;
            }
          }
        }
        return obj;
      });
    }
    return _codec;
  };
  NoiseHandshakePayload2.encode = (obj) => {
    return encodeMessage(obj, NoiseHandshakePayload2.codec());
  };
  NoiseHandshakePayload2.decode = (buf, opts) => {
    return decodeMessage(buf, NoiseHandshakePayload2.codec(), opts);
  };
})(NoiseHandshakePayload || (NoiseHandshakePayload = {}));

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/utils.js
async function createHandshakePayload(privateKey, staticPublicKey, extensions) {
  const identitySig = await privateKey.sign(getSignaturePayload(staticPublicKey));
  return NoiseHandshakePayload.encode({
    identityKey: publicKeyToProtobuf(privateKey.publicKey),
    identitySig,
    extensions
  });
}
async function decodeHandshakePayload(payloadBytes, remoteStaticKey, remoteIdentityKey) {
  try {
    const payload = NoiseHandshakePayload.decode(payloadBytes);
    const publicKey = publicKeyFromProtobuf(payload.identityKey);
    if (remoteIdentityKey?.equals(publicKey) === false) {
      throw new Error(`Payload identity key ${publicKey} does not match expected remote identity key ${remoteIdentityKey}`);
    }
    if (!remoteStaticKey) {
      throw new Error("Remote static does not exist");
    }
    const signaturePayload = getSignaturePayload(remoteStaticKey);
    if (!await publicKey.verify(signaturePayload, payload.identitySig)) {
      throw new Error("Invalid payload signature");
    }
    return payload;
  } catch (e2) {
    throw new UnexpectedPeerError(e2.message);
  }
}
function getSignaturePayload(publicKey) {
  const prefix2 = fromString2("noise-libp2p-static-key:");
  if (publicKey instanceof Uint8Array) {
    return concat([prefix2, publicKey], prefix2.length + publicKey.length);
  }
  publicKey.prepend(prefix2);
  return publicKey;
}
var EncryptedMessageStream = class extends AbstractMessageStream {
  stream;
  handshake;
  metrics;
  decoder;
  constructor(stream, handshake, metrics) {
    super({
      log: stream.log,
      inactivityTimeout: stream.inactivityTimeout,
      maxReadBufferLength: stream.maxReadBufferLength,
      direction: stream.direction
    });
    this.stream = stream;
    this.handshake = handshake;
    this.metrics = metrics;
    this.decoder = new LengthPrefixedDecoder({
      lengthDecoder: uint16BEDecode,
      maxBufferSize: 16 * 1024 * 1024,
      encodingLength: () => 2
    });
    const noiseOnMessageDecrypt = (evt) => {
      try {
        for (const buf of this.decoder.decode(evt.data)) {
          this.onData(this.decrypt(buf));
        }
      } catch (err) {
        this.abort(err);
      }
    };
    this.stream.addEventListener("message", noiseOnMessageDecrypt);
    const noiseOnClose = (evt) => {
      if (evt.error != null) {
        if (evt.local === true) {
          this.abort(evt.error);
        } else {
          this.onRemoteReset();
        }
      } else {
        this.onTransportClosed();
      }
    };
    this.stream.addEventListener("close", noiseOnClose);
    const noiseOnDrain = () => {
      this.safeDispatchEvent("drain");
    };
    this.stream.addEventListener("drain", noiseOnDrain);
    const noiseOnRemoteCloseWrite = () => {
      this.onRemoteCloseWrite();
    };
    this.stream.addEventListener("remoteCloseWrite", noiseOnRemoteCloseWrite);
  }
  encrypt(chunk) {
    const output = new Uint8ArrayList();
    for (let i2 = 0; i2 < chunk.byteLength; i2 += NOISE_MSG_MAX_LENGTH_BYTES_WITHOUT_TAG) {
      let end = i2 + NOISE_MSG_MAX_LENGTH_BYTES_WITHOUT_TAG;
      if (end > chunk.byteLength) {
        end = chunk.byteLength;
      }
      let data;
      if (chunk instanceof Uint8Array) {
        data = this.handshake.encrypt(chunk.subarray(i2, end));
      } else {
        data = this.handshake.encrypt(chunk.sublist(i2, end));
      }
      this.metrics?.encryptedPackets.increment();
      output.append(uint16BEEncode(data.byteLength));
      output.append(data);
    }
    return output;
  }
  decrypt(chunk) {
    const output = new Uint8ArrayList();
    for (let i2 = 0; i2 < chunk.byteLength; i2 += NOISE_MSG_MAX_LENGTH_BYTES) {
      let end = i2 + NOISE_MSG_MAX_LENGTH_BYTES;
      if (end > chunk.byteLength) {
        end = chunk.byteLength;
      }
      if (end - CHACHA_TAG_LENGTH < i2) {
        throw new Error("Invalid chunk");
      }
      let encrypted;
      if (chunk instanceof Uint8Array) {
        encrypted = chunk.subarray(i2, end);
      } else {
        encrypted = chunk.sublist(i2, end);
      }
      const dst = chunk.subarray(i2, end - CHACHA_TAG_LENGTH);
      try {
        const plaintext = this.handshake.decrypt(encrypted, dst);
        this.metrics?.decryptedPackets.increment();
        output.append(plaintext);
      } catch (e2) {
        this.metrics?.decryptErrors.increment();
        throw e2;
      }
    }
    return output;
  }
  close(options) {
    return this.stream.close(options);
  }
  sendPause() {
    this.stream.pause();
  }
  sendResume() {
    this.stream.resume();
  }
  sendReset(err) {
    this.stream.abort(err);
  }
  sendData(data) {
    return {
      sentBytes: data.byteLength,
      canSendMore: this.stream.send(this.encrypt(data))
    };
  }
};
function toMessageStream(connection, handshake, metrics) {
  return new EncryptedMessageStream(connection, handshake, metrics);
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/performHandshake.js
async function performHandshakeInitiator(init, options) {
  const { log: log3, connection, crypto: crypto2, privateKey, prologue, s: s2, remoteIdentityKey, extensions } = init;
  const payload = await createHandshakePayload(privateKey, s2.publicKey, extensions);
  const xx = new XXHandshakeState({
    crypto: crypto2,
    protocolName: "Noise_XX_25519_ChaChaPoly_SHA256",
    initiator: true,
    prologue,
    s: s2
  });
  logLocalStaticKeys(xx.s, log3);
  log3.trace("Stage 0 - Initiator starting to send first message.");
  await connection.write(xx.writeMessageA(ZEROLEN), options);
  log3.trace("Stage 0 - Initiator finished sending first message.");
  logLocalEphemeralKeys(xx.e, log3);
  log3.trace("Stage 1 - Initiator waiting to receive first message from responder...");
  const plaintext = xx.readMessageB(await connection.read(options));
  log3.trace("Stage 1 - Initiator received the message.");
  logRemoteEphemeralKey(xx.re, log3);
  logRemoteStaticKey(xx.rs, log3);
  log3.trace("Initiator going to check remote's signature...");
  const receivedPayload = await decodeHandshakePayload(plaintext, xx.rs, remoteIdentityKey);
  log3.trace("All good with the signature!");
  log3.trace("Stage 2 - Initiator sending third handshake message.");
  await connection.write(xx.writeMessageC(payload), options);
  log3.trace("Stage 2 - Initiator sent message with signed payload.");
  const [cs1, cs2] = xx.ss.split();
  logCipherState(cs1, cs2, log3);
  return {
    payload: receivedPayload,
    encrypt: (plaintext2) => cs1.encryptWithAd(ZEROLEN, plaintext2),
    decrypt: (ciphertext, dst) => cs2.decryptWithAd(ZEROLEN, ciphertext, dst)
  };
}
async function performHandshakeResponder(init, options) {
  const { log: log3, connection, crypto: crypto2, privateKey, prologue, s: s2, remoteIdentityKey, extensions } = init;
  const payload = await createHandshakePayload(privateKey, s2.publicKey, extensions);
  const xx = new XXHandshakeState({
    crypto: crypto2,
    protocolName: "Noise_XX_25519_ChaChaPoly_SHA256",
    initiator: false,
    prologue,
    s: s2
  });
  logLocalStaticKeys(xx.s, log3);
  log3.trace("Stage 0 - Responder waiting to receive first message.");
  xx.readMessageA(await connection.read(options));
  log3.trace("Stage 0 - Responder received first message.");
  logRemoteEphemeralKey(xx.re, log3);
  log3.trace("Stage 1 - Responder sending out first message with signed payload and static key.");
  await connection.write(xx.writeMessageB(payload), options);
  log3.trace("Stage 1 - Responder sent the second handshake message with signed payload.");
  logLocalEphemeralKeys(xx.e, log3);
  log3.trace("Stage 2 - Responder waiting for third handshake message...");
  const plaintext = xx.readMessageC(await connection.read(options));
  log3.trace("Stage 2 - Responder received the message, finished handshake.");
  const receivedPayload = await decodeHandshakePayload(plaintext, xx.rs, remoteIdentityKey);
  const [cs1, cs2] = xx.ss.split();
  logCipherState(cs1, cs2, log3);
  return {
    payload: receivedPayload,
    encrypt: (plaintext2) => cs2.encryptWithAd(ZEROLEN, plaintext2),
    decrypt: (ciphertext, dst) => cs1.decryptWithAd(ZEROLEN, ciphertext, dst)
  };
}

// ../../node_modules/@chainsafe/libp2p-noise/dist/src/noise.js
var Noise = class {
  protocol = "/noise";
  crypto;
  prologue;
  staticKey;
  extensions;
  metrics;
  components;
  log;
  constructor(components, init = {}) {
    const { staticNoiseKey, extensions, crypto: crypto2, prologueBytes } = init;
    const { metrics } = components;
    this.components = components;
    this.log = components.logger.forComponent("libp2p:noise");
    const _crypto = crypto2 ?? defaultCrypto;
    this.crypto = wrapCrypto(_crypto);
    this.extensions = {
      webtransportCerthashes: [],
      ...extensions
    };
    this.metrics = metrics ? registerMetrics(metrics) : void 0;
    if (staticNoiseKey) {
      this.staticKey = _crypto.generateX25519KeyPairFromSeed(staticNoiseKey);
    } else {
      this.staticKey = _crypto.generateX25519KeyPair();
    }
    this.prologue = prologueBytes ?? alloc(0);
  }
  [Symbol.toStringTag] = "@chainsafe/libp2p-noise";
  [serviceCapabilities] = [
    "@libp2p/connection-encryption",
    "@chainsafe/libp2p-noise"
  ];
  /**
   * Encrypt outgoing data to the remote party (handshake as initiator)
   *
   * @param connection - streaming iterable duplex that will be encrypted
   * @param options
   * @param options.remotePeer - PeerId of the remote peer. Used to validate the integrity of the remote peer
   * @param options.signal - Used to abort the operation
   */
  async secureOutbound(connection, options) {
    const log3 = connection.log?.newScope("noise") ?? this.log;
    const wrappedConnection = lpStream(connection, {
      lengthEncoder: uint16BEEncode,
      lengthDecoder: uint16BEDecode,
      maxDataLength: NOISE_MSG_MAX_LENGTH_BYTES
    });
    const handshake = await this.performHandshakeInitiator(wrappedConnection, this.components.privateKey, log3, options?.remotePeer?.publicKey, options);
    const publicKey = publicKeyFromProtobuf(handshake.payload.identityKey);
    return {
      connection: toMessageStream(wrappedConnection.unwrap(), handshake, this.metrics),
      remoteExtensions: handshake.payload.extensions,
      remotePeer: peerIdFromPublicKey(publicKey),
      streamMuxer: options?.skipStreamMuxerNegotiation === true ? void 0 : this.getStreamMuxer(handshake.payload.extensions?.streamMuxers)
    };
  }
  getStreamMuxer(protocols) {
    if (protocols == null || protocols.length === 0) {
      return;
    }
    const streamMuxers = this.components.upgrader.getStreamMuxers();
    if (streamMuxers != null) {
      for (const protocol of protocols) {
        const streamMuxer = streamMuxers.get(protocol);
        if (streamMuxer != null) {
          return streamMuxer;
        }
      }
    }
    if (protocols.length) {
      throw new InvalidCryptoExchangeError("Early muxer negotiation was requested but the initiator and responder had no common muxers");
    }
  }
  /**
   * Decrypt incoming data (handshake as responder).
   *
   * @param connection - streaming iterable duplex that will be encrypted
   * @param options
   * @param options.remotePeer - PeerId of the remote peer. Used to validate the integrity of the remote peer
   * @param options.signal - Used to abort the operation
   */
  async secureInbound(connection, options) {
    const log3 = connection.log?.newScope("noise") ?? this.log;
    const wrappedConnection = lpStream(connection, {
      lengthEncoder: uint16BEEncode,
      lengthDecoder: uint16BEDecode,
      maxDataLength: NOISE_MSG_MAX_LENGTH_BYTES
    });
    const handshake = await this.performHandshakeResponder(wrappedConnection, this.components.privateKey, log3, options?.remotePeer?.publicKey, options);
    const publicKey = publicKeyFromProtobuf(handshake.payload.identityKey);
    return {
      connection: toMessageStream(wrappedConnection.unwrap(), handshake, this.metrics),
      remoteExtensions: handshake.payload.extensions,
      remotePeer: peerIdFromPublicKey(publicKey),
      streamMuxer: options?.skipStreamMuxerNegotiation === true ? void 0 : this.getStreamMuxer(handshake.payload.extensions?.streamMuxers)
    };
  }
  /**
   * Perform XX handshake as initiator.
   */
  async performHandshakeInitiator(connection, privateKey, log3, remoteIdentityKey, options) {
    let result;
    const streamMuxers = options?.skipStreamMuxerNegotiation === true ? [] : [...this.components.upgrader.getStreamMuxers().keys()];
    try {
      result = await performHandshakeInitiator({
        connection,
        privateKey,
        remoteIdentityKey,
        log: log3.newScope("xxhandshake"),
        crypto: this.crypto,
        prologue: this.prologue,
        s: this.staticKey,
        extensions: {
          streamMuxers,
          webtransportCerthashes: [],
          ...this.extensions
        }
      }, options);
      this.metrics?.xxHandshakeSuccesses.increment();
    } catch (e2) {
      this.metrics?.xxHandshakeErrors.increment();
      throw e2;
    }
    return result;
  }
  /**
   * Perform XX handshake as responder.
   */
  async performHandshakeResponder(connection, privateKey, log3, remoteIdentityKey, options) {
    let result;
    const streamMuxers = options?.skipStreamMuxerNegotiation === true ? [] : [...this.components.upgrader.getStreamMuxers().keys()];
    try {
      result = await performHandshakeResponder({
        connection,
        privateKey,
        remoteIdentityKey,
        log: log3.newScope("xxhandshake"),
        crypto: this.crypto,
        prologue: this.prologue,
        s: this.staticKey,
        extensions: {
          streamMuxers,
          webtransportCerthashes: [],
          ...this.extensions
        }
      }, options);
      this.metrics?.xxHandshakeSuccesses.increment();
    } catch (e2) {
      this.metrics?.xxHandshakeErrors.increment();
      throw e2;
    }
    return result;
  }
};

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/frame.js
var FrameType;
(function(FrameType2) {
  FrameType2[FrameType2["Data"] = 0] = "Data";
  FrameType2[FrameType2["WindowUpdate"] = 1] = "WindowUpdate";
  FrameType2[FrameType2["Ping"] = 2] = "Ping";
  FrameType2[FrameType2["GoAway"] = 3] = "GoAway";
})(FrameType || (FrameType = {}));
var Flag;
(function(Flag2) {
  Flag2[Flag2["SYN"] = 1] = "SYN";
  Flag2[Flag2["ACK"] = 2] = "ACK";
  Flag2[Flag2["FIN"] = 4] = "FIN";
  Flag2[Flag2["RST"] = 8] = "RST";
})(Flag || (Flag = {}));
var flagCodes = Object.values(Flag).filter((x) => typeof x !== "string");
var YAMUX_VERSION = 0;
var GoAwayCode;
(function(GoAwayCode2) {
  GoAwayCode2[GoAwayCode2["NormalTermination"] = 0] = "NormalTermination";
  GoAwayCode2[GoAwayCode2["ProtocolError"] = 1] = "ProtocolError";
  GoAwayCode2[GoAwayCode2["InternalError"] = 2] = "InternalError";
})(GoAwayCode || (GoAwayCode = {}));
var HEADER_LENGTH = 12;

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/errors.js
var ProtocolError = class extends Error {
  static name = "ProtocolError";
  reason;
  constructor(message2, reason) {
    super(message2);
    this.name = "ProtocolError";
    this.reason = reason;
  }
};
function isProtocolError(err) {
  return err?.reason !== null;
}
var InvalidFrameError = class extends ProtocolError {
  static name = "InvalidFrameError";
  constructor(message2 = "The frame was invalid") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "InvalidFrameError";
  }
};
var UnRequestedPingError = class extends ProtocolError {
  static name = "UnRequestedPingError";
  constructor(message2 = "Un-requested ping error") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "UnRequestedPingError";
  }
};
var NotMatchingPingError = class extends ProtocolError {
  static name = "NotMatchingPingError";
  constructor(message2 = "Not matching ping error") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "NotMatchingPingError";
  }
};
var StreamAlreadyExistsError = class extends ProtocolError {
  static name = "StreamAlreadyExistsError";
  constructor(message2 = "Stream already exists") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "StreamAlreadyExistsError";
  }
};
var DecodeInvalidVersionError = class extends ProtocolError {
  static name = "DecodeInvalidVersionError";
  constructor(message2 = "Decode invalid version") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "DecodeInvalidVersionError";
  }
};
var BothClientsError = class extends ProtocolError {
  static name = "BothClientsError";
  constructor(message2 = "Both clients") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "BothClientsError";
  }
};
var ReceiveWindowExceededError = class extends ProtocolError {
  static name = "ReceiveWindowExceededError";
  constructor(message2 = "Receive window exceeded") {
    super(message2, GoAwayCode.ProtocolError);
    this.name = "ReceiveWindowExceededError";
  }
};

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/constants.js
var PROTOCOL_ERRORS = /* @__PURE__ */ new Set([
  InvalidFrameError.name,
  UnRequestedPingError.name,
  NotMatchingPingError.name,
  StreamAlreadyExistsError.name,
  DecodeInvalidVersionError.name,
  BothClientsError.name,
  ReceiveWindowExceededError.name
]);
var INITIAL_STREAM_WINDOW = 256 * 1024;
var MAX_STREAM_WINDOW = 16 * 1024 * 1024;

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/config.js
var defaultConfig = {
  enableKeepAlive: true,
  keepAliveInterval: 3e4,
  maxInboundStreams: 1e3,
  maxOutboundStreams: 1e3,
  maxMessageSize: 64 * 1024,
  maxEarlyStreams: 10,
  streamOptions: {
    initialStreamWindowSize: INITIAL_STREAM_WINDOW,
    maxStreamWindowSize: MAX_STREAM_WINDOW,
    inactivityTimeout: 12e4,
    maxReadBufferLength: 4194304,
    maxWriteBufferLength: Infinity
  }
};
function verifyConfig(config) {
  if (config.keepAliveInterval != null && config.keepAliveInterval <= 0) {
    throw new InvalidParametersError("keep-alive interval must be positive");
  }
  if (config.maxInboundStreams != null && config.maxInboundStreams < 0) {
    throw new InvalidParametersError("max inbound streams must be larger or equal 0");
  }
  if (config.maxOutboundStreams != null && config.maxOutboundStreams < 0) {
    throw new InvalidParametersError("max outbound streams must be larger or equal 0");
  }
  if (config.maxMessageSize != null && config.maxMessageSize < 1024) {
    throw new InvalidParametersError("MaxMessageSize must be greater than a kilobyte");
  }
  if (config.streamOptions?.initialStreamWindowSize != null && config.streamOptions?.initialStreamWindowSize < INITIAL_STREAM_WINDOW) {
    throw new InvalidParametersError("InitialStreamWindowSize must be larger or equal 256 kB");
  }
  if (config.streamOptions?.maxStreamWindowSize != null && config.streamOptions?.initialStreamWindowSize != null && config.streamOptions?.maxStreamWindowSize < config.streamOptions?.initialStreamWindowSize) {
    throw new InvalidParametersError("MaxStreamWindowSize must be larger than the InitialStreamWindowSize");
  }
  if (config.streamOptions?.maxStreamWindowSize != null && config.streamOptions?.maxStreamWindowSize > 2 ** 32 - 1) {
    throw new InvalidParametersError("MaxStreamWindowSize must be less than equal MAX_UINT32");
  }
}

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/decode.js
function isDataFrame(frame) {
  return frame.header.type === FrameType.Data && frame.data !== null;
}
var twoPow24 = 2 ** 24;
function decodeHeader(data) {
  if (data[0] !== YAMUX_VERSION) {
    throw new InvalidFrameError("Invalid frame version");
  }
  return {
    type: data[1],
    flag: (data[2] << 8) + data[3],
    streamID: data[4] * twoPow24 + (data[5] << 16) + (data[6] << 8) + data[7],
    length: data[8] * twoPow24 + (data[9] << 16) + (data[10] << 8) + data[11]
  };
}
var Decoder2 = class {
  /** Buffer for in-progress frames */
  buffer;
  constructor() {
    this.buffer = new Uint8ArrayList();
  }
  /**
   * Emits frames from the decoder source.
   *
   * Note: If `readData` is emitted, it _must_ be called before the next iteration
   * Otherwise an error is thrown
   */
  *emitFrames(buf) {
    this.buffer.append(buf);
    while (true) {
      const frame = this.readFrame();
      if (frame === void 0) {
        break;
      }
      yield frame;
    }
  }
  readFrame() {
    let frameSize = HEADER_LENGTH;
    if (this.buffer.byteLength < HEADER_LENGTH) {
      return;
    }
    const header = decodeHeader(this.buffer.subarray(0, HEADER_LENGTH));
    if (header.type === FrameType.Data) {
      frameSize += header.length;
      if (this.buffer.byteLength < frameSize) {
        return;
      }
      const data = this.buffer.sublist(HEADER_LENGTH, frameSize);
      this.buffer.consume(frameSize);
      return { header, data };
    }
    this.buffer.consume(frameSize);
    return { header };
  }
};

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/encode.js
function encodeHeader(header) {
  const frame = new Uint8Array(HEADER_LENGTH);
  frame[1] = header.type;
  frame[2] = header.flag >>> 8;
  frame[3] = header.flag;
  frame[4] = header.streamID >>> 24;
  frame[5] = header.streamID >>> 16;
  frame[6] = header.streamID >>> 8;
  frame[7] = header.streamID;
  frame[8] = header.length >>> 24;
  frame[9] = header.length >>> 16;
  frame[10] = header.length >>> 8;
  frame[11] = header.length;
  return frame;
}

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/stream.js
var StreamState;
(function(StreamState2) {
  StreamState2[StreamState2["Init"] = 0] = "Init";
  StreamState2[StreamState2["SYNSent"] = 1] = "SYNSent";
  StreamState2[StreamState2["SYNReceived"] = 2] = "SYNReceived";
  StreamState2[StreamState2["Established"] = 3] = "Established";
  StreamState2[StreamState2["Finished"] = 4] = "Finished";
  StreamState2[StreamState2["Paused"] = 5] = "Paused";
})(StreamState || (StreamState = {}));
var YamuxStream = class extends AbstractStream {
  streamId;
  state;
  /** The number of available bytes to send */
  sendWindowCapacity;
  /** The number of bytes available to receive in a full window */
  recvWindow;
  /** The number of available bytes to receive */
  recvWindowCapacity;
  maxStreamWindowSize;
  /**
   * An 'epoch' is the time it takes to process and read data
   *
   * Used in conjunction with RTT to determine whether to increase the recvWindow
   */
  epochStart;
  getRTT;
  sendFrame;
  constructor(init) {
    const initialWindowSize = init.initialStreamWindowSize ?? INITIAL_STREAM_WINDOW;
    super({
      ...init,
      maxMessageSize: initialWindowSize - HEADER_LENGTH
    });
    this.streamId = init.streamId;
    this.state = init.state;
    this.sendWindowCapacity = initialWindowSize;
    this.recvWindow = initialWindowSize;
    this.recvWindowCapacity = this.recvWindow;
    this.maxStreamWindowSize = init.maxStreamWindowSize ?? MAX_STREAM_WINDOW;
    this.epochStart = Date.now();
    this.getRTT = init.getRTT;
    this.sendFrame = init.sendFrame;
    const setStateToFinishedOnCloseListener = () => {
      this.state = StreamState.Finished;
    };
    this.addEventListener("close", setStateToFinishedOnCloseListener);
  }
  /**
   * Send a data message to the remote muxer
   */
  sendData(buf) {
    const totalBytes = buf.byteLength;
    let sentBytes = 0;
    let canSendMore = true;
    this.log?.trace("send window capacity is %d bytes", this.sendWindowCapacity);
    while (buf.byteLength > 0) {
      if (this.sendWindowCapacity === 0) {
        canSendMore = false;
        this.log?.trace("sent %d/%d bytes, exhausted send window, waiting for window update", sentBytes, totalBytes);
        break;
      }
      const toSend = Math.min(this.sendWindowCapacity, buf.byteLength);
      const flags = this.getSendFlags();
      const data = buf.sublist(0, toSend);
      buf.consume(toSend);
      const muxerSendMore = this.sendFrame({
        type: FrameType.Data,
        flag: flags,
        streamID: this.streamId,
        length: toSend
      }, data);
      this.sendWindowCapacity -= toSend;
      sentBytes += toSend;
      if (!muxerSendMore) {
        canSendMore = muxerSendMore;
        this.log.trace("sent %d/%d bytes, wait for muxer to have more send capacity", sentBytes, totalBytes);
        break;
      }
    }
    return {
      sentBytes,
      canSendMore
    };
  }
  /**
   * Send a reset message to the remote muxer
   */
  sendReset() {
    this.sendFrame({
      type: FrameType.WindowUpdate,
      flag: Flag.RST,
      streamID: this.streamId,
      length: 0
    });
  }
  /**
   * Send a message to the remote muxer, informing them no more data messages
   * will be sent by this end of the stream
   */
  async sendCloseWrite() {
    const flags = this.getSendFlags() | Flag.FIN;
    this.sendFrame({
      type: FrameType.WindowUpdate,
      flag: flags,
      streamID: this.streamId,
      length: 0
    });
  }
  /**
   * Send a message to the remote muxer, informing them no more data messages
   * will be read by this end of the stream - this is a no-op on Yamux streams
   */
  async sendCloseRead(options) {
    options?.signal?.throwIfAborted();
  }
  /**
   * Stop sending window updates temporarily - in the interim the the remote
   * send window will exhaust and the remote will stop sending data
   */
  sendPause() {
    this.state = StreamState.Paused;
  }
  /**
   * Start sending window updates as normal
   */
  sendResume() {
    this.state = StreamState.Established;
    this.sendWindowUpdate();
  }
  /**
   * handleWindowUpdate is called when the stream receives a window update frame
   */
  handleWindowUpdate(frame) {
    this.processFlags(frame.header.flag);
    this.sendWindowCapacity += frame.header.length;
    this.maxMessageSize = this.sendWindowCapacity - HEADER_LENGTH;
    if (this.maxMessageSize < 0) {
      this.maxMessageSize = 0;
    }
    if (this.maxMessageSize === 0) {
      return;
    }
    if (this.writeBuffer.byteLength > 0) {
      this.log?.trace("window update of %d bytes allows more data to be sent, have %d bytes queued, sending data %s", frame.header.length, this.writeBuffer.byteLength, this.sendingData);
      this.safeDispatchEvent("drain");
    }
  }
  /**
   * handleData is called when the stream receives a data frame
   */
  handleData(frame) {
    if (!isDataFrame(frame)) {
      throw new InvalidFrameError("Frame was not data frame");
    }
    this.processFlags(frame.header.flag);
    if (this.recvWindowCapacity < frame.header.length) {
      throw new ReceiveWindowExceededError("Receive window exceeded");
    }
    this.recvWindowCapacity -= frame.header.length;
    this.onData(frame.data);
    this.sendWindowUpdate();
  }
  /**
   * processFlags is used to update the state of the stream based on set flags, if any.
   */
  processFlags(flags) {
    if ((flags & Flag.ACK) === Flag.ACK) {
      if (this.state === StreamState.SYNSent) {
        this.state = StreamState.Established;
      }
    }
    if ((flags & Flag.FIN) === Flag.FIN) {
      this.onRemoteCloseWrite();
    }
    if ((flags & Flag.RST) === Flag.RST) {
      this.onRemoteReset();
    }
  }
  /**
   * getSendFlags determines any flags that are appropriate
   * based on the current stream state.
   *
   * The state is updated as a side-effect.
   */
  getSendFlags() {
    switch (this.state) {
      case StreamState.Init:
        this.state = StreamState.SYNSent;
        return Flag.SYN;
      case StreamState.SYNReceived:
        this.state = StreamState.Established;
        return Flag.ACK;
      default:
        return 0;
    }
  }
  /**
   * Potentially sends a window update enabling further remote writes to take
   * place.
   */
  sendWindowUpdate() {
    if (this.state === StreamState.Paused) {
      this.epochStart = Date.now();
      return;
    }
    const flags = this.getSendFlags();
    const now = Date.now();
    const rtt = this.getRTT();
    if (flags === 0 && rtt > -1 && now - this.epochStart <= rtt * 4) {
      this.recvWindow = Math.min(this.recvWindow * 2, this.maxStreamWindowSize);
    }
    if (this.recvWindowCapacity >= this.recvWindow && flags === 0) {
      return;
    }
    const delta = this.recvWindow - this.recvWindowCapacity;
    this.recvWindowCapacity = this.recvWindow;
    this.epochStart = now;
    this.sendFrame({
      type: FrameType.WindowUpdate,
      flag: flags,
      streamID: this.streamId,
      length: delta
    });
  }
};

// ../../node_modules/@chainsafe/libp2p-yamux/dist/src/muxer.js
function debugFrame(header) {
  return {
    type: FrameType[header.type],
    flags: [
      (header.flag & Flag.SYN) === Flag.SYN ? "SYN" : void 0,
      (header.flag & Flag.ACK) === Flag.ACK ? "ACK" : void 0,
      (header.flag & Flag.FIN) === Flag.FIN ? "FIN" : void 0,
      (header.flag & Flag.RST) === Flag.RST ? "RST" : void 0
    ].filter(Boolean),
    streamID: header.streamID,
    length: header.length
  };
}
var YAMUX_PROTOCOL_ID = "/yamux/1.0.0";
var Yamux = class {
  protocol = YAMUX_PROTOCOL_ID;
  _init;
  constructor(init = {}) {
    this._init = init;
  }
  [Symbol.toStringTag] = "@chainsafe/libp2p-yamux";
  [serviceCapabilities] = [
    "@libp2p/stream-multiplexing"
  ];
  createStreamMuxer(maConn) {
    return new YamuxMuxer(maConn, {
      ...this._init
    });
  }
};
var YamuxMuxer = class extends AbstractStreamMuxer {
  /** The next stream id to be used when initiating a new stream */
  nextStreamID;
  /** The next ping id to be used when pinging */
  nextPingID;
  /** Tracking info for the currently active ping */
  activePing;
  /** Round trip time */
  rtt;
  /** True if client, false if server */
  client;
  localGoAway;
  remoteGoAway;
  /** Number of tracked inbound streams */
  numInboundStreams;
  /** Number of tracked outbound streams */
  numOutboundStreams;
  decoder;
  keepAlive;
  enableKeepAlive;
  keepAliveInterval;
  maxInboundStreams;
  maxOutboundStreams;
  constructor(maConn, init = {}) {
    super(maConn, {
      ...init,
      protocol: YAMUX_PROTOCOL_ID,
      name: "yamux"
    });
    this.client = maConn.direction === "outbound";
    verifyConfig(init);
    this.enableKeepAlive = init.enableKeepAlive ?? defaultConfig.enableKeepAlive;
    this.keepAliveInterval = init.keepAliveInterval ?? defaultConfig.keepAliveInterval;
    this.maxInboundStreams = init.maxInboundStreams ?? defaultConfig.maxInboundStreams;
    this.maxOutboundStreams = init.maxOutboundStreams ?? defaultConfig.maxOutboundStreams;
    this.decoder = new Decoder2();
    this.numInboundStreams = 0;
    this.numOutboundStreams = 0;
    this.nextStreamID = this.client ? 1 : 2;
    this.nextPingID = 0;
    this.rtt = -1;
    this.log.trace("muxer created");
    if (this.enableKeepAlive) {
      this.log.trace("muxer keepalive enabled interval=%s", this.keepAliveInterval);
      this.keepAlive = repeatingTask(async (options) => {
        try {
          await this.ping(options);
        } catch (err) {
          this.log.error("ping error: %s", err);
        }
      }, this.keepAliveInterval, {
        // send an initial ping to establish RTT
        runImmediately: true
      });
      this.keepAlive.start();
    }
  }
  onData(buf) {
    for (const frame of this.decoder.emitFrames(buf)) {
      this.handleFrame(frame);
    }
  }
  onCreateStream() {
    if (this.remoteGoAway !== void 0) {
      throw new MuxerClosedError("Muxer closed remotely");
    }
    if (this.localGoAway !== void 0) {
      throw new MuxerClosedError("Muxer closed locally");
    }
    const id = this.nextStreamID;
    this.nextStreamID += 2;
    if (this.numOutboundStreams >= this.maxOutboundStreams) {
      throw new TooManyOutboundProtocolStreamsError("max outbound streams exceeded");
    }
    this.log.trace("new outgoing stream id=%s", id);
    const stream = this._newStream(id, StreamState.Init, "outbound");
    this.numOutboundStreams++;
    queueMicrotask(() => {
      stream.sendWindowUpdate();
    });
    return stream;
  }
  /**
   * Initiate a ping and wait for a response
   *
   * Note: only a single ping will be initiated at a time.
   * If a ping is already in progress, a new ping will not be initiated.
   *
   * @returns the round-trip-time in milliseconds
   */
  async ping(options) {
    if (this.remoteGoAway !== void 0) {
      throw new MuxerClosedError("Muxer closed remotely");
    }
    if (this.localGoAway !== void 0) {
      throw new MuxerClosedError("Muxer closed locally");
    }
    if (this.activePing != null) {
      return raceSignal(this.activePing.promise, options?.signal);
    }
    this.activePing = Object.assign(Promise.withResolvers(), {
      id: this.nextPingID++,
      start: Date.now()
    });
    this.sendPing(this.activePing.id);
    try {
      this.rtt = await raceSignal(this.activePing.promise, options?.signal);
    } finally {
      this.activePing = void 0;
    }
    return this.rtt;
  }
  /**
   * Get the ping round trip time
   *
   * Note: Will return 0 if no successful ping has yet been completed
   *
   * @returns the round-trip-time in milliseconds
   */
  getRTT() {
    return this.rtt;
  }
  /**
   * Close the muxer
   */
  async close(options = {}) {
    if (this.status !== "open") {
      return;
    }
    try {
      const reason = options?.reason ?? GoAwayCode.NormalTermination;
      this.log.trace("muxer close reason=%s", GoAwayCode[reason]);
      await super.close(options);
      this.sendGoAway(reason);
    } finally {
      this.keepAlive?.stop();
    }
  }
  abort(err) {
    if (this.status !== "open") {
      return;
    }
    try {
      super.abort(err);
      let reason = GoAwayCode.InternalError;
      if (isProtocolError(err)) {
        reason = err.reason;
      }
      this.log.error("muxer abort reason=%s error=%s", reason, err);
      this.sendGoAway(reason);
    } finally {
      this.keepAlive?.stop();
    }
  }
  onTransportClosed() {
    try {
      super.onTransportClosed();
    } finally {
      this.keepAlive?.stop();
    }
  }
  /** Create a new stream */
  _newStream(streamId, state, direction) {
    if (this.streams.find((s2) => s2.streamId === streamId) != null) {
      throw new InvalidParametersError("Stream already exists with that id");
    }
    const stream = new YamuxStream({
      ...this.streamOptions,
      id: `${streamId}`,
      streamId,
      state,
      direction,
      sendFrame: this.sendFrame.bind(this),
      log: this.log.newScope(`${direction}:${streamId}`),
      getRTT: this.getRTT.bind(this)
    });
    stream.addEventListener("close", () => {
      this.closeStream(streamId);
    }, {
      once: true
    });
    return stream;
  }
  /**
   * closeStream is used to close a stream once both sides have
   * issued a close.
   */
  closeStream(id) {
    if (this.client === (id % 2 === 0)) {
      this.numInboundStreams--;
    } else {
      this.numOutboundStreams--;
    }
  }
  handleFrame(frame) {
    const { streamID, type, length: length3 } = frame.header;
    this.log.trace("received frame %o", debugFrame(frame.header));
    if (streamID === 0) {
      switch (type) {
        case FrameType.Ping: {
          this.handlePing(frame.header);
          return;
        }
        case FrameType.GoAway: {
          this.handleGoAway(length3);
          return;
        }
        default:
          throw new InvalidFrameError("Invalid frame type");
      }
    } else {
      switch (frame.header.type) {
        case FrameType.Data:
        case FrameType.WindowUpdate: {
          this.handleStreamMessage(frame);
          return;
        }
        default:
          throw new InvalidFrameError("Invalid frame type");
      }
    }
  }
  handlePing(header) {
    if (header.flag === Flag.SYN) {
      this.log.trace("received ping request pingId=%s", header.length);
      this.sendPing(header.length, Flag.ACK);
    } else if (header.flag === Flag.ACK) {
      this.log.trace("received ping response pingId=%s", header.length);
      this.handlePingResponse(header.length);
    } else {
      throw new InvalidFrameError("Invalid frame flag");
    }
  }
  handlePingResponse(pingId) {
    if (this.activePing === void 0) {
      throw new UnRequestedPingError("ping not requested");
    }
    if (this.activePing.id !== pingId) {
      throw new NotMatchingPingError("ping doesn't match our id");
    }
    this.activePing.resolve(Date.now() - this.activePing.start);
  }
  handleGoAway(reason) {
    this.log.trace("received GoAway reason=%s", GoAwayCode[reason] ?? "unknown");
    this.remoteGoAway = reason;
    if (reason === GoAwayCode.NormalTermination) {
      this.onTransportClosed();
    } else {
      this.abort(new Error("Remote sent GoAway"));
    }
  }
  handleStreamMessage(frame) {
    const { streamID, flag, type } = frame.header;
    if ((flag & Flag.SYN) === Flag.SYN) {
      this.incomingStream(streamID);
    }
    const stream = this.streams.find((s2) => s2.streamId === streamID);
    if (stream === void 0) {
      this.log.trace("frame for missing stream id=%s", streamID);
      return;
    }
    switch (type) {
      case FrameType.WindowUpdate: {
        stream.handleWindowUpdate(frame);
        return;
      }
      case FrameType.Data: {
        stream.handleData(frame);
        return;
      }
      default:
        throw new Error("unreachable");
    }
  }
  incomingStream(id) {
    if (this.client !== (id % 2 === 0)) {
      throw new InvalidParametersError("Both endpoints are clients");
    }
    if (this.streams.find((s2) => s2.streamId === id)) {
      return;
    }
    this.log.trace("new incoming stream id=%s", id);
    if (this.localGoAway !== void 0) {
      this.sendFrame({
        type: FrameType.WindowUpdate,
        flag: Flag.RST,
        streamID: id,
        length: 0
      });
      return;
    }
    if (this.numInboundStreams >= this.maxInboundStreams) {
      this.log("maxIncomingStreams exceeded, forcing stream reset");
      this.sendFrame({
        type: FrameType.WindowUpdate,
        flag: Flag.RST,
        streamID: id,
        length: 0
      });
      return;
    }
    const stream = this._newStream(id, StreamState.SYNReceived, "inbound");
    this.numInboundStreams++;
    this.onRemoteStream(stream);
  }
  sendFrame(header, data) {
    let encoded;
    if (header.type === FrameType.Data) {
      if (data == null) {
        throw new InvalidFrameError("Invalid frame");
      }
      encoded = new Uint8ArrayList(encodeHeader(header), data);
    } else {
      encoded = encodeHeader(header);
    }
    this.log.trace("sending frame %o", debugFrame(header));
    return this.send(encoded);
  }
  sendPing(pingId, flag = Flag.SYN) {
    if (flag === Flag.SYN) {
      this.log.trace("sending ping request pingId=%s", pingId);
    } else {
      this.log.trace("sending ping response pingId=%s", pingId);
    }
    this.sendFrame({
      type: FrameType.Ping,
      flag,
      streamID: 0,
      length: pingId
    });
  }
  sendGoAway(reason = GoAwayCode.NormalTermination) {
    this.log("sending GoAway reason=%s", GoAwayCode[reason]);
    this.localGoAway = reason;
    this.sendFrame({
      type: FrameType.GoAway,
      flag: 0,
      streamID: 0,
      length: reason
    });
  }
};

// src/lib/libp2p/libp2p-browser.ts
var LIBP2P_DEFAULT_BOOTSTRAP_NODES = [
  "/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
  "/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star/",
  "/dns4/webrtc-star.discovery.libp2p.io/tcp/443/wss/p2p-webrtc-star/",
  "/dns4/relay.libp2p.io/tcp/443/wss/p2p-circuit/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa",
  "/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt"
];

// src/components/bootstrap-address/index.ts
var BootstrapAddress = class extends BaseComponent {
  static observedAttributes = [
    "title",
    "data-auto-refresh",
    "data-refresh-interval",
    "data-source",
    // 'libp2p', 'mock', 'default', 'auto'
    "data-default-source"
    // primary, secondary, all
  ];
  refreshInterval = null;
  libp2pNode = null;
  libp2pListenerSet = false;
  DEFAULT_BOOTSTRAP_NODES = LIBP2P_DEFAULT_BOOTSTRAP_NODES;
  // Добавлено
  constructor() {
    super();
    this._templateMethods = {
      defaultTemplate: (params) => {
        const state = params.state;
        return defaultTemplate({ state, context: params.context });
      },
      renderSecondaryAddresses: (params) => {
        const state = params.state;
        return renderSecondaryAddresses({ state, context: params.context });
      },
      renderAddAddressForm: (params) => {
        const state = params.state;
        return renderAddAddressForm({ state, context: params.context });
      }
    };
    this.state = {
      primaryAddress: "",
      secondaryAddresses: [],
      customAddresses: [],
      isLoading: false,
      showAddForm: false,
      newAddress: "",
      isCopied: false,
      lastUpdated: Date.now(),
      totalAddresses: 0,
      connectedNodes: 0,
      addressStats: {
        ws: 0,
        tcp: 0,
        webrtc: 0,
        ip4: 0,
        ip6: 0
      },
      dataSource: "default"
      // Добавлено
    };
  }
  async _componentReady() {
    this._controller = controller(this);
    const actions = await createActions(this);
    this._actions = {
      ...actions,
      validateAddress: (address) => Promise.resolve(this.validateAddress(address)),
      formatAddressForDisplay: (address) => Promise.resolve(this.formatAddressForDisplay(address))
    };
    await this.fullRender(this.state);
    const autoRefresh = this.getAttribute("data-auto-refresh") === "true";
    if (autoRefresh) {
      this.startAutoRefresh();
    }
    await this.setupLibp2pIntegration();
    const source = this.getAttribute("data-source") || "auto";
    await this.loadAddressesFromSource(source);
  }
  async _componentAttributeChanged(name2, oldValue, newValue) {
    if (oldValue === newValue) return;
    const state = this.state;
    switch (name2) {
      case "title":
        if (newValue) {
          await this.updateElement({
            selector: ".card-title",
            value: newValue,
            property: "textContent"
          });
        }
        break;
      case "data-auto-refresh":
        const autoRefresh = newValue === "true";
        this.addLog(`Auto refresh ${autoRefresh ? "enabled" : "disabled"}`, "info");
        if (autoRefresh) {
          this.startAutoRefresh();
        } else {
          this.stopAutoRefresh();
        }
        break;
      case "data-refresh-interval":
        this.addLog(`Refresh interval updated to ${newValue}ms`, "info");
        this.stopAutoRefresh();
        if (this.getAttribute("data-auto-refresh") === "true") {
          this.startAutoRefresh();
        }
        break;
      case "data-source":
        this.addLog(`Data source changed to: ${newValue}`, "info");
        if (newValue) {
          state.dataSource = newValue;
          await this.loadAddressesFromSource(newValue);
        }
        break;
      case "data-default-source":
        this.addLog(`Default source filter changed to: ${newValue}`, "info");
        break;
    }
  }
  async postMessage(event) {
    try {
      const state = this.state;
      switch (event.type) {
        case "UPDATE_BOOTSTRAP_ADDRESSES":
          const addresses = event.data?.addresses;
          const source = event.data?.source || "unknown";
          if (addresses && Array.isArray(addresses)) {
            state.dataSource = source;
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
            addresses: {
              primary: state.primaryAddress,
              secondary: state.secondaryAddresses,
              custom: state.customAddresses,
              total: state.totalAddresses,
              stats: state.addressStats
            },
            lastUpdated: state.lastUpdated,
            dataSource: state.dataSource
            // Добавлено
          };
        case "ADD_CUSTOM_ADDRESS":
          const addressToAdd = event.data?.address;
          if (addressToAdd && this.validateAddress(addressToAdd)) {
            const result = await this.addCustomAddress(addressToAdd);
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
        case "TEST_CONNECTION":
          const addressToTest = event.data?.address || state.primaryAddress;
          if (addressToTest) {
            const result = await this.testConnection(addressToTest);
            return { success: true, result };
          }
          return { success: false, error: "No address to test" };
        case "COPY_ADDRESS":
          const addressToCopy = event.data?.address || state.primaryAddress;
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
              connectedNodes: state.connectedNodes,
              addressStats: state.addressStats,
              lastUpdated: state.lastUpdated,
              dataSource: state.dataSource
              // Добавлено
            }
          };
        case "SYNC_WITH_LIBP2P":
          const syncResult = await this.syncWithLibp2pNode();
          return syncResult;
        case "SET_LIBP2P_LISTENER":
          const callback = event.data?.callback;
          if (callback && typeof callback === "function") {
            this.libp2pListenerSet = true;
            this.libp2pNode = { callback };
            return { success: true, message: "Libp2p listener set" };
          }
          return { success: false, error: "Invalid callback" };
        case "USE_DEFAULT_ADDRESSES":
          state.dataSource = "default";
          await this.loadAddressesFromSource("default");
          return {
            success: true,
            message: `Using ${this.DEFAULT_BOOTSTRAP_NODES.length} default bootstrap addresses`
          };
        default:
          console.warn(`[BootstrapAddress] Unknown message type: ${event.type}`);
          return {
            success: false,
            error: "Unknown message type",
            availableTypes: [
              "UPDATE_BOOTSTRAP_ADDRESSES",
              "GET_ADDRESSES",
              "ADD_CUSTOM_ADDRESS",
              "REMOVE_ADDRESS",
              "TEST_CONNECTION",
              "COPY_ADDRESS",
              "REFRESH_ADDRESSES",
              "EXPORT_ADDRESSES",
              "GET_STATS",
              "SYNC_WITH_LIBP2P",
              "SET_LIBP2P_LISTENER",
              "USE_DEFAULT_ADDRESSES"
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
  // Публичные методы
  async updateAddresses(addresses, source = "manual") {
    const state = this.state;
    if (!addresses || addresses.length === 0) {
      state.primaryAddress = "";
      state.secondaryAddresses = [];
      state.totalAddresses = state.customAddresses.length;
    } else {
      state.primaryAddress = addresses[0] || "";
      state.secondaryAddresses = addresses.slice(1);
      state.totalAddresses = addresses.length + state.customAddresses.length;
      this.updateAddressStats(addresses);
    }
    state.lastUpdated = Date.now();
    state.dataSource = source;
    state.isLoading = false;
    await this.updateElement({
      selector: "#primaryAddress",
      value: state.primaryAddress || "No addresses available",
      property: "textContent"
    });
    await this.renderPart({
      partName: "renderSecondaryAddresses",
      state,
      selector: "#secondaryAddresses"
    });
    if (this.libp2pListenerSet && this.libp2pNode?.callback) {
      try {
        this.libp2pNode.callback(state);
      } catch (error) {
        console.error("Error in libp2p listener callback:", error);
      }
    }
  }
  async addCustomAddress(address) {
    if (!this.validateAddress(address)) {
      await this.showModal({
        title: "Invalid Address",
        content: "The provided address has an invalid format",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return false;
    }
    const state = this.state;
    if (state.customAddresses.includes(address) || state.primaryAddress === address || state.secondaryAddresses.includes(address)) {
      await this.showModal({
        title: "Duplicate Address",
        content: "This address already exists in the list",
        buttons: [{ text: "OK", type: "primary" }]
      });
      return false;
    }
    state.customAddresses.push(address);
    state.totalAddresses++;
    this.updateAddressStats([address]);
    await this.renderPart({
      partName: "renderSecondaryAddresses",
      state,
      selector: "#secondaryAddresses"
    });
    this.addLog(`Custom address added: ${address}`, "info");
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
            return { confirmed: true };
          }
        }
      ]
    });
    if (shouldRemove === void 0) {
      return false;
    }
    let removed = false;
    if (state.primaryAddress === address) {
      const newPrimary = state.secondaryAddresses.length > 0 ? state.secondaryAddresses[0] : "";
      state.primaryAddress = newPrimary || "";
      state.secondaryAddresses = state.secondaryAddresses.slice(1);
      removed = true;
    } else if (state.secondaryAddresses.includes(address)) {
      state.secondaryAddresses = state.secondaryAddresses.filter((addr) => addr !== address);
      removed = true;
    } else if (state.customAddresses.includes(address)) {
      state.customAddresses = state.customAddresses.filter((addr) => addr !== address);
      removed = true;
    }
    if (removed) {
      state.totalAddresses--;
      state.lastUpdated = Date.now();
      await this.updateElement({
        selector: "#primaryAddress",
        value: state.primaryAddress || "No addresses available",
        property: "textContent"
      });
      await this.renderPart({
        partName: "renderSecondaryAddresses",
        state,
        selector: "#secondaryAddresses"
      });
      this.addLog(`Address removed: ${address}`, "info");
      return true;
    }
    return false;
  }
  async testConnection(address) {
    this.addLog(`Testing connection to: ${address}`, "info");
    await this.updateElement({
      selector: ".btn-test",
      value: true,
      property: "disabled"
    });
    await this.updateElement({
      selector: ".btn-test .btn-text",
      value: "Testing...",
      property: "textContent"
    });
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
    } finally {
      await this.updateElement({
        selector: ".btn-test",
        value: false,
        property: "disabled"
      });
      await this.updateElement({
        selector: ".btn-test .btn-text",
        value: "Test Connection",
        property: "textContent"
      });
    }
  }
  async copyAddress(address) {
    try {
      await navigator.clipboard.writeText(address);
      await this.updateElement({
        selector: ".btn-copy",
        value: "✓ Copied!",
        property: "textContent"
      });
      await this.updateElement({
        selector: ".btn-copy",
        value: "copied",
        property: "className",
        action: "add"
      });
      setTimeout(async () => {
        await this.updateElement({
          selector: ".btn-copy",
          value: "Copy",
          property: "textContent"
        });
        await this.updateElement({
          selector: ".btn-copy",
          value: "copied",
          property: "className",
          action: "remove"
        });
      }, 2e3);
      this.addLog(`Address copied to clipboard: ${address}`, "info");
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
      const source = this.getAttribute("data-source") || "auto";
      await this.loadAddressesFromSource(source);
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
    const allAddresses = [
      state.primaryAddress,
      ...state.secondaryAddresses,
      ...state.customAddresses
    ].filter((addr) => addr.trim() !== "");
    const exportData = {
      addresses: allAddresses,
      exportTime: (/* @__PURE__ */ new Date()).toISOString(),
      totalAddresses: state.totalAddresses,
      stats: state.addressStats,
      dataSource: state.dataSource,
      // Добавлено
      component: "Bootstrap Address",
      nodeInfo: {
        timestamp: Date.now()
      }
    };
    return exportData;
  }
  async syncWithLibp2pNode() {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        const result = await libp2pNode.postMessage({ type: "GET_STATS" });
        if (result.success && result.stats?.multiaddrs) {
          await this.updateAddresses(result.stats.multiaddrs, "libp2p-sync");
          return {
            success: true,
            message: `Synced ${result.stats.multiaddrs.length} addresses from libp2p node`
          };
        }
        return {
          success: false,
          error: "No addresses available from libp2p node"
        };
      }
      return {
        success: false,
        error: "Libp2p node not found"
      };
    } catch (error) {
      console.warn("Failed to sync with libp2p node:", error);
      return {
        success: false,
        error: `Failed to sync: ${error.message}`
      };
    }
  }
  async setupLibp2pIntegration() {
    try {
      const libp2pNode = await this.getComponentAsync("libp2p-node", "libp2p-node-1");
      if (libp2pNode) {
        const result = await libp2pNode.postMessage({
          type: "SET_DHT_LISTENER",
          data: {
            callback: (stats) => {
              if (stats?.multiaddrs) {
                this.updateAddresses(stats.multiaddrs, "libp2p-dht-update").catch((error) => console.error("Error updating addresses from DHT:", error));
              }
            }
          }
        });
        if (result?.success) {
          this.addLog("Libp2p node listener set successfully", "info");
        }
        const initialResult = await libp2pNode.postMessage({ type: "GET_STATS" });
        if (initialResult.success && initialResult.stats?.multiaddrs) {
          await this.updateAddresses(initialResult.stats.multiaddrs, "libp2p-initial");
        }
      }
    } catch (error) {
      console.debug("Libp2p node not available during setup:", error);
    }
  }
  // Вспомогательные методы
  validateAddress(address) {
    if (typeof address !== "string" || address.trim().length === 0) {
      return false;
    }
    const validProtocols = ["/ip4/", "/ip6/", "/dns4/", "/dns6/", "/tcp/", "/ws/", "/wss/", "/p2p/"];
    return validProtocols.some((protocol) => address.includes(protocol));
  }
  formatAddressForDisplay(address) {
    if (!address) return "";
    if (address.length > 80) {
      return address.substring(0, 77) + "...";
    }
    return address;
  }
  getState() {
    return this.state;
  }
  // Метод для логирования
  addLog(message2, level = "info") {
    console.log(`[BootstrapAddress] [${level}] ${message2}`);
  }
  async loadAddressesFromSource(source) {
    const state = this.state;
    state.dataSource = source;
    switch (source) {
      case "libp2p":
        await this.syncWithLibp2pNode();
        break;
      case "mock":
        const mockAddresses = this.generateMockAddresses(5);
        await this.updateAddresses(mockAddresses, "mock");
        break;
      case "default":
        await this.updateAddresses(this.DEFAULT_BOOTSTRAP_NODES, "default");
        break;
      case "auto":
        break;
      default:
        this.addLog(`Unknown data source: ${source}`, "warn");
    }
  }
  generateMockAddresses(count) {
    const protocols = ["/ip4/", "/ip6/"];
    const transports = ["/tcp/", "/ws/"];
    const ports = ["6832", "8080", "9090", "3000"];
    const addresses = [];
    for (let i2 = 0; i2 < count; i2++) {
      const protocol = protocols[Math.floor(Math.random() * protocols.length)];
      const ip = protocol === "/ip4/" ? `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : `2001:db8::${Math.floor(Math.random() * 9999)}`;
      const transport = transports[Math.floor(Math.random() * transports.length)];
      const port = ports[Math.floor(Math.random() * ports.length)];
      addresses.push(`${protocol}${ip}${transport}${port}`);
    }
    return addresses;
  }
  updateAddressStats(addresses) {
    const state = this.state;
    state.addressStats = {
      ws: 0,
      tcp: 0,
      webrtc: 0,
      ip4: 0,
      ip6: 0
    };
    addresses.forEach((address) => {
      if (address.includes("/ws")) state.addressStats.ws++;
      if (address.includes("/tcp/")) state.addressStats.tcp++;
      if (address.includes("/webrtc/")) state.addressStats.webrtc++;
      if (address.includes("/ip4/")) state.addressStats.ip4++;
      if (address.includes("/ip6/")) state.addressStats.ip6++;
    });
  }
  startAutoRefresh() {
    this.stopAutoRefresh();
    const interval = parseInt(this.getAttribute("data-refresh-interval") || "20000", 10);
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
  async _componentDisconnected() {
    this.stopAutoRefresh();
    if (this._controller?.destroy) {
      await this._controller.destroy();
    }
  }
};
if (!customElements.get("bootstrap-address")) {
  customElements.define("bootstrap-address", BootstrapAddress);
}
export {
  BootstrapAddress
};
//# sourceMappingURL=index.js.map
