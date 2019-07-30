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
  PLAN_DELETE,
  TOOLBAR_ARCHIVES_TOGGLE_HIGHLIGHT,
  PANEL_ARCHIVES_ADD,
  PANEL_ARCHIVES_OPEN,
  PANEL_ARCHIVES_CLOSE,
  PANEL_ARCHIVES_TOGGLE,
  COLUMNS_OPEN,
  COLUMNS_CLOSE,
  PLAN_CLOSE_PANELS
} from './plan.actions'

import {
  createTaskElement,
  getTasksFragment
} from './plan.task'

import { isDelayed } from './plan.static'

const $wrap = document.querySelector('#archives-panel')
let $confirm

const Panel = {
  initialize (plans) {
    this.setPlans(plans)
        .addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    archivesCount: $wrap.querySelector('#archives-count'),
    tasksArchives: $wrap.querySelector('#tasks-archives')
  },
  _plans: [],
  addEventListeners () {
    on($wrap, '.archives-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.task-delete', 'click', this._onDeleteClick, this)

    emitter.on(PANEL_ARCHIVES_ADD, this.add.bind(this))
    emitter.on(PANEL_ARCHIVES_OPEN, this.open.bind(this))
    emitter.on(PANEL_ARCHIVES_CLOSE, this.close.bind(this))
    emitter.on(PANEL_ARCHIVES_TOGGLE, this.toggle.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onDeleteClick)

    emitter.off(PANEL_ARCHIVES_ADD, this.add.bind(this))
    emitter.off(PANEL_ARCHIVES_OPEN, this.open.bind(this))
    emitter.off(PANEL_ARCHIVES_CLOSE, this.close.bind(this))
    emitter.off(PANEL_ARCHIVES_TOGGLE, this.toggle.bind(this))

    return this
  },
  render () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $tasksArchives = elements.tasksArchives
    let $fragment = getTasksFragment(plans)

    elements.archivesCount.innerHTML = `${plans.length}`
    $tasksArchives.innerHTML = ''
    $tasksArchives.appendChild($fragment)

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
    let $tasks = elements.tasksArchives
    let $count = elements.archivesCount
    let count = parseInt($count.innerHTML, 10)
    let plans = clone(this.getPlans())

    plan.status = 4
    plan.archived = true
    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.archive.code,
      operate: OPERATIONS.archive.text
    })

    plans.unshift(plan)
    this.setPlans(plans)

    count += 1
    $count.innerHTML = count.toString()
    $tasks.appendChild(createTaskElement(plan))

    return this
  },
  delete (plan) {
    let plans = clone(this.getPlans())
    let elements = this.getEls()
    let $tasks = elements.tasksArchives
    let $count = elements.archivesCount
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

    emitter.emit(TOOLBAR_ARCHIVES_TOGGLE_HIGHLIGHT)
    emitter.emit(COLUMNS_OPEN)

    removeClass($wrap, 'panel-opened')

    return this
  },
  open () {
    if (this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_ARCHIVES_TOGGLE_HIGHLIGHT)
    emitter.emit(PLAN_CLOSE_PANELS, 'panel.archives.close')
    emitter.emit(COLUMNS_CLOSE)

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

    elements.archivesCount.innerHTML = '0'
    elements.tasksArchives.innerHTML = ''

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
