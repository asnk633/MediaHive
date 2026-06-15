const rule = {
  target: 'task_priority',
  action: 'update'
};
const context = {
  action: 'update'
};
console.log(rule.target.toLowerCase().includes(context.action.toLowerCase()));
console.log(context.action.toLowerCase().includes(rule.action.toLowerCase()));
