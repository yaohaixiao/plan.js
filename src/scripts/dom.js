'use strict'

import Utils from './utils'

const DOM = {
  /**
   * 创建 DOM 节点，并添加属性和子节点
   * ========================================================================
   * @param {String} tagName - 标签名称
   * @param {Object} attributes - 属性对象
   * @param {Array} [children] - 子节点数组
   * @returns {HTMLElement}
   */
  createElement: (tagName, attributes, children) => {
    let element = document.createElement(tagName)

    for (let attr in attributes) {
      if (attributes.hasOwnProperty(attr)) {
        DOM.setAttribute(element, attr, attributes[attr])
      }
    }

    if (Utils.isArray(children)) {
      children.forEach((child) => {
        let childNode

        if (Utils.isElement(child)) {
          childNode = child
        } else {
          if (Utils.isString(child) || Utils.isNumber(child)) {
            let text = Utils.isString(child) ? Utils.trim(Utils.stripTags(child)) : child.toString()

            childNode = document.createTextNode(text)
          }
        }

        element.appendChild(childNode)
      })
    }

    return element
  },
  /**
   * 给 DOM 节点设置属性/值
   * ========================================================================
   * @param {Object|HTMLElement} el - DOM 节点
   * @param {String} attr - 属性名称
   * @param {String|Number|Boolean} value - 属性值
   */
  setAttribute: (el, attr, value) => {
    let tagName = el.tagName.toLowerCase()

    switch (attr) {
      case 'style':
        el.style.cssText = value
        break
      case 'value':
        if (tagName === 'input' || tagName === 'textarea') {
          el.value = value
        } else {
          el.setAttribute(attr, value)
        }
        break
      case 'className':
        el.className = value
        break
      default:
        el.setAttribute(attr, value)
        break
    }
  },
  /**
   * 检测 DOM 节点是否包含名为 className 的样式
   * ========================================================================
   * @param {Object|HTMLElement} el - DOM 节点
   * @param {String} className - 样式名称
   * @returns {*}
   */
  hasClass (el, className) {
    let allClass = el.className

    if (!allClass) {
      return false
    }

    return allClass.match(new RegExp('(\\s|^)' + className + '(\\s|$)'))
  },
  /**
   * 给 DOM 节点添加名为 className 的样式
   * ========================================================================
   * @param {Object|HTMLElement} el - DOM 节点
   * @param {String} className - 样式名称
   * @returns {Boolean}
   */
  addClass (el, className) {
    let allClass = el.className

    if (DOM.hasClass(el, className)) {
      return false
    }

    allClass += allClass.length > 0 ? ' ' + className : className

    el.className = allClass
  },
  /**
   * 移除 DOM 节点的 className 样式
   * ========================================================================
   * @param {Object|HTMLElement} el - DOM 节点
   * @param {String} className - 样式名称
   * @returns {Boolean}
   */
  removeClass (el, className) {
    let allClass = el.className

    if (!allClass || !DOM.hasClass(el, className)) {
      return false
    }

    allClass = Utils.trim(allClass.replace(className, ''))

    el.className = allClass
  },
  /**
   * 替换 DOM 节点的 className 样式
   * ========================================================================
   * @param {Object|HTMLElement} el - DOM 节点
   * @param {String} newClass - 样式名称
   * @param {String} oldClass - 样式名称
   * @returns {Boolean}
   */
  replaceClass (el, newClass, oldClass) {
    let allClass = el.className

    if (!allClass || !DOM.hasClass(el, oldClass)) {
      return false
    }

    allClass = Utils.trim(allClass.replace(oldClass, newClass))

    el.className = allClass
  }
}

export default DOM