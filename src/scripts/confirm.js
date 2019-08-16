'use strict'

import {
  isFunction,
  toSafeText,
  assign
} from './utils'

import {
  createElement,
  addClass,
  removeClass
} from './dom'

import {
  on,
  off
} from './delegate'

/**
 * Confirm 是一个简单的确认模拟弹窗控件
 *
 * @class Confirm
 */
class Confirm {
  /**
   * 构造函数
   * ========================================================================
   * @constructor
   * @param {Object} options - 配置信息对象
   * @param {String} options.title - 确认信息的标题文本字符
   * @prram {String} [options.message] - 确认信息的补充说明文本
   * @praam {String} [options.cancelText] - 取消按钮的文本
   * @praam {String} [options.enterText] - 确定按钮的文本
   * @praam {Function} [options.afterClose] - 确定窗口关闭后的回调函数
   * @praam {Function} [options.afterCancel] - 点击取消按钮的回调函数
   * @praam {Function} [options.enterText] - 点击确定按钮的回调函数
   * @returns {Confirm}
   */
  constructor (options) {
    this.attributes = {
      title: '',
      message: '',
      cancelText: '',
      enterText: '',
      afterClose: null,
      afterCancel: null,
      afterEnter: null
    }

    this.elements = {
      wrap: null,
      modal: null,
      header: null,
      body: null,
      title: null,
      message: null,
      footer: null,
      cancel: null,
      enter: null,
      overlay: null
    }

    this.data = {
      title: '',
      message: ''
    }

    this.initialize(options)
        .render()
        .addEventListeners()

    return this
  }

  /**
   * 初始化方法
   * ========================================================================
   * @param {Object} options - 配置信息对象
   * @see Confirm.constructor
   * @returns {Confirm}
   */
  initialize (options) {
    this.set(options)
        .setTitle(this.get('title'))
        .setMessage(this.get('message'))
        ._createElements()

    return this
  }

  /**
   * 绘制界面
   * ========================================================================
   * @returns {Confirm}
   */
  render () {
    let $wrap = this.getEls().wrap

    document.body.appendChild($wrap)

    return this
  }

  /**
   * 绑定各个 DOM 的事件处理器
   * ========================================================================
   * @returns {Confirm}
   */
  addEventListeners () {
    let $wrap = this.getEls().wrap

    on($wrap, '.confirm-overlay', 'click', this._onOverlayClick, this)
    on($wrap, '.confirm-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.confirm-enter', 'click', this._onEnterClick, this)

    return this
  }

  /**
   * 移除绑定在 DOM 上的事件处理器
   * ========================================================================
   * @returns {Confirm}
   */
  removeEventListeners () {
    let $wrap = this.getEls().wrap

    off($wrap, 'click', this._onOverlayClick)
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onEnterClick)

