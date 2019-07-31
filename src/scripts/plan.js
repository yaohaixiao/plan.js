'use strict'

import {
  assign,
  clone,
  findIndex
} from './utils'

import {
  getMoments
} from './time'

import {
  addClass,
  removeClass,
  replaceClass
} from './dom'

import {
  isDelayed,
  updateStatusChangedCount
} from './plan.static'

import {
  THEMES,
  OPERATIONS
} from './plan.config'

import Toolbar from './plan.toolbar'
import PanelView from './plan.panel.view'
import PanelAdd from './plan.panel.add'
import PanelEdit from './plan.panel.edit'
import PanelArchives from './plan.panel.archives'
import PanelTrash from './plan.panel.trash'
import PanelSetting from './plan.panel.setting'
import Columns from './plan.columns'

import emitter from './plan.emitter'

import {
  PLAN_UPDATE_TEMPLATE,
  PLAN_UPDATE_THEME,
  PLAN_UPDATE_CACHE,
  PLAN_FILTER,
  PLAN_UPDATE,
  PLAN_ADD,
  PLAN_EDIT,
  PLAN_DELETE,
  PLAN_REMOVE,
  PLAN_REPLACE,
  PLAN_ARCHIVE,
  PLAN_CLOSE_PANELS,
  PANEL_VIEW_EMPTY,
  PANEL_VIEW_CLOSE,
  PANEL_ADD_EMPTY,
  PANEL_ADD_CLOSE,
  PANEL_EDIT_EMPTY,
  PANEL_EDIT_CLOSE,
  PANEL_ARCHIVES_ADD,
  PANEL_ARCHIVES_EMPTY,
  PANEL_ARCHIVES_CLOSE,
  PANEL_TRASH_ADD,
  PANEL_TRASH_PUSH,
  PANEL_TRASH_EMPTY,
  PANEL_TRASH_CLOSE,
  PANEL_SETTING_CLOSE,
  COLUMNS_EMPTY,
  COLUMNS_FILTER,
  COLUMNS_ADD,
  COLUMNS_PUSH,
  COLUMNS_EDIT,
  COLUMNS_DELETE
} from './plan.actions'

import dragula from 'dragula'

class Plan {
  constructor (options) {
    this.attributes = {
      template: 0,
      theme: 0,
      cache: 0,
      plans: []
    }

    this.$toolbar = null
    this.$panelView = null
    this.$panelAdd = null
    this.$panelEdit = null
    this.$panelArchives = null
    this.$panelTrash = null
    this.$panelSetting = null
    this.$columns = null

    this.$dragula = null

    this.data = {
      plans: [],
      filter: 'inbox'
    }

    this.initialize(options)
        .render()
        .addEventListeners()

    return this
  }

  initialize (options) {
    let columnsEls

    this.$toolbar = Toolbar
    this.$panelView = PanelView
    this.$panelAdd = PanelAdd
    this.$panelEdit = PanelEdit
    this.$panelArchives = PanelArchives
    this.$panelTrash = PanelTrash
    this.$panelSetting = PanelSetting

    this.$columns = Columns

    this.set(options)
        .setPlans(clone(this.get('plans')))

    this.$toolbar.initialize(this.getFilter())

    this.$panelView.initialize()
    this.$panelAdd.initialize()
    this.$panelEdit.initialize()

    this.$panelArchives.initialize(this.getPlans().filter(plan => plan.archived))
    this.$panelTrash.initialize(this.getPlans().filter(plan => plan.deleted))

    this.$panelSetting.initialize({
      template: this.get('template'),
      theme: this.get('theme'),
      cache: this.get('cache')
    })

    this.$columns.initialize({
      filter: this.getFilter(),
      plans: this.getPlans().filter(plan => !plan.deleted)
    })

    columnsEls = this.$columns.getEls()

    this.$dragula = dragula([
      this.$panelTrash.getEls().tasksTrash,
      columnsEls.tasksTodo,
      columnsEls.tasksDoing,
      columnsEls.tasksChecking,
      columnsEls.tasksDone
    ])

    return this
  }

