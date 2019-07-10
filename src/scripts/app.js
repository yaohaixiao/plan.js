'use strict'

import Plan from './plan'
import Tasks from './tasks'
import 'babel-polyfill'

new Plan({
  plans: Tasks
})