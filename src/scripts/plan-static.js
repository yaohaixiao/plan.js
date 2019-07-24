'use strict'

import {getToday} from './time'

export const isDelayed = (plan) => {
  let today = getToday().text

  return new Date(today).getTime() > new Date(plan.deadline).getTime() > 0 && plan.status < 2
}

export const isEstimateTime = (str) => {
  let regEstimate = /^(([1-9]\d*)|[0]?)\.([0-9]\d*)([dhm]?)$/i

  return regEstimate.test(str)
}

export const isLevelSaveAsFilter = (level, filter) => {
  return levelToFilter(level) === filter
}

export const levelToFilter = (level) => {
  let filter = ''

  switch (level) {
    case '0':
    case 0:
      filter = 'spades'
      break
    case '1':
    case 1:
      filter = 'heart'
      break
    case '2':
    case 2:
      filter = 'clubs'
      break
    case '3':
    case 4:
      filter = 'diamonds'
      break

  }

  return filter
}

export const filterToLevel = (filter) => {
  let level = -1

  switch (filter) {
    case 'spades':
      level = 0

      break
    case 'heart':
      level = 1

      break
    case 'clubs':
      level = 2

      break
    case 'diamonds':
      level = 3

      break
  }

  return level
}

export const updateStatusChangedCount = ($sourceCount, $targetCount) => {
  let sourceCount = parseInt($sourceCount.innerHTML, 10)
  let targetCount = parseInt($targetCount.innerHTML, 10)

  sourceCount -= 1
  $sourceCount.innerHTML = sourceCount

  targetCount += 1
  $targetCount.innerHTML = targetCount
}
