'use strict'

import {
  TEMPLATES
} from './config'

import Plan from './plan'
import 'babel-polyfill'

let cachedTemplate = localStorage.getItem('plan.template')
let cachedTheme = localStorage.getItem('plan.theme')
let cachedStorage = localStorage.getItem('plan.cache')
let cachedPlans = localStorage.getItem('plan.plans')

let template = cachedTemplate ? parseInt(cachedTemplate, 10) : 0
let theme = cachedTheme ? parseInt(cachedTheme, 10) : 0
let cache = cachedStorage ? parseInt(cachedStorage, 10) : 0
let plans = cachedPlans ? JSON.parse(cachedPlans) : template === 1 ? [] : TEMPLATES[0].plans

new Plan({
  template: template,
  theme: theme,
  cache: cache,
  plans: plans
})
