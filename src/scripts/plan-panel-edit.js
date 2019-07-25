'use strict'

import {
  clone
} from './utils'

import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import {
  getMoments
} from './time'

import {
  off,
  on
} from './delegate'

import emitter from './plan-emitter'
import Calendar from './calendar'
import {OPERATIONS} from './plan-config'

const $wrap = document.querySelector('#edit-panel')

let $calendar

const Panel = {
  initialize () {
    this.addEventListeners()
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

    emitter.on('panel.edit.update', this.setPlan.bind(this))
    emitter.on('panel.edit.open', this.open.bind(this))
    emitter.on('panel.edit.close', this.close.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onSaveClick)
    off($wrap, 'click', this._onLevelClick)

    emitter.off('panel.edit.update', this.setPlan.bind(this))
    emitter.off('panel.edit.open', this.open.bind(this))
    emitter.off('panel.edit.close', this.close.bind(this))

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
    let $deadline = $wrap.querySelector('#edit-deadline')
    let $icon = $wrap.querySelector('.edit-deadline')

    emitter.emit('panel.add.close')
    emitter.emit('panel.view.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

    $calendar = new Calendar({
      parent: 'edit-calendar',
      time: this.getEditPlan().deadline,
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
  level ($button) {
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
    plan.id = originPlan.id
    plan.title = $title.value
    plan.deadline = $deadline.value
    plan.estimate = $estimate.value
    plan.level = parseInt($level.value, 10)
    plan.desc = $desc.value
    plan.marked = originPlan.marked
    plan.deleted = originPlan.deleted
    plan.status = originPlan.status
    plan.create = originPlan.create
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.edit.code,
      operate: OPERATIONS.edit.text
    })

    this.close()

    emitter.on('plan.update', plan)

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
