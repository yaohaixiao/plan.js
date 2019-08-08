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

import { clone } from './utils'
import Chart from 'chart.js'
import emitter from './plan.emitter'

import {
  TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT,
  PANEL_CHARTS_UPDATE,
  PANEL_CHARTS_OPEN,
  PANEL_CHARTS_CLOSE,
  PANEL_CHARTS_TOGGLE,
  COLUMNS_OPEN,
  COLUMNS_CLOSE,
  PLAN_CLOSE_PANELS
} from './plan.actions'

const blue = '#2196f3'
const red = '#d31f1f'
const orange = '#ff9000'
const green = '#4caf50'
const $wrap = document.querySelector('#charts-panel')

const Panel = {
  initialize (plans) {
    this.setPlans(plans)
        .addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    tasksCharts: $wrap.querySelector('#tasks-charts')
  },
  _plans: [],
  addEventListeners () {
    on($wrap, '.charts-cancel', 'click', this._onCancelClick, this)

    emitter.on(PANEL_CHARTS_UPDATE, this.update.bind(this))
    emitter.on(PANEL_CHARTS_OPEN, this.open.bind(this))
    emitter.on(PANEL_CHARTS_CLOSE, this.close.bind(this))
    emitter.on(PANEL_CHARTS_TOGGLE, this.toggle.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)

    emitter.off(PANEL_CHARTS_UPDATE, this.update.bind(this))
    emitter.off(PANEL_CHARTS_OPEN, this.open.bind(this))
    emitter.off(PANEL_CHARTS_CLOSE, this.close.bind(this))
    emitter.off(PANEL_CHARTS_TOGGLE, this.toggle.bind(this))

    return this
  },
  render () {
    this.drawPie()
      .drawBar()

    return this
  },
  drawPie () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $pie = elements.tasksCharts.querySelector('#chart-pie')
    let ctx = $pie.getContext('2d')
    let $chartPie = null
    let config = {
      type: 'pie',
      data: {
        datasets: [{
          data: [
            plans.filter(plan => plan.status===0).length,
            plans.filter(plan => plan.status===1).length,
            plans.filter(plan => plan.status===2).length,
            plans.filter(plan => plan.status===3).length
          ],
          backgroundColor: [
            blue,
            orange,
            red,
            green
          ],
          label: 'Dataset 1'
        }],
        labels: [
          '待处理',
          '处理中',
          '待验收',
          '已完成'
        ]
      },
      options: {
        responsive: false,
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: '任务进度比例图'
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    }

    $pie.innerHTML = ''
    $chartPie = new Chart(ctx, config)

    return this
  },
  drawBar () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $bar = elements.tasksCharts.querySelector('#chart-bar')
    let ctx = $bar.getContext('2d')
    let color = Chart.helpers.color
    let $chartBar = null
    let config = {
      type: 'bar',
      data: {
        labels: [
          '待处理',
          '处理中',
          '待验收',
          '已完成'
        ],
        datasets: [
          {
            backgroundColor: [
              color(blue).alpha(0.5).rgbString(),
              color(orange).alpha(0.5).rgbString(),
              color(red).alpha(0.5).rgbString(),
              color(green).alpha(0.5).rgbString()
            ],
            data: [
              plans.filter(plan => plan.status === 0).length,
              plans.filter(plan => plan.status === 1).length,
              plans.filter(plan => plan.status === 2).length,
              plans.filter(plan => plan.status === 3).length
            ]
          }
        ]
      },
      options: {
        responsive: false,
        legend: {
          display: false,
          position: 'bottom'
        },
        title: {
          display: true,
          text: '工作量统计图'
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    }

    $bar.innerHTML = ''
    $chartBar = new Chart(ctx, config)

    return this
  },
  getPlan (id) {
    return this.getPlans().filter((plan) => {
      return plan.id === id
    })[0]
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
  indexOf (plans, plan) {
    let index = -1

    plans.forEach((task, i) => {
      if (plan.id === task.id) {
        index = i
      }
    })

    return index
  },
  update (plan) {
    let plans = clone(this.getPlans())



    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT)
    emitter.emit(COLUMNS_OPEN)

    removeClass($wrap, 'panel-opened')

    return this
  },
  open () {
    if (this.isOpened()) {
      return this
    }

    emitter.emit(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT)
    emitter.emit(PLAN_CLOSE_PANELS, PANEL_CHARTS_CLOSE)
    emitter.emit(COLUMNS_CLOSE)

    addClass($wrap, 'panel-opened')

    return this
  },
  toggle () {
    if (this.isOpened()) {
      this.close()
    } else {
      this.open()
    }

    return this
  },
  isOpened () {
    return hasClass($wrap, 'panel-opened')
  },
  empty () {
    let elements = this.getEls()

    elements.tasksCharts.innerHTML = ''

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  }
}

export default Panel
