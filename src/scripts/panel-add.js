'use strict'

import {
  guid,
  toSafeText
} from './utils'

import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import {
  getMoments,
  getToday
} from './time'

import {
  isDelayed,
  isLevelSaveAsFilter
} from './plan-static'

import {
  off,
  on
} from './delegate'

import mitt from 'mitt'
import Calendar from './calendar'
import {OPERATIONS} from './config'

const emitter = mitt()
const $wrap = document.querySelector('#add-panel')

let $calendar

const Panel = {
  initialize () {
    this.addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    title: $wrap.querySelector('#add-title'),
    create: $wrap.querySelector('#add-create'),
    deadline: $wrap.querySelector('#add-deadline'),
    estimate: $wrap.querySelector('#add-estimate'),
    levels: $wrap.querySelector('#add-levels'),
    level: $wrap.querySelector('#add-level'),
    desc: $wrap.querySelector('#add-desc')
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
  _filter: 'diamonds',
  getFilter () {
    return this._filter
  },
  setFilter (filter) {
    this._filter = filter

    return this
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
    on($wrap, '.add-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.add-save', 'click', this._onSaveClick, this)
    on($wrap, '.add-level', 'click', this._onLevelClick, this)

    emitter.on('panel.add.update.filter', this.setFilter)
    emitter.on('panel.add.update', this.setPlan)
    emitter.on('panel.add.open', this.open)
    emitter.on('panel.add.close', this.close)

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onSaveClick)
    off($wrap, 'click', this._onLevelClick)

    emitter.off('panel.add.update.filter', this.setFilter)
    emitter.off('panel.add.update', this.setPlan)
    emitter.off('panel.add.open', this.open)
    emitter.off('panel.add.close', this.close)

    return this
  },
  close () {
    removeClass($wrap, 'panel-opened')

    emitter.emit('columns.open')

    if ($calendar) {
      $calendar.destroy()
      $calendar = null
    }

    this.empty()

    return this
  },
  open () {
    let $create = $wrap.querySelector('#add-create')
    let $deadline = $wrap.querySelector('#add-deadline')
    let $icon = $wrap.querySelector('.add-deadline')
    let today = getToday().text

    emitter.emit('panel.view.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

    $calendar = new Calendar({
      parent: 'add-calendar',
      time: this.getPlan().deadline,
      hasFooter: false,
      onDatePick: (time) => {
        $deadline.value = time
        $calendar.hide()
        removeClass($icon, 'field-icon-checked')
      }
    })

    $create.innerHTML = today

    $calendar.hide()

    addClass($wrap, 'panel-opened')

    emitter.emit('columns.close')

    return this
  },
  empty () {
    const CLS_CHECKED = 'field-level-checked'
    let $title = $wrap.querySelector('#add-title')
    let $create = $wrap.querySelector('#add-create')
    let $deadline = $wrap.querySelector('#add-deadline')
    let $estimate = $wrap.querySelector('#add-estimate')
    let $level = $wrap.querySelector('#add-level')
    let $desc = $wrap.querySelector('#add-desc')
    let $checked = $wrap.querySelector('.' + CLS_CHECKED)

    $title.value = ''
    $create.innerHTML = ''
    $deadline.value = ''
    $estimate.value = ''
    $level.value = -1
    $desc.value = ''

    if ($checked) {
      removeClass($checked, CLS_CHECKED)
    }

    return this
  },
  level ($button) {
    const CLS_CHECKED = 'field-level-checked'
    let id = $button.getAttribute('data-level')
    let $checked = $wrap.querySelector('.' + CLS_CHECKED)
    let $input = $wrap.querySelector(`#add-level`)

    if (hasClass($button, CLS_CHECKED)) {
      return this
    }

    if ($checked) {
      removeClass($checked, CLS_CHECKED)
    }
    addClass($button, CLS_CHECKED)

    if ($input) {
      $input.value = id
    }

    return this
  },
  save () {
    let elements = this.getEls()
    let $title = elements.title
    let $deadline = elements.deadline
    let $estimate = elements.estimate
    let $level = elements.level
    let $desc = elements.desc
    let plan = {}
    let moments = getMoments()
    let filter = this.getFilter()
    let status

    // TODO: 添加校验

    // 收集新任务的数据
    plan.id = parseInt(guid(4, 10), 10)
    plan.title = toSafeText($title.value)
    plan.deadline = $deadline.value
    plan.estimate = $estimate.value
    plan.level = parseInt($level.value, 10)
    plan.desc = toSafeText($desc.value)
    plan.marked = false
    plan.deleted = false
    plan.status = 0
    plan.create = moments
    plan.update = [{
      time: moments,
      code: OPERATIONS.add.code,
      operate: OPERATIONS.add.text
    }]

    plan.delayed = isDelayed(plan)

    status = plan.status

    if ((status !== 'marked' && isLevelSaveAsFilter(plan.level, filter)) || filter === 'inbox') {
      emitter.emit('plan.todo.add', plan)
    }

    emitter.emit('plan.add', plan)

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  },
  _onSaveClick () {
    this.save()

    return this
  },
  _onLevelClick (evt) {
    this.level(evt.delegateTarget)

    return this
  }
}

export default Panel
