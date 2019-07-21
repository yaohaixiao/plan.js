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
} from './task'

import {
  TEMPLATES,
  THEMES,
  STORAGE,
  OPERATIONS
} from './config'

import Calendar from './calendar'
import Confirm from './confirm'
import dragula from 'dragula'
import marked from 'marked'

class Plan {
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

    this.$calendar = null
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
        .setPlans(clone(this.get('plans')))

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

    addClass(document.body, THEMES[this.get('theme')].theme)

    this.updateSettingPanel()
        .updateColumns(todoPlans, doingPlans, checkingPlans, donePlans)

    return this
  }

  addEventListeners () {
    let elements = this.getEls()
    let $wrap = elements.wrap

    // ---------- toolbar ----------
    // 添加
    on($wrap, '.toolbar-plus', 'click', this._onPlusButtonClick, this)
    // 过滤任务
    on($wrap, '.toolbar-inbox', 'click', this._onInBoxFilterButtonClick, this)
    on($wrap, '.toolbar-spades', 'click', this._onSpadesFilterButtonClick, this)
    on($wrap, '.toolbar-heart', 'click', this._onHeartFilterButtonClick, this)
    on($wrap, '.toolbar-clubs', 'click', this._onClubsFilterButtonClick, this)
    on($wrap, '.toolbar-diamonds', 'click', this._onDiamondsFilterButtonClick, this)
    on($wrap, '.toolbar-bookmark', 'click', this._onBookmarkFilterButtonClick, this)
    // 回收站
    on($wrap, '.toolbar-trash', 'click', this._onTrashButtonClick, this)
    // 设置
    on($wrap, '.toolbar-setting', 'click', this._onSettingButtonClick, this)

    // ---------- panel ----------
    on($wrap, '.view-cancel', 'click', this._onViewCancelButtonClick, this)
    on($wrap, '.view-edit', 'click', this._onViewEditButtonClick, this)
    // 新建任务 Panel
    on($wrap, '.add-cancel', 'click', this._onAddCancelButtonClick, this)
    on($wrap, '.add-save', 'click', this._onAddSaveButtonClick, this)
    on($wrap, '.add-level', 'click', this._onAddLevelButtonClick, this)
    on($wrap, '.add-deadline', 'click', this._onAddDeadlineIconClick, this)
    // 编辑任务 Panel
    on($wrap, '.edit-cancel', 'click', this._onEditCancelButtonClick, this)
    on($wrap, '.edit-save', 'click', this._onEditSaveButtonClick, this)
    on($wrap, '.edit-level', 'click', this._onEditLevelButtonClick, this)
    on($wrap, '.edit-deadline', 'click', this._onEditDeadlineIconClick, this)
    // 回收站
    on($wrap, '.trash-cancel', 'click', this._onTrashCancelButtonClick, this)
    // 设置
    on($wrap, '.setting-cancel', 'click', this._onSettingCancelButtonClick, this)
    on($wrap, '.setting-template', 'click', this._onSettingTemplateClick, this)
    on($wrap, '.setting-theme', 'click', this._onSettingThemeClick, this)
    on($wrap, '.setting-cache', 'click', this._onSettingCacheClick, this)

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

    // ---------- panel ----------
    off($wrap, 'click', this._onViewCancelButtonClick)
    off($wrap, 'click', this._onViewEditButtonClick)
    off($wrap, 'click', this._onAddCancelButtonClick)
    off($wrap, 'click', this._onAddSaveButtonClick)
    off($wrap, 'click', this._onAddLevelButtonClick)
    off($wrap, 'click', this._onAddDeadlineIconClick)
    off($wrap, 'click', this._onEditCancelButtonClick)
    off($wrap, 'click', this._onEditSaveButtonClick)
    off($wrap, 'click', this._onEditLevelButtonClick)
    off($wrap, 'click', this._onEditDeadlineIconClick)
    off($wrap, 'click', this._onTrashCancelButtonClick)
    off($wrap, 'click', this._onSettingCancelButtonClick)
    off($wrap, 'click', this._onSettingTemplateClick)
    off($wrap, 'click', this._onSettingThemeClick)
    off($wrap, 'click', this._onSettingCacheClick)

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

    plan.delayed = Plan.isDelayed(plan)
    plans.push(plan)
    this.setPlans(plans)

    if ((status !== 'marked' && Plan.isLevelSaveAsFilter(plan.level, filter)) || filter === 'inbox') {
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
    plan.delayed = Plan.isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.remove.code,
      operate: OPERATIONS.remove.text
    })
    this.setPlan(plan)

    Plan.updateStatusChangedCount($count, elements.trashCount)

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

    plan.delayed = Plan.isDelayed(plan)
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

  confirm (plan) {
    this.setEditPlan(plan)

    this.$confirm.open()

    return this
  }

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
    this.emptyAddPanel()
        .emptyEditPanel()
        .emptyTrashPanel()
        .emptyViewPanel()
        .emptyColumns()

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

    elements.viewPanel = document.querySelector('#view-panel')
    elements.addPanel = document.querySelector('#add-panel')
    elements.editPanel = document.querySelector('#edit-panel')
    elements.trashPanel = document.querySelector('#trash-panel')
    elements.settingPanel = document.querySelector('#setting-panel')

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

  checkLevel ($button) {
    const CLS_CHECKED = 'field-level-checked'
    let id = $button.getAttribute('data-level')
    let type = $button.getAttribute('data-type')
    let elements = this.getEls()
    let $panel
    let $checked
    let $input

    if (hasClass($button, CLS_CHECKED)) {
      return this
    }

    switch (type) {
      case 'add':
        $panel = elements.addPanel
        $input = $panel.querySelector(`#${type}-level`)
        break
      case 'edit':
        $panel = elements.editPanel
        $input = $panel.querySelector(`#${type}-level`)
        break
    }

    $checked = $panel.querySelector('.' + CLS_CHECKED)

    if ($checked) {
      removeClass($checked, CLS_CHECKED)
    }
    addClass($button, CLS_CHECKED)

    if ($input) {
      $input.value = id
    }

    return this
  }

  checkTemplate ($button) {
    const CLS_OPTION_CHECKED = 'field-option-checked'
    let value = $button.getAttribute('data-template')
    let elements = this.getEls()
    let $templates = elements.settingPanel.querySelector('#setting-templates')
    let $checked = $templates.querySelector('.' + CLS_OPTION_CHECKED)
    let $input = $templates.querySelector('#setting-template')

    if (hasClass($button, CLS_OPTION_CHECKED)) {
      return this
    }

    $input.value = value
    if ($checked) {
      removeClass($checked, CLS_OPTION_CHECKED)
    }
    addClass($button, CLS_OPTION_CHECKED)

    this.set({
      template: parseInt(value, 10)
    })

    localStorage.setItem('plan.template', value)

    return this
  }

  checkTheme ($button) {
    const CLS_OPTION_CHECKED = 'field-option-checked'
    let value = $button.getAttribute('data-value')
    let elements = this.getEls()
    let $body = document.body
    let $themes = elements.settingPanel.querySelector('#setting-themes')
    let $checked = $themes.querySelector('.' + CLS_OPTION_CHECKED)
    let $input = $themes.querySelector('#setting-theme')

    if (hasClass($button, CLS_OPTION_CHECKED)) {
      return this
    }

    $input.value = value
    if ($checked) {
      removeClass($checked, CLS_OPTION_CHECKED)
    }
    addClass($button, CLS_OPTION_CHECKED)

    removeClass($body, THEMES[this.get('theme')].theme)
    addClass($body, THEMES[parseInt(value, 10)].theme)

    this.set({
      theme: parseInt(value, 10)
    })

    localStorage.setItem('plan.theme', value)

    return this
  }

  checkCache ($button) {
    const CLS_OPTION_CHECKED = 'panel-option-checked'
    const CLS_RADIO_CHECKED = 'field-radio-checked'
    let value = $button.getAttribute('data-cache')
    let elements = this.getEls()
    let $storage = elements.settingPanel.querySelector('#setting-storage')
    let $checkedOption = $storage.querySelector('.' + CLS_OPTION_CHECKED)
    let $radio = $button.querySelector('.field-radio')
    let $checkedRadio = $storage.querySelector('.' + CLS_RADIO_CHECKED)
    let $input = $storage.querySelector('#setting-cache')

    if (hasClass($button, CLS_OPTION_CHECKED)) {
      return this
    }

    $input.value = value
    if ($checkedOption) {
      removeClass($checkedOption, CLS_OPTION_CHECKED)
    }
    addClass($button, CLS_OPTION_CHECKED)
    if ($checkedRadio) {
      removeClass($checkedRadio, CLS_RADIO_CHECKED)
    }
    addClass($radio, CLS_RADIO_CHECKED)

    this.set({
      cache: parseInt(value, 10)
    })

    localStorage.setItem('plan.cache', value)

    if(parseInt(value, 10)===0){
      localStorage.removeItem('plan.plans')
    }

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

    plan.delayed = Plan.isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.status.code,
      operate: OPERATIONS.status.text
    })
    this.setPlan(plan)

    $targetCount = this.getStatusCountEl(plan.status)
    $targetTasks = this.getStatusTasksEl(plan.status)

    Plan.updateStatusChangedCount($sourceCount, $targetCount)

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
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.replace.code,
      operate: OPERATIONS.replace.text
    })
    this.update(plan)

    $tasksTrash.removeChild($plan)
    count = parseInt($trashCount.innerHTML, 10)
    count -= 1
    $trashCount.innerHTML = count

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
    plan.delayed = Plan.isDelayed(plan)
    this.setPlan(plan)

    Plan.updateStatusChangedCount($sourceCount, $targetCount)

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

  emptyViewPanel () {
    let elements = this.getEls()
    let $viewPanel = elements.viewPanel
    let $title = $viewPanel.querySelector('#view-title')
    let $create = $viewPanel.querySelector('#view-create')
    let $deadline = $viewPanel.querySelector('#view-deadline')
    let $estimate = $viewPanel.querySelector('#view-estimate')
    let $level = $viewPanel.querySelector('#view-level')
    let $desc = $viewPanel.querySelector('#view-desc')
    let $logs = $viewPanel.querySelector('#view-logs')

    $title.innerHTML = ''
    $create.innerHTML = ''
    $deadline.innerHTML = ''
    $estimate.innerHTML = ''
    $level.innerHTML = ''
    $desc.innerHTML = ''
    $logs.innerHTML = ''

    return this
  }

  emptyAddPanel () {
    const CLS_CHECKED = 'field-level-checked'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $title = $addPanel.querySelector('#add-title')
    let $create = $addPanel.querySelector('#add-create')
    let $deadline = $addPanel.querySelector('#add-deadline')
    let $estimate = $addPanel.querySelector('#add-estimate')
    let $level = $addPanel.querySelector('#add-level')
    let $desc = $addPanel.querySelector('#add-desc')
    let $checked = $addPanel.querySelector('.' + CLS_CHECKED)

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
  }

  emptyEditPanel () {
    const CLS_CHECKED = 'field-level-checked'
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $create = $editPanel.querySelector('#edit-create')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $estimate = $editPanel.querySelector('#edit-estimate')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let $checked = $editPanel.querySelector('.' + CLS_CHECKED)

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
    const CLS_VIEW_OPENED = 'panel-view-opened'
    const CLS_ADD_OPENED = 'panel-add-opened'
    const CLS_EDIT_OPENED = 'panel-edit-opened'
    const CLS_TRASH_OPENED = 'panel-trash-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    if (hasClass($columns, CLS_VIEW_OPENED)) {
      this.emptyViewPanel()
    }

    if (hasClass($columns, CLS_ADD_OPENED)) {
      this.emptyAddPanel()
    }

    if (hasClass($columns, CLS_EDIT_OPENED)) {
      this.emptyEditPanel()
    }

    if (hasClass($columns, CLS_TRASH_OPENED)) {
      this.emptyTrashPanel()
    }

    return this
  }

  closeSettingPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $settingButton = elements.toolbar.querySelector('.toolbar-setting')

    removeClass($settingButton, 'toolbar-active')
    removeClass(elements.settingPanel, CLS_OPENED)
    removeClass($columns, CLS_OPENED)

    return this
  }

  updateSettingPanel () {
    const SPACE = ' '
    const CLS_RADIOS_GROUP = 'field-radios-group'
    const CLS_RADIO = 'field-radio'
    const CLS_RADIO_CHECKED = 'field-radio-checked'
    const CLS_RADIO_ICON = 'field-radio-icon'
    const CLS_RADIO_LABEL = 'field-radio-label'
    const CLS_OPTION = 'field-option'
    const CLS_OPTION_CHECKED = 'field-option-checked'
    const CLS_FIELD_TEMPLATE = 'field-template'
    const CLS_FIELD_THEME = 'field-theme'
    const CLS_SETTING_TEMPLATE = 'setting-template'
    const CLS_SETTING_THEME = 'setting-theme'
    const CLS_SETTING_CACHE = 'setting-cache'
    let template = this.get('template')
    let theme = this.get('theme')
    let cache = this.get('cache')
    let $settingPanel = this.getEls().settingPanel
    let $templates = $settingPanel.querySelector('#setting-templates')
    let $themes = $settingPanel.querySelector('#setting-themes')
    let $storage = $settingPanel.querySelector('#setting-storage')
    let $template = createElement('input', {
      'type': 'hidden',
      'name': 'template',
      'id': 'setting-template',
      'value': this.get('template')
    })
    let $theme = createElement('input', {
      'type': 'hidden',
      'name': 'theme',
      'id': 'setting-theme',
      'value': this.get('theme')
    })
    let $cache = createElement('input', {
      'type': 'hidden',
      'name': 'cache',
      'id': 'setting-cache',
      'value': this.get('cache')
    })
    let $templatesGroup = createElement('div', {
      'className': 'field-templates'
    })
    let $themesGroup = createElement('div', {
      'className': 'field-themes'
    })
    let $storageGroup = createElement('div', {
      'className': CLS_RADIOS_GROUP
    })

    TEMPLATES.forEach((option) => {
      let clsTemplate = option.value === template ? CLS_OPTION + SPACE + CLS_OPTION_CHECKED + SPACE + CLS_FIELD_TEMPLATE + SPACE + CLS_SETTING_TEMPLATE : CLS_OPTION + SPACE + CLS_FIELD_TEMPLATE + SPACE + CLS_SETTING_TEMPLATE
      let $image = createElement('p', {
        'className': 'field-template-image',
        'data-template': option.value
      }, [
        createElement('img', {
          'alt': option.name,
          'src': option.image,
          'width': '130',
          'height': '51'
        })
      ])
      let $text = createElement('p', {
        'className': 'field-template-text',
        'data-template': option.value
      }, [
        option.name
      ])

      $templatesGroup.appendChild(createElement('div', {
        'className': clsTemplate,
        'data-template': option.value
      }, [
        $image,
        $text
      ]))
    })

    THEMES.forEach((option) => {
      let clsTheme = option.value === theme ? CLS_OPTION + SPACE + CLS_OPTION_CHECKED + SPACE + CLS_FIELD_THEME + SPACE + CLS_SETTING_THEME : CLS_OPTION + SPACE + CLS_FIELD_THEME + SPACE + CLS_SETTING_THEME
      let $color = createElement('div', {
        'className': 'field-theme-color' + SPACE + option.theme,
        'data-theme': option.theme,
        'data-value': option.value
      })
      let $text = createElement('p', {
        'className': 'field-theme-text',
        'data-theme': option.theme,
        'data-value': option.value
      }, [
        option.name
      ])

      $themesGroup.appendChild(createElement('div', {
        'className': clsTheme,
        'data-theme': option.theme,
        'data-value': option.value
      }, [
        $color,
        $text
      ]))
    })

    STORAGE.forEach((option) => {
      let clsOption = option.value === cache ? CLS_OPTION + SPACE + CLS_OPTION_CHECKED + SPACE + CLS_SETTING_CACHE : CLS_OPTION + SPACE + CLS_SETTING_CACHE
      let clsRadio = option.value === cache ? CLS_RADIO + SPACE + CLS_RADIO_CHECKED : CLS_RADIO
      let $radio = createElement('div', {
        'className': clsRadio,
        'data-cache': option.value
      }, [
        createElement('div', {
          'className': CLS_RADIO_ICON
        }, [
          createElement('i', {
            'className': 'icon-radio-unchecked'
          }),
          createElement('i', {
            'className': 'icon-radio-checked2'
          })
        ]),
        createElement('label', {
          'className': CLS_RADIO_LABEL
        }, [
          option.name
        ])
      ])
      let $cache = createElement('div', {
        'className': clsOption,
        'data-cache': option.value
      }, [
        $radio
      ])

      $storageGroup.appendChild($cache)
    })

    $templates.appendChild($templatesGroup)
    $templates.appendChild($template)
    $themes.appendChild($themesGroup)
    $themes.appendChild($theme)
    $storage.appendChild($storageGroup)
    $storage.appendChild($cache)

    return this
  }

  openSettingPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $settingButton = elements.toolbar.querySelector('.toolbar-setting')

    this.closeViewPanel()
        .closeAddPanel()
        .closeEditPanel()
        .closeTrashPanel()

    addClass($settingButton, 'toolbar-active')
    addClass(elements.settingPanel, CLS_OPENED)
    addClass($columns, CLS_OPENED)

    return this
  }

  toggleSettingPanel () {
    let elements = this.getEls()
    let $settingPanel = elements.settingPanel

    if (hasClass($settingPanel, 'panel-opened')) {
      this.closeSettingPanel()
    } else {
      this.openSettingPanel()
    }

    return this
  }

  closeViewPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    removeClass(elements.viewPanel, CLS_OPENED)
    removeClass($columns, CLS_OPENED)

    this.emptyViewPanel()

    return this
  }

  openViewPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $viewPanel = elements.viewPanel
    let $columns = elements.columns

    this.closeSettingPanel()
        .closeAddPanel()
        .closeEditPanel()
        .closeTrashPanel()
        .updateViewPanel()

    addClass($viewPanel, CLS_OPENED)
    addClass($columns, CLS_OPENED)

    return this
  }

  updateViewPanel () {
    const CLS_LEVEL = 'field-view-level field-level-icon field-level-checked'
    let elements = this.getEls()
    let plan = this.getEditPlan()
    let $viewPanel = elements.viewPanel
    let $title = $viewPanel.querySelector('#view-title')
    let $create = $viewPanel.querySelector('#view-create')
    let $deadline = $viewPanel.querySelector('#view-deadline')
    let $estimate = $viewPanel.querySelector('#view-estimate')
    let $level = $viewPanel.querySelector('#view-level')
    let $desc = $viewPanel.querySelector('#view-desc')
    let $logs = $viewPanel.querySelector('#view-logs')
    let $list = createElement('ol', {
      'className': 'panel-logs'
    })
    let $icon

    $title.innerHTML = plan.title
    $create.innerHTML = plan.create
    $deadline.innerHTML = plan.deadline
    $estimate.innerHTML = plan.estimate
    $desc.innerHTML = marked(plan.desc)

    switch (plan.level) {
      case 0:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-spades'
          })
        ])
        break
      case 1:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-heart'
          })
        ])
        break
      case 2:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-clubs'
          })
        ])
        break
      case 3:
        $icon = createElement('div', {
          'className': CLS_LEVEL
        }, [
          createElement('i', {
            'className': 'icon-diamonds'
          })
        ])
        break
    }

    $level.innerHTML = ''
    $level.appendChild($icon)

    plan.update.forEach(log => {
      let $operate = createElement('span', {
        'className': 'panel-log-operate'
      }, [
        log.operate
      ])
      let $time = createElement('span', {
        'className': 'panel-log-time'
      }, [
        format(log.time, 'MM-dd hh:mm')
      ])
      let $li = createElement('li', {
        'className': 'panel-log'
      }, [
        $operate,
        $time
      ])

      $list.appendChild($li)
    })

    $logs.appendChild($list)

    return this
  }

  closeAddPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $columns = elements.columns

    removeClass($addPanel, CLS_OPENED)
    removeClass($columns, CLS_OPENED)

    if (this.$calendar) {
      this.$calendar.destroy()
      this.$calendar = null
    }

    this.emptyAddPanel()

    return this
  }

  openAddPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $columns = elements.columns
    let $create = $addPanel.querySelector('#add-create')
    let $deadline = $addPanel.querySelector('#add-deadline')
    let $icon = $addPanel.querySelector('.add-deadline')
    let today = getToday().text

    this.closeSettingPanel()
        .closeViewPanel()
        .closeEditPanel()
        .closeTrashPanel()

    this.$calendar = new Calendar({
      parent: 'add-calendar',
      time: today,
      hasFooter: false,
      onDatePick: (time) => {
        $deadline.value = time
        this.$calendar.hide()
        removeClass($icon, 'field-icon-checked')
      }
    })

    $create.innerHTML = today

    this.$calendar.hide()

    addClass($addPanel, CLS_OPENED)
    addClass($columns, CLS_OPENED)

    return this
  }

  toggleAddPanel () {
    let elements = this.getEls()
    let $addPanel = elements.addPanel

    if (hasClass($addPanel, 'panel-opened')) {
      this.closeAddPanel()
    } else {
      this.openAddPanel()
    }

    return this
  }

  closeEditPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    removeClass(elements.editPanel, CLS_OPENED)
    removeClass($columns, CLS_OPENED)

    if (this.$calendar) {
      this.$calendar.destroy()
      this.$calendar = null
    }

    this.emptyEditPanel()

    return this
  }

  openEditPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $columns = elements.columns
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $icon = $editPanel.querySelector('.edit-deadline')

    this.closeSettingPanel()
        .closeViewPanel()
        .closeAddPanel()
        .closeTrashPanel()
        .updateEditPanel()

    this.$calendar = new Calendar({
      parent: 'edit-calendar',
      time: this.getEditPlan().deadline,
      hasFooter: false,
      onDatePick: (time) => {
        $deadline.value = time
        this.$calendar.hide()
        removeClass($icon, 'field-icon-checked')
      }
    })

    this.$calendar.hide()

    addClass($editPanel, CLS_OPENED)
    addClass($columns, CLS_OPENED)

    return this
  }

  updateEditPanel () {
    let plan = this.getEditPlan()
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $create = $editPanel.querySelector('#edit-create')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $estimate = $editPanel.querySelector('#edit-estimate')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let $checked = $editPanel.querySelector(`[data-level="${plan.level}"]`)

    $title.value = plan.title
    $create.innerHTML = plan.create
    $deadline.value = plan.deadline
    $estimate.value = plan.estimate
    $level.value = plan.level
    $desc.value = plan.desc

    if ($checked) {
      addClass($checked, 'field-level-checked')
    }

    return this
  }

  closeTrashPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $trashPanel = elements.trashPanel
    let $trashButton = elements.toolbar.querySelector('.toolbar-trash')

    removeClass($trashButton, 'toolbar-active')
    removeClass($trashPanel, CLS_OPENED)
    removeClass($columns, CLS_OPENED)

    this.emptyTrashPanel()

    return this
  }

  openTrashPanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns
    let $trashPanel = elements.trashPanel
    let $trashButton = elements.toolbar.querySelector('.toolbar-trash')

    this.closeSettingPanel()
        .closeViewPanel()
        .closeAddPanel()
        .closeEditPanel()
        .updateTrashPanel()

    addClass($trashButton, 'toolbar-active')
    addClass($trashPanel, CLS_OPENED)
    addClass($columns, CLS_OPENED)

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

    if (hasClass($trashPanel, 'panel-opened')) {
      this.closeTrashPanel()
    } else {
      this.openTrashPanel()
    }

    return this
  }

  closePanel () {
    const CLS_OPENED = 'panel-opened'
    let elements = this.getEls()
    let $columns = elements.columns

    if (hasClass($columns, CLS_OPENED)) {
      this.closeViewPanel()
          .closeAddPanel()
          .closeEditPanel()
          .closeTrashPanel()
          .closeSettingPanel()
    }

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

  _onSettingButtonClick () {
    this.toggleSettingPanel()
  }

  _onViewCancelButtonClick () {
    this.closeViewPanel()

    return this
  }

  _onViewEditButtonClick () {
    this.openEditPanel()

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

  _onAddDeadlineIconClick (evt) {
    const CLS_CHECKED = 'field-icon-checked'
    let $icon = evt.delegateTarget

    if (hasClass($icon, CLS_CHECKED)) {
      removeClass($icon, CLS_CHECKED)
    } else {
      addClass($icon, CLS_CHECKED)
    }

    this.$calendar.toggle()

    return this
  }

  _onAddSaveButtonClick () {
    let elements = this.getEls()
    let $addPanel = elements.addPanel
    let $title = $addPanel.querySelector('#add-title')
    let $deadline = $addPanel.querySelector('#add-deadline')
    let $estimate = $addPanel.querySelector('#add-estimate')
    let $level = $addPanel.querySelector('#add-level')
    let $desc = $addPanel.querySelector('#add-desc')
    let plan = {}
    let moments = getMoments()

    // TODO: 添加校验

    // 收集新任务的数据
    plan.id = parseInt(guid(4, 10), 10)
    plan.title = toSafeText($title.value)
    plan.deadline = $deadline.value
    plan.estimate = $estimate.value
    plan.level = parseInt($level.value, 10)
    plan.desc = toSafeText($desc.value)
    plan.marked = false
    plan.deleted = false
    plan.status = 0
    plan.create = moments
    plan.update = [{
      time: moments,
      code: OPERATIONS.add.code,
      operate: OPERATIONS.add.text
    }]

    this.closeAddPanel()
        .add(plan)

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

  _onEditDeadlineIconClick (evt) {
    const CLS_CHECKED = 'field-icon-checked'
    let $icon = evt.delegateTarget

    if (hasClass($icon, CLS_CHECKED)) {
      removeClass($icon, CLS_CHECKED)
    } else {
      addClass($icon, CLS_CHECKED)
    }

    this.$calendar.toggle()

    return this
  }

  _onEditSaveButtonClick () {
    let elements = this.getEls()
    let $editPanel = elements.editPanel
    let $title = $editPanel.querySelector('#edit-title')
    let $deadline = $editPanel.querySelector('#edit-deadline')
    let $estimate = $editPanel.querySelector('#edit-estimate')
    let $level = $editPanel.querySelector('#edit-level')
    let $desc = $editPanel.querySelector('#edit-desc')
    let originPlan = this.getEditPlan()
    let plan = clone(originPlan)

    // TODO: 添加校验

    // 收集新任务的数据
    plan.id = originPlan.id
    plan.title = $title.value
    plan.deadline = $deadline.value
    plan.estimate = $estimate.value
    plan.level = parseInt($level.value, 10)
    plan.desc = $desc.value
    plan.marked = originPlan.marked
    plan.deleted = originPlan.deleted
    plan.status = originPlan.status
    plan.create = originPlan.create
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.edit.code,
      operate: OPERATIONS.add.text
    })

    this.closeEditPanel()
        .update(plan)

    return this
  }

  _onTrashCancelButtonClick () {
    this.closeTrashPanel()

    return this
  }

  _onSettingCancelButtonClick () {
    this.closeSettingPanel()

    return this
  }

  _onSettingTemplateClick (evt) {
    this.checkTemplate(evt.delegateTarget)

    return this
  }

  _onSettingThemeClick (evt) {
    this.checkTheme(evt.delegateTarget)

    return this
  }

  _onSettingCacheClick (evt) {
    this.checkCache(evt.delegateTarget)

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

  _onDeleteButtonClick (evt) {
    this.checkDelete(evt.delegateTarget)

    return this
  }

  _onReplaceButtonClick (evt) {
    this.checkReplace(evt.delegateTarget)

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

  static isDelayed (plan) {
    let today = getToday().text

    return new Date(today).getTime() > new Date(plan.deadline).getTime() > 0 && plan.status < 2
  }

  static isEstimateTime (str) {
    let regEstimate = /^(([1-9]\d*)|[0]?)\.([0-9]\d*)([dhm]?)$/i

    return regEstimate.test(str)
  }

  static isLevelSaveAsFilter (level, filter) {
    return Plan.levelToFilter(level) === filter
  }

  static levelToFilter (level) {
    let filter = ''

    switch (level) {
      case '0':
      case 0:
        filter = 'spades'
        break
      case '1':
      case 1:
        filter = 'heart'
        break
      case '2':
      case 2:
        filter = 'clubs'
        break
      case '3':
      case 4:
        filter = 'diamonds'
        break

    }

    return filter
  }

  static filterToLevel (filter) {
    let level = -1

    switch (filter) {
      case 'spades':
        level = 0

        break
      case 'heart':
        level = 1

        break
      case 'clubs':
        level = 2

        break
      case 'diamonds':
        level = 3

        break
    }

    return level
  }

  static updateStatusChangedCount ($sourceCount, $targetCount) {
    let sourceCount = parseInt($sourceCount.innerHTML, 10)
    let targetCount = parseInt($targetCount.innerHTML, 10)

    sourceCount -= 1
    $sourceCount.innerHTML = sourceCount

    targetCount += 1
    $targetCount.innerHTML = targetCount
  }
}

export default Plan