  render () {
    document.body.className = THEMES[this.get('theme')].theme

    this.$panelArchives.render()
    this.$panelTrash.render()
    this.$panelSetting.render()
    this.$columns.render()

    return this
  }

  addEventListeners () {
    // 更新配置
    emitter.on(PLAN_UPDATE_TEMPLATE, this.setTemplate.bind(this))
    emitter.on(PLAN_UPDATE_THEME, this.setTheme.bind(this))
    emitter.on(PLAN_UPDATE_CACHE, this.setCache.bind(this))

    // 更新数据
    emitter.on(PLAN_FILTER, this.filter.bind(this))
    emitter.on(PLAN_ADD, this.add.bind(this))
    emitter.on(PLAN_EDIT, this.edit.bind(this))
    emitter.on(PLAN_UPDATE, this.update.bind(this))
    emitter.on(PLAN_REMOVE, this.remove.bind(this))
    emitter.on(PLAN_REPLACE, this.replace.bind(this))
    emitter.on(PLAN_DELETE, this.delete.bind(this))
    emitter.on(PLAN_ARCHIVE, this.archive.bind(this))

    // 收起 Panel
    emitter.on(PLAN_CLOSE_PANELS, this.closePanels.bind(this))

    // 拖动完成，更新任务状态
    this.$dragula.on('drop', ($plan, $target, $source) => {
      this.drop($plan, $target, $source)
    })

    return this
  }

  removeEventListeners () {
    this.$toolbar.removeEventListeners()
    this.$panelView.removeEventListeners()
    this.$panelAdd.removeEventListeners()
    this.$panelEdit.removeEventListeners()
    this.$panelTrash.removeEventListeners()
    this.$panelSetting.removeEventListeners()
    this.$columns.removeEventListeners()

    // 更新配置
    emitter.off(PLAN_UPDATE_TEMPLATE, this.setTemplate.bind(this))
    emitter.off(PLAN_UPDATE_THEME, this.setTheme.bind(this))
    emitter.off(PLAN_UPDATE_CACHE, this.setCache.bind(this))

    // 更新数据
    emitter.off(PLAN_FILTER, this.filter.bind(this))
    emitter.off(PLAN_ADD, this.add.bind(this))
    emitter.off(PLAN_EDIT, this.edit.bind(this))
    emitter.off(PLAN_UPDATE, this.update.bind(this))
    emitter.off(PLAN_REMOVE, this.remove.bind(this))
    emitter.off(PLAN_REPLACE, this.replace.bind(this))
    emitter.off(PLAN_DELETE, this.delete.bind(this))
    emitter.off(PLAN_ARCHIVE, this.archive.bind(this))

    emitter.off(PLAN_CLOSE_PANELS, this.closePanels.bind(this))

    this.$dragula.destroy()

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

    return this
  }

  reset () {
    this.attributes = {
      template: 0,
      theme: 0,
      cache: 0,
      plans: []
    }

    this.$toolbar = null
    this.$panelView = null
    this.$panelAdd = null
    this.$panelEdit = null
    this.$panelTrash = null
    this.$panelSetting = null
    this.$columns = null

    this.$dragula = null

    this.data = {
      plans: [],
      filter: 'inbox'
    }

    return this
  }

  empty () {
    emitter.emit(PANEL_VIEW_EMPTY)
    emitter.emit(PANEL_ADD_EMPTY)
    emitter.emit(PANEL_EDIT_EMPTY)
    emitter.emit(PANEL_ARCHIVES_EMPTY)
    emitter.emit(PANEL_TRASH_EMPTY)
    emitter.emit(COLUMNS_EMPTY)

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
    let index = findIndex(plans, (task) => {
      return task.id === plan.id
    })

    // 如果存在，则更新数据
    if (index > -1) {
      plans[index] = plan
      this.setPlans(plans)
    }

    return this
  }

  /**
   *
   * @returns {Array}
   */
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

  setFilter (filter) {
    this.data.filter = filter

    return this
  }

