// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$TaskImpl _$$TaskImplFromJson(Map<String, dynamic> json) => _$TaskImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      status: json['status'] as String,
      priority: json['priority'] as String,
      requester: json['requester'] as String,
      assignee: json['assignee'] as String,
      dueDate: json['dueDate'] as String,
      createdBy: json['createdBy'] as String?,
      createdAt: json['createdAt'] as String?,
      completionDate: json['completionDate'] as String?,
      description: json['description'] as String?,
      onBehalfOf: json['onBehalfOf'] as String?,
      completedByName: json['completedByName'] as String?,
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      eventId: json['eventId'] as String?,
      isBlocked: json['isBlocked'] as bool? ?? false,
      blockedBy: json['blockedBy'] as String?,
      requiresReview: json['requiresReview'] as bool? ?? false,
      department: json['department'] as String?,
    );

Map<String, dynamic> _$$TaskImplToJson(_$TaskImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'status': instance.status,
      'priority': instance.priority,
      'requester': instance.requester,
      'assignee': instance.assignee,
      'dueDate': instance.dueDate,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt,
      'completionDate': instance.completionDate,
      'description': instance.description,
      'onBehalfOf': instance.onBehalfOf,
      'completedByName': instance.completedByName,
      'attachments': instance.attachments,
      'eventId': instance.eventId,
      'isBlocked': instance.isBlocked,
      'blockedBy': instance.blockedBy,
      'requiresReview': instance.requiresReview,
      'department': instance.department,
    };
