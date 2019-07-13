'use strict'

import {createElement} from './dom'
import {toSafeText} from './utils'
import marked from 'marked'

export const createTaskElement = (plan) => {
  let id = plan.id
  let $side = createTaskSideElement(plan)
  let $main = createTaskMainElement(plan)
  let classTask = 'task'

  if (plan.marked) {
    classTask += ' ' + 'task-marked'
  }

  if (plan.deleted) {
    classTask += ' ' + 'task-deleted'
  }

  if (plan.delayed) {
    classTask += ' ' + 'task-delayed'
  }

  classTask += ' ' + 'task-status-' + plan.status

  return createElement('div', {
    'id': `task-${id}`,
    'className': classTask,
    'data-id': `${id}`,
    'data-status': `${plan.status}`,
    'data-deleted': `${plan.deleted ? 1 : 0}`,
    'data-delayed': `${plan.delayed ? 1 : 0}`,
    'data-marked': `${plan.marked ? 1 : 0}`
  }, [
    $main,
    $side
  ])
}

export const createTaskPrevElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-prev-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-cheveron-up'
    })
  ])
}

export const createTaskEditElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-edit-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-edit-pencil'
    })
  ])
}

export const createTaskMarkElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-bookmark-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-bookmark'
    })
  ])
}

export const createTasKDeleteElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-delete-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-trash'
    })
  ])
}

export const createTaskReplaceElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-replace-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-reload'
    })
  ])
}

export const createTaskNextElement = (plan) => {
  let id = plan.id

  return createElement('div', {
    'className': 'task-button task-next-button',
    'data-id': `${id}`
  }, [
    createElement('i', {
      'className': 'icon-cheveron-down'
    })
  ])
}

export const createTaskSideElement = (plan) => {
  let $prev = createTaskPrevElement(plan)
  let $next = createTaskNextElement(plan)
  let $edit = createTaskEditElement(plan)
  let $mark = createTaskMarkElement(plan)
  let $delete = createTasKDeleteElement(plan)
  let $replace = createTaskReplaceElement(plan)

  return createElement('div', {
    'className': 'task-side'
  }, [
    $prev,
    $edit,
    $mark,
    $replace,
    $delete,
    $next
  ])
}

export const createTaskLevelElement = (plan) => {
  const LEVELS = [
    'spades',
    'heart',
    'clubs',
    'diamonds'
  ]
  let level = plan.level

  return createElement('div', {
    'className': `task-level task-level-${level}`
  }, [
    createElement('i', {
      'className': `icon-${LEVELS[level]}`
    })
  ])
}

export const createTaskTitleTextElement = (plan) => {
  return createElement('strong', {
    'className': 'task-title-text'
  }, [
    toSafeText(plan.title)
  ])
}

export const createTaskTitleElement = (plan) => {
  let id = plan.id
  let $text = createTaskTitleTextElement(plan)

  return createElement('h3', {
    'className': 'task-title',
    'data-id': `${id}`
  }, [
    '任务：',
    $text
  ])
}

export const createTaskHeaderElement = (plan) => {
  let $level = createTaskLevelElement(plan)
  let $title = createTaskTitleElement(plan)

  return createElement('div', {
    'className': 'task-hd'
  }, [
    $title,
    $level
  ])
}

export const createTaskDescElement = (plan) => {
  return createElement('div', {
    'className': 'task-desc'
  }, [
    marked(toSafeText(plan.desc))
  ])
}

export const createTaskBodyElement = (plan) => {
  let $desc = createTaskDescElement(plan)

  return createElement('div', {
    'className': 'task-bd'
  }, [
    $desc
  ])
}

export const createTaskDeadlineElement = (plan) => {
  return createElement('div', {
    'className': 'task-deadline'
  }, [
    createElement('div', {
      'className': 'task-deadline-icon'
    }, [
      createElement('i', {
        'className': 'icon-calendar'
      })
    ]),
    createElement('p', {
      'className': 'task-deadline-text'
    }, [
      plan.deadline
    ])
  ])
}

export const createTaskEstimateElement = (plan) => {
  return createElement('div', {
    'className': 'task-estimate'
  }, [
    createElement('div', {
      'className': 'task-estimate-icon'
    }, [
      createElement('i', {
        'className': 'icon-clock'
      })
    ]),
    createElement('p', {
      'className': 'task-estimate-text'
    }, [
      plan.consuming
    ])
  ])
}

export const createTaskFooterElement = (plan) => {
  let $deadline = createTaskDeadlineElement(plan)
  let $consuming = createTaskEstimateElement(plan)

  return createElement('div', {
    'className': 'task-ft'
  }, [
    $deadline,
    $consuming
  ])
}

export const createTaskMainElement = (plan) => {
  let $header = createTaskHeaderElement(plan)
  let $body = createTaskBodyElement(plan)
  let $footer = createTaskFooterElement(plan)

  return createElement('div', {
    'className': 'task-main'
  }, [
    $header,
    $body,
    $footer
  ])
}

export default {
  createTaskPrevElement,
  createTaskEditElement,
  createTaskMarkElement,
  createTasKDeleteElement,
  createTaskReplaceElement,
  createTaskNextElement,
  createTaskSideElement,
  createTaskLevelElement,
  createTaskTitleTextElement,
  createTaskTitleElement,
  createTaskHeaderElement,
  createTaskDescElement,
  createTaskBodyElement,
  createTaskDeadlineElement,
  createTaskEstimateElement,
  createTaskFooterElement,
  createTaskMainElement,
  createTaskElement
}
