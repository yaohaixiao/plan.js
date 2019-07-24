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

import {
  OPERATIONS
} from './plan-config'

import {clone} from './utils'
import {getMoments} from './time'
import {createTaskElement} from './plan-task'
import {isDelayed} from './plan-static'
import Confirm from './confirm'

import mitt from 'mitt'
const emitter = mitt()

const $wrap = document.querySelector('#trash-panel')

const Panel = {
  _elements: {
    wrap: $wrap,
    count: $wrap.querySelector('#trash-count'),
    tasks: $wrap.querySelector('#trash-tasks')
  },
  _plans: [],
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
  render () {
    this.update()

    return this
  },
  addEventListeners () {
    on($wrap, '.trash-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.task-replace', 'click', this._onReplaceClick, this)
    on($wrap, '.task-delete', 'click', this._onDeleteClick, this)

    emitter.on('panel.trash.update', this.setPlans)
    emitter.on('panel.trash.add', this.add)
    emitter.on('panel.trash.open', this.open)
    emitter.on('panel.trash.close', this.close)
    emitter.on('panel.trash.toggle', this.toggle)

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onReplaceClick)
    off($wrap, 'click', this._onDeleteClick)

    emitter.off('panel.trash.update', this.setPlans)
    emitter.off('panel.trash.open', this.open)
    emitter.off('panel.trash.close', this.close)
    emitter.off('panel.trash.toggle', this.toggle)

    return this
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
    let $tasks = elements.tasks
    let $count = elements.count
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

    count+=1
    $count.innerHTML = count.toString()
    $tasks.appendChild(createTaskElement(plan))

    emitter('plan.remove', plan)

    return this
  },
  delete (plan) {
    let plans = clone(this.getPlans())
    let elements = this.getEls()
    let $tasks = elements.tasks
    let $count = elements.count
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

    $plan = $tasks.querySelector(`div.task[data-id="${plan.id}"]`)
    $tasks.removeChild($plan)

    emitter.on('plan.delete', plan)

    return this
  },
  replace (plan) {
    let elements = this.getEls()
    let $tasks = elements.tasks
    let $count = elements.count
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

    emitter('plan.update', plan)

    return this
  },
  close () {
    emitter('toolbar.trash.normalize')
    removeClass($wrap, 'panel-opened')
    emitter('columns.open')

    this.empty()

    return this
  },
  open () {
    emitter('panel.view.close')
    emitter('panel.add.close')
    emitter('panel.edit.close')
    emitter('panel.setting.close')

    emitter('toolbar.trash.highlight')
    addClass($wrap, 'panel-opened')
    emitter('columns.close')

    return this
  },
  toggle () {
    if (hasClass($wrap, 'panel-opened')) {
      this.close()
    } else {
      this.open()
    }

    return this
  },
  empty () {
    let elements = this.getEls()
    let $count = elements.count
    let $tasks = elements.tasks

    $count.innerHTML = '0'
    $tasks.innerHTML = ''

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

    this.delete(plan)

    return this
  }
}

export default Panel
