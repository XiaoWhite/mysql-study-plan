export const weeks = [
  {
    title: '表与数据模型',
    description: '认识电商表之间的关系，判断字段类型和约束如何保护数据。',
    icon: 'tables',
    lessons: [
      ['relational-tables', '关系表与主外键'],
      ['types-and-null', '字段类型与 NULL'],
      ['constraints', '约束与表结构取舍'],
    ],
  },
  {
    title: '查询与结果',
    description: '推演订单列表的结果，找出重复、漏行和分页不稳定的原因。',
    icon: 'query',
    lessons: [
      ['filter-sort-page', '筛选、排序和分页'],
      ['joins', 'JOIN 与结果行数'],
      ['aggregation', '分组、聚合与去重'],
    ],
  },
  {
    title: '索引与性能',
    description: '从筛选条件、排序和执行计划判断该加什么索引。',
    icon: 'chart',
    lessons: [
      ['innodb-indexes', 'InnoDB 主键与二级索引'],
      ['composite-indexes', '联合索引和覆盖索引'],
      ['explain', 'EXPLAIN 与慢查询排查'],
    ],
  },
  {
    title: '事务与并发',
    description: '逐步推演两个请求同时扣库存，理解锁、事务边界和重试。',
    icon: 'layers',
    lessons: [
      ['acid', 'ACID、提交与回滚'],
      ['isolation-mvcc', '隔离级别与 MVCC'],
      ['locks-deadlocks', '行锁、死锁与重试'],
    ],
  },
  {
    title: 'Node.js 接入',
    description: '审阅订单接口中的连接池、参数绑定和幂等处理。',
    icon: 'code',
    lessons: [
      ['connection-pool', 'mysql2/promise 与连接池'],
      ['parameters-and-errors', '参数绑定、错误处理与连接释放'],
      ['transaction-idempotency', '事务连接与接口幂等'],
    ],
  },
  {
    title: '生产常识与综合审阅',
    description: '评估数据库变更和故障风险，用整套知识审阅一个订单模块。',
    icon: 'check',
    lessons: [
      ['backup-permissions', '备份恢复与权限'],
      ['migrations-replication', '表结构变更与主从延迟'],
      ['order-module-review', '订单模块综合审阅'],
    ],
  },
].map((week, index) => ({
  ...week,
  number: index + 1,
  lessons: week.lessons.map(([id, title]) => ({ id, title, week: index + 1 })),
}));

export const lessons = weeks.flatMap((week) => week.lessons);
export const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));
export const lessonLink = (id) => `#/lesson/${id}`;
