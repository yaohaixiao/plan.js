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

class Confirm {
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

  initialize (options) {
    this.set(options)
        .setTitle(this.get('title'))
        .setMessage(this.get('message'))
        ._createElements()

    return this
  }

  render () {
    let $wrap = this.getEls().wrap

    document.body.appendChild($wrap)

    return this
  }

  addEventListeners () {
    let $wrap = this.getEls().wrap

    on($wrap, '.confirm-overlay', 'click', this._onOverlayClick, this)
    on($wrap, '.confirm-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.confirm-enter', 'click', this._onEnterClick, this)

    return this
  }

  removeEventListeners () {
    let $wrap = this.getEls().wrap

    off($wrap, 'click', this._onOverlayClick)
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onEnterClick)

    return this
  }

  reload (options) {
    this.destroy()
        .initialize(options)
        .render()
        .addEventListeners()

    return this
  }

  destroy () {
    this.removeEventListeners()
        .remove()
        .reset()

    return this
  }

  remove () {
    let $wrap = this.getEls().wrap

    document.body.removeChild($wrap)

    return this
  }

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

  get (prop) {
    return this.attributes[prop]
  }

  set (options) {
    assign(this.attributes, options)

    return this
  }

  getEls () {
    return this.elements
  }

  getTitle () {
    return this.data.title
  }

  setTitle (title) {
    this.data.title = toSafeText(title)

    return this
  }

  getMessage () {
    return this.data.message
  }

  setMessage (message) {
    this.data.message = toSafeText(message)

    return this
  }

  open () {
    let $wrap = this.getEls().wrap

    removeClass($wrap, 'hidden')

    return this
  }

  close () {
    let $wrap = this.getEls().wrap
    let afterClose = this.get('afterClose')

    addClass($wrap, 'hidden')

    if (isFunction(afterClose)) {
      afterClose()
    }

    return this
  }

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

  _onOverlayClick () {
    this.close()

    return this
  }

  _onCancelClick () {
    let afterCancel = this.get('afterCancel')

    this.close()

    if (isFunction(afterCancel)) {
      afterCancel()
    }

    return this
  }

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
