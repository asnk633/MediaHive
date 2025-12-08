# Disaster Recovery Runbook

## Overview

This document provides procedures for backup, multi-region synchronization, and disaster recovery for the Thaiba Garden Media Manager application.

## RTO/RPO Objectives

### Recovery Time Objective (RTO)
- **Primary Database Failure**: 15 minutes
- **Complete Data Center Outage**: 1 hour
- **Application Server Failure**: 5 minutes

### Recovery Point Objective (RPO)
- **Data Loss**: Maximum 5 minutes of data
- **Backup Frequency**: Nightly full backups with continuous WAL replication

## Backup Procedures

### Nightly Database Backups

Backups are performed automatically every night at 2:00 AM UTC via GitHub Actions workflow.

#### Backup Process
1. Export database as SQL dump using [scripts/backup/export-db.js](file:///d:/Thaiba%20Garden%20Media%20Manager-Orchids/scripts/backup/export-db.js)
2. Store backup as GitHub Action artifact with 30-day retention
3. Verify backup integrity

#### Manual Backup
```bash
# SQL format backup
node scripts/backup/export-db.js --format sql --output backup-$(date -u +"%Y%m%d-%H%M%S").sql

# Data directory backup
node scripts/backup/export-db.js --format data --output backup-$(date -u +"%Y%m%d-%H%M%S")
```

### Restore from Backup

#### Restore Process
1. Stop application services
2. Restore database from backup file
3. Start application services
4. Verify data integrity

#### Manual Restore
```bash
# SQL format restore
node scripts/backup/import-db.js --format sql --input backup-file.sql

# Data directory restore
node scripts/backup/import-db.js --format data --input backup-directory/
```

## Replication Setup

### Multi-Region Synchronization

The application uses WAL (Write-Ahead Logging) based replication to synchronize data between primary and secondary databases.

#### Replication Endpoints
- `/api/replication/export` - Export WAL events
- `/api/replication/ingest` - Ingest WAL events
- `/api/replication/status` - Check replication status

#### Local Replication Worker
For development and testing, a local replication worker is available:
```bash
# Run replication worker continuously
node scripts/replication-worker.js

# Run replication worker once
node scripts/replication-worker.js --once

# Run with custom interval (seconds)
node scripts/replication-worker.js --interval 60
```

## Failover Procedures

### Automatic Failover Detection

The system monitors database health through:
- `/api/health` - Basic health checks
- `/api/health/ready` - Readiness checks including replication status

### Manual Failover

When automatic failover is not triggered or fails, perform manual failover:

1. **Stop replication to primary**
   ```bash
   # This would be done by stopping the replication worker
   ```

2. **Promote secondary database**
   ```bash
   node scripts/failover/promote.js --dry-run  # Test first
   node scripts/failover/promote.js           # Execute promotion
   ```

3. **Update application configuration**
   The promote script automatically updates the .env file to point to the secondary database.

4. **Restart application services**
   ```bash
   npm run restart  # Or your deployment-specific restart command
   ```

5. **Verify promoted database health**
   ```bash
   curl http://localhost:3000/api/health
   curl http://localhost:3000/api/health/ready
   ```

### Failback Procedures

After the primary database is restored:

1. **Demote former primary to secondary**
2. **Update replication configuration**
3. **Resume normal replication**

## Verification Procedures

### Backup Verification

1. Check GitHub Actions for successful backup runs
2. Verify backup file existence and size
3. Perform periodic restore tests

### Replication Verification

1. Check `/api/replication/status` endpoint
2. Monitor audit logs for consistency
3. Verify row counts between primary and secondary

### Failover Verification

1. Test failover script with `--dry-run` flag
2. Perform controlled failover drills
3. Verify application functionality after failover

## Monitoring and Alerts

### Health Checks

- Database connectivity
- Replication lag
- Application responsiveness
- Storage availability

### Alerting Thresholds

- Replication lag > 5 minutes
- Database unavailable for > 30 seconds
- Storage usage > 80%

## Contact Information

### Primary Contacts
- DevOps Team: devops@thaibagarden.com
- Database Administrator: dba@thaibagarden.com
- Application Support: support@thaibagarden.com

### Escalation Procedures
1. DevOps Team (24/7)
2. Database Administrator (Business hours)
3. Management (Outside business hours)

## Appendices

### Environment Variables

Required environment variables for replication and failover:

```bash
# Primary database
TURSO_CONNECTION_URL=libsql://primary-db.thaibagarden.com
TURSO_AUTH_TOKEN=primary-token

# Secondary database
TURSO_SECONDARY_URL=libsql://secondary-db.thaibagarden.com
TURSO_SECONDARY_AUTH_TOKEN=secondary-token
```

### Common Issues and Resolutions

#### Replication Lag
- **Symptom**: High lag in `/api/replication/status`
- **Resolution**: Check network connectivity, restart replication worker

#### Backup Failure
- **Symptom**: Failed GitHub Actions workflow
- **Resolution**: Check database connectivity, verify credentials

#### Failover Failure
- **Symptom**: Application unresponsive after failover
- **Resolution**: Check environment variables, verify secondary database status

### Testing Schedule

| Test Type | Frequency | Responsible Team |
|-----------|-----------|------------------|
| Backup Verification | Daily | DevOps |
| Failover Drill | Monthly | DevOps |
| Full DR Test | Quarterly | DevOps + DBA |