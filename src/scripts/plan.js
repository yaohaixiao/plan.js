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
import PanelTrash from './plan.panel.trash'
import PanelSetting from './plan.panel.setting'
import Columns from './plan.columns'

import emitter from './plan.emitter'

import dragula from 'dragula'
import marked from 'marked'

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
    let columnsEls

    this.$toolbar = Toolbar
    this.$panelView = PanelView
    this.$panelAdd = PanelAdd
    this.$panelEdit = PanelEdit
    this.$panelTrash = PanelTrash

    this.$panelSetting = PanelSetting

    this.$columns = Columns

    this.set(options)
        .setPlans(clone(this.get('plans')))

    this.$toolbar.initialize(this.getFilter())

    this.$panelView.initialize()
    this.$panelAdd.initialize()
    this.$panelEdit.initialize()

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
      columnsEls.tasksTodo,
      columnsEls.tasksDoing,
      columnsEls.tasksChecking,
      columnsEls.tasksDone
    ])

    return this
  }

  render () {
    document.body.className = THEMES[this.get('theme')].theme

    this.$panelTrash.render()
    this.$panelSetting.render()
    this.$columns.render()

    return this
  }

  addEventListeners () {
    // 更新配置
    emitter.on('plan.update.template', this.setTemplate.bind(this))
    emitter.on('plan.update.theme', this.setTheme.bind(this))
    emitter.on('plan.update.cache', this.setCache.bind(this))

    // 更新数据
    emitter.on('plan.filter', this.filter.bind(this))
    emitter.on('plan.add', this.add.bind(this))
    emitter.on('plan.edit', this.edit.bind(this))
    emitter.on('plan.update', this.update.bind(this))
    emitter.on('plan.remove', this.remove.bind(this))
    emitter.on('plan.replace', this.replace.bind(this))
    emitter.on('plan.delete', this.delete.bind(this))

    // 收起 Panel
    emitter.on('plan.close.panels', this.closePanels.bind(this))

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
    emitter.off('plan.update.template', this.setTemplate.bind(this))
    emitter.off('plan.update.theme', this.setTheme.bind(this))
    emitter.off('plan.update.cache', this.setCache.bind(this))

    // 更新数据
    emitter.off('plan.filter', this.filter.bind(this))
    emitter.off('plan.add', this.add.bind(this))
    emitter.off('plan.edit', this.edit.bind(this))
    emitter.off('plan.update', this.update.bind(this))
    emitter.off('plan.remove', this.remove.bind(this))
    emitter.off('plan.replace', this.replace.bind(this))
    emitter.off('plan.delete', this.delete.bind(this))

    emitter.off('plan.close.panels', this.closePanels.bind(this))

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

    emitter.emit('columns.filter', filter)

    return this
  }

  add (plan) {
    let plans = clone(this.getPlans())

    plans.push(plan)

    this.setPlans(plans)

    emitter.emit('columns.add', plan)

    return this
  }

  edit (plan) {
    this.setPlan(plan)

    emitter.emit('columns.edit', plan)

    return this
  }

  update (plan) {
    this.setPlan(plan)

    return this
  }

  remove (plan) {
    plan.deleted = true
    plan.delayed = isDelayed(plan)
    plan.update.unshift({
      time: getMoments(),
      code: OPERATIONS.remove.code,
      operate: OPERATIONS.remove.text
    })

    this.setPlan(plan)

    emitter.emit('panel.trash.add', clone(plan))

    return this
  }

  replace (plan) {
    this.setPlan(plan)

    emitter.emit('columns.add', plan)

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

  closePanels () {
    emitter.emit('panel.view.close')
    emitter.emit('panel.add.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.trash.close')
    emitter.emit('panel.setting.close')

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
      emitter.emit('columns.edit', plan)

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
}

export default PlanV2
