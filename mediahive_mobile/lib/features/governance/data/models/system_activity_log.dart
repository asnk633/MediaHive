import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class SystemActivityLog {
  final String id;
  final String title;
  final String description;
  final String actionType;
  final String actorName;
  final String? actorId;
  final DateTime createdAt;

  SystemActivityLog({
    required this.id,
    required this.title,
    required this.description,
    required this.actionType,
    required this.actorName,
    this.actorId,
    required this.createdAt,
  });

  factory SystemActivityLog.fromJson(Map<String, dynamic> json) {
    return SystemActivityLog(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String? ?? '',
      actionType: json['action_type'] as String,
      actorName: json['actor_name'] as String,
      actorId: json['actor_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'action_type': actionType,
      'actor_name': actorName,
      'actor_id': actorId,
      'created_at': createdAt.toUtc().toIso8601String(),
    };
  }

  IconData getIconForType() {
    switch (actionType.toLowerCase()) {
      case 'security':
        return LucideIcons.shieldAlert;
      case 'onboarding':
      case 'institution':
        return LucideIcons.building2;
      case 'system':
      case 'infrastructure':
        return LucideIcons.refreshCw;
      case 'user':
        return LucideIcons.userPlus;
      case 'error':
        return LucideIcons.alertTriangle;
      default:
        return LucideIcons.activity;
    }
  }
}
