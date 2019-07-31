'use strict'

import {
  guid,
  toSafeText,
  clone
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
  off,
  on
} from './delegate'

import {
  PLAN_ADD,
  PANEL_ADD_OPEN,
  PANEL_ADD_CLOSE,
  PANEL_ADD_TOGGLE,
  PANEL_ADD_EMPTY,
  PLAN_CLOSE_PANELS,
  COLUMNS_OPEN,
  COLUMNS_CLOSE
} from './plan.actions'

import Calendar from './calendar'

import { OPERATIONS } from './plan.config'
import { isDelayed } from './plan.static'
import emitter from './plan.emitter'

const $wrap = document.querySelector('#add-panel')
const CLS_CHECKED = 'field-level-checked'

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
    on($wrap, '.add-deadline-input', 'click', this._onDeadlineInputFocus, this)
    on($wrap, '.add-calendar-icon', 'click', this._onCalendarIconClick, this)

    emitter.on(PANEL_ADD_OPEN, this.open.bind(this))
    emitter.on(PANEL_ADD_CLOSE, this.close.bind(this))
    emitter.on(PANEL_ADD_TOGGLE, this.toggle.bind(this))
    emitter.on(PANEL_ADD_EMPTY, this.empty.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onSaveClick)
    off($wrap, 'click', this._onLevelClick)
    off($wrap, 'click', this._onDeadlineInputFocus)
    off($wrap, 'click', this._onCalendarIconClick)

    emitter.off(PANEL_ADD_OPEN, this.open.bind(this))
    emitter.off(PANEL_ADD_CLOSE, this.close.bind(this))
    emitter.off(PANEL_ADD_TOGGLE, this.toggle.bind(this))
    emitter.off(PANEL_ADD_EMPTY, this.empty.bind(this))

    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

    removeClass($wrap, 'panel-opened')

    emitter.emit(COLUMNS_OPEN)

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
    let $icon = $wrap.querySelector('.add-calendar-icon')
    let today = getToday().text

    if (this.isOpened()) {
      return this
    }

    emitter.emit(PLAN_CLOSE_PANELS, PANEL_ADD_CLOSE)

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

    emitter.emit(COLUMNS_CLOSE)

    return this
  },
  toggle () {
    if (this.isOpened()) {
      this.close()
    } else {
      this.open()
    }

    return this
  },
  isOpened () {
    return hasClass($wrap, 'panel-opened')
  },
  empty () {
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
    let moments = getMoments()
    let plan = {}

    // TODO: 添加校验

    // 收集新任务的数据
    plan = {
      id: parseInt(guid(4, 10), 10),
      title: toSafeText($title.value),
      deadline: $deadline.value,
      estimate: $estimate.value,
      level: parseInt($level.value, 10),
      desc: toSafeText($desc.value),
      marked: false,
      deleted: false,
      status: 0,
      create: moments,
      update: [
        {
          time: moments,
          code: OPERATIONS.add.code,
          operate: OPERATIONS.add.text
        }
      ],
      delayed: isDelayed(plan)
    }

    emitter.emit(PLAN_ADD, clone(plan))

    return this
  },
  /**
   * 点击取消按钮的事件处理器，点击后关闭添加 Panel
   * ========================================================================
   * @returns {Panel}
   * @private
   */
  _onCancelClick () {
    this.close()

    return this
  },
  /**
   * 点击保存的事件处理器，点击后新增一个任务
   * ========================================================================
   * @returns {Panel}
   * @private
   */
  _onSaveClick () {
    this.save()

    return this
  },
  /**
   * 点击任务级别的事件处理器，点击后更改任务级别
   * ========================================================================
   * @param {Event} evt - 事件对象
   * @returns {Panel}
   * @private
   */
  _onLevelClick (evt) {
    this.changeLevel(evt.delegateTarget)

    return this
  },
  _onDeadlineInputFocus () {
    let $icon = $wrap.querySelector('.add-calendar-icon')

    this.toggleCalendar($icon)

    return this
  },
  _onCalendarIconClick (evt) {
    this.toggleCalendar(evt.delegateTarget)

    return this
  }
}

export default Panel
