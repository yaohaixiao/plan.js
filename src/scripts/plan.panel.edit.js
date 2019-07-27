'use strict'

import {
  clone,
  assign
} from './utils'

import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import { getMoments } from './time'

import {
  off,
  on
} from './delegate'

import Calendar from './calendar'

import { OPERATIONS } from './plan.config'
import { isDelayed } from './plan.static'
import emitter from './plan.emitter'

const $wrap = document.querySelector('#edit-panel')

let $calendar

const Panel = {
  initialize () {
    this.addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    title: $wrap.querySelector('#edit-title'),
    create: $wrap.querySelector('#edit-create'),
    deadline: $wrap.querySelector('#edit-deadline'),
    estimate: $wrap.querySelector('#edit-estimate'),
    levels: $wrap.querySelector('#edit-levels'),
    level: $wrap.querySelector('#edit-level'),
    desc: $wrap.querySelector('#edit-desc')
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
    on($wrap, '.edit-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.edit-save', 'click', this._onSaveClick, this)
    on($wrap, '.edit-level', 'click', this._onLevelClick, this)
    on($wrap, '.edit-deadline-input', 'click', this._onDeadlineInputFocus, this)
    on($wrap, '.edit-calendar-icon', 'click', this._onCalendarIconClick, this)

    emitter.on('panel.edit.update', this.setPlan.bind(this))
    emitter.on('panel.edit.open', this.open.bind(this))
    emitter.on('panel.edit.close', this.close.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onSaveClick)
    off($wrap, 'click', this._onLevelClick)
    off($wrap, 'click', this._onDeadlineInputFocus)
    off($wrap, 'click', this._onCalendarIconClick)

    emitter.off('panel.edit.update', this.setPlan.bind(this))
    emitter.off('panel.edit.open', this.open.bind(this))
    emitter.off('panel.edit.close', this.close.bind(this))

    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

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
    let $deadline = $wrap.querySelector('#edit-deadline')
    let $icon = $wrap.querySelector('.edit-calendar-icon')

    if (this.isOpened()) {
      return this
    }

    emitter.emit('panel.add.close')
    emitter.emit('panel.view.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

    $calendar = new Calendar({
      parent: 'edit-calendar',
      time: this.getPlan().deadline,
      hasFooter: false,
      onDatePick: (time) => {
        $deadline.value = time
        $calendar.hide()
        removeClass($icon, 'field-icon-checked')
      }
    })

    $calendar.hide()

    this.update()

    addClass($wrap, 'panel-opened')

    emitter.emit('columns.close')

    return this
  },
  isOpened () {
    return hasClass($wrap, 'panel-opened')
  },
  update () {
    let plan = this.getPlan()
    let $title = $wrap.querySelector('#edit-title')
    let $create = $wrap.querySelector('#edit-create')
    let $deadline = $wrap.querySelector('#edit-deadline')
    let $estimate = $wrap.querySelector('#edit-estimate')
    let $level = $wrap.querySelector('#edit-level')
    let $desc = $wrap.querySelector('#edit-desc')
    let $checked = $wrap.querySelector(`[data-level="${plan.level}"]`)

    $title.value = plan.title
    $create.innerHTML = plan.create
    $deadline.value = plan.deadline
    $estimate.value = plan.estimate
    $level.value = plan.level
    $desc.value = plan.desc

    if ($checked) {
      addClass($checked, 'field-level-checked')
    }

    return this
  },
  empty () {
    const CLS_CHECKED = 'field-level-checked'
    let $title = $wrap.querySelector('#edit-title')
    let $create = $wrap.querySelector('#edit-create')
    let $deadline = $wrap.querySelector('#edit-deadline')
    let $estimate = $wrap.querySelector('#edit-estimate')
    let $level = $wrap.querySelector('#edit-level')
    let $desc = $wrap.querySelector('#edit-desc')
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
  toggleCalendar ($icon) {
    const CLS_CHECKED = 'field-icon-checked'

    if (hasClass($icon, CLS_CHECKED)) {
      removeClass($icon, CLS_CHECKED)
    } else {
      addClass($icon, CLS_CHECKED)
    }

    $calendar.toggle()

    return this
  },
  changeLevel ($button) {
    const CLS_CHECKED = 'field-level-checked'
    let id = $button.getAttribute('data-level')
    let $checked = $wrap.querySelector('.' + CLS_CHECKED)
    let $input = $wrap.querySelector(`#edit-level`)

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
    let $title = $wrap.querySelector('#edit-title')
    let $deadline = $wrap.querySelector('#edit-deadline')
    let $estimate = $wrap.querySelector('#edit-estimate')
    let $level = $wrap.querySelector('#edit-level')
    let $desc = $wrap.querySelector('#edit-desc')
    let originPlan = this.getPlan()
    let plan = clone(originPlan)

    // 收集新任务的数据
    assign(plan, {
      id: originPlan.id,
      title: $title.value,
      deadline: $deadline.value,
      estimate: $estimate.value,
      level: parseInt($level.value, 10),
      desc: $desc.value,
      marked: originPlan.marked,
      deleted: originPlan.deleted,
      status: originPlan.status,
      create: originPlan.create,
      delayed: isDelayed(plan)
    })

    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.edit.code,
      operate: OPERATIONS.edit.text
    })

    this.close()

    emitter.emit('plan.edit', clone(plan))

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
    this.changeLevel(evt.delegateTarget)

    return this
  },
  _onDeadlineInputFocus () {
    let $icon = $wrap.querySelector('.edit-calendar-icon')

    this.toggleCalendar($icon)

    return this
  },
  _onCalendarIconClick (evt) {
    this.toggleCalendar(evt.delegateTarget)

    return this
  }
}

export default Panel
