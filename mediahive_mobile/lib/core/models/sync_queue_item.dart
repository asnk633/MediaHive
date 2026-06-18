class SyncQueueItem {
  final String id;
  final String entity;
  final String entityId;
  final Map<String, dynamic> mutation;
  final DateTime timestamp;
  final String status;
  final int retries;
  final Map<String, dynamic>? conflictData;

  const SyncQueueItem({
    required this.id,
    required this.entity,
    required this.entityId,
    required this.mutation,
    required this.timestamp,
    this.status = 'pending',
    this.retries = 0,
    this.conflictData,
  });

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      id: json['id'] as String,
      entity: json['entity'] as String,
      entityId: json['entityId'] as String,
      mutation: Map<String, dynamic>.from(json['mutation'] as Map),
      timestamp: DateTime.parse(json['timestamp'] as String),
      status: json['status'] as String? ?? 'pending',
      retries: json['retries'] as int? ?? 0,
      conflictData: json['conflictData'] != null
          ? Map<String, dynamic>.from(json['conflictData'] as Map)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'entity': entity,
      'entityId': entityId,
      'mutation': mutation,
      'timestamp': timestamp.toIso8601String(),
      'status': status,
      'retries': retries,
      if (conflictData != null) 'conflictData': conflictData,
    };
  }

  SyncQueueItem copyWith({
    String? id,
    String? entity,
    String? entityId,
    Map<String, dynamic>? mutation,
    DateTime? timestamp,
    String? status,
    int? retries,
    Map<String, dynamic>? conflictData,
  }) {
    return SyncQueueItem(
      id: id ?? this.id,
      entity: entity ?? this.entity,
      entityId: entityId ?? this.entityId,
      mutation: mutation ?? this.mutation,
      timestamp: timestamp ?? this.timestamp,
      status: status ?? this.status,
      retries: retries ?? this.retries,
      conflictData: conflictData ?? this.conflictData,
    );
  }
}
