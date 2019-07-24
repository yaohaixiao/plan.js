'use strict'

import {
  assign,
  clone,
  guid,
  toSafeText
} from './utils'

import {
  getToday,
  getMoments,
  format
} from './time'

import {
  createElement,
  hasClass,
  addClass,
  removeClass,
  replaceClass
} from './dom'

import {
  on,
  off
} from './delegate'

import {
  createTaskElement
} from './plan-task'

import {
  isDelayed,
  isLevelSaveAsFilter,
  updateStatusChangedCount
} from './plan-static'

import {
  THEMES,
  OPERATIONS
} from './plan-config'

// import PanelView from './panel-view'
// import PanelAdd from './panel-add'
// import PanelEdit from './panel-edit'
import PanelTrash from './plan-panel-trash'
import PanelSetting from './plan-panel-setting'

// import Calendar from './calendar'
// import Confirm from './confirm'

import dragula from 'dragula'
import marked from 'marked'

import mitt from 'mitt'
const emitter = mitt()

class PlanV2 {
  constructor (options) {
    this.attributes = {
      template: 0,
      theme: 0,
      cache: 0,
      plans: []
    }

    this.elements = {
      wrap: null,
      toolbar: null,
      todoCount: null,
      tasksTodo: null,
      doingCount: null,
      tasksDoing: null,
      checkingCount: null,
      tasksChecking: null,
      doneCount: null,
      tasksDone: null,
      columns: null,
      columnsOverlay: null
    }

    // this.$panelView = PanelView
    // this.$panelAdd = PanelAdd
    // this.$panelEdit = PanelEdit
    this.$panelTrash = PanelTrash
    this.$panelSetting = PanelSetting

    // this.$calendar = null
    // this.$confirm = null
    this.$dragula = null

    this.data = {
      plans: [],
      filter: 'inbox',
      editPlan: null
    }

    this.initialize(options)
        .render()
        .addEventListeners()

    return this
  }

  initialize (options) {
    let elements = this.getEls()
    let $tasksTrash
    let $tasksTodo
    let $tasksDoing
    let $tasksChecking
    let $tasksDone

    this.set(options)
        .queryElements()
        .setPlans(clone(this.get('plans')))

    emitter.emit('panel.setting.update', {
      template: this.get('template'),
      theme: this.get('theme'),
      cache: this.get('cache')
    })

    emitter.emit('panel.trash.update', this.getPlans().filter(plan => plan.deleted))

    $tasksTrash = this.$panelTrash.tasks
    $tasksTodo = elements.tasksTodo
    $tasksDoing = elements.tasksDoing
    $tasksChecking = elements.tasksChecking
    $tasksDone = elements.tasksDone

    this.$dragula = dragula([
      $tasksTrash,
      $tasksTodo,
      $tasksDoing,
      $tasksChecking,
      $tasksDone
    ])

    return this
  }

