
class Policy {
  final String id;
  final String title;
  final String description;
  final String iconName;
  final bool isActive;

  const Policy({
    required this.id,
    required this.title,
    required this.description,
    required this.iconName,
    this.isActive = true,
  });

  factory Policy.fromJson(Map<String, dynamic> json) => Policy(
    id: json['id'] as String,
    title: json['title'] as String,
    description: json['description'] as String,
    iconName: json['iconName'] as String,
    isActive: json['isActive'] as bool? ?? true,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'iconName': iconName,
    'isActive': isActive,
  };
}

class GovernanceLog {
  final String id;
  final String action;
  final String details;
  final String timestamp;

  const GovernanceLog({
    required this.id,
    required this.action,
    required this.details,
    required this.timestamp,
  });

  factory GovernanceLog.fromJson(Map<String, dynamic> json) => GovernanceLog(
    id: json['id'] as String,
    action: json['action'] as String,
    details: json['details'] as String,
    timestamp: json['timestamp'] as String,
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'action': action,
    'details': details,
    'timestamp': timestamp,
  };
}

class GovernanceStats {
  final int activeRulesCount;
  final int auditEventsCount;
  final double adminPercentage;
  final double managerPercentage;
  final double teamPercentage;

  const GovernanceStats({
    required this.activeRulesCount,
    required this.auditEventsCount,
    required this.adminPercentage,
    required this.managerPercentage,
    required this.teamPercentage,
  });

  factory GovernanceStats.empty() => const GovernanceStats(
        activeRulesCount: 0,
        auditEventsCount: 0,
        adminPercentage: 0.0,
        managerPercentage: 0.0,
        teamPercentage: 0.0,
      );
}
