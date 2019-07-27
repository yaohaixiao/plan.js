'use strict'

import {
  createElement,
  hasClass,
  addClass,
  removeClass
} from './dom'

import {
  off,
  on
} from './delegate'

import {
  TEMPLATES,
  THEMES,
  STORAGE
} from './plan.config'

import emitter from './plan.emitter'

const CLS_OPTION_CHECKED = 'field-option-checked'
const CLS_RADIO_CHECKED = 'field-radio-checked'
const $wrap = document.querySelector('#setting-panel')

const Panel = {
  initialize ({ template, theme, cache }) {
    this.setTemplate(template)
        .setTheme(theme)
        .setCache(cache)
        .addEventListeners()

    return this
  },
  _elements: {
    wrap: $wrap,
    templates: $wrap.querySelector('#setting-templates'),
    themes: $wrap.querySelector('#setting-themes'),
    storage: $wrap.querySelector('#setting-storage')
  },
  _template: 0,
  _theme: 0,
  _cache: 0,
  render () {
    const SPACE = ' '
    const CLS_RADIOS_GROUP = 'field-radios-group'
    const CLS_RADIO = 'field-radio'
    const CLS_RADIO_ICON = 'field-radio-icon'
    const CLS_RADIO_LABEL = 'field-radio-label'
    const CLS_OPTION = 'field-option'
    const CLS_FIELD_TEMPLATE = 'field-template'
    const CLS_FIELD_THEME = 'field-theme'
    const CLS_SETTING_TEMPLATE = 'setting-template'
    const CLS_SETTING_THEME = 'setting-theme'
    const CLS_SETTING_CACHE = 'setting-cache'
    let template = this.getTemplate()
    let theme = this.getTheme()
    let cache = this.getCache()
    let elements = this.getEls()
    let $templates = elements.templates
    let $themes = elements.themes
    let $storage = elements.storage
    let $template = createElement('input', {
      'type': 'hidden',
      'name': 'template',
      'id': 'setting-template',
      'value': template
    })
    let $theme = createElement('input', {
      'type': 'hidden',
      'name': 'theme',
      'id': 'setting-theme',
      'value': theme
    })
    let $cache = createElement('input', {
      'type': 'hidden',
      'name': 'cache',
      'id': 'setting-cache',
      'value': cache
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
  },
  getTemplate () {
    return this._template
  },
  setTemplate (val) {
    this._template = val

    return this
  },
  getTheme () {
    return this._theme
  },
  setTheme (val) {
    this._theme = val

    return this
  },
  getCache () {
    return this._cache
  },
  setCache (val) {
    this._cache = val

    return this
  },
  getEls () {
    return this._elements
  },
  addEventListeners () {
    on($wrap, '.setting-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.setting-template', 'click', this._onTemplateClick, this)
    on($wrap, '.setting-theme', 'click', this._onThemeClick, this)
    on($wrap, '.setting-cache', 'click', this._onCacheClick, this)

    emitter.on('panel.setting.open', this.open.bind(this))
    emitter.on('panel.setting.close', this.close.bind(this))
    emitter.on('panel.setting.toggle', this.toggle.bind(this))

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onTemplateClick)
    off($wrap, 'click', this._onThemeClick)
    off($wrap, 'click', this._onCacheClick)

    emitter.off('panel.setting.open', this.open.bind(this))
    emitter.off('panel.setting.close', this.close.bind(this))
    emitter.off('panel.setting.toggle', this.toggle.bind(this))

    return this
  },
  close () {
    if (!this.isOpened()) {
      return this
    }

    emitter.emit('toolbar.setting.toggle.highlight')
    emitter.emit('columns.open')

    removeClass($wrap, 'panel-opened')

    return this
  },
  open () {
    if (this.isOpened()) {
      return this
    }

    emitter.emit('toolbar.setting.toggle.highlight')

    emitter.emit('panel.view.close')
    emitter.emit('panel.add.close')
    emitter.emit('panel.edit.close')
    emitter.emit('panel.trash.close')
    emitter.emit('columns.close')

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
  changeTemplate ($button) {
    let value = $button.getAttribute('data-template')
    let elements = this.getEls()
    let $templates = elements.templates
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

    emitter.emit('plan.update.template', parseInt(value, 10))

    return this
  },
  changeTheme ($button) {
    let value = $button.getAttribute('data-value')
    let elements = this.getEls()
    let $body = document.body
    let $themes = elements.themes
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

    $body.className = THEMES[parseInt(value, 10)].theme

    emitter.emit('plan.update.theme', parseInt(value, 10))

    return this
  },
  changeCache ($button) {
    let value = $button.getAttribute('data-cache')
    let elements = this.getEls()
    let $storage = elements.storage
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

    emitter.emit('plan.update.cache', parseInt(value, 10))

    return this
  },
  /**
   * 点击取消按钮的事件处理器 - 点击后关闭设置 Panel
   * ========================================================================
   * @returns {Panel}
   * @private
   */
  _onCancelClick () {
    this.close()

    return this
  },
  /**
   * 点击模板选项的事件处理器 - 如果同时选择了关闭缓存模式，选择模板后刷新界面会更新演示数据
   * ========================================================================
   * @param evt
   * @returns {Panel}
   * @private
   */
  _onTemplateClick (evt) {
    this.changeTemplate(evt.delegateTarget)

    return this
  },
  /**
   * 点击主题选项的事件处理器 - 点击后切换 Plan 的主题样式
   * ========================================================================
   * @param evt
   * @returns {Panel}
   * @private
   */
  _onThemeClick (evt) {
    this.changeTheme(evt.delegateTarget)

    return this
  },
  /**
   * 点击缓存 radio 按钮的时间处理器 - 点击后会取消（并清空）或者开启缓存数据
   * ========================================================================
   * @param evt
   * @returns {Panel}
   * @private
   */
  _onCacheClick (evt) {
    this.changeCache(evt.delegateTarget)

    return this
  }
}

export default Panel