  setTemplate (template) {
    this.set({
      template: template
    })

    localStorage.setItem('plan.template', template)

    return this
  }

  setTheme (theme) {
    this.set({
      theme: theme
    })

    addClass(document.body, THEMES[this.get('theme')].theme)

    localStorage.setItem('plan.theme', theme)

    return this
  }

  setCache (cache) {
    this.set({
      cache: cache
    })

    localStorage.setItem('plan.cache', cache)

    if (cache === 0) {
      localStorage.removeItem('plan.plans')
    }

    return this
  }

  filter(filter) {
    this.setFilter(filter)

    emitter.emit(COLUMNS_FILTER, filter)

    return this
  }

  add (plan) {
    let plans = clone(this.getPlans())

    plans.push(plan)

    this.setPlans(plans)

    emitter.emit(COLUMNS_ADD, plan)

    return this
  }

  edit (plan) {
    this.setPlan(plan)

    emitter.emit(COLUMNS_EDIT, plan)

    return this
  }

  update (plan) {
    this.setPlan(plan)

    return this
  }

  remove (plan) {
    this.setPlan(plan)

    emitter.emit(PANEL_TRASH_ADD, plan)

    return this
  }

  replace (plan) {
    this.setPlan(plan)

    emitter.emit(COLUMNS_ADD, plan)

    return this
  }

  delete (plan) {
    let plans = clone(this.getPlans())
    let index = -1

    plans.forEach((task, i) => {
      if (task.id === plan.id) {
        index = i
      }
    })

    if (index === -1) {
      return this
    }

    plans.splice(index, 1)
    this.setPlans(plans)

    return this
  }

  archive (plan) {
    this.setPlan(plan)

    emitter.emit(PANEL_ARCHIVES_ADD, plan)

    return this
  }

  closePanels (action) {
    let actions = [
      PANEL_VIEW_CLOSE,
      PANEL_ADD_CLOSE,
      PANEL_EDIT_CLOSE,
      PANEL_ARCHIVES_CLOSE,
      PANEL_TRASH_CLOSE,
      PANEL_SETTING_CLOSE
    ]

    if (action) {
      actions = actions.filter(evt => evt !== action)
    }

    actions.forEach(evt => emitter.emit(evt))

    return this
  }

  drop ($plan, $target, $source) {
    let id = $plan.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let filter = this.getFilter()
    let $columns = this.$columns
    let sourceStatus = $source.getAttribute('data-status')
    let targetStatus = $target.getAttribute('data-status')
    let $trashElements = this.$panelTrash.getEls()
    let $sourceCount
    let $targetCount
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

      $sourceCount = $columns.getStatusCountEl(sourceStatus)
      $targetCount = $trashElements.trashCount
    } else {
      $sourceCount = $trashElements.trashCount
      $targetCount = $columns.getStatusCountEl(targetStatus)

      // 从回收站移出来
      if (sourceStatus === 'deleted') {
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

        code = OPERATIONS.replace.text
        text = OPERATIONS.replace.text
      } else {
        code = OPERATIONS.status.text
        text = OPERATIONS.status.text

        $sourceCount = $columns.getStatusCountEl(sourceStatus)
        $targetCount = $columns.getStatusCountEl(targetStatus)
      }
    }

    plan.status = parseInt(targetStatus, 10)
    plan.update.unshift({
      time: getMoments(),
      code: code,
      operate: text
    })
    plan.delayed = isDelayed(plan)
    this.setPlan(plan)

    if (targetStatus === 'deleted') {
      this.setPlan(plan)
      emitter.emit(PANEL_TRASH_PUSH, plan)
      emitter.emit(COLUMNS_DELETE, plan)
    } else {
      if (sourceStatus === 'deleted') {
        emitter.emit(COLUMNS_PUSH, plan)
      } else {
        emitter.emit(COLUMNS_EDIT, plan)
      }
    }

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

    updateStatusChangedCount($sourceCount, $targetCount)

    return this
  }
}

export default Plan
