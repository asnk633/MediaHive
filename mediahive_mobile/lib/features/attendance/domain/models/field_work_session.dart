import 'package:freezed_annotation/freezed_annotation.dart';

part 'field_work_session.freezed.dart';
part 'field_work_session.g.dart';

/// State machine for field work sessions:
///   pending_approval → cancelled    (member cancels before manager acts)
///   pending_approval → approved     (manager approves)
///   pending_approval → auto_approved (manager timeout)
///   approved → active               (member departs)
///   auto_approved → active          (member departs)
///   active → completed              (member returns)
///   pending_approval → rejected     (manager rejects → grace period → checkout)
enum FieldWorkStatus {
  pendingApproval, // Waiting for manager decision
  approved,        // Manager approved, not yet departed
  active,          // Member has departed and is in the field
  rejected,        // Manager rejected, triggers grace period then checkout
  completed,       // Field work ended normally (member returned)
  autoApproved,    // Auto-approved after manager timeout
  cancelled,       // Member cancelled before manager acted
}

@freezed
class FieldWorkSession with _$FieldWorkSession {
  const FieldWorkSession._();

  const factory FieldWorkSession({
    required String id,
    required String attendanceId,
    required String userId,
    String? nfcTagId,
    required String startedAt,
    String? endedAt,
    String? returnTime,    // When member physically returned (distinct from endedAt)
    String? reason,
    @Default('pending_approval') String status, // 'pending_approval', 'approved', 'active', 'rejected', 'completed', 'auto_approved', 'cancelled'
    String? approvedBy,
    String? approvedAt,
    String? rejectionReason,
    String? managerNotifiedAt,
    @Default([]) List<Map<String, dynamic>> locationSnapshots, // Periodic GPS during field work
    required String createdAt,
    String? updatedAt,
  }) = _FieldWorkSession;

  factory FieldWorkSession.fromJson(Map<String, dynamic> json) =>
      _$FieldWorkSessionFromJson(json);

  /// Calculate current duration of field work session
  Duration get calculatedDuration {
    final start = DateTime.tryParse(startedAt) ?? DateTime.now();
    final end = endedAt != null
        ? (DateTime.tryParse(endedAt!) ?? DateTime.now())
        : DateTime.now();
    final diff = end.difference(start);
    return diff.isNegative ? Duration.zero : diff;
  }

  String get formattedDuration {
    final dur = calculatedDuration;
    final hours = dur.inHours;
    final minutes = dur.inMinutes.remainder(60);
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }

  /// Parse the status string into the enum
  FieldWorkStatus get statusEnum {
    switch (status) {
      case 'pending_approval':
        return FieldWorkStatus.pendingApproval;
      case 'approved':
        return FieldWorkStatus.approved;
      case 'active':
        return FieldWorkStatus.active;
      case 'rejected':
        return FieldWorkStatus.rejected;
      case 'completed':
        return FieldWorkStatus.completed;
      case 'auto_approved':
        return FieldWorkStatus.autoApproved;
      case 'cancelled':
        return FieldWorkStatus.cancelled;
      default:
        return FieldWorkStatus.pendingApproval;
    }
  }

  /// Whether this session is currently in the field (approved and departed)
  bool get isInField => status == 'active';

  /// Whether this session is active (not ended, not rejected, not cancelled)
  bool get isActive => endedAt == null && status != 'rejected' && status != 'cancelled';

  /// Whether manager action is pending
  bool get isPending => status == 'pending_approval';

  /// Whether the session was approved (manually or auto) but member hasn't departed yet
  bool get isApprovedNotDeparted => status == 'approved' || status == 'auto_approved';

  /// Whether the session was approved (at any stage)
  bool get isApproved => status == 'approved' || status == 'auto_approved' || status == 'active';

  /// Whether the session can be cancelled by the member
  bool get isCancellable => status == 'pending_approval';
}
