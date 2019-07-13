'use strict'

export const isString = (o) => {
  return typeof o === 'string'
}

export const isNumber = (o) => {
  return typeof o === 'number'
}

export const isArray = (o) => {
  if (Array.isArray) {
    return Array.isArray(o)
  } else {
    return Object.prototype.toString.apply(o) === '[object Array]'
  }
}

export const isFunction = (o) => {
  return (typeof o === 'function') || Object.prototype.toString.apply(o) === '[object Function]'
}

export const isElement = (o) => {
  return o && o.nodeName && o.tagName && o.nodeType === 1
}

export const trim = (str) => {
  return str.replace(/^\s+/g, '').replace(/\s+$/g, '')
}

export const stripTags = (str) => {
  return str.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?(\/)?>|<\/\w+>/gi, '')
}

export const stripScripts = (str) => {
  let scriptFragment = '<script[^>]*>([\\S\\s]*?)<\/script\\s*>'

  return str.replace(new RegExp(scriptFragment, 'img'), '')
}

export const toSafeText = (str) => {
  return trim(stripTags(stripScripts(str)))
}

export const clone = (o) => {
  return JSON.parse(JSON.stringify(o))
}

export const guid = (len, radix) => {
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  let uuid = []
  let i

  radix = radix || chars.length

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) {
      uuid[i] = chars[0 | Math.random() * radix]
    }
  } else {
    // rfc4122, version 4 form
    let r

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16
        uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
      }
    }
  }

  return uuid.join('')
}

export default {
  isArray,
  isElement,
  isFunction,
  isNumber,
  isString,
  trim,
  stripScripts,
  stripTags,
  toSafeText,
  clone,
  guid
}
