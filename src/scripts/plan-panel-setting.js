'use strict'

import {
  addClass,
  createElement,
  hasClass,
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
} from './plan-config'

import mitt from 'mitt'
const emitter = mitt()

const $wrap = document.querySelector('#setting-panel')

const Panel = {
  _elements: {
    wrap: $wrap,
    templates: $wrap.querySelector('#setting-templates'),
    themes: $wrap.querySelector('#setting-themes'),
    storage: $wrap.querySelector('#setting-storage')
  },
  _data: {
    template: 0,
    theme: 0,
    cache: 0
  },
  getData () {
    return this._data
  },
  setData (data) {
    this._data = data

    return this
  },
  getEls () {
    return this._elements
  },
  render () {
    this.update()

    return this
  },
  addEventListeners () {
    on($wrap, '.setting-cancel', 'click', this._onCancelClick, this)
    on($wrap, '.setting-template', 'click', this._onTemplateClick, this)
    on($wrap, '.setting-theme', 'click', this._onThemeClick, this)
    on($wrap, '.setting-cache', 'click', this._onCacheClick, this)

    emitter.on('panel.setting.update', this.setData)
    emitter.on('panel.setting.open', this.open)
    emitter.on('panel.setting.close', this.close)
    emitter.on('panel.setting.toggle', this.toggle)

    console.log('setting -> addEventListeners')

    return this
  },
  removeEventListeners () {
    off($wrap, 'click', this._onCancelClick)
    off($wrap, 'click', this._onTemplateClick)
    off($wrap, 'click', this._onThemeClick)
    off($wrap, 'click', this._onCacheClick)

    emitter.off('panel.setting.update', this.setData)
    emitter.off('panel.setting.open', this.open)
    emitter.off('panel.setting.close', this.close)
    emitter.off('panel.setting.toggle', this.toggle)

    return this
  },
  update () {
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
    let data = this.getData()
    let template = data.template
    let theme = data.theme
    let cache = data.cache
    let elements = this.getEls()
    let $templates = elements.templates
    let $themes = elements.themes
    let $storage = elements.storage
    let $template = createElement('input', {
      'type': 'hidden',
      'name': 'template',
      'id': 'setting-template',
      'value': data.template
    })
    let $theme = createElement('input', {
      'type': 'hidden',
      'name': 'theme',
      'id': 'setting-theme',
      'value': data.theme
    })
    let $cache = createElement('input', {
      'type': 'hidden',
      'name': 'cache',
      'id': 'setting-cache',
      'value': data.cache
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
  close () {
    emitter('toolbar.setting.normalize')
    removeClass($wrap, 'panel-opened')
    emitter('columns.open')

    return this
  },
  open () {
    emitter('panel.view.close')
    emitter('panel.add.close')
    emitter('panel.edit.close')
    emitter('panel.trash.close')

    emitter('toolbar.setting.highlight')
    addClass($wrap, 'panel-opened')
    emitter('columns.close')

    return this
  },
  toggle () {
    console.log('setting -> toggle')
    if (hasClass($wrap, 'panel-opened')) {
      this.close()
    } else {
      this.open()
    }

    return this
  },
  template ($button) {
    const CLS_OPTION_CHECKED = 'field-option-checked'
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

    emitter('plan.update.template', parseInt(value, 10))

    localStorage.setItem('plan.template', value)

    return this
  },
  theme ($button) {
    const CLS_OPTION_CHECKED = 'field-option-checked'
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

    removeClass($body, THEMES[this.get('theme')].theme)
    addClass($body, THEMES[parseInt(value, 10)].theme)

    emitter('plan.update.theme', parseInt(value, 10))

    localStorage.setItem('plan.theme', value)

    return this
  },
  cache ($button) {
    const CLS_OPTION_CHECKED = 'panel-option-checked'
    const CLS_RADIO_CHECKED = 'field-radio-checked'
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

    emitter('plan.update.cache', parseInt(value, 10))

    localStorage.setItem('plan.cache', value)

    if (parseInt(value, 10) === 0) {
      localStorage.removeItem('plan.plans')
    }

    return this
  },
  _onCancelClick () {
    this.close()

    return this
  },
  _onTemplateClick (evt) {
    this.template(evt.delegateTarget)

    return this
  },
  _onThemeClick (evt) {
    this.theme(evt.delegateTarget)

    return this
  },
  _onCacheClick (evt) {
    this.cache(evt.delegateTarget)

    return this
  }
}

export default Panel
