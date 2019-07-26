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
import {createTaskElement} from './plan-task'
import {getMoments} from './time'
import {OPERATIONS} from './plan-config'
import {
  isDelayed,
  updateStatusChangedCount
} from './plan-static'

let $wrap = document.querySelector('#columns')

const Columns = {
  initialize ({filter, plans}) {
    this.setFilter(filter)
        .setPlans(plans)
        .addEventListeners()

    return this
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
  _filter: 'inbox',
  render () {
    let todoPlans = this.getTodoPlans()
    let doingPlans = this.getDoingPlans()
    let checkingPlans = this.getCheckingPlans()
    let donePlans = this.getDonePlans()

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  },
  getFilter () {
    return this._filter
  },
  setFilter (filter) {
    this._filter = filter

    return this
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
  addEventListeners () {
    on($wrap, '.column-up', 'click', this._onCollapseClick, this)
    on($wrap, '.column-down', 'click', this._onExpandClick, this)
    on($wrap, '.columns-overlay', 'click', this._onOverlayClick, this)

    // ---------- task ----------
    on($wrap, '.task-title', 'click', this._onTaskTitleClick, this)
    on($wrap, '.task-prev', 'click', this._onPrevButtonClick, this)
    on($wrap, '.task-edit', 'click', this._onEditButtonClick, this)
    on($wrap, '.task-bookmark', 'click', this._onMarkedButtonClick, this)
    on($wrap, '.task-delete', 'click', this._onDeleteButtonClick, this)
    on($wrap, '.task-next', 'click', this._onNextButtonClick, this)

    emitter.on('columns.open', this.open.bind(this))
    emitter.on('columns.close', this.close.bind(this))

    emitter.on('columns.update.filter', this.setFilter.bind(this))
    emitter.on('columns.add', this.add.bind(this))
    emitter.on('columns.edit', this.edit.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCollapseClick)
    off($wrap, 'click', this._onExpandClick)
    off($wrap, 'click', this._onOverlayClick)

    // ---------- task ----------
    off($wrap, 'click', this._onTaskTitleClick)
    off($wrap, 'click', this._onPrevButtonClick)
    off($wrap, 'click', this._onEditButtonClick)
    off($wrap, 'click', this._onMarkedButtonClick)
    off($wrap, 'click', this._onDeleteButtonClick)
    off($wrap, 'click', this._onNextButtonClick)

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
      default:
        plans = originPlans.filter((plan) => {
          return plan.status === status && !plan.deleted
        })

        break
    }

    return plans
  },
  getTodoPlans () {
    return this.filterPlans(this.getFilter(), 0)
  },
  getDoingPlans () {
    return this.filterPlans(this.getFilter(), 1)
  },
  getCheckingPlans () {
    return this.filterPlans(this.getFilter(), 2)
  },
  getDonePlans () {
    return this.filterPlans(this.getFilter(), 3)
  },
  getMarkedPlans () {
    return this.filterPlans('marked')
  },
  add (plan) {
    return this
  },
  edit (plan) {
    return this
  },
  remove (plan) {
    // emitter.emit('plan.edit', plan)

    return this
  },
  mark (plan) {
    const CLS_MARKED = 'task-marked'
    let filter = this.getFilter()
    let status = plan.status
    let selector = `div.task[data-id="${id}"]`
    let $columns = this.$columns
    let $plan

    plan.marked = !plan.marked
    plan.update.unshift({
      time: getMoments(),
      code: plan.marked ? OPERATIONS.mark.code : OPERATIONS.unmark.code,
      operate: plan.marked ? OPERATIONS.mark.text : OPERATIONS.unmark.text,
    })
    this.setPlan(plan)

    emitter.emit('plan.edit', plan)

    switch (status) {
      case 0:
        $plan = $columns.tasksTodo.querySelector(selector)
        break
      case 1:
        $plan = $columns.tasksDoing.querySelector(selector)
        break
      case 2:
        $plan = $columns.tasksChecking.querySelector(selector)
        break
      case 3:
        $plan = $columns.tasksDone.querySelector(selector)
        break
    }

    if (filter === 'marked') {
      $columns.updateColumn(status, $columns.filterPlans(status, 'marked'))
    } else {
      if (plan.marked) {
        addClass($plan, CLS_MARKED)
        $plan.setAttribute('data-marked', '1')
      } else {
        removeClass($plan, CLS_MARKED)
        $plan.setAttribute('data-marked', '0')
      }
    }

    return this
  },
  changeStatus (plan, direction) {
    let status = plan.status
    let $columns = this.$columns
    let $sourceCount = $columns.getStatusCountEl(status)
    let $sourceTasks = $columns.getStatusTasksEl(status)
    let $plan = $sourceTasks.querySelector(`div.task[data-id="${id}"]`)
    let $targetCount = $columns.getStatusCountEl(plan.status)
    let $targetTasks = $columns.getStatusTasksEl(plan.status)

    if (direction === 'prev') {
      plan.status -= 1

      if (plan.status < 0) {
        plan.status = 0
      }
    } else {
      if (direction === 'next') {
        plan.status += 1

        if (plan.status > 3) {
          plan.status = 3
        }
      }
    }

    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.status.code,
      operate: OPERATIONS.status.text
    })
    this.setPlan(plan)

    emitter.emit('plan.edit', plan)

    updateStatusChangedCount($sourceCount, $targetCount)

    $sourceTasks.removeChild($plan)
    $targetTasks.appendChild(createTaskElement(plan))

    return this
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
    removeClass($wrap, 'panel-opened')

    return this
  },
  close () {
    addClass($wrap, 'panel-opened')

    return this
  },
  _getTasksFragment (plans) {
    let $fragment = document.createDocumentFragment()

    if (plans.length < 1) {
      return $fragment
    }

    plans.forEach((plan) => {
      let $plan = createTaskElement(plan)

      $fragment.appendChild($plan)
    })

    return $fragment
  },
  _onTaskTitleClick (evt) {
    let $title = evt.delegateTarget
    let id = $title.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    emitter.emit('panel.view.update', plan)
    emitter.emit('panel.view.open')

    return this
  },
  _onPrevButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.changeStatus(plan, 'prev')

    return this
  },
  _onNextButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.changeStatus(plan, 'next')

    return this
  },
  _onEditButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    emitter.emit('panel.edit.update', plan)
    emitter.emit('panel.edit.open')

    return this
  },
  _onMarkedButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.mark(plan)

    return this
  },
  _onDeleteButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.remove(plan)

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
    this.open()

    emitter.emit('panel.view.close')
    emitter.emit('panel.add.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

    return this
  }
}

export default Columns