    return this
  }

  /**
   * 重置
   * ========================================================================
   * @param {Object} options - 配置信息
   * @returns {Confirm}
   */
  reload (options) {
    this.destroy()
        .initialize(options)
        .render()
        .addEventListeners()

    return this
  }

  /**
   * 销毁 Confirm 控件
   * ========================================================================
   * @returns {Confirm}
   */
  destroy () {
    this.removeEventListeners()
        .remove()
        .reset()

    return this
  }

  /**
   * 移除 Confirm 绘制的 DOM
   * ========================================================================
   * @returns {Confirm}
   */
  remove () {
    let $wrap = this.getEls().wrap

    document.body.removeChild($wrap)

    return this
  }

  /**
   * 重置属性
   * ========================================================================
   * @returns {Confirm}
   */
  reset () {
    this.attributes = {
      title: '',
      message: '',
      cancelText: '取消',
      enterText: '确认',
      afterClose: null,
      afterCancel: null,
      afterEnter: null
    }

    this.elements = {
      wrap: null,
      modal: null,
      header: null,
      body: null,
      title: null,
      message: null,
      footer: null,
      cancel: null,
      enter: null,
      overlay: null
    }

    this.data = {
      title: '',
      message: ''
    }

    return this
  }

  /**
   * 获取 attributes 中的配置信息
   * ========================================================================
   * @param {String} prop - 属性名称
   * @returns {*}
   */
  get (prop) {
    return this.attributes[prop]
  }

  /**
   * 设置 attributes 配置信息
   * ========================================================================
   * @param {Object} options - 配置信息
   * @returns {Confirm}
   */
  set (options) {
    assign(this.attributes, options)

    return this
  }

  /**
   * 获得 Confirm 控件的 DOM 节点（this.elements 属性）
   * ========================================================================
   * @returns {{wrap: null, modal: null, header: null, body: null, title: null, message: null, footer: null, cancel: null, enter: null, overlay: null}|*}
   */
  getEls () {
    return this.elements
  }

  /**
   * 获取标题文本
   * ========================================================================
   * @returns {string}
   */
  getTitle () {
    return this.data.title
  }

  /**
   * 设置标题文本
   * ========================================================================
   * @param {String} title - 标题文本
   * @returns {Confirm}
   */
  setTitle (title) {
    this.data.title = toSafeText(title)

    return this
  }

  /**
   * 获取确认说明文本信息
   * ========================================================================
   * @returns {string}
   */
  getMessage () {
    return this.data.message
  }

  /**
   * 设置确认说明文本信息
   * ========================================================================
   * @param message
   * @returns {Confirm}
   */
  setMessage (message) {
    this.data.message = toSafeText(message)

    return this
  }

  /**
   * 展示 Confirm 控件
   * ========================================================================
   * @returns {Confirm}
   */
  open () {
    let $wrap = this.getEls().wrap

    removeClass($wrap, 'hidden')

    return this
  }

  /**
   * 隐藏 Confirm 控件
   * ========================================================================
   * @returns {Confirm}
   */
  close () {
    let $wrap = this.getEls().wrap
    let afterClose = this.get('afterClose')

    addClass($wrap, 'hidden')

    if (isFunction(afterClose)) {
      afterClose()
    }

    return this
  }

  /**
   * 创建 Confirm 控件的各个 DOM 节点
   * ========================================================================
   * @returns {Confirm}
   * @private
   */
  _createElements () {
    const toSaveText = toSafeText
    let elements = this.getEls()
    let title = this.getTitle()
    let message = this.getMessage()
    let cancelText = toSaveText(this.get('cancelText'))
    let enterText = toSaveText(this.get('enterText'))

    elements.header = createElement('div', {
      'className': 'confirm-hd'
    })

    elements.title = createElement('h2', {
      'className': 'confirm-title'
    }, [
      toSafeText(title)
    ])

    elements.message = createElement('p', {
      'className': 'confirm-message'
    }, [
      toSafeText(message)
    ])

    elements.body = createElement('div', {
      'className': 'confirm-bd'
    }, [
      elements.title,
      elements.message
    ])

    elements.cancel = createElement('div', {
      'className': 'confirm-button confirm-cancel'
    }, [
      cancelText
    ])

    elements.enter = createElement('div', {
      'className': 'confirm-button confirm-enter'
    }, [
      enterText
    ])

    elements.footer = createElement('div', {
      'className': 'confirm-ft'
    }, [
      elements.cancel,
      elements.enter
    ])

    elements.modal = createElement('div', {
      'className': 'confirm-modal'
    }, [
      elements.header,
      elements.body,
      elements.footer
    ])

    elements.overlay = createElement('div', {
      'className': 'confirm-overlay'
    })

    elements.wrap = createElement('div', {
      'className': 'confirm hidden'
    }, [
      elements.modal,
      elements.overlay
    ])

    return this
  }

  /**
   * 点击 Confirm 控件遮罩层的事件处理器
   * ========================================================================
   * @returns {Confirm}
   * @private
   */
  _onOverlayClick () {
    this.close()

    return this
  }

  /**
   * 点击取消按钮的事件处理器
   * ========================================================================
   * @returns {Confirm}
   * @private
   */
  _onCancelClick () {
    let afterCancel = this.get('afterCancel')

    this.close()

    if (isFunction(afterCancel)) {
      afterCancel()
    }

    return this
  }

  /**
   * 点击确定按钮的事件处理器
   * ========================================================================
   * @returns {Confirm}
   * @private
   */
  _onEnterClick () {
    let afterEnter = this.get('afterEnter')

    this.close()

    if (isFunction(afterEnter)) {
      afterEnter()
    }

    return this
  }
}

export default Confirm
