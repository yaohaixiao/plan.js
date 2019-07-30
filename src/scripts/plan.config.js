'use strict'

export const TEMPLATES = [
  {
    name: '空模板',
    image: 'images/t-empty.png',
    value: 0,
    plans: []
  },
  {
    name: '演示模板',
    image: 'images/t-plan.png',
    value: 1,
    plans: [
      {
        id: 1,
        title: '分析 Plan 项目的用户需求',
        deadline: '2019-07-14',
        estimate: '3d',
        level: 0,
        desc: '- 于客户进行多轮沟通，收集尽可能多用户需求 \n- 并分析整理出项目计划',
        create: '2019-07-05',
        update: [],
        status: 3,
        archived: false,
        marked: true,
        delayed: false,
        deleted: false
      },
      {
        id: 2,
        title: '根据分析出的项目计划，整理产品设计方案',
        deadline: '2019-07-16',
        estimate: '1d',
        level: 1,
        desc: '根据项目计划，分析整理出的完整产品功能需求，出产品设计方案（功能需求，用户故事）',
        create: '2019-07-05',
        update: [],
        status: 2,
        archived: false,
        marked: false,
        delayed: false,
        deleted: false
      },
      {
        id: 3,
        title: '出 Plan 的 UI 设计稿',
        deadline: '2019-07-18',
        estimate: '3d',
        level: 1,
        desc: '根据功能需求和用户故事，设计出一套完整的系统 UI 界面',
        create: '2019-07-05',
        update: [],
        status: 1,
        archived: false,
        marked: false,
        delayed: false,
        deleted: false
      },
      {
        id: 4,
        title: '设计用户体验细节',
        deadline: '2019-07-18',
        estimate: '3d',
        level: 1,
        desc: '根据功能需求和用户故事以及 UI 设计图，设计出完整的用户体验细节',
        create: '2019-07-05',
        update: [],
        status: 0,
        archived: false,
        marked: true,
        delayed: false,
        deleted: false
      },
      {
        id: 5,
        title: '前端开发开发 HTML 交互原型',
        deadline: '2019-07-24',
        estimate: '3d',
        level: 1,
        desc: '前端工程师根据功能需求和用户故事，结合 UI 设计图和交互设计，开发出产品的交互原型',
        create: '2019-07-05',
        update: [],
        status: 0,
        archived: false,
        marked: true,
        delayed: false,
        deleted: true
      },
      {
        id: 6,
        title: '进行交互评审',
        deadline: '2019-07-28',
        estimate: '3d',
        level: 2,
        desc: '联系客户，对交互原型进行评审，根据反馈结果进行用户体验优化',
        create: '2019-07-15',
        update: [],
        status: 0,
        archived: false,
        marked: false,
        delayed: false,
        deleted: false
      },
      {
        id: 7,
        title: '前端开发最终的产品',
        deadline: '2019-08-01',
        estimate: '3d',
        level: 3,
        desc: '前端工程师开发出最终的 PlanV2 产品',
        create: '2019-07-15',
        update: [],
        status: 0,
        archived: false,
        marked: true,
        delayed: false,
        deleted: false
      },
      {
        id: 8,
        title: '交付客户，进行项目收尾',
        deadline: '2019-08-08',
        estimate: '3d',
        level: 3,
        desc: '将最终的产品交付给客户，项目结束',
        create: '2019-07-15',
        update: [],
        status: 0,
        archived: true,
        marked: true,
        delayed: false,
        deleted: false
      }
    ]
  }
]

export const THEMES = [
  {
    name: '蓝色',
    theme: 'theme-blue',
    color: 'blue',
    value: 0
  },
  {
    name: '绿色',
    theme: 'theme-green',
    color: 'green',
    value: 1
  },
  {
    name: '紫色',
    theme: 'theme-purple',
    color: 'purple',
    value: 2
  },
  {
    name: '红色',
    theme: 'theme-red',
    color: 'red',
    value: 3
  },
  {
    name: '靛蓝色',
    theme: 'theme-indigo',
    color: 'indigo',
    value: 4
  },
  {
    name: '墨绿色',
    theme: 'theme-teal',
    color: 'teal',
    value: 5
  },
  {
    name: '暗紫色',
    theme: 'theme-dark-purple',
    color: 'dark-purple',
    value: 6
  },
  {
    name: '粉色',
    theme: 'theme-pink',
    color: 'pink',
    value: 7
  }
]

export const STORAGE = [
  {
    name: '关闭',
    value: 0
  },
  {
    name: '启用',
    value: 1
  }
]

export const OPERATIONS = {
  add: {
    code: 0,
    text: '创建任务'
  },
  edit: {
    code: 1,
    text: '编辑任务'
  },
  mark: {
    code: 2,
    text: '标记任务'
  },
  unmark: {
    code: 3,
    text: '取消标记'
  },
  status: {
    code: 4,
    text: '更新状态'
  },
  remove: {
    code: 5,
    text: '移除任务'
  },
  replace: {
    code: 6,
    text: '还原任务'
  },
  archive: {
    code: 7,
    text: '任务归档'
  }
}
