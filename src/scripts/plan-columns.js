'use strict'

import {
  on,
  off
} from './delegate'

import {
  addClass,
  removeClass
} from './dom'

import emitter from './plan-emitter'

let $wrap = document.querySelector('#columns')

const Columns = {
  initialize () {
    this.addEventListeners()
  },
  _elements: {
    wrap: $wrap,
    todoCount: $wrap.querySelector('#todo-count'),
    tasksTodo: $wrap.querySelector('#tasks-todo'),
    doingCount: $wrap.querySelector('#doing-count'),
    tasksDoing: $wrap.querySelector('#tasks-doing'),
    checkingCount: $wrap.querySelector('#checking-count'),
    tasksChecking: $wrap.querySelector('#tasks-checking'),
    doneCount: $wrap.querySelector('#done-count'),
    tasksDone: $wrap.querySelector('#tasks-done')
  },
  _plans: [],
  getPlans () {
    return this._plans
  },
  setPlans (plans) {
    this._plans = plans

    return this
  },
  addEventListeners () {
    on($wrap, '.column-up', 'click', this._onCollapseClick, this)
    on($wrap, '.column-down', 'click', this._onExpandClick, this)
    on($wrap, '.columns-overlay', 'click', this._onOverlayClick, this)

    emitter.on('columns.open', this.open.bind(this))
    emitter.on('columns.close', this.close.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCollapseClick)
    off($wrap, 'click', this._onExpandClick)
    off($wrap, 'click', this._onOverlayClick)

    emitter.off('columns.open', this.open.bind(this))
    emitter.off('columns.close', this.close.bind(this))

    return this
  },
  getStatusCountEl (status) {
    let elements = this.getEls()
    let $count

    switch (status) {
      case '0':
      case 0:
        $count = elements.todoCount
        break
      case '1':
      case 1:
        $count = elements.doingCount
        break
      case '2':
      case 2:
        $count = elements.checkingCount
        break
      case '3':
      case 3:
        $count = elements.doneCount
        break
    }

    return $count
  },
  getStatusTasksEl (status) {
    let elements = this.getEls()
    let $tasks

    switch (status) {
      case '0':
      case 0:
        $tasks = elements.tasksTodo
        break
      case '1':
      case 1:
        $tasks = elements.tasksDoing
        break
      case '2':
      case 2:
        $tasks = elements.tasksChecking
        break
      case '3':
      case 3:
        $tasks = elements.tasksDone
        break
    }

    return $tasks
  },
  filterPlans (prop, status) {
    let originPlans = this.getPlans()
    let plans = []

    switch (prop) {
      case 'spades':
        plans = originPlans.filter((plan) => {
          return plan.status === status && plan.level === 0 && !plan.deleted
        })

        break
      case 'heart':
        plans = originPlans.filter((plan) => {
          return plan.status === status && plan.level === 1 && !plan.deleted
        })

        break
      case 'clubs':
        plans = originPlans.filter((plan) => {
          return plan.status === status && plan.level === 2 && !plan.deleted
        })

        break
      case 'diamonds':
        plans = originPlans.filter((plan) => {
          return plan.status === status && plan.level === 3 && !plan.deleted
        })

        break
      case 'marked':
        plans = originPlans.filter((plan) => {
          return plan.status === status && plan.marked && !plan.deleted
        })

        break
      case 'deleted':
        plans = originPlans.filter((plan) => {
          return plan.deleted
        })

        break
      default:
        plans = originPlans.filter((plan) => {
          return plan.status === status && !plan.deleted
        })

        break
    }

    return plans
  },
  getTodoPlans () {
    return this.filterPlans('inbox', 0)
  },
  getDoingPlans () {
    return this.filterPlans('inbox', 1)
  },
  getCheckingPlans () {
    return this.filterPlans('inbox', 2)
  },
  getDonePlans () {
    return this.filterPlans('inbox', 3)
  },
  getMarkedPlans () {
    return this.filterPlans('marked')
  },
  updateTodoColumn (todoPlans) {
    let elements = this.getEls()
    // 待处理
    let $tasksTodo = elements.tasksTodo
    let $todoCount = elements.todoCount
    let $todoFragment = this._getTasksFragment(todoPlans)

    $todoCount.innerHTML = `${todoPlans.length}`
    $tasksTodo.innerHTML = ''
    $tasksTodo.appendChild($todoFragment)

    return this
  },

  updateDoingColumn (doingPlans) {
    let elements = this.getEls()
    // 处理中
    let $tasksDoing = elements.tasksDoing
    let $doingCount = elements.doingCount
    let $doingFragment = this._getTasksFragment(doingPlans)

    $doingCount.innerHTML = `${doingPlans.length}`
    $tasksDoing.innerHTML = ''
    $tasksDoing.appendChild($doingFragment)

    return this
  },

  updateCheckingColumn (checkingPlans) {
    let elements = this.getEls()
    // 待验证
    let $tasksChecking = elements.tasksChecking
    let $checkingCount = elements.checkingCount
    let $checkingFragment = this._getTasksFragment(checkingPlans)

    $checkingCount.innerHTML = `${checkingPlans.length}`
    $tasksChecking.innerHTML = ''
    $tasksChecking.appendChild($checkingFragment)

    return this
  },

  updateDoneColumn (donePlans) {
    let elements = this.getEls()
    // 已完成
    let $tasksDone = elements.tasksDone
    let $doneCount = elements.doneCount
    let $doneFragment = this._getTasksFragment(donePlans)

    $doneCount.innerHTML = `${donePlans.length}`
    $tasksDone.innerHTML = ''
    $tasksDone.appendChild($doneFragment)

    return this
  },

  updateColumn (status, plans) {
    switch (status) {
      case 0:
        this.updateTodoColumn(plans)
        break
      case 1:
        this.updateDoingColumn(plans)
        break
      case 2:
        this.updateCheckingColumn(plans)
        break
      case 3:
        this.updateDoneColumn(plans)
        break
    }

    return this
  },

  updateColumns (todoPlans, doingPlans, checkingPlans, donePlans) {
    this.updateTodoColumn(todoPlans)
        .updateDoingColumn(doingPlans)
        .updateCheckingColumn(checkingPlans)
        .updateDoneColumn(donePlans)

    return this
  },

  emptyTodoColumn () {
    let elements = this.getEls()

    elements.todoCount = 0
    elements.tasksTodo.innerHTML = ''

    return this
  },

  emptyDoingColumn () {
    let elements = this.getEls()

    elements.doingCount = 0
    elements.tasksDoing.innerHTML = ''

    return this
  },

  emptyCheckingColumn () {
    let elements = this.getEls()

    elements.checkCount = 0
    elements.tasksChecking.innerHTML = ''

    return this
  },

  emptyDoneColumn () {
    let elements = this.getEls()

    elements.doneCount = 0
    elements.tasksDone.innerHTML = ''

    return this
  },

  emptyColumns () {
    this.emptyTodoColumn()
        .emptyDoingColumn()
        .emptyCheckingColumn()
        .emptyDoneColumn()

    return this
  },
  collapse ($button) {
    const CLS_HIDDEN = 'hidden'
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $down = $button.parentNode.querySelector('.column-down')
    let $tasks = this.getStatusTasksEl(status)

    addClass($button, CLS_HIDDEN)
    removeClass($down, CLS_HIDDEN)
    addClass($tasks, 'tasks-min')

    return this
  },
  expand ($button) {
    const CLS_HIDDEN = 'hidden'
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $up = $button.parentNode.querySelector('.column-up')
    let $tasks = this.getStatusTasksEl(status)

    addClass($button, CLS_HIDDEN)
    removeClass($up, CLS_HIDDEN)
    removeClass($tasks, 'tasks-min')

    return this
  },
  open () {
    addClass($wrap, 'panel-opened')

    return this
  },
  close () {
    removeClass($wrap, 'panel-opened')

    return this
  },
  _onCollapseClick (evt) {
    this.collapse(evt.delegateTarget)

    return this
  },
  _onExpandClick (evt) {
    this.expand(evt.delegateTarget)

    return this
  },
  _onOverlayClick () {
    this.close()

    return this
  }
}

export default Columns
