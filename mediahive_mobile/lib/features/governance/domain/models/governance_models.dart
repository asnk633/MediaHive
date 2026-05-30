
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