  render () {
    let todoPlans = this.getTodoPlans()
    let doingPlans = this.getDoingPlans()
    let checkingPlans = this.getCheckingPlans()
    let donePlans = this.getDonePlans()

    addClass(document.body, THEMES[this.get('theme')].theme)

    this.$panelSetting.render()

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  addEventListeners () {
    let elements = this.getEls()
    let $wrap = elements.wrap

    // ---------- toolbar ----------
    // 添加
    on($wrap, '.toolbar-plus', 'click', this._onPlusButtonClick, this)
    // 过滤任务级别
    on($wrap, '.toolbar-inbox', 'click', this._onInBoxFilterButtonClick, this)
    on($wrap, '.toolbar-spades', 'click', this._onSpadesFilterButtonClick, this)
    on($wrap, '.toolbar-heart', 'click', this._onHeartFilterButtonClick, this)
    on($wrap, '.toolbar-clubs', 'click', this._onClubsFilterButtonClick, this)
    on($wrap, '.toolbar-diamonds', 'click', this._onDiamondsFilterButtonClick, this)
    // 重要任务
    on($wrap, '.toolbar-bookmark', 'click', this._onBookmarkFilterButtonClick, this)
    // 回收站
    on($wrap, '.toolbar-trash', 'click', this._onTrashButtonClick, this)
    // 设置
    on($wrap, '.toolbar-setting', 'click', this._onSettingButtonClick, this)

    this.$panelTrash.addEventListeners()
    this.$panelSetting.addEventListeners()

    // ---------- task ----------
    on($wrap, '.task-title', 'click', this._onTaskTitleClick, this)
    // 切换状态
    on($wrap, '.task-prev', 'click', this._onPrevButtonClick, this)
    on($wrap, '.task-next', 'click', this._onNextButtonClick, this)
    // 编辑
    on($wrap, '.task-edit', 'click', this._onEditButtonClick, this)
    // 标记重要
    on($wrap, '.task-bookmark', 'click', this._onMarkedButtonClick, this)
    // 删除
    on($wrap, '.task-delete', 'click', this._onDeleteButtonClick, this)
    // 恢复
    on($wrap, '.task-replace', 'click', this._onReplaceButtonClick, this)

    // ---------- column ----------
    on($wrap, '.column-up', 'click', this._onColumnUpButtonClick, this)
    on($wrap, '.column-down', 'click', this._onColumnDownButtonClick, this)
    on($wrap, '.columns-overlay', 'click', this._onColumnsOverlayClick, this)

    // 拖动完成，更新任务状态
    this.$dragula.on('drop', ($plan, $target, $source) => {
      this.drop($plan, $target, $source)
    })

    return this
  }

  reload (options) {
    this.destroy()
        .initialize(options)
        .render()
        .addEventListeners()
  }

  destroy () {
    this.removeEventListeners()
        .reset()
        .empty()

    this.$dragula.destroy()
    this.$dragula = null

    return this
  }

  removeEventListeners () {
    let $wrap = this.getEls().wrap

    // ---------- toolbar ----------
    off($wrap, 'click', this._onPlusButtonClick)
    off($wrap, 'click', this._onInBoxFilterButtonClick)
    off($wrap, 'click', this._onSpadesFilterButtonClick)
    off($wrap, 'click', this._onHeartFilterButtonClick)
    off($wrap, 'click', this._onClubsFilterButtonClick)
    off($wrap, 'click', this._onDiamondsFilterButtonClick)
    off($wrap, 'click', this._onBookmarkFilterButtonClick)
    off($wrap, 'click', this._onTrashButtonClick)
    off($wrap, 'click', this._onSettingButtonClick)

    // ---------- task ----------
    off($wrap, 'click', this._onTaskTitleClick)
    off($wrap, 'click', this._onPrevButtonClick)
    off($wrap, 'click', this._onEditButtonClick)
    off($wrap, 'click', this._onMarkedButtonClick)
    off($wrap, 'click', this._onDeleteButtonClick)
    off($wrap, 'click', this._onReplaceButtonClick)
    off($wrap, 'click', this._onNextButtonClick)

    // ---------- column ----------
    off($wrap, 'click', this._onColumnUpButtonClick)
    off($wrap, 'click', this._onColumnDownButtonClick)
    off($wrap, 'click', this._onColumnsOverlayClick)

    return this
  }

  add (plan) {
    let elements = this.getEls()
    let $tasks = elements.tasksTodo
    let $count = elements.todoCount
    let plans = clone(this.getPlans())
    let status = plan.status
    let filter = this.getFilter()

    plan.delayed = isDelayed(plan)
    plans.push(plan)
    this.setPlans(plans)

    if ((status !== 'marked' && isLevelSaveAsFilter(plan.level, filter)) || filter === 'inbox') {
      $count.innerHTML = parseInt($count.innerHTML, 10) + 1
      $tasks.appendChild(createTaskElement(plan))
    }

    return this
  }

  remove (plan) {
    let status = plan.status
    let elements = this.getEls()
    let $tasksTrash = elements.tasksTrash
    let $tasks = this.getStatusTasksEl(status)
    let $count = this.getStatusCountEl(status)

    plan.deleted = true
    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.remove.code,
      operate: OPERATIONS.remove.text
    })
    this.setPlan(plan)

    updateStatusChangedCount($count, elements.trashCount)

    $tasks.removeChild($tasks.querySelector(`div.task[data-id="${plan.id}"]`))
    $tasksTrash.appendChild(createTaskElement(plan))

