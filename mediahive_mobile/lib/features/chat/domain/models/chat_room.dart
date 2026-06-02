class ChatRoom {
  final String id;
  final String? name;
  final bool isMediaTeamOnly;
  final String? tenantId;
  final String? createdBy;
  final DateTime? lastMessageTime;
  final String? lastMessagePreview;
  final DateTime createdAt;
  final String? iconUrl;
  
  // Non-database fields resolved for UI convenience
  final String? displayName;
  final String? displayAvatar;
  final int unreadCount;

  ChatRoom({
    required this.id,
    this.name,
    required this.isMediaTeamOnly,
    this.tenantId,
    this.createdBy,
    this.lastMessageTime,
    this.lastMessagePreview,
    required this.createdAt,
    this.iconUrl,
    this.displayName,
    this.displayAvatar,
    this.unreadCount = 0,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json, {String? displayName, String? displayAvatar, int unreadCount = 0}) {
    return ChatRoom(
      id: json['id'] as String,
      name: json['name'] as String?,
      isMediaTeamOnly: json['is_media_team_only'] as bool? ?? false,
      tenantId: json['tenant_id'] as String?,
      createdBy: json['created_by'] as String?,
      lastMessageTime: json['last_message_time'] != null
          ? DateTime.parse(json['last_message_time'] as String).toLocal()
          : null,
      lastMessagePreview: json['last_message_preview'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      iconUrl: json['icon_url'] as String?,
      displayName: displayName,
      displayAvatar: displayAvatar,
      unreadCount: unreadCount,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'is_media_team_only': isMediaTeamOnly,
      'tenant_id': tenantId,
      'created_by': createdBy,
      'last_message_time': lastMessageTime?.toIso8601String(),
      'last_message_preview': lastMessagePreview,
      'created_at': createdAt.toIso8601String(),
      'icon_url': iconUrl,
    };
  }

  ChatRoom copyWith({
    String? displayName,
    String? displayAvatar,
    String? lastMessagePreview,
    DateTime? lastMessageTime,
    int? unreadCount,
  }) {
    return ChatRoom(
      id: id,
      name: name,
      isMediaTeamOnly: isMediaTeamOnly,
      tenantId: tenantId,
      createdBy: createdBy,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
      lastMessagePreview: lastMessagePreview ?? this.lastMessagePreview,
      createdAt: createdAt,
      iconUrl: iconUrl,
      displayName: displayName ?? this.displayName,
      displayAvatar: displayAvatar ?? this.displayAvatar,
      unreadCount: unreadCount ?? this.unreadCount,
    );
  }
}

class ChatParticipant {
  final String id;
  final String roomId;
  final String userId;
  final String? role;
  final String? addedBy;
  final String? tenantId;
  final DateTime createdAt;

  ChatParticipant({
    required this.id,
    required this.roomId,
    required this.userId,
    this.role,
    this.addedBy,
    this.tenantId,
    required this.createdAt,
  });

  factory ChatParticipant.fromJson(Map<String, dynamic> json) {
    return ChatParticipant(
      id: json['id'] as String,
      roomId: json['room_id'] as String,
      userId: json['user_id'] as String,
      role: json['role'] as String?,
      addedBy: json['added_by'] as String?,
      tenantId: json['tenant_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'room_id': roomId,
      'user_id': userId,
      'role': role,
      'added_by': addedBy,
      'tenant_id': tenantId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

class ChatMessage {
  final String id;
  final String roomId;
  final String senderId;
  final String text;
  final String? mediaUrl;
  final String? mediaType;
  final String? driveFileId;
  final String? tenantId;
  final DateTime createdAt;
  final bool isEdited;
  final bool isDeleted;
  final String? status; // 'sending', 'sent', 'error'

  // Resolve sender details for UI
  final String? senderName;
  final String? senderAvatar;

  ChatMessage({
    required this.id,
    required this.roomId,
    required this.senderId,
    required this.text,
    this.mediaUrl,
    this.mediaType,
    this.driveFileId,
    this.tenantId,
    required this.createdAt,
    this.isEdited = false,
    this.isDeleted = false,
    this.status,
    this.senderName,
    this.senderAvatar,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json, {String? senderName, String? senderAvatar}) {
    return ChatMessage(
      id: json['id'] as String,
      roomId: json['room_id'] as String,
      senderId: json['sender_id'] as String,
      text: json['text'] as String? ?? '',
      mediaUrl: json['media_url'] as String?,
      mediaType: json['media_type'] as String?,
      driveFileId: json['drive_file_id'] as String?,
      tenantId: json['tenant_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String).toLocal(),
      isEdited: json['is_edited'] as bool? ?? false,
      isDeleted: json['is_deleted'] as bool? ?? false,
      status: json['status'] as String?,
      senderName: senderName,
      senderAvatar: senderAvatar,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'room_id': roomId,
      'sender_id': senderId,
      'text': text,
      'media_url': mediaUrl,
      'media_type': mediaType,
      'drive_file_id': driveFileId,
      'tenant_id': tenantId,
      'created_at': createdAt.toIso8601String(),
      'is_edited': isEdited,
      'is_deleted': isDeleted,
      'status': status,
    };
  }
}
