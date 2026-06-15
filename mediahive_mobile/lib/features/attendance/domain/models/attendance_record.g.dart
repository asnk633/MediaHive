// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'attendance_record.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$AttendanceRecordImpl _$$AttendanceRecordImplFromJson(
        Map<String, dynamic> json) =>
    _$AttendanceRecordImpl(
      id: json['id'] as String,
      userId: json['userId'] as String,
      userName: json['userName'] as String,
      nfcTagId: json['nfcTagId'] as String?,
      checkInTime: json['checkInTime'] as String,
      checkOutTime: json['checkOutTime'] as String?,
      checkInSource: json['checkInSource'] as String? ?? 'nfc',
      checkOutSource: json['checkOutSource'] as String?,
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      deviceId: json['deviceId'] as String?,
      deviceName: json['deviceName'] as String?,
      checkOutDeviceId: json['checkOutDeviceId'] as String?,
      checkOutDeviceName: json['checkOutDeviceName'] as String?,
      campusId: json['campusId'] as String?,
      campusName: json['campusName'] as String?,
      isHoliday: json['isHoliday'] as bool? ?? false,
      isWeekend: json['isWeekend'] as bool? ?? false,
      attendanceState: json['attendanceState'] as String? ?? 'active',
      workMode: json['workMode'] as String? ?? 'office',
      lastKnownWorkLocation: json['lastKnownWorkLocation'] as String?,
      assignmentId: json['assignmentId'] as String?,
      closeReason: json['closeReason'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$$AttendanceRecordImplToJson(
        _$AttendanceRecordImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'userId': instance.userId,
      'userName': instance.userName,
      'nfcTagId': instance.nfcTagId,
      'checkInTime': instance.checkInTime,
      'checkOutTime': instance.checkOutTime,
      'checkInSource': instance.checkInSource,
      'checkOutSource': instance.checkOutSource,
      'latitude': instance.latitude,
      'longitude': instance.longitude,
      'deviceId': instance.deviceId,
      'deviceName': instance.deviceName,
      'checkOutDeviceId': instance.checkOutDeviceId,
      'checkOutDeviceName': instance.checkOutDeviceName,
      'campusId': instance.campusId,
      'campusName': instance.campusName,
      'isHoliday': instance.isHoliday,
      'isWeekend': instance.isWeekend,
      'attendanceState': instance.attendanceState,
      'workMode': instance.workMode,
      'lastKnownWorkLocation': instance.lastKnownWorkLocation,
      'assignmentId': instance.assignmentId,
      'closeReason': instance.closeReason,
      'createdAt': instance.createdAt,
    };
