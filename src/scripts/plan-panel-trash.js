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

import emitter from './plan-emitter'

const $wrap = document.querySelector('#trash-panel')

const Panel = {
  initialize () {
    this.addEventListeners()
  },
  _elements: {
    wrap: $wrap,
    count: $wrap.querySelector('#trash-count'),
    tasks: $wrap.querySelector('#tasks-trash')
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

    emitter.on('panel.trash.update', this.setPlans.bind(this))
    emitter.on('panel.trash.add', this.add.bind(this))
    emitter.on('panel.trash.open', this.open.bind(this))
    emitter.on('panel.trash.close', this.close.bind(this))
    emitter.on('panel.trash.toggle', this.toggle.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onReplaceClick)
    off($wrap, 'click', this._onDeleteClick)

    emitter.off('panel.trash.update', this.setPlans.bind(this))
    emitter.off('panel.trash.open', this.open.bind(this))
    emitter.off('panel.trash.close', this.close.bind(this))
    emitter.off('panel.trash.toggle', this.toggle.bind(this))

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

    emitter.emit('plan.remove', plan)

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

    emitter.emit('plan.update', plan)

    return this
  },
  close () {
    emitter.emit('toolbar.trash.normalize')
    removeClass($wrap, 'panel-opened')
    emitter.emit('columns.open')

    this.empty()

    return this
  },
  open () {
    emitter.emit('panel.view.close')
    emitter.emit('panel.add.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.setting.close')

    emitter.emit('toolbar.trash.highlight')
    addClass($wrap, 'panel-opened')
    emitter.emit('columns.close')

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
