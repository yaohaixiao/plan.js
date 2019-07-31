'use strict'

import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import {
  off,
  on
} from './delegate'

import { clone } from './utils'
import { getMoments } from './time'

import Confirm from './confirm'

import { OPERATIONS } from './plan.config'
import emitter from './plan.emitter'

import {
  createTaskElement,
  getTasksFragment
} from './plan.task'

import { isDelayed } from './plan.static'

import {
  PLAN_DELETE,
  PLAN_REPLACE,
  PLAN_CLOSE_PANELS,
  TOOLBAR_TRASH_TOGGLE_HIGHLIGHT,
  PANEL_TRASH_ADD,
  PANEL_TRASH_PUSH,
  PANEL_TRASH_OPEN,
  PANEL_TRASH_CLOSE,
  PANEL_TRASH_EMPTY,
  PANEL_TRASH_TOGGLE,
  COLUMNS_OPEN,
  COLUMNS_CLOSE
} from './plan.actions'

const $wrap = document.querySelector('#trash-panel')
let $confirm

const Panel = {
  initialize (plans) {
    this.setPlans(plans)
        .addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    trashCount: $wrap.querySelector('#trash-count'),
    tasksTrash: $wrap.querySelector('#tasks-trash')
  },
  _plans: [],
  addEventListeners () {
    on($wrap, '.trash-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.task-replace', 'click', this._onReplaceClick, this)
    on($wrap, '.task-delete', 'click', this._onDeleteClick, this)

    emitter.on(PANEL_TRASH_ADD, this.add.bind(this))
    emitter.on(PANEL_TRASH_PUSH, this.push.bind(this))
    emitter.on(PANEL_TRASH_OPEN, this.open.bind(this))
    emitter.on(PANEL_TRASH_CLOSE, this.close.bind(this))
    emitter.on(PANEL_TRASH_TOGGLE, this.toggle.bind(this))
    emitter.on(PANEL_TRASH_EMPTY, this.empty.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onReplaceClick)
    off($wrap, 'click', this._onDeleteClick)

    emitter.off(PANEL_TRASH_ADD, this.add.bind(this))
    emitter.off(PANEL_TRASH_PUSH, this.push.bind(this))
    emitter.off(PANEL_TRASH_OPEN, this.open.bind(this))
    emitter.off(PANEL_TRASH_CLOSE, this.close.bind(this))
    emitter.off(PANEL_TRASH_TOGGLE, this.toggle.bind(this))
    emitter.off(PANEL_TRASH_EMPTY, this.empty.bind(this))

    return this
  },
  render () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $tasksTrash = elements.tasksTrash
    let $fragment = getTasksFragment(plans)

    elements.trashCount.innerHTML = `${plans.length}`
    $tasksTrash.innerHTML = ''
    $tasksTrash.appendChild($fragment)

    return this
  },
  getPlan (id) {
    return this.getPlans().filter((plan) => {
      return plan.id === id
    })[0]
  },
  getPlans () {
    return this._plans
  },
  setPlans (plans) {
    this._plans = plans

    return this
  },
  getEls () {
    return this._elements
  },
  indexOf (plans, plan) {
    let index = -1

    plans.forEach((task, i) => {
      if (plan.id === task.id) {
        index = i
      }
    })

    return index
  },
  add (plan) {
    let elements = this.getEls()
    let $tasks = elements.tasksTrash
    let $count = elements.trashCount
    let count = parseInt($count.innerHTML, 10)
    let plans = clone(this.getPlans())

    plan.deleted = true
    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.remove.code,
      operate: OPERATIONS.remove.text
    })

    plans.unshift(plan)
    this.setPlans(plans)

    count += 1
    $count.innerHTML = count.toString()
    $tasks.appendChild(createTaskElement(plan))

    return this
  },
  push (plan) {
    let plans = clone(this.getPlans())

    plans.push(plan)

    this.setPlans(plans)

    return this
  },
  delete (plan) {
    let plans = clone(this.getPlans())
    let elements = this.getEls()
    let $tasks = elements.tasksTrash
    let $count = elements.trashCount
    let index = this.indexOf(plans, plan)
    let count = parseInt($count.innerHTML, 10)
    let $plan

    if (index === -1) {
      return this
    }

    plans.splice(index, 1)
    this.setPlans(plans)

    count -= 1
    $count.innerHTML = count.toString()

    $plan = $tasks.querySelector(`.task[data-id="${plan.id}"]`)
    $tasks.removeChild($plan)

    emitter.emit(PLAN_DELETE, clone(plan))

    return this
  },
  replace (plan) {
    let elements = this.getEls()
    let $tasks = elements.tasksTrash
    let $count = elements.trashCount
    let count = parseInt($count.innerHTML, 10)
    let plans = clone(this.getPlans())
    let index = this.indexOf(plans, plan)
    let $plan

    plan.deleted = false
    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.remove.code,
      operate: OPERATIONS.remove.text
    })

    if (index === -1) {
      return this
    }

    plans.splice(index, 1)
    this.setPlans(plans)

    count -= 1
    $count.innerHTML = count.toString()

    $plan = $tasks.querySelector(`div.task[data-id="${plan.id}"]`)
    $tasks.removeChild($plan)

    emitter.emit(PLAN_REPLACE, clone(plan))

    return this
  },
  confirm (plan) {
    $confirm = new Confirm({
      title: '确定删除任务吗？',
      message: '任务将被彻底删除，无法恢复',
      cancelText: '取消',
      enterText: '删除',
      afterEnter: () => {
        this.delete(plan)

        $confirm.destroy()
      }
    })

    $confirm.open()

    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_TRASH_TOGGLE_HIGHLIGHT)
    emitter.emit(COLUMNS_OPEN, true)

    removeClass($wrap, 'panel-opened')

    return this
  },
  open () {
    if (this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_TRASH_TOGGLE_HIGHLIGHT)
    emitter.emit(PLAN_CLOSE_PANELS, PANEL_TRASH_CLOSE)
    emitter.emit(COLUMNS_CLOSE, true)

    addClass($wrap, 'panel-opened')

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
    let elements = this.getEls()

    elements.trashCount.innerHTML = '0'
    elements.tasksTrash.innerHTML = ''

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  },
  _onReplaceClick (evt) {
    let $button = evt.delegateTarget
    let id = parseInt($button.getAttribute('data-id'), 10)
    let plan = this.getPlan(id)

    this.replace(plan)

    return this
  },
  _onDeleteClick (evt) {
    let $button = evt.delegateTarget
    let id = parseInt($button.getAttribute('data-id'), 10)
    let plan = this.getPlan(id)

    this.confirm(plan)

    return this
  }
}

export default Panel
