'use strict'

import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import { getDate } from './time'

import {
  off,
  on
} from './delegate'

import {
  clone
} from './utils'
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
const purple = '#673ab7'
const $wrap = document.querySelector('#charts-panel')

let $chartBar = null
let $chartPie = null
let $chartLine = null

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
        .drawLine()

    return this
  },
  drawPie () {
    let elements = this.getEls()
    let $pie = elements.tasksCharts.querySelector('#chart-pie')
    let ctx = $pie.getContext('2d')
    let config = {
      type: 'pie',
      data: {
        datasets: [
          {
            data: this.getPieChartData(),
            backgroundColor: [
              blue,
              orange,
              red,
              green
            ],
            label: 'Dataset 1'
          }
        ],
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
          position: 'bottom'
        },
        title: {
          display: true,
          text: '任务状态统计图'
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
    let elements = this.getEls()
    let $bar = elements.tasksCharts.querySelector('#chart-bar')
    let ctx = $bar.getContext('2d')
    let color = Chart.helpers.color
    let config = {
      type: 'bar',
      data: {
        labels: [
          '待处理',
          '处理中',
          '待验收',
          '已完成',
          '合计'
        ],
        datasets: [
          {
            backgroundColor: [
              color(blue).alpha(0.5).rgbString(),
              color(orange).alpha(0.5).rgbString(),
              color(red).alpha(0.5).rgbString(),
              color(green).alpha(0.5).rgbString(),
              color(purple).alpha(0.5).rgbString()
            ],
            data: this.getBarChartData()
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
          yAxes: [
            {
              ticks: {
                beginAtZero: true
              }
            }
          ]
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
  drawLine () {
    let plans = this.getPlans()
    let elements = this.getEls()
    let $line = elements.tasksCharts.querySelector('#chart-line')
    let ctx = $line.getContext('2d')
    let color = Chart.helpers.color
    let allDates = plans.map(plan => getDate(plan.deadline).text.replace(/^(\d{4}-)/, ''))
    let dates = Array.from(new Set([ ...allDates ]))
    let config = {
      type: 'line',
      data: {
        // Date Objects
        labels: dates,
        datasets: [
          {
            label: '任务数量',
            backgroundColor: color(blue).alpha(0.5).rgbString(),
            borderColor: blue,
            fill: false,
            data: this.getLineChartData()
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
          text: '到期日统计图'
        },
        scales: {
          xAxes: [
            {
              // type: 'time',
              // time: {
              //   parser: 'MM/DD/YYYY'
              // },
              scaleLabel: {
                display: false,
                labelString: 'Date'
              }
            }
          ],
          yAxes: [
            {
              scaleLabel: {
                display: false,
                labelString: 'value'
              }
            }
          ]
        }
      }
    }

    $line.innerHTML = ''
    $chartLine = new Chart(ctx, config)

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
  getPieChartData () {
    let plans = this.getPlans()
    let todoCount = plans.filter(plan => plan.status === 0).length
    let doingCount = plans.filter(plan => plan.status === 1).length
    let checkingCount = plans.filter(plan => plan.status === 2).length
    let doneCount = plans.filter(plan => plan.status === 3).length

    return [
      todoCount,
      doingCount,
      checkingCount,
      doneCount
    ]
  },
  getBarChartData () {
    let plans = this.getPlans()
    let todo = plans.filter(plan => plan.status === 0).map((plan) => plan.estimate)
    let doing = plans.filter(plan => plan.status === 1).map((plan) => plan.estimate)
    let checking = plans.filter(plan => plan.status === 2).map((plan) => plan.estimate)
    let done = plans.filter(plan => plan.status === 3).map((plan) => plan.estimate)
    let total = plans.map((plan) => plan.estimate)
    let todoCount = todo.length > 0 ? todo.reduce((sum, num) => sum + num) : 0
    let doingCount = doing.length > 0 ? doing.reduce((sum, num) => sum + num) : 0
    let checkingCount = checking.length > 0 ? checking.reduce((sum, num) => sum + num) : 0
    let doneCount = done.length > 0 ? done.reduce((sum, num) => sum + num) : 0
    let totalCount = total.length > 0 ? total.reduce((sum, num) => sum + num) : 0

    return [
      todoCount,
      doingCount,
      checkingCount,
      doneCount,
      totalCount
    ]
  },
  getLineChartData () {
    let plans = this.getPlans()
    let allDates = plans.map(plan => getDate(plan.deadline).text.replace(/^(\d{4}-)/, ''))
    let counts = []
    let obj = allDates.reduce((allNames, name) => {
      if (name in allNames) {
        allNames[name]++
      } else {
        allNames[name] = 1
      }

      return allNames
    }, {})

    Object.keys(obj).forEach((key) => {
      counts.push(obj[key])
    })

    return counts
  },
  update (plans) {
    this.setPlans(plans)
        .repaint()

    return this
  },
  repaint () {
    $chartPie.data.datasets[0].data = this.getPieChartData()
    $chartPie.update()

    $chartBar.data.datasets[0].data = this.getBarChartData()
    $chartBar.update()

    $chartLine.data.datasets[0].data = this.getLineChartData()
    $chartLine.update()

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
