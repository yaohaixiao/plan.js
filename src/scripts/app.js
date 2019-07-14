'use strict'

import {
  THEMES,
  TEMPLATES,
  STORAGE
} from './config'
import Plan from './plan'
import 'babel-polyfill'

new Plan({
  options: {
    templates: TEMPLATES,
    themes: THEMES,
    storage: STORAGE,
    template: TEMPLATES[0].value,
    theme: THEMES[0].value,
    cache: STORAGE[0].value
  },
  plans: TEMPLATES[0].plans
})
