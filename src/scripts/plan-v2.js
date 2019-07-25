'use strict'

import {
  assign,
  clone
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
  on,
  off
} from './delegate'

import {
  createTaskElement
} from './plan-task'

import {
  isDelayed,
  updateStatusChangedCount
} from './plan-static'

import {
  THEMES,
  OPERATIONS
} from './plan-config'

import Toolbar from './plan-toolbar'
import PanelView from './plan-panel-view'
import PanelAdd from './plan-panel-add'
import PanelEdit from './plan-panel-edit'
import PanelTrash from './plan-panel-trash'
import PanelSetting from './plan-panel-setting'
import Columns from './plan-columns'

import emitter from './plan-emitter'

import dragula from 'dragula'
import marked from 'marked'

let $wrap = document.querySelector('#plan')

class PlanV2 {
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
    this.$toolbar = Toolbar
    this.$panelView = PanelView
    this.$panelAdd = PanelAdd
    this.$panelEdit = PanelEdit
    this.$panelTrash = PanelTrash

    this.$panelSetting = PanelSetting

    this.$columns = Columns

    this.set(options)
        .setPlans(clone(this.get('plans')))

    this.$toolbar.initialize()

    this.$panelView.initialize()
    this.$panelAdd.initialize()
    this.$panelEdit.initialize()

    this.$panelTrash.initialize()

    this.$panelSetting.initialize({
      template: this.get('template'),
      theme: this.get('theme'),
      cache: this.get('cache')
    })

    this.$columns.initialize()

    this.$dragula = dragula([
      this.$panelTrash.tasks,
      this.$columns.tasksTodo,
      this.$columns.tasksDoing,
      this.$columns.tasksChecking,
      this.$columns.tasksDone
    ])

    return this
  }

  render () {
    document.body.className = THEMES[this.get('theme')].theme

    this.$panelSetting.render()

    return this
  }

  addEventListeners () {
    // ---------- task ----------
    on($wrap, '.task-title', 'click', this._onTaskTitleClick, this)
    on($wrap, '.task-prev', 'click', this._onPrevButtonClick, this)
    on($wrap, '.task-edit', 'click', this._onEditButtonClick, this)
    on($wrap, '.task-bookmark', 'click', this._onMarkedButtonClick, this)
    on($wrap, '.task-delete', 'click', this._onDeleteButtonClick, this)
    on($wrap, '.task-next', 'click', this._onNextButtonClick, this)

    // 更新配置信息
    emitter.on('plan.update.template', this.set.bind(this))
    emitter.on('plan.update.theme', this.set.bind(this))
    emitter.on('plan.update.cache', this.set.bind(this))
    // 更新数据
    emitter.on('plan.update.filter', this.setFilter(this))
    emitter.on('plan.update.plans', this.setPlans(this))

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

    // ---------- task ----------
    off($wrap, 'click', this._onTaskTitleClick)
    off($wrap, 'click', this._onPrevButtonClick)
    off($wrap, 'click', this._onEditButtonClick)
    off($wrap, 'click', this._onMarkedButtonClick)
    off($wrap, 'click', this._onDeleteButtonClick)
    off($wrap, 'click', this._onNextButtonClick)

    // 更新配置信息
    emitter.off('plan.update.template', this.setTemplate.bind(this))
    emitter.off('plan.update.theme', this.setTheme.bind(this))
    emitter.off('plan.update.cache', this.setCache.bind(this))
    // 更新数据
    emitter.off('plan.update.filter', this.setFilter(this))
    emitter.off('plan.update.plans', this.setPlans(this))

    this.$dragula.destroy()

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
    emitter.emit('panel.view.empty')
    emitter.emit('panel.add.empty')
    emitter.emit('panel.edit.empty')
    emitter.emit('panel.trash.empty')
    emitter.emit('panel.setting.empty')
    emitter.emit('panel.columns.empty')

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

    return this
  }

  setTheme (theme) {
    this.set({
      theme: theme
    })

    addClass(document.body, THEMES[this.get('theme')].theme)

    return this
  }

  setCache (cache) {
    this.set({
      cache: cache
    })

    return this
  }

  view (plan) {
    if (plan.deleted) {
      return this
    }

    emitter.emit('panel.view.update', plan)
    emitter.emit('panel.view.open')

    return this
  }

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

    updateStatusChangedCount($sourceCount, $targetCount)

    $sourceTasks.removeChild($plan)
    $targetTasks.appendChild(createTaskElement(plan))

    return this
  }

  edit (plan) {
    emitter.emit('panel.edit.update', plan)
    emitter.emit('panel.edit.open')

    return this
  }

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
  }

  remove (plan) {
    console.log(plan)

    return this
  }

  drop ($plan, $target, $source) {
    let filter = this.getFilter()
    let id = $plan.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))
    let $columns = this.$columns
    let sourceStatus = $source.getAttribute('data-status')
    let targetStatus = $target.getAttribute('data-status')
    let $sourceCount = $columns.getStatusCountEl(sourceStatus)
    let $targetCount = $columns.getStatusCountEl(targetStatus)
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

  _onTaskTitleClick (evt) {
    let $title = evt.delegateTarget
    let id = $title.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.view(plan)

    return this
  }

  _onPrevButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.changeStatus(plan, 'prev')

    return this
  }

  _onNextButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.changeStatus(plan, 'next')

    return this
  }

  _onEditButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.edit(plan)

    return this
  }

  _onMarkedButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.mark(plan)

    return this
  }

  _onDeleteButtonClick (evt) {
    let $button = evt.delegateTarget
    let id = $button.getAttribute('data-id')
    let plan = this.getPlan(parseInt(id, 10))

    this.remove(plan)

    return this
  }
}

export default PlanV2
