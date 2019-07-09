const Utils = {
  uuid: 0,
  isString: (o) => {
    return typeof o === 'string'
  },
  isNumber: (o) => {
    return typeof o === 'number'
  },
  isArray: (o) => {
    if (Array.isArray) {
      return Array.isArray(o)
    } else {
      return Object.prototype.toString.apply(o) === '[object Array]'
    }
  },
  isFunction: (o) => {
    return (typeof o === 'function') || Object.prototype.toString.apply(o) === '[object Function]'
  },
  isElement: (o) => {
    return o && o.nodeName && o.tagName && o.nodeType === 1
  },
  guid: (prefix) => {
    Utils.uuid += 1

    return prefix ? prefix + '-' + Utils.uuid : 'guid-' + Utils.uuid
  },
  trim: (str) => {
    return str.replace(/^\s+/g, '').replace(/\s+$/g, '')
  },
  stripTags: (str) => {
    return str.replace(/<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?(\/)?>|<\/\w+>/gi, '')
  },
  stripScripts: (str) => {
    let scriptFragment = '<script[^>]*>([\\S\\s]*?)<\/script\\s*>'

    return str.replace(new RegExp(scriptFragment, 'img'), '')
  },
  toSafeText: (str) => {
    return Utils.trim(Utils.stripTags(Utils.stripScripts(str)))
  },
  clone: (o) => {
    return JSON.parse(JSON.stringify(o))
  },
  getMoments () {
    let time = new Date()
    let year = time.getFullYear()
    let month = time.getMonth() + 1
    let date = time.getDate()
    let hours = time.getHours()
    let minutes = time.getMinutes()
    let seconds = time.getSeconds()

    if (month < 10) {
      month = '0' + month
    }

    if (date < 10) {
      date = '0' + date
    }

    if (hours < 10) {
      hours = '0' + hours
    }

    if (minutes < 10) {
      minutes = '0' + minutes
    }

    if (seconds < 10) {
      seconds = '0' + seconds
    }

    return year + '-' + month + '-' + date + ' ' + hours + ':' + minutes + ':' + seconds
  }
}

export default Utils