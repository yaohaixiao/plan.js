'use strict'

/**
 * 判断是否为 String 类型
 * ========================================================================
 * @param {*} o - 要测试的数据
 * @returns {boolean}
 */
export const isString = (o) => {
  return typeof o === 'string'
}

/**
 * 判断是否为 Number 类型
 * ========================================================================
 * @param {*} o - 要测试的数据
 * @returns {boolean}
 */
export const isNumber = (o) => {
  return typeof o === 'number'
}

/**
 * 判断是否为 Array 类型
 * ========================================================================
 * @param {*} o - 要测试的数据
 * @returns {boolean}
 */
export const isArray = (o) => {
  if (Array.isArray) {
    return Array.isArray(o)
  } else {
    return Object.prototype.toString.apply(o) === '[object Array]'
  }
}

/**
 * 判断是否为 Function 类型
 * ========================================================================
 * @param {*} o - 要测试的数据
 * @returns {boolean}
 */
export const isFunction = (o) => {
  return (typeof o === 'function') || Object.prototype.toString.apply(o) === '[object Function]'
}

/**
 * 检测是否为 HTMLElement 元素节点
 * ========================================================================
 * @param {*} o - 要测试的数据
 * @returns {boolean}
 */
export const isElement = (o) => {
  return o && o.nodeName && o.tagName && o.nodeType === 1
}

/**
 * 移除字符串两端的空白
 * ========================================================================
 * @param {String} str - 要处理的字符串
 * @returns {string}
 */
export const trim = (str) => {
  return str.replace(/^\s+/g, '').replace(/\s+$/g, '')
}

/**
 * 移除字符串中的 HTML 代码
 * ========================================================================
 * @param {String} str - 要处理的字符串
 * @returns {*|void|string}
 */
export const stripTags = (str) => {
  return str.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?(\/)?>|<\/\w+>/gi, '')
}

/**
 * 移除字符串中的 script 代码片段
 * ========================================================================
 * @param {String} str - 要处理的字符串
 * @returns {*|void|string}
 */
export const stripScripts = (str) => {
  let scriptFragment = '<script[^>]*>([\\S\\s]*?)<\/script\\s*>'

  return str.replace(new RegExp(scriptFragment, 'img'), '')
}

/**
 * 过滤字符串中的危险字符
 * ========================================================================
 * @param {String} str - 要处理的字符串
 * @returns {string}
 */
export const toSafeText = (str) => {
  return trim(stripTags(stripScripts(str)))
}

/**
 * 简单粗暴的对象深拷贝
 * ========================================================================
 * @param {Object|Array} o - 要拷贝的数据（对象）
 * @returns {any}
 */
export const clone = (o) => {
  return JSON.parse(JSON.stringify(o))
}

/**
 * 拷贝对象属性值
 * ========================================================================
 * 此方法来自 MDN 的 Polyfill 部分
 * https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 * ========================================================================
 * @param target
 * @param source
 * @returns {*}
 */
export const assign = (target, ...source) => {
  let to

  // TypeError if undefined or null
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object')
  }

  to = Object(target)

  for (let index = 0; index < source.length; index++) {
    let nextSource = source[index]

    if (nextSource != null) { // Skip over if undefined or null
      for (let nextKey in nextSource) {
        // Avoid bugs when hasOwnProperty is shadowed
        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
          to[nextKey] = nextSource[nextKey]
        }
      }
    }
  }

  return to
}

/**
 * findIndex 的 polyfill 函数 - 查询某个值在数组中的索引值，没有则返回 -1
 * ========================================================================
 * 代码修改至 MDN 给出的 Array.prototype.findIndex 的 polyfill 方法：
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex#Polyfill
 * 对 findIndex 函数的说明，可以查看 ECMA-262 的文档：
 * https://tc39.github.io/ecma262/#sec-array.prototype.findindex
 * ========================================================================
 * @param {Array|*} source - 要查询的数组
 * @param {Function} filter - 过滤值的回调方法
 * @param {Object|*} [context] - filter 回调函数中的 this 上下文
 * @returns {*}
 */
export const findIndex = (source, filter, context = source) => {
  let o = Object(source)
  let len = o.length >>> 0
  let k = 0

  if (!isArray(source)) {
    throw new TypeError('source must be an array')
  }

  if (!isFunction(filter)) {
    throw new TypeError('filter must be a function')
  }

  if (isFunction(Array.prototype.findIndex)) {
    return source.findIndex(filter, context)
  } else {
    while (k < len) {
      let value = o[k]

      if (filter.call(context, value, k, o)) {
        return k
      }

      k += 1
    }
  }

  return -1
}

/**
 * 生成 GUID 编号
 * ========================================================================
 * @param {Number} len - 生成的编号长度
 * @param {Number} [radix] - 编码类型的数值
 * @returns {string}
 */
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

export const keys = (obj) => {
  let hasOwnProperty = Object.prototype.hasOwnProperty
  let hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString')
  let dontEnums = [
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'constructor'
  ]
  let dontEnumsLength = dontEnums.length

  if (typeof obj !== 'function' && (typeof obj !== 'object' || obj === null)) {
    throw new TypeError('Object.keys called on non-object')
  }

  let result = []
  let prop
  let i

  for (prop in obj) {
    if (hasOwnProperty.call(obj, prop)) {
      result.push(prop)
    }
  }

  if (hasDontEnumBug) {
    for (i = 0; i < dontEnumsLength; i++) {
      if (hasOwnProperty.call(obj, dontEnums[i])) {
        result.push(dontEnums[i])
      }
    }
  }

  return result
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
  assign,
  guid,
  findIndex,
  keys
}
