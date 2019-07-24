'use strict'

import {
  addClass,
  createElement,
  removeClass
} from './dom'

import {
  format
} from './time'

import {
  off,
  on
} from './delegate'

import marked from 'marked'
import mitt from 'mitt'

const emitter = mitt()
const $wrap = document.querySelector('#view-panel')

const Panel = {
  initialize () {
    this.addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    title: $wrap.querySelector('#view-title'),
    create: $wrap.querySelector('#view-create'),
    deadline: $wrap.querySelector('#view-deadline'),
    estimate: $wrap.querySelector('#view-estimate'),
    level: $wrap.querySelector('#view-level'),
    desc: $wrap.querySelector('#view-desc'),
    logs: $wrap.querySelector('#view-logs'),
  },
  _plan: {
    id: 1,
    title: '',
    deadline: '',
    estimate: '',
    level: 3,
    desc: '',
    create: '',
    update: [],
    status: 0,
    marked: false,
    delayed: false,
    deleted: false
  },
  getPlan () {
    return this._plan
  },
  setPlan (plan) {
    this._plan = plan

    return this
  },
  getEls () {
    return this._elements
  },
  addEventListeners () {
    on($wrap, '.view-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.view-edit', 'click', this._onEditClick, this)

    emitter.on('panel.view.update', this.setPlan)
    emitter.on('panel.view.open', this.open)
    emitter.on('panel.view.close', this.close)

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onEditClick)

    emitter.off('panel.view.update', this.setPlan)
    emitter.off('panel.view.open', this.open)
    emitter.off('panel.view.close', this.close)

    return this
  },
  close () {
    removeClass($wrap, 'panel-opened')

    emitter.emit('columns.open')

    this.empty()

    return this
  },
  open () {
    emitter.emit('panel.add.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

    this.update()

    addClass($wrap, 'panel-opened')

    emitter.emit('columns.close')

    return this
  },
  update () {
    const CLS_LEVEL = 'field-view-level field-level-icon field-level-checked'
    let plan = this.getPlan()
    let elements = this.getEls()
    let $title = elements.title
    let $create = elements.create
    let $deadline = elements.deadline
    let $estimate = elements.estimate
    let $level = elements.level
    let $desc = elements.desc
    let $logs = elements.logs
    let $list = createElement('ol', {
      'className': 'panel-logs'
    })
    let $icon

    $title.innerHTML = plan.title
    $create.innerHTML = plan.create
    $deadline.innerHTML = plan.deadline
    $estimate.innerHTML = plan.estimate

    switch (plan.level) {
      case 0:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-spades'
          })
        ])
        break
      case 1:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-heart'
          })
        ])
        break
      case 2:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-clubs'
          })
        ])
        break
      case 3:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-diamonds'
          })
        ])
        break
    }

    $level.innerHTML = ''
    $level.appendChild($icon)

    $desc.innerHTML = marked(plan.desc)

    plan.update.forEach(log => {
      let $operate = createElement('span', {
        'className': 'panel-log-operate'
      }, [
        log.operate
      ])
      let $time = createElement('span', {
        'className': 'panel-log-time'
      }, [
        format(log.time, 'MM-dd hh:mm')
      ])
      let $li = createElement('li', {
        'className': 'panel-log'
      }, [
        $operate,
        $time
      ])

      $list.appendChild($li)
    })

    $logs.innerHTML = ''
    $logs.appendChild($list)

    return this
  },
  empty () {
    let elements = this.getEls()
    let $title = elements.title
    let $create = elements.create
    let $deadline = elements.deadline
    let $estimate = elements.estimate
    let $level = elements.level
    let $desc = elements.desc
    let $logs = elements.logs

    $title.innerHTML = ''
    $create.innerHTML = ''
    $deadline.innerHTML = ''
    $estimate.innerHTML = ''
    $level.innerHTML = ''
    $desc.innerHTML = ''
    $logs.innerHTML = ''

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  },
  _onEditClick () {
    emitter.on('panel.edit.open')
  }
}

export default Panel
