'use strict'

import DOM from './dom'
import Delegate from './delegate'
import Confirm from './confirm'
import Utils from './utils'
import dragula from 'dragula'

class Plan {
  constructor (options) {
    this.attributes = {
      plans: []
    }

    this.elements = {
      wrap: null,
      toolbar: null,
      addPanel: null,
      addCancel: null,
      addSave: null,
      columns: null,
      columnsOverlay: null,
      todoCount: null,
      tasksTodo: null,
      doingCount: null,
      tasksDoing: null,
      checkingCount: null,
      tasksChecking: null,
      doneCount: null,
      tasksDone: null,
      editPanel: null,
      editCancel: null,
      editSave: null,
      trashPanel: null,
      trashCancel: null,
      trashCount: null,
      tasksTrash: null
    }

    this.$confirm = null
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
        .setPlans(Utils.clone(this.get('plans')))

    $tasksTrash = elements.tasksTrash
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

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  addEventListeners () {
    let elements = this.getEls()
    let $wrap = elements.wrap

    // ---------- toolbar ----------
    // 添加
    Delegate.on($wrap, '.toolbar-plus-button', 'click', this._onPlusButtonClick, this)
    // 过滤任务
    Delegate.on($wrap, '.toolbar-inbox-button', 'click', this._onInBoxFilterButtonClick, this)
    Delegate.on($wrap, '.toolbar-spades-button', 'click', this._onSpadesFilterButtonClick, this)
    Delegate.on($wrap, '.toolbar-heart-button', 'click', this._onHeartFilterButtonClick, this)
    Delegate.on($wrap, '.toolbar-clubs-button', 'click', this._onClubsFilterButtonClick, this)
    Delegate.on($wrap, '.toolbar-diamonds-button', 'click', this._onDiamondsFilterButtonClick, this)
    Delegate.on($wrap, '.toolbar-bookmark-button', 'click', this._onBookmarkFilterButtonClick, this)
    // 回收站
    Delegate.on($wrap, '.toolbar-trash-button', 'click', this._onTrashButtonClick, this)

    // ---------- panel ----------
    // 新建任务 Panel
    Delegate.on($wrap, '.panel-add-cancel', 'click', this._onAddCancelButtonClick, this)
    Delegate.on($wrap, '.panel-add-save', 'click', this._onAddSaveButtonClick, this)
    Delegate.on($wrap, '.panel-add-level', 'click', this._onAddLevelButtonClick, this)
    // 编辑任务 Panel
    Delegate.on($wrap, '.panel-edit-cancel', 'click', this._onEditCancelButtonClick, this)
    Delegate.on($wrap, '.panel-edit-save', 'click', this._onEditSaveButtonClick, this)
    Delegate.on($wrap, '.panel-edit-level', 'click', this._onEditLevelButtonClick, this)
    // 回收站
    Delegate.on($wrap, '.panel-trash-cancel', 'click', this._onTrashCancelButtonClick, this)

    // ---------- task ----------
    // 切换状态
    Delegate.on($wrap, '.task-prev-button', 'click', this._onPrevButtonClick, this)
    Delegate.on($wrap, '.task-next-button', 'click', this._onNextButtonClick, this)
    // 编辑
    Delegate.on($wrap, '.task-edit-button', 'click', this._onEditButtonClick, this)
    // 标记重要
    Delegate.on($wrap, '.task-bookmark-button', 'click', this._onMarkedButtonClick, this)
    // 删除
    Delegate.on($wrap, '.task-delete-button', 'click', this._onDeleteButtonClick, this)
    // 恢复
    Delegate.on($wrap, '.task-replace-button', 'click', this._onReplaceButtonClick, this)

    // ---------- column ----------
    Delegate.on($wrap, '.column-up-button', 'click', this._onColumnUpButtonClick, this)
    Delegate.on($wrap, '.column-down-button', 'click', this._onColumnDownButtonClick, this)
    Delegate.on($wrap, '.columns-overlay', 'click', this._onColumnsOverlayClick, this)

    // 拖动完成，更新任务状态
    this.$dragula.on('drop', ($plan, $target) => {
      this.drop($plan, $target)
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

    this.$dragula.destroy()

    return this
  }

  removeEventListeners () {
    let $wrap = this.getEls().wrap

    // ---------- toolbar ----------
    Delegate.off($wrap, 'click', this._onPlusButtonClick)
    Delegate.off($wrap, 'click', this._onInBoxFilterButtonClick)
    Delegate.off($wrap, 'click', this._onSpadesFilterButtonClick)
    Delegate.off($wrap, 'click', this._onHeartFilterButtonClick)
    Delegate.off($wrap, 'click', this._onClubsFilterButtonClick)
    Delegate.off($wrap, 'click', this._onDiamondsFilterButtonClick)
    Delegate.off($wrap, 'click', this._onBookmarkFilterButtonClick)
    Delegate.off($wrap, 'click', this._onTrashButtonClick)

    // ---------- panel ----------
    Delegate.off($wrap, 'click', this._onAddCancelButtonClick)
    Delegate.off($wrap, 'click', this._onAddSaveButtonClick)
    Delegate.off($wrap, 'click', this._onAddLevelButtonClick)
    Delegate.off($wrap, 'click', this._onEditCancelButtonClick)
    Delegate.off($wrap, 'click', this._onEditSaveButtonClick)
    Delegate.off($wrap, 'click', this._onEditLevelButtonClick)
    Delegate.off($wrap, 'click', this._onTrashCancelButtonClick)

    // ---------- task ----------
    Delegate.off($wrap, 'click', this._onPrevButtonClick)
    Delegate.off($wrap, 'click', this._onEditButtonClick)
    Delegate.off($wrap, 'click', this._onMarkedButtonClick)
    Delegate.off($wrap, 'click', this._onDeleteButtonClick)
    Delegate.off($wrap, 'click', this._onReplaceButtonClick)
    Delegate.off($wrap, 'click', this._onNextButtonClick)

    // ---------- column ----------
    Delegate.off($wrap, 'click', this._onColumnUpButtonClick)
    Delegate.off($wrap, 'click', this._onColumnDownButtonClick)
    Delegate.off($wrap, 'click', this._onColumnsOverlayClick)

    return this
  }

  add (plan) {
    let plans = Utils.clone(this.getPlans())
    let filter = this.getFilter()
    let todoPlans
    let doingPlans
    let checkingPlans
    let donePlans

    plan.delayed = Plan.isDelayed(plan.deadline)
    plans.push(plan)
    this.setPlans(plans)

    todoPlans = this.filterPlans(filter, 0)
    doingPlans = this.filterPlans(filter, 1)
    checkingPlans = this.filterPlans(filter, 2)
    donePlans = this.filterPlans(filter, 3)

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  remove (plan) {
    let status = plan.status
    let $tasks = this.getStatusTasksEl(status)
    let $count = this.getStatusCountEl(status)
    let $plan
    let count

    plan.deleted = true
    plan.delayed = Plan.isDelayed(plan.deadline)
    plan.update = Utils.getMoments()
    this.setPlan(plan)

    count = parseInt($count.innerHTML, 10)
    count -= 1

    $plan = $tasks.querySelector(`div.task[data-id="${plan.id}"]`)
    $tasks.removeChild($plan)
    $count.innerHTML = count

    return this
  }

  update (plan) {
    let filter = this.getFilter()
    let todoPlans
    let doingPlans
    let checkingPlans
    let donePlans

    plan.delayed = Plan.isDelayed(plan.deadline)
    plan.update = Utils.getMoments()
    this.setPlan(plan)

    todoPlans = this.filterPlans(filter, 0)
    doingPlans = this.filterPlans(filter, 1)
    checkingPlans = this.filterPlans(filter, 2)
    donePlans = this.filterPlans(filter, 3)

    this.updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  delete (plan) {
    let plans = Utils.clone(this.getPlans())
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

  confirm (plan) {
    this.setEditPlan(plan)

    this.$confirm.open()

    return this
  }

  reset () {
    this.emptyAddPanel()
        .emptyEditPanel()
        .emptyTrashPanel()
        .emptyColumns()

    this.attributes = {
      plans: []
    }

    this.elements = {
      wrap: null,
      toolbar: null,
      addPanel: null,
      trashPanel: null,
      editPanel: null,
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

  get (prop) {
    return this.attributes[prop]
  }

  set (options) {
    Object.assign(this.attributes, options)

    return this
  }

  getPlan (id) {
    return this.getPlans().filter((plan) => {
      return plan.id === id
    })[0]
  }

  setPlan (plan) {
    let plans = Utils.clone(this.getPlans())
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
    let plans = []

    switch (prop) {
      case 'spades':
        plans = this.getPlans().filter((plan) => {
          return plan.status === status && plan.level === 0 && !plan.deleted
        })

        break
      case 'heart':
        plans = this.getPlans().filter((plan) => {
          return plan.status === status && plan.level === 1 && !plan.deleted
        })

        break
      case 'clubs':
        plans = this.getPlans().filter((plan) => {
          return plan.status === status && plan.level === 2 && !plan.deleted
        })

        break
      case 'diamonds':
        plans = this.getPlans().filter((plan) => {
          return plan.status === status && plan.level === 3 && !plan.deleted
        })

        break
      case 'marked':
        plans = this.getPlans().filter((plan) => {
          return plan.status === status && plan.marked && !plan.deleted
        })

        break
      case 'deleted':
        plans = this.getPlans().filter((plan) => {
          return plan.deleted
        })

        break
      default:
        plans = this.getPlans().filter((plan) => {
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
      case 0:
        $count = elements.todoCount
        break
      case 1:
        $count = elements.doingCount
        break
      case 2:
        $count = elements.checkingCount
        break
      case 3:
        $count = elements.doneCount
        break
    }

    return $count
  }

  getStatusTasksEl (status) {
    let elements = this.getEls()
    let $tasks

    switch (status) {
      case 0:
        $tasks = elements.tasksTodo
        break
      case 1:
        $tasks = elements.tasksDoing
        break
      case 2:
        $tasks = elements.tasksChecking
        break
      case 3:
        $tasks = elements.tasksDone
        break
    }

    return $tasks
  }

  queryElements () {
    let elements = this.getEls()

    elements.wrap = document.querySelector('#plan')

    elements.toolbar = document.querySelector('#toolbar')

    elements.addPanel = document.querySelector('#add-panel')
    elements.editPanel = document.querySelector('#edit-panel')
    elements.trashPanel = document.querySelector('#trash-panel')

    elements.todoCount = document.querySelector('#todo-count')
    elements.tasksTodo = document.querySelector('#tasks-todo')

    elements.doingCount = document.querySelector('#doing-count')
    elements.tasksDoing = document.querySelector('#tasks-doing')

    elements.checkingCount = document.querySelector('#checking-count')
    elements.tasksChecking = document.querySelector('#tasks-checking')

    elements.doneCount = document.querySelector('#done-count')
    elements.tasksDone = document.querySelector('#tasks-done')

    elements.trashCount = document.querySelector('#trash-count')
    elements.tasksTrash = document.querySelector('#tasks-trash')

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

    if (DOM.hasClass($button, CLS_ACTIVE)) {
      return this
    }

    $active = $toolbar.querySelector('.' + CLS_ACTIVE)

    DOM.removeClass($active, CLS_ACTIVE)
    DOM.addClass($button, CLS_ACTIVE)

    todoPlans = this.filterPlans(prop, 0)
    doingPlans = this.filterPlans(prop, 1)
    checkingPlans = this.filterPlans(prop, 2)
    donePlans = this.filterPlans(prop, 3)

    this.setFilter(prop)
        .updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  checkLevel ($button) {
    const CLS_CHECKED = 'field-level-checked'
    let id = $button.getAttribute('data-level')
    let type = $button.getAttribute('data-type')
    let elements = this.getEls()
    let $panel = type === 'add' ? elements.addPanel : elements.editPanel
    let $checked
    let $input

    if (DOM.hasClass($button, CLS_CHECKED)) {
      return this
    }

    $input = $panel.querySelector(`#${type}-level`)
    $checked = $panel.querySelector('.' + CLS_CHECKED)

    if ($checked) {
      DOM.removeClass($checked, CLS_CHECKED)
    }
    DOM.addClass($button, CLS_CHECKED)

    $input.value = id

    return this
  }

  checkPrevStage ($button) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let status = parseInt(plan.status, 10)
    let $sourceCount = this.getStatusCountEl(status)
    let $sourceTasks = this.getStatusTasksEl(status)
    let $plan = $sourceTasks.querySelector(`div.task[data-id="${id}"]`)
    let $targetCount
    let $targetTasks
    let sourceCount
    let targetCount

    plan.status -= 1

    if (plan.status < 0) {
      plan.status = 0
    }

    plan.delayed = Plan.isDelayed(plan.deadline)
    plan.update = Utils.getMoments()
    this.setPlan(plan)

    $targetCount = this.getStatusCountEl(plan.status)
    $targetTasks = this.getStatusTasksEl(plan.status)

    sourceCount = parseInt($sourceCount.innerHTML, 10)
    sourceCount -= 1

    targetCount = parseInt($targetCount.innerHTML, 10)
    targetCount += 1

    $sourceCount.innerHTML = sourceCount
    $sourceTasks.removeChild($plan)

    $targetCount.innerHTML = targetCount
    $targetTasks.appendChild(Plan.getTaskElement(plan))

    return this
  }

  checkNextStage ($button) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let status = parseInt(plan.status, 10)
    let $sourceCount = this.getStatusCountEl(status)
    let $sourceTasks = this.getStatusTasksEl(status)
    let $plan = $sourceTasks.querySelector(`div.task[data-id="${id}"]`)
    let $targetCount
    let $targetTasks
    let sourceCount
    let targetCount

    plan.status += 1

    if (plan.status > 3) {
      plan.status = 3
    }

    plan.delayed = Plan.isDelayed(plan.deadline)
    plan.update = Utils.getMoments()
    this.setPlan(plan)

    $targetCount = this.getStatusCountEl(plan.status)
    $targetTasks = this.getStatusTasksEl(plan.status)

    sourceCount = parseInt($sourceCount.innerHTML, 10)
    sourceCount -= 1

    targetCount = parseInt($targetCount.innerHTML, 10)
    targetCount += 1

    $sourceCount.innerHTML = sourceCount
    $sourceTasks.removeChild($plan)

    $targetCount.innerHTML = targetCount
    $targetTasks.appendChild(Plan.getTaskElement(plan))

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
    plan.update = Utils.getMoments()
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
        DOM.addClass($plan, CLS_MARKED)
        $plan.setAttribute('data-marked', '1')
      } else {
        DOM.removeClass($plan, CLS_MARKED)
        $plan.setAttribute('data-marked', '0')
      }
    }

    return this
  }

  checkDelete ($button) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let isDeleted = plan.deleted

    this.$confirm = new Confirm({
      title: '确定删除任务吗？',
      message: isDeleted ? '任务将被彻底删除，无法恢复' : '任务将转移到垃圾箱，可以恢复',
      cancelText: '取消',
      enterText: '删除',
      afterEnter: () => {
        let plan = this.getEditPlan()

        if (isDeleted) {
          this.delete(plan)
        } else {
          this.remove(plan)
        }

        this.$confirm.destroy()
      }
    })

    this.confirm(plan)

    return this
  }

  checkReplace ($button) {
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let elements = this.getEls()
    let $tasksTrash = elements.tasksTrash
    let $trashCount = elements.trashCount
    let $plan = $tasksTrash.querySelector(`[data-id="${id}"]`)
    let count

    plan.deleted = false
    this.update(plan)

    $tasksTrash.removeChild($plan)
    count = parseInt($trashCount.innerHTML, 10)
    count -= 1
    $trashCount.innerHTML = count

    return this
  }

  checkColumnUp ($button) {
    const CLS_HIDDEN = 'hidden'
    const addClass = DOM.addClass
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $down = $button.parentNode.querySelector('.column-down-button')
    let $tasks = this.getStatusTasksEl(status)

    addClass($button, CLS_HIDDEN)
    DOM.removeClass($down, CLS_HIDDEN)
    addClass($tasks, 'tasks-min')

    return this
  }

  checkColumnDown ($button) {
    const CLS_HIDDEN = 'hidden'
    const removeClass = DOM.removeClass
    let status = parseInt($button.getAttribute('data-status'), 10)
    let $up = $button.parentNode.querySelector('.column-up-button')
    let $tasks = this.getStatusTasksEl(status)

    DOM.addClass($button, CLS_HIDDEN)
    removeClass($up, CLS_HIDDEN)
    removeClass($tasks, 'tasks-min')

    return this
  }

  drop ($plan, $column) {
    const updateCount = ($sourceCount, $targetCount) => {
      let sourceCount = parseInt($sourceCount.innerHTML, 10)
      let targetCount = parseInt($targetCount.innerHTML, 10)

      sourceCount -= 1
      $sourceCount.innerHTML = sourceCount

      targetCount += 1
      $targetCount.innerHTML = targetCount
    }
    let filter = this.getFilter()
    let id = $plan.getAttribute('data-id')
    let status = $column.getAttribute('data-status')
    let plan = this.getPlan(parseInt(id, 10))
    let elements = this.getEls()
    let $header
    let $level
    let $sourceCount
    let $targetCount

    // 移动到回收站
    if (status === 'deleted') {
      $sourceCount = this.getStatusCountEl(plan.status)
      $targetCount = elements.trashCount

      updateCount($sourceCount, $targetCount)

      plan.deleted = true
    } else {
      // 从回收站移出来
      if (plan.deleted) {
        // 根据过滤器，更新相应的属性
        switch (filter) {
          case 'marked':
            plan.marked = true
            break
          case 'spades':
            plan.level = 0
            $level = $plan.querySelector('.task-level')
            break
          case 'heart':
            plan.level = 1
            $level = $plan.querySelector('.task-level')
            break
          case 'clubs':
            plan.level = 2
            $level = $plan.querySelector('.task-level')
            break
          case 'diamonds':
            plan.level = 3
            $level = $plan.querySelector('.task-level')
            break
        }

        if ($level) {
          $header = $plan.querySelector('.task-hd')
          $header.replaceChild(Plan.getTaskLevelElement(plan), $level)
        }

        $sourceCount = elements.trashCount
        $targetCount = this.getStatusCountEl(parseInt(status, 10))

        DOM.removeClass($plan, 'task-status-' + plan.status)
        updateCount($sourceCount, $targetCount)

        plan.deleted = false
        plan.status = parseInt(status, 10)
      } else {
        $sourceCount = this.getStatusCountEl(plan.status)
        $targetCount = this.getStatusCountEl(parseInt(status, 10))

        DOM.removeClass($plan, 'task-status-' + plan.status)
        updateCount($sourceCount, $targetCount)

        // 普通状态之前的调整
        plan.status = parseInt(status, 10)
      }
    }

    plan.update = Utils.getMoments()
    plan.delayed = Plan.isDelayed(plan.deadline)
    this.setPlan(plan)

    if (plan.deleted) {
      $plan.setAttribute('data-deleted', '1')
      DOM.addClass($plan, 'task-deleted')
    } else {
      $plan.setAttribute('data-deleted', '0')
      DOM.removeClass($plan, 'task-deleted')
    }

    if (plan.marked) {
      $plan.setAttribute('data-marked', '1')
      DOM.addClass($plan, 'task-marked')
    } else {
      $plan.setAttribute('data-marked', '0')
      DOM.removeClass($plan, 'task-marked')
    }

    if (plan.delayed) {
      $plan.setAttribute('data-delayed', '1')
      DOM.addClass($plan, 'task-delayed')
    } else {
      $plan.setAttribute('data-delayed', '0')
      DOM.removeClass($plan, 'task-delayed')
    }

    $plan.setAttribute('data-status', plan.status.toString())
    DOM.addClass($plan, 'task-status-' + plan.status)

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

  emptyAddPanel () {
    const CLS_CHECKED = 'field-level-checked'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $title = $addPanel.querySelector('#add-title')
    let $deadline = $addPanel.querySelector('#add-deadline')
    let $consuming = $addPanel.querySelector('#add-consuming')
    let $level = $addPanel.querySelector('#add-level')
    let $desc = $addPanel.querySelector('#add-desc')
    let $checked = $addPanel.querySelector('.' + CLS_CHECKED)

    $title.value = ''
    $deadline.value = ''
    $consuming.value = ''
    $level.value = -1
    $desc.value = ''

    if ($checked) {
      DOM.removeClass($checked, CLS_CHECKED)
    }

    return this
  }

  emptyEditPanel () {
    const CLS_CHECKED = 'field-level-checked'
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $consuming = $editPanel.querySelector('#edit-consuming')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let $checked = $editPanel.querySelector('.' + CLS_CHECKED)

    $title.value = ''
    $deadline.value = ''
    $consuming.value = ''
    $level.value = -1
    $desc.value = ''

    if ($checked) {
      DOM.removeClass($checked, CLS_CHECKED)
    }

    return this
  }

  emptyTrashPanel () {
    let elements = this.getEls()
    let $trashCount = elements.trashCount
    let $tasksTrash = elements.tasksTrash

    $trashCount.innerHTML = 0
    $tasksTrash.innerHTML = ''

    return this
  }

  emptyPanel () {
    const CLS_ADD_OPENED = 'panel-add-opened'
    const CLS_EDIT_OPENED = 'panel-edit-opened'
    const CLS_TRASH_OPENED = 'panel-trash-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    if (DOM.hasClass($columns, CLS_ADD_OPENED)) {
      this.emptyAddPanel()
    }

    if (DOM.hasClass($columns, CLS_EDIT_OPENED)) {
      this.emptyEditPanel()
    }

    if (DOM.hasClass($columns, CLS_TRASH_OPENED)) {
      this.emptyTrashPanel()
    }

    return this
  }

  closeAddPanel () {
    const CLS_ADD_OPENED = 'panel-add-opened'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $columns = elements.columns

    DOM.removeClass($addPanel, CLS_ADD_OPENED)
    DOM.removeClass($columns, CLS_ADD_OPENED)

    this.emptyAddPanel()

    return this
  }

  openAddPanel () {
    const CLS_OPENED = 'panel-add-opened'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $columns = elements.columns

    this.closeEditPanel()
        .closeTrashPanel()

    DOM.addClass($addPanel, CLS_OPENED)
    DOM.addClass($columns, CLS_OPENED)

    return this
  }

  toggleAddPanel () {
    let elements = this.getEls()
    let $addPanel = elements.addPanel

    if (DOM.hasClass($addPanel, 'panel-add-opened')) {
      this.closeAddPanel()
    } else {
      this.openAddPanel()
    }

    return this
  }

  closeEditPanel () {
    const CLS_EDIT_OPENED = 'panel-edit-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    DOM.removeClass(elements.editPanel, CLS_EDIT_OPENED)
    DOM.removeClass($columns, CLS_EDIT_OPENED)

    this.emptyEditPanel()

    return this
  }

  openEditPanel () {
    const CLS_OPENED = 'panel-edit-opened'
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $columns = elements.columns

    this.closeAddPanel()
        .closeTrashPanel()
        .updateEditPanel()

    DOM.addClass($editPanel, CLS_OPENED)
    DOM.addClass($columns, CLS_OPENED)

    return this
  }

  updateEditPanel () {
    let plan = this.getEditPlan()
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $consuming = $editPanel.querySelector('#edit-consuming')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let $checked = $editPanel.querySelector(`[data-level="${plan.level}"]`)

    $title.value = plan.title
    $deadline.value = plan.deadline
    $consuming.value = plan.consuming
    $level.value = plan.level
    $desc.value = plan.desc

    if ($checked) {
      DOM.addClass($checked, 'field-level-checked')
    }

    return this
  }

  closeTrashPanel () {
    const CLS_TRASH_OPENED = 'panel-trash-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $trashPanel = elements.trashPanel
    let $trashButton = elements.toolbar.querySelector('.toolbar-trash-button')

    DOM.removeClass($trashButton, 'toolbar-active')
    DOM.removeClass($trashPanel, CLS_TRASH_OPENED)
    DOM.removeClass($columns, CLS_TRASH_OPENED)

    this.emptyTrashPanel()

    return this
  }

  openTrashPanel () {
    const CLS_TRASH_OPENED = 'panel-trash-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $trashPanel = elements.trashPanel
    let $trashButton = elements.toolbar.querySelector('.toolbar-trash-button')

    this.closeAddPanel()
        .closeEditPanel()
        .updateTrashPanel()

    DOM.addClass($trashButton, 'toolbar-active')
    DOM.addClass($trashPanel, CLS_TRASH_OPENED)
    DOM.addClass($columns, CLS_TRASH_OPENED)

    return this
  }

  updateTrashPanel () {
    let plans = this.getTrashPlans()
    let elements = this.getEls()
    let $taskTrash = elements.tasksTrash
    let $trashCount = elements.trashCount
    let $fragment = this._getTasksFragment(plans)

    $trashCount.innerHTML = plans.length
    $taskTrash.innerHTML = ''
    $taskTrash.appendChild($fragment)

    return this
  }

  toggleTrashPanel () {
    let elements = this.getEls()
    let $trashPanel = elements.trashPanel

    if (DOM.hasClass($trashPanel, 'panel-trash-opened')) {
      this.closeTrashPanel()
    } else {
      this.openTrashPanel()
    }

    return this
  }

  closePanel () {
    const CLS_ADD_OPENED = 'panel-add-opened'
    const CLS_EDIT_OPENED = 'panel-edit-opened'
    const CLS_TRASH_OPENED = 'panel-trash-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    if (DOM.hasClass($columns, CLS_ADD_OPENED)) {
      this.closeAddPanel()
    }

    if (DOM.hasClass($columns, CLS_EDIT_OPENED)) {
      this.closeEditPanel()
    }

    if (DOM.hasClass($columns, CLS_TRASH_OPENED)) {
      this.closeTrashPanel()
    }

    return this
  }

  _getTasksFragment (plans) {
    let $fragment = document.createDocumentFragment()

    if (plans.length < 1) {
      return $fragment
    }

    plans.forEach((plan) => {
      let $plan = Plan.getTaskElement(plan)

      $fragment.appendChild($plan)
    })

    return $fragment
  }

  _onPlusButtonClick () {
    this.toggleAddPanel()

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
    this.toggleTrashPanel()

    return this
  }

  _onAddCancelButtonClick () {
    this.closeAddPanel()

    return this
  }

  _onAddLevelButtonClick (evt) {
    this.checkLevel(evt.delegateTarget)

    return this
  }

  _onAddSaveButtonClick () {
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $title = $addPanel.querySelector('#add-title')
    let $deadline = $addPanel.querySelector('#add-deadline')
    let $consuming = $addPanel.querySelector('#add-consuming')
    let $level = $addPanel.querySelector('#add-level')
    let $desc = $addPanel.querySelector('#add-desc')
    let plan = {}
    let moments = Utils.getMoments()

    // TODO: 添加校验

    // 收集新任务的数据
    plan.id = parseInt(Plan.guid(4, 10), 10)
    plan.title = Utils.toSafeText($title.value)
    plan.deadline = $deadline.value
    plan.consuming = $consuming.value
    plan.level = parseInt($level.value, 10)
    plan.desc = Utils.toSafeText($desc.value)
    plan.marked = false
    plan.deleted = false
    plan.status = 0
    plan.create = moments
    plan.update = moments

    this.closeAddPanel().add(plan)

    return this
  }

  _onEditCancelButtonClick () {
    this.closeEditPanel()

    return this
  }

  _onEditLevelButtonClick (evt) {
    this.checkLevel(evt.delegateTarget)

    return this
  }

  _onEditSaveButtonClick () {
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $consuming = $editPanel.querySelector('#edit-consuming')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let originPlan = this.getEditPlan()
    let plan = Utils.clone(originPlan)

    // TODO: 添加校验

    // 收集新任务的数据
    plan.id = originPlan.id
    plan.title = $title.value
    plan.deadline = $deadline.value
    plan.consuming = $consuming.value
    plan.level = parseInt($level.value, 10)
    plan.desc = $desc.value
    plan.marked = originPlan.marked
    plan.deleted = originPlan.deleted
    plan.status = originPlan.status
    plan.create = originPlan.create

    this.closeEditPanel().update(plan)

    return this
  }

  _onTrashCancelButtonClick () {
    this.closeTrashPanel()

    return this
  }

  _onPrevButtonClick (evt) {
    this.checkPrevStage(evt.delegateTarget)

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

  _onDeleteButtonClick (evt) {
    this.checkDelete(evt.delegateTarget)

    return this
  }

  _onReplaceButtonClick (evt) {
    this.checkReplace(evt.delegateTarget)

    return this
  }

  _onNextButtonClick (evt) {
    this.checkNextStage(evt.delegateTarget)

    return this
  }

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

  static getTaskElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id
    let $prev = Plan.getTaskPrevElement(plan)
    let $next = Plan.getTaskNextElement(plan)
    let $edit = Plan.getTaskEditElement(plan)
    let $mark = Plan.getTaskMarkElement(plan)
    let $delete = Plan.getTasKDeleteElement(plan)
    let $replace = Plan.getTaskReplaceElement(plan)
    let $side = createElement('div', {
      'className': 'task-side'
    }, [
      $prev,
      $edit,
      $mark,
      $replace,
      $delete,
      $next
    ])
    let $level = Plan.getTaskLevelElement(plan)
    let $header = createElement('div', {
      'className': 'task-hd'
    }, [
      createElement('h3', {
        'className': 'task-title'
      }, [
        '任务：',
        createElement('strong', {
          'className': 'task-title-text'
        }, [
          `${plan.title}`
        ])
      ]),
      $level
    ])
    let $body = createElement('div', {
      'className': 'task-bd'
    }, [
      createElement('p', {
        'className': 'task-desc'
      }, [
        plan.desc
      ])
    ])
    let $deadline = createElement('div', {
      'className': 'task-deadline'
    }, [
      createElement('div', {
        'className': 'task-deadline-icon'
      }, [
        createElement('i', {
          'className': 'icon-calendar'
        })
      ]),
      createElement('p', {
        'className': 'task-deadline-text'
      }, [
        plan.deadline
      ])
    ])
    let $consuming = createElement('div', {
      'className': 'task-time-consuming'
    }, [
      createElement('div', {
        'className': 'task-time-consuming-icon'
      }, [
        createElement('i', {
          'className': 'icon-clock'
        })
      ]),
      createElement('p', {
        'className': 'task-time-consuming-text'
      }, [
        plan.consuming
      ])
    ])
    let $footer = createElement('div', {
      'className': 'task-ft'
    }, [
      $deadline,
      $consuming
    ])
    let $main = createElement('div', {
      'className': 'task-main'
    }, [
      $header,
      $body,
      $footer
    ])
    let classTask = 'task'

    if (plan.marked) {
      classTask += ' ' + 'task-marked'
    }

    if (plan.deleted) {
      classTask += ' ' + 'task-deleted'
    }

    if (plan.delayed) {
      classTask += ' ' + 'task-delayed'
    }

    classTask += ' ' + 'task-status-' + plan.status

    return createElement('div', {
      'id': `task-${id}`,
      'className': classTask,
      'data-id': `${id}`,
      'data-status': `${plan.status}`,
      'data-deleted': `${plan.deleted ? 1 : 0}`,
      'data-delayed': `${plan.delayed ? 1 : 0}`,
      'data-marked': `${plan.marked ? 1 : 0}`
    }, [
      $main,
      $side
    ])
  }

  static getTaskPrevElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-prev-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-cheveron-up'
      })
    ])
  }

