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

import { OPERATIONS } from './plan.config'
import emitter from './plan.emitter'

import {
  TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT,
  PANEL_CHARTS_UPDATE,
  PANEL_CHARTS_OPEN,
  PANEL_CHARTS_CLOSE,
  PANEL_CHARTS_TOGGLE,
  COLUMNS_OPEN,
  COLUMNS_CLOSE,
  PLAN_CLOSE_PANELS
} from './plan.actions'

import {
  createTaskElement,
  getTasksFragment
} from './plan.task'

import { isDelayed } from './plan.static'

const $wrap = document.querySelector('#charts-panel')

const Panel = {
  initialize (plans) {
    this.setPlans(plans)
        .addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    tasksCharts: $wrap.querySelector('#tasks-charts')
  },
  _plans: [],
  addEventListeners () {
    on($wrap, '.charts-cancel', 'click', this._onCancelClick, this)

    emitter.on(PANEL_CHARTS_UPDATE, this.update.bind(this))
    emitter.on(PANEL_CHARTS_OPEN, this.open.bind(this))
    emitter.on(PANEL_CHARTS_CLOSE, this.close.bind(this))
    emitter.on(PANEL_CHARTS_TOGGLE, this.toggle.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)

    emitter.off(PANEL_CHARTS_UPDATE, this.update.bind(this))
    emitter.off(PANEL_CHARTS_OPEN, this.open.bind(this))
    emitter.off(PANEL_CHARTS_CLOSE, this.close.bind(this))
    emitter.off(PANEL_CHARTS_TOGGLE, this.toggle.bind(this))

    return this
  },
  render () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $tasksCharts = elements.tasksCharts
    let $fragment = getTasksFragment(plans)

    $tasksCharts.innerHTML = ''
    $tasksCharts.appendChild($fragment)

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
  update (plan) {
    let elements = this.getEls()
    let $tasks = elements.tasksCharts
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

    $tasks.appendChild(createTaskElement(plan))

    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT)
    emitter.emit(COLUMNS_OPEN)

    removeClass($wrap, 'panel-opened')

    return this
  },
  open () {
    if (this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT)
    emitter.emit(PLAN_CLOSE_PANELS, PANEL_CHARTS_CLOSE)
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

    elements.tasksCharts.innerHTML = ''

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  }
}

export default Panel
