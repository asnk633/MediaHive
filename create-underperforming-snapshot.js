const Database = require('better-sqlite3');
const db = new Database('dev.db');

// Create a snapshot for user ID 1 with low IPS score (< 60) for the current period
const currentPeriod = '2026-01';

// Delete existing snapshot for this period to avoid conflicts
db.prepare(`
  DELETE FROM performance_snapshots 
  WHERE user_id = 1 AND period = ?
`).run(currentPeriod);

// Insert new snapshot with low IPS score
const insert = db.prepare(`
  INSERT INTO performance_snapshots (
    user_id, period, individual_performance_score, performance_status,
    assigned_tasks, completed_tasks, overdue_tasks, avg_daily_hours,
    generated_at, tenant_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insert.run(
  1,                          // user_id
  currentPeriod,              // period
  0.45,                       // individual_performance_score (45%)
  'underperforming',          // performance_status
  10,                         // assigned_tasks
  4,                          // completed_tasks
  5,                          // overdue_tasks
  6.5,                        // avg_daily_hours
  new Date().toISOString(),   // generated_at
  1                           // tenant_id
);

console.log('✅ Created underperforming snapshot for user ID 1');
console.log('   Period:', currentPeriod);
console.log('   IPS Score: 45%');
console.log('   Status: Underperforming');

// Verify the data
const snapshots = db.prepare(`
  SELECT ps.*, u.full_name 
  FROM performance_snapshots ps 
  JOIN users u ON ps.user_id = u.id 
  WHERE ps.user_id = 1 
  ORDER BY ps.period DESC 
  LIMIT 3
`).all();

console.log('\n📊 Latest snapshots for user ID 1:');
snapshots.forEach(s => {
  console.log(`   ${s.period}: IPS=${Math.round(s.individual_performance_score * 100)}%, Status=${s.performance_status}`);
});

db.close();