  static getTaskEditElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-edit-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-edit-pencil'
      })
    ])
  }

  static getTaskMarkElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-bookmark-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-bookmark'
      })
    ])
  }

  static getTasKDeleteElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-delete-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-trash'
      })
    ])
  }

  static getTaskReplaceElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-replace-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-reload'
      })
    ])
  }

  static getTaskLevelElement (plan) {
    const createElement = DOM.createElement
    const LEVELS = [
      'spades',
      'heart',
      'clubs',
      'diamonds'
    ]
    let level = plan.level

    return createElement('div', {
      'className': `task-level task-level-${level}`
    }, [
      createElement('i', {
        'className': `icon-${LEVELS[level]}`
      })
    ])
  }

  static getTaskNextElement (plan) {
    const createElement = DOM.createElement
    let id = plan.id

    return createElement('div', {
      'className': 'task-button task-next-button',
      'data-id': `${id}`
    }, [
      createElement('i', {
        'className': 'icon-cheveron-down'
      })
    ])
  }

  static guid (len, radix) {
    let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
    let uuid = []
    let i

    radix = radix || chars.length

    if (len) {
      // Compact form
      for (i = 0; i < len; i++) {
        uuid[i] = chars[0 | Math.random() * radix]
      }
    } else {
      // rfc4122, version 4 form
      let r

      // rfc4122 requires these characters
      uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
      uuid[14] = '4'

      // Fill in random data.  At i==19 set the high bits of clock sequence as
      // per rfc4122, sec. 4.1.5
      for (i = 0; i < 36; i++) {
        if (!uuid[i]) {
          r = 0 | Math.random() * 16
          uuid[i] = chars[(i === 19) ? (r & 0x3) | 0x8 : r]
        }
      }
    }

    return uuid.join('')
  }

  static isDelayed (deadline) {
    return new Date().getTime() > new Date(deadline).getTime() > 0
  }
}

export default Plan
