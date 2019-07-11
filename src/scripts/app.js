'use strict'

import Plan from './plan'
import Templates from './templates'
import 'babel-polyfill'

new Plan({
  plans: Templates[0].tasks
})