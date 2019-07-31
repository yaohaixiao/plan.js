'use strict'

import {on,off} from './delegate'

import emitter from './plan.emitter'
import {
  addClass,
  hasClass,
  removeClass
} from './dom'

import {
  PLAN_FILTER,
  PLAN_CLOSE_PANELS,
  TOOLBAR_SETTING_TOGGLE_HIGHLIGHT,
  TOOLBAR_TRASH_TOGGLE_HIGHLIGHT,
  TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT,
  PANEL_ADD_TOGGLE,
  PANEL_CHARTS_TOGGLE,
  PANEL_SETTING_TOGGLE,
  PANEL_TRASH_TOGGLE
} from './plan.actions'

let $wrap = document.querySelector('#toolbar')

const Toolbar = {
  initialize (filter) {
    this.setFilter(filter)
        .addEventListeners()

    return this
  },
  _filter: 'inbox',
  addEventListeners(){
    // 添加
    on($wrap, '.toolbar-plus', 'click', this._onPlusClick, this)
    // 过滤任务级别
    on($wrap, '.toolbar-inbox', 'click', this._onInBoxFilterClick, this)
    on($wrap, '.toolbar-spades', 'click', this._onSpadesFilterClick, this)
    on($wrap, '.toolbar-heart', 'click', this._onHeartFilterClick, this)
    on($wrap, '.toolbar-clubs', 'click', this._onClubsFilterClick, this)
    on($wrap, '.toolbar-diamonds', 'click', this._onDiamondsFilterClick, this)
    // 重要任务
    on($wrap, '.toolbar-bookmark', 'click', this._onBookmarkFilterClick, this)
    // 任务归档
    on($wrap, '.toolbar-charts', 'click', this._onChartsClick, this)
    // 回收站
    on($wrap, '.toolbar-trash', 'click', this._onTrashClick, this)
    // 设置
    on($wrap, '.toolbar-setting', 'click', this._onSettingClick, this)

    emitter.on(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT, this.chartsToggleHighlight.bind(this))
    emitter.on(TOOLBAR_TRASH_TOGGLE_HIGHLIGHT, this.trashToggleHighlight.bind(this))
    emitter.on(TOOLBAR_SETTING_TOGGLE_HIGHLIGHT, this.settingToggleHighlight.bind(this))

    return this
  },
  removeEventListeners(){
    // 添加
    off($wrap, 'click', this._onPlusClick, this)
    // 过滤任务级别
    off($wrap, 'click', this._onInBoxFilterClick)
    off($wrap, 'click', this._onSpadesFilterClick)
    off($wrap, 'click', this._onHeartFilterClick)
    off($wrap, 'click', this._onClubsFilterClick)
    off($wrap, 'click', this._onDiamondsFilterClick)
    // 重要任务
    off($wrap, 'click', this._onBookmarkFilterClick)
    // 回收站
    off($wrap, 'click', this._onTrashClick)
    // 设置
    off($wrap, 'click', this._onSettingClick)

    emitter.off(TOOLBAR_CHARTS_TOGGLE_HIGHLIGHT, this.chartsToggleHighlight.bind(this))
    emitter.off(TOOLBAR_TRASH_TOGGLE_HIGHLIGHT, this.trashToggleHighlight.bind(this))
    emitter.off(TOOLBAR_SETTING_TOGGLE_HIGHLIGHT, this.settingToggleHighlight.bind(this))

    return this
  },
  getFilter () {
    return this._filter
  },

  setFilter (filter) {
    this._filter = filter

    return this
  },
  filter ($button) {
    const CLS_ACTIVE = 'toolbar-active'
    let prop = $button.getAttribute('data-filter')
    let $active

    if (hasClass($button, CLS_ACTIVE)) {
      return this
    }

    $active = $wrap.querySelector('.' + CLS_ACTIVE)

    removeClass($active, CLS_ACTIVE)
    addClass($button, CLS_ACTIVE)

    this.setFilter(prop)

    emitter.emit(PLAN_FILTER, prop)
    emitter.emit(PLAN_CLOSE_PANELS)

    return this
  },
  chartsToggleHighlight () {
    this.toggleHighlight($wrap.querySelector('.toolbar-charts'))

    return this
  },
  trashToggleHighlight () {
    this.toggleHighlight($wrap.querySelector('.toolbar-trash'))

    return this
  },
  settingToggleHighlight () {
    this.toggleHighlight($wrap.querySelector('.toolbar-setting'))

    return this
  },
  toggleHighlight($button) {
    const CLS_ACTIVE = 'toolbar-active'

    if(hasClass($button, CLS_ACTIVE)){
      removeClass($button, CLS_ACTIVE)
    } else {
      addClass($button, CLS_ACTIVE)
    }

    return this
  },
  _onPlusClick () {
    emitter.emit(PANEL_ADD_TOGGLE)

    return this
  },
  _onInBoxFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onSpadesFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onHeartFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onClubsFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onDiamondsFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onBookmarkFilterClick (evt) {
    this.filter(evt.delegateTarget)

    return this
  },
  _onChartsClick () {
    emitter.emit(PANEL_CHARTS_TOGGLE)

    return this
  },
  _onTrashClick () {
    emitter.emit(PANEL_TRASH_TOGGLE)

    return this
  },
  _onSettingClick () {
    emitter.emit(PANEL_SETTING_TOGGLE)

    return this
  }
}

export default Toolbar