    return this
  }

  update (plan) {
    let filter = this.getFilter()
    let todoPlans
    let doingPlans
    let checkingPlans
    let donePlans

    plan.delayed = isDelayed(plan)
    this.setPlan(plan)

    todoPlans = this.filterPlans(filter, 0)
    doingPlans = this.filterPlans(filter, 1)
    checkingPlans = this.filterPlans(filter, 2)
    donePlans = this.filterPlans(filter, 3)

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  delete (plan) {
    let plans = clone(this.getPlans())
    let elements = this.getEls()
    let $tasksTrash = elements.tasksTrash
    let $count = elements.trashCount
    let index = -1
    let $plan
    let count

    plans.forEach((task, i) => {
      if (plan.id === task.id) {
        index = i
      }
    })

    if (index === -1) {
      return this
    }

    plans.splice(index, 1)
    this.setPlans(plans)

    count = parseInt($count.innerHTML, 10)
    count -= 1

    $plan = $tasksTrash.querySelector(`div.task[data-id="${plan.id}"]`)
    $tasksTrash.removeChild($plan)
    $count.innerHTML = count

    return this
  }

  // confirm (plan) {
  //   this.setEditPlan(plan)
  //
  //   this.$confirm.open()
  //
  //   return this
  // }

  reset () {
    this.attributes = {
      template: 0,
      theme: 0,
      cache: 0,
      plans: []
    }

    this.elements = {
      wrap: null,
      toolbar: null,
      viewPanel: null,
      addPanel: null,
      editPanel: null,
      trashPanel: null,
      settingPanel: null,
      todoCount: null,
      tasksTodo: null,
      doingCount: null,
      tasksDoing: null,
      checkingCount: null,
      tasksChecking: null,
      doneCount: null,
      tasksDone: null,
      trashCount: null,
      tasksTrash: null,
      columns: null,
      columnsOverlay: null
    }

    this.data = {
      plans: [],
      filter: 'inbox',
      editPlan: null
    }

    return this
  }

  empty () {
    // this.emptyAddPanel()
    //     .emptyEditPanel()
    //     .emptyTrashPanel()
    //     .emptyViewPanel()
    //     .emptyColumns()

    return this
  }

  get (prop) {
    return this.attributes[prop]
  }

  set (options) {
    assign(this.attributes, options)

    return this
  }

  getPlan (id) {
    return this.getPlans().filter((plan) => {
      return plan.id === id
    })[0]
  }

  setPlan (plan) {
    let plans = clone(this.getPlans())
    let index = -1

    // 查询是否存在
    plans.forEach((task, i) => {
      if (task.id === plan.id) {
        index = i
      }
    })

    // 如果存在，则更新数据
    if (index > -1) {
      plans[index] = plan
      this.setPlans(plans)
    }

    return this
  }

  getEditPlan () {
    return this.data.editPlan
  }

  setEditPlan (plan) {
    this.data.editPlan = plan

    return this
  }

  getPlans () {
    return this.data.plans
  }

  setPlans (plans) {
    this.data.plans = plans

    if (this.get('cache') === 1) {
      localStorage.setItem('plan.plans', JSON.stringify(this.data.plans))
    } else {
      localStorage.removeItem('plan.plans')
    }

    return this
  }

  getFilter () {
    return this.data.filter
  }

  setFilter (prop) {
    this.data.filter = prop

    return this
  }

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
  }

  getTodoPlans () {
    return this.filterPlans('inbox', 0)
  }

  getDoingPlans () {
    return this.filterPlans('inbox', 1)
  }

  getCheckingPlans () {
    return this.filterPlans('inbox', 2)
  }

  getDonePlans () {
    return this.filterPlans('inbox', 3)
  }

  getMarkedPlans () {
    return this.filterPlans('marked')
  }

  getTrashPlans () {
    return this.filterPlans('deleted')
  }

  getEls () {
    return this.elements
  }

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
      case 'deleted':
        $count = elements.trashCount
        break
    }

    return $count
  }

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
      case 'deleted':
        $tasks = elements.tasksTrash
        break
    }

    return $tasks
  }

  queryElements () {
    let elements = this.getEls()

    elements.wrap = document.querySelector('#plan')

    elements.toolbar = document.querySelector('#toolbar')

    elements.todoCount = document.querySelector('#todo-count')
    elements.tasksTodo = document.querySelector('#tasks-todo')

    elements.doingCount = document.querySelector('#doing-count')
    elements.tasksDoing = document.querySelector('#tasks-doing')

    elements.checkingCount = document.querySelector('#checking-count')
    elements.tasksChecking = document.querySelector('#tasks-checking')

    elements.doneCount = document.querySelector('#done-count')
    elements.tasksDone = document.querySelector('#tasks-done')

    elements.columns = document.querySelector('#columns')
    elements.columnsOverlay = document.querySelector('#columns-overlay')

    return this
  }

  checkFilter ($button) {
    const CLS_ACTIVE = 'toolbar-active'
    let prop = $button.getAttribute('data-filter')
    let $toolbar = this.getEls().toolbar
    let $active
    let todoPlans
    let doingPlans
    let checkingPlans
    let donePlans

    if (hasClass($button, CLS_ACTIVE)) {
      return this
    }

    $active = $toolbar.querySelector('.' + CLS_ACTIVE)

    removeClass($active, CLS_ACTIVE)
    addClass($button, CLS_ACTIVE)

    todoPlans = this.filterPlans(prop, 0)
    doingPlans = this.filterPlans(prop, 1)
    checkingPlans = this.filterPlans(prop, 2)
    donePlans = this.filterPlans(prop, 3)

    this.setFilter(prop)
        .updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  checkTitle ($title) {
    let id = $title.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    if (plan.deleted) {
      return this
    }

    this.setEditPlan(plan)
        .openViewPanel()

    return this
  }

  checkChangeStatus ($button, direction) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let status = plan.status
    let $sourceCount = this.getStatusCountEl(status)
    let $sourceTasks = this.getStatusTasksEl(status)
    let $plan = $sourceTasks.querySelector(`div.task[data-id="${id}"]`)
    let $targetCount
    let $targetTasks

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

    $targetCount = this.getStatusCountEl(plan.status)
    $targetTasks = this.getStatusTasksEl(plan.status)

    updateStatusChangedCount($sourceCount, $targetCount)

    $sourceTasks.removeChild($plan)
    $targetTasks.appendChild(createTaskElement(plan))

    return this
  }

  checkEdit ($button) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.setEditPlan(plan)
        .openEditPanel()

    return this
  }

  checkBookmark ($button) {
    const CLS_MARKED = 'task-marked'
    let id = parseInt($button.getAttribute('data-id'), 10)
    let plan = this.getPlan(id)
    let filter = this.getFilter()
    let status = plan.status
    let elements = this.getEls()
    let selector = `div.task[data-id="${id}"]`
    let $plan

    plan.marked = !plan.marked
    plan.update.unshift({
      time: getMoments(),
      code: plan.marked ? OPERATIONS.mark.code : OPERATIONS.unmark.code,
      operate: plan.marked ? OPERATIONS.mark.text : OPERATIONS.unmark.text,
    })
    this.setPlan(plan)

    switch (status) {
      case 0:
        $plan = elements.tasksTodo.querySelector(selector)
        break
      case 1:
        $plan = elements.tasksDoing.querySelector(selector)
        break
      case 2:
        $plan = elements.tasksChecking.querySelector(selector)
        break
      case 3:
        $plan = elements.tasksDone.querySelector(selector)
        break
    }

    if (filter === 'marked') {
      this.updateColumn(status, this.filterPlans(status, 'marked'))
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
  }


  checkColumnUp ($button) {
    const CLS_HIDDEN = 'hidden'
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $down = $button.parentNode.querySelector('.column-down')
    let $tasks = this.getStatusTasksEl(status)

    addClass($button, CLS_HIDDEN)
    removeClass($down, CLS_HIDDEN)
    addClass($tasks, 'tasks-min')

    return this
  }

  checkColumnDown ($button) {
    const CLS_HIDDEN = 'hidden'
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $up = $button.parentNode.querySelector('.column-up')
    let $tasks = this.getStatusTasksEl(status)

    addClass($button, CLS_HIDDEN)
    removeClass($up, CLS_HIDDEN)
    removeClass($tasks, 'tasks-min')

    return this
  }

  drop ($plan, $target, $source) {
    let filter = this.getFilter()
    let id = $plan.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let sourceStatus = $source.getAttribute('data-status')
    let targetStatus = $target.getAttribute('data-status')
    let $sourceCount = this.getStatusCountEl(sourceStatus)
    let $targetCount = this.getStatusCountEl(targetStatus)
    let code
    let text

    if (targetStatus === sourceStatus) {
      return this
    }

    // 移动到回收站
    if (targetStatus === 'deleted') {
      plan.deleted = true
      code = OPERATIONS.remove.code
      text = OPERATIONS.remove.text
    } else {
      // 从回收站移出来
      if (sourceStatus === 'deleted') {
        code = OPERATIONS.replace.text
        text = OPERATIONS.replace.text

        // 根据过滤器，更新相应的属性
        switch (filter) {
          case 'marked':
            plan.marked = true
            break
          case 'spades':
            plan.level = 0
            break
          case 'heart':
            plan.level = 1
            break
          case 'clubs':
            plan.level = 2
            break
          case 'diamonds':
            plan.level = 3
            break
        }

        plan.deleted = false
        plan.status = parseInt(targetStatus, 10)
      } else {
        code = OPERATIONS.status.text
        text = OPERATIONS.status.text

        plan.status = parseInt(targetStatus, 10)
      }
    }

    plan.update.unshift({
      time: getMoments(),
      code: code,
      operate: text
    })
    plan.delayed = isDelayed(plan)
    this.setPlan(plan)

    updateStatusChangedCount($sourceCount, $targetCount)

    if (plan.deleted) {
      addClass($plan, 'task-deleted')
      $plan.setAttribute('data-deleted', '1')
    } else {
      removeClass($plan, 'task-deleted')
      $plan.setAttribute('data-deleted', '0')

      replaceClass($plan, 'task-status-' + plan.status, 'task-status-' + sourceStatus)
      $plan.setAttribute('data-status', plan.status)
    }

    if (plan.marked) {
      addClass($plan, 'task-marked')
      $plan.setAttribute('data-marked', '1')
    } else {
      removeClass($plan, 'task-marked')
      $plan.setAttribute('data-marked', '0')
    }

    if (plan.delayed) {
      addClass($plan, 'task-delayed')
      $plan.setAttribute('data-delay', '1')
    } else {
      removeClass($plan, 'task-delayed')
      $plan.setAttribute('data-delay', '0')
    }

    return this
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  updateColumns (todoPlans, doingPlans, checkingPlans, donePlans) {
    this.updateTodoColumn(todoPlans)
        .updateDoingColumn(doingPlans)
        .updateCheckingColumn(checkingPlans)
        .updateDoneColumn(donePlans)

    return this
  }

  emptyTodoColumn () {
    let elements = this.getEls()

    elements.todoCount = 0
    elements.tasksTodo.innerHTML = ''

    return this
  }

  emptyDoingColumn () {
    let elements = this.getEls()

    elements.doingCount = 0
    elements.tasksDoing.innerHTML = ''

    return this
  }

  emptyCheckingColumn () {
    let elements = this.getEls()

    elements.checkCount = 0
    elements.tasksChecking.innerHTML = ''

    return this
  }

  emptyDoneColumn () {
    let elements = this.getEls()

    elements.doneCount = 0
    elements.tasksDone.innerHTML = ''

    return this
  }

  emptyColumns () {
    this.emptyTodoColumn()
        .emptyDoingColumn()
        .emptyCheckingColumn()
        .emptyDoneColumn()

    return this
  }

  emptyPanel () {


    return this
  }


  closePanel () {


    return this
  }

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
  }

  _onPlusButtonClick () {
    // this.toggleAddPanel()

    return this
  }

  _onInBoxFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onSpadesFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onHeartFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onClubsFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onDiamondsFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onBookmarkFilterButtonClick (evt) {
    this.closePanel()
        .checkFilter(evt.delegateTarget)

    return this
  }

  _onTrashButtonClick () {
    emitter.emit('panel.trash.toggle')

    return this
  }

  _onSettingButtonClick () {
    emitter.emit('panel.setting.toggle')

    return this
  }

  _onTaskTitleClick (evt) {
    this.checkTitle(evt.delegateTarget)

    return this
  }

  _onPrevButtonClick (evt) {
    this.checkChangeStatus(evt.delegateTarget, 'prev')

    return this
  }

  _onNextButtonClick (evt) {
    this.checkChangeStatus(evt.delegateTarget, 'next')

    return this
  }

  _onEditButtonClick (evt) {
    this.checkEdit(evt.delegateTarget)

    return this
  }

  _onMarkedButtonClick (evt) {
    this.checkBookmark(evt.delegateTarget)

    return this
  }

  // _onDeleteButtonClick (evt) {
  //   this.checkDelete(evt.delegateTarget)
  //
  //   return this
  // }
  //
  // _onReplaceButtonClick (evt) {
  //   this.checkReplace(evt.delegateTarget)
  //
  //   return this
  // }

  _onColumnsOverlayClick () {
    this.closePanel()

    return this
  }

  _onColumnUpButtonClick (evt) {
    this.checkColumnUp(evt.delegateTarget)

    return this
  }

  _onColumnDownButtonClick (evt) {
    this.checkColumnDown(evt.delegateTarget)

    return this
  }
}

export default PlanV2
