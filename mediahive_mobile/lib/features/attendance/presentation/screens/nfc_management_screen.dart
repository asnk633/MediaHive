import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart' as latlong;
import 'package:uuid/uuid.dart';
import 'package:nfc_manager/nfc_manager.dart';
import 'package:nfc_manager_ndef/nfc_manager_ndef.dart';
import 'package:nfc_manager/ndef_record.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:gal/gal.dart';
import 'package:share_plus/share_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:network_info_plus/network_info_plus.dart';

import 'package:mediahive_mobile/core/theme/app_colors.dart';
import 'package:mediahive_mobile/core/theme/app_typography.dart';
import 'package:mediahive_mobile/core/theme/elastic_scroll_physics.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/shared/widgets/mh_loading.dart';
import 'package:mediahive_mobile/shared/widgets/mh_refresh_indicator.dart';
import 'package:mediahive_mobile/features/attendance/domain/models/nfc_tag.dart' as domain;
import 'package:mediahive_mobile/features/attendance/presentation/providers/attendance_provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mediahive_mobile/features/attendance/data/services/qr_signature_service.dart';
import 'package:mediahive_mobile/core/providers/user_provider.dart';


class NfcManagementScreen extends ConsumerStatefulWidget {
  const NfcManagementScreen({super.key});

  @override
  ConsumerState<NfcManagementScreen> createState() =>
      _NfcManagementScreenState();
}

class _NfcManagementScreenState extends ConsumerState<NfcManagementScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _tagIdController = TextEditingController();
  final _campusNameController = TextEditingController();
  final _campusIdController = TextEditingController();
  final _locationGroupController = TextEditingController();
  final _wifiSsidsController = TextEditingController();
  bool _isCapturingLocation = false;
  double _latitude = 0.0;
  double _longitude = 0.0;
  double _radius = 75.0;
  double _accuracy = 0.0;
  bool _isLocationConfirmed = false;
  String _gpsProgress = "";
  String _tagType = 'attendance';
  bool _isSubmitting = false;
  bool _biometricsLoading = false;
  bool _showSatellite = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(nfcRegistryActiveProvider.notifier).state = true;
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _tagIdController.dispose();
    _campusNameController.dispose();
    _campusIdController.dispose();
    _locationGroupController.dispose();
    _wifiSsidsController.dispose();
    // Reset nfc registry active state
    try {
      ref.read(nfcRegistryActiveProvider.notifier).state = false;
    } catch (_) {}
    super.dispose();
  }

  Future<void> _captureLocationGeneric({
    required StateSetter setSheetState,
    required Function(bool isCapturing, String progress) onProgress,
    required Function(double lat, double lng, double accuracy) onSuccess,
    required Function(String errorMsg) onError,
  }) async {
    final colors = ref.read(themeColorsProvider);
    onProgress(true, "Initializing high-accuracy GPS...");
    setSheetState(() {});

    try {
      // 1. Check if location services are enabled
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        onProgress(false, "");
        setSheetState(() {});
        if (mounted) {
          showDialog(
            context: context,
            builder: (dialogCtx) => AlertDialog(
              backgroundColor: colors.backgroundSecondary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                'Location Services Disabled',
                style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              content: Text(
                'Enable Location Services to capture tag coordinates.',
                style: TextStyle(color: colors.textSecondary, fontSize: 13),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(dialogCtx),
                  child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
                ),
                TextButton(
                  onPressed: () async {
                    Navigator.pop(dialogCtx);
                    await Geolocator.openLocationSettings();
                  },
                  child: Text('Open Settings', style: TextStyle(color: colors.honey, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          );
        }
        return;
      }

      // 2. Check current permission status
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          onError('Location permission denied');
          return;
        }
      }
      
      if (permission == LocationPermission.deniedForever) {
        onError('Location permissions are permanently denied. Please enable them in your system settings.');
        return;
      }

      // 3. Stream position for 7 seconds to stabilize
      Position? bestPosition;
      StreamSubscription<Position>? subscription;

      final completer = Completer<void>();
      final startTime = DateTime.now();

      // Setup a periodic timer to update status text
      final progressTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        final elapsed = DateTime.now().difference(startTime).inSeconds;
        if (elapsed >= 7) {
          timer.cancel();
          if (!completer.isCompleted) completer.complete();
        } else {
          onProgress(
            true,
            "Stabilizing GPS ($elapsed/7s)... Best accuracy: ${bestPosition != null ? '±${bestPosition!.accuracy.toStringAsFixed(1)}m' : 'Waiting...'}"
          );
          setSheetState(() {});
        }
      });

      subscription = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: 0,
        ),
      ).listen((Position pos) {
        if (bestPosition == null || pos.accuracy < bestPosition!.accuracy) {
          bestPosition = pos;
        }
      });

      // Wait 7 seconds
      await Future.any([
        completer.future,
        Future.delayed(const Duration(seconds: 7)),
      ]);

      await subscription.cancel();
      progressTimer.cancel();

      if (bestPosition == null) {
        throw Exception('Could not obtain any GPS readings. Please ensure you are outdoors or near a window.');
      }

      final pos = bestPosition!;

      // Validation Rules:
      // - Accuracy > 25m: block registration.
      if (pos.accuracy > 25.0) {
        onError('GPS accuracy is too poor (±${pos.accuracy.toStringAsFixed(1)}m). Accuracy must be under 25m.');
        return;
      }

      onSuccess(pos.latitude, pos.longitude, pos.accuracy);
      setSheetState(() {});
      
      if (mounted) {
        if (pos.accuracy > 15.0) {
          _showSnack(
            colors,
            'Warning: GPS accuracy is ±${pos.accuracy.toStringAsFixed(1)}m (target is <= 15m). Geofence check-ins might be unreliable.',
            isSuccess: false,
          );
        } else {
          _showSnack(colors, 'Location stabilized successfully! Accuracy: ±${pos.accuracy.toStringAsFixed(1)}m', isSuccess: true);
        }
      }
    } catch (e) {
      onError('Failed to get location: $e');
    } finally {
      onProgress(false, "");
      setSheetState(() {});
    }
  }

  Future<void> _captureLocation(StateSetter setSheetState) async {
    await _captureLocationGeneric(
      setSheetState: setSheetState,
      onProgress: (isCapturing, progress) {
        setState(() {
          _isCapturingLocation = isCapturing;
          _gpsProgress = progress;
        });
      },
      onSuccess: (lat, lng, acc) {
        setState(() {
          _latitude = lat;
          _longitude = lng;
          _accuracy = acc;
          _isLocationConfirmed = true;
        });
      },
      onError: (err) {
        final colors = ref.read(themeColorsProvider);
        _showSnack(colors, err);
      },
    );
  }

  void _openMapPicker({
    required BuildContext context,
    required ThemeColors colors,
    required StateSetter setSheetState,
    required double initialLatitude,
    required double initialLongitude,
    required double initialRadius,
    required Function(double lat, double lng) onConfirm,
  }) {
    final mapController = MapController();
    latlong.LatLng mapCenter = latlong.LatLng(
      initialLatitude != 0.0 ? initialLatitude : 25.313183,
      initialLongitude != 0.0 ? initialLongitude : 88.606451,
    );

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (dialogCtx, setDialogState) {
            return Dialog(
              backgroundColor: colors.backgroundSecondary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: SizedBox(
                  width: double.infinity,
                  height: 480,
                  child: Stack(
                    children: [
                      FlutterMap(
                        mapController: mapController,
                        options: MapOptions(
                          initialCenter: mapCenter,
                          initialZoom: 16.0,
                          onPositionChanged: (position, hasGesture) {
                            if (position.center != null) {
                              setDialogState(() {
                                mapCenter = position.center!;
                              });
                            }
                          },
                        ),
                        children: [
                          TileLayer(
                            urlTemplate: _showSatellite
                                ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                                : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                            userAgentPackageName: 'com.mediahive.app',
                          ),
                          CircleLayer(
                            circles: [
                              CircleMarker(
                                point: mapCenter,
                                radius: initialRadius,
                                useRadiusInMeter: true,
                                color: colors.honey.withValues(alpha: 0.15),
                                borderColor: colors.honey,
                                borderStrokeWidth: 1.5,
                              ),
                            ],
                          ),
                        ],
                      ),
                      IgnorePointer(
                        child: Center(
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 24),
                            child: Icon(LucideIcons.mapPin, color: colors.honey, size: 40),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 16,
                        left: 16,
                        right: 16,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                          decoration: BoxDecoration(
                            color: colors.backgroundSecondary.withValues(alpha: 0.9),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: colors.border),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'DRAG MAP TO PLACE PIN',
                                style: TextStyle(color: colors.honey, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                '${mapCenter.latitude.toStringAsFixed(6)}, ${mapCenter.longitude.toStringAsFixed(6)}',
                                style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                              ),
                            ],
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 130,
                        right: 16,
                        child: FloatingActionButton(
                          mini: true,
                          backgroundColor: colors.honey,
                          foregroundColor: colors.backgroundPrimary,
                          onPressed: () {
                            setDialogState(() {
                              _showSatellite = !_showSatellite;
                            });
                          },
                          child: Icon(
                            _showSatellite ? LucideIcons.map : LucideIcons.globe,
                            size: 18,
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 80,
                        right: 16,
                        child: FloatingActionButton(
                          mini: true,
                          backgroundColor: colors.honey,
                          foregroundColor: colors.backgroundPrimary,
                          onPressed: () async {
                            try {
                              final pos = await Geolocator.getCurrentPosition(
                                desiredAccuracy: LocationAccuracy.high,
                                timeLimit: const Duration(seconds: 5),
                              );
                              mapController.move(latlong.LatLng(pos.latitude, pos.longitude), 16.0);
                              setDialogState(() {
                                mapCenter = latlong.LatLng(pos.latitude, pos.longitude);
                              });
                            } catch (_) {}
                          },
                          child: const Icon(LucideIcons.locateFixed, size: 18),
                        ),
                      ),
                      Positioned(
                        bottom: 16,
                        left: 16,
                        right: 16,
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: colors.honey,
                            foregroundColor: colors.backgroundPrimary,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            elevation: 0,
                          ),
                          onPressed: () {
                            onConfirm(mapCenter.latitude, mapCenter.longitude);
                            Navigator.pop(dialogCtx);
                          },
                          child: const Text(
                            'CONFIRM LOCATION PIN',
                            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
  }

  Future<void> _registerTag() async {
    if (_formKey.currentState?.validate() != true) return;
    final colors = ref.read(themeColorsProvider);
    if (_latitude == 0.0 && _longitude == 0.0) {
      _showSnack(colors, 'Please select location on map first');
      return;
    }
    if (!_isLocationConfirmed) {
      _showSnack(colors, 'Please lock and confirm coordinates before saving');
      return;
    }
    setState(() => _isSubmitting = true);
    try {
      final campusName = _campusNameController.text.trim();
      final locationGroup = _locationGroupController.text.trim();
      final wifiSsids = _wifiSsidsController.text.trim();
      String? campusId = _campusIdController.text.trim();

      if (campusId.isEmpty && campusName.isNotEmpty) {
        campusId = const Uuid().v4();
      } else if (campusId.isEmpty) {
        campusId = null;
      }

      final repo = ref.read(attendanceRepositoryProvider);
      await repo.registerTag({
        'tagName': _nameController.text.trim(),
        'tagId': _tagIdController.text.trim(),
        'tagType': _tagType,
        'latitude': _latitude,
        'longitude': _longitude,
        'radius': _radius,
        'accuracy': _accuracy,
        'active': true,
        'campusId': campusId,
        'campusName': campusName.isNotEmpty ? campusName : null,
        'locationGroup': locationGroup.isNotEmpty ? locationGroup : null,
        'wifi_ssids': wifiSsids.isNotEmpty ? wifiSsids : null,
        'deletedAt': null,
      });

      if (mounted) {
        ref.invalidate(allNfcTagsProvider);
        ref.invalidate(activeNfcTagsProvider);
        _nameController.clear();
        _tagIdController.clear();
        _campusNameController.clear();
        _campusIdController.clear();
        _locationGroupController.clear();
        _wifiSsidsController.clear();
        setState(() {
          _latitude = 0.0;
          _longitude = 0.0;
          _radius = 75.0;
          _accuracy = 0.0;
          _isLocationConfirmed = false;
          _tagType = 'attendance';
        });
        _showSnack(colors, 'NFC tag registered successfully', isSuccess: true);
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) _showSnack(colors, 'Registration failed: $e');
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  void _showSnack(ThemeColors colors, String msg, {bool isSuccess = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(msg, style: const TextStyle(fontSize: 12)),
        backgroundColor: isSuccess ? AppColors.success : AppColors.error,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final tagsAsync = ref.watch(allNfcTagsProvider);
    final biometricsAsync = ref.watch(attendanceBiometricsRequiredProvider);
    final profileAsync = ref.watch(currentUserProfileProvider);
    
    final role = profileAsync.maybeWhen(
      data: (p) => (p?['role']?.toString() ?? 'member').toLowerCase().trim(),
      orElse: () => 'member',
    );
    final isAdmin = role == 'admin';

    return Scaffold(
      backgroundColor: colors.backgroundPrimary,
      body: Stack(
        children: [
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [colors.backgroundSecondary, colors.backgroundPrimary],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
            child: MhRefreshIndicator(
              edgeOffset: 140,
              onRefresh: () async {
                ref.invalidate(allNfcTagsProvider);
                ref.invalidate(attendanceBiometricsRequiredProvider);
                await Future.delayed(const Duration(milliseconds: 600));
              },
              child: CustomScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: ElasticScrollPhysics()),
                slivers: [
                  SliverPadding(
                    padding: EdgeInsets.fromLTRB(
                        20, 100 + MediaQuery.of(context).padding.top, 20, 120),
                    sliver: SliverList(
                      delegate: SliverChildListDelegate([
                        _buildHeader(context, colors),
                        const SizedBox(height: 24),
                        // Biometrics toggle card
                        biometricsAsync.when(
                          data: (required) => _buildBiometricsToggle(colors, required),
                          loading: () => const MhLoading(size: 60),
                          error: (_, __) => const SizedBox.shrink(),
                        ),
                        const SizedBox(height: 24),
                        // Tags list
                        tagsAsync.when(
                          data: (tags) => _buildTagsList(context, colors, tags),
                          loading: () => const MhLoading(size: 100),
                          error: (e, _) => _buildErrorCard(colors, e.toString()),
                        ),
                      ]),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (isAdmin)
            Positioned(
              bottom: 140,
              right: 20,
              child: FloatingActionButton.extended(
                onPressed: () => _showRegisterSheet(context, colors),
                backgroundColor: colors.honey,
                foregroundColor: colors.backgroundPrimary,
                icon: const Icon(LucideIcons.plus, size: 18),
                label: const Text('REGISTER TAG', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5)),
              ),
            ),
        ],
      ),
    );
  }

  // ─── Header ────────────────────────────────────────────────────────────────
  Widget _buildHeader(BuildContext context, ThemeColors colors) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('NFC REGISTRY', style: AppTypography.h1.copyWith(color: colors.textPrimary)),
              const SizedBox(height: 4),
              Text(
                'MANAGE TAGS & ACCESS CONFIG',
                style: AppTypography.caption.copyWith(color: colors.textSecondary, letterSpacing: 1),
              ),
              const SizedBox(height: 16),
              Container(height: 1, width: 60, color: colors.honey.withValues(alpha: 0.5)),
            ],
          ),
        ),
        GestureDetector(
          onTap: () => context.pop(),
          child: Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: colors.surface,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: colors.border),
            ),
            child: Icon(LucideIcons.nfc, color: colors.honey, size: 20),
          ),
        ),
      ],
    ).animate().fadeIn(duration: 400.ms).slideX(begin: -0.1);
  }

  // ─── Biometrics Toggle ─────────────────────────────────────────────────────
  Widget _buildBiometricsToggle(ThemeColors colors, bool required) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: required ? colors.honey.withValues(alpha: 0.4) : colors.border,
        ),
        boxShadow: required ? [BoxShadow(color: colors.honey.withValues(alpha: 0.08), blurRadius: 16)] : colors.cardShadow,
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: colors.honey.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(LucideIcons.fingerprint, color: colors.honey, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'BIOMETRIC VERIFICATION',
                  style: TextStyle(
                      color: colors.textPrimary,
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 0.5),
                ),
                const SizedBox(height: 4),
                Text(
                  required
                      ? 'Face ID / Fingerprint required on check-in'
                      : 'Biometric auth is currently disabled',
                  style: TextStyle(color: colors.textSecondary, fontSize: 11),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          _biometricsLoading
              ? SizedBox(
                  width: 20, height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2, color: colors.honey,
                  ),
                )
              : Switch(
                  value: required,
                  activeColor: colors.honey,
                  onChanged: (value) async {
                    setState(() => _biometricsLoading = true);
                    try {
                      await ref.read(attendanceRepositoryProvider).setBiometricsRequired(value);
                      ref.invalidate(attendanceBiometricsRequiredProvider);
                      if (mounted) {
                        _showSnack(colors, value ? 'Biometric auth enabled' : 'Biometric auth disabled', isSuccess: true);
                      }
                    } catch (e) {
                      if (mounted) _showSnack(colors, 'Failed to update: $e');
                    } finally {
                      if (mounted) setState(() => _biometricsLoading = false);
                    }
                  },
                ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms, delay: 100.ms);
  }

  // ─── Tags List ──────────────────────────────────────────────────────────────
  Widget _buildTagsList(BuildContext context, ThemeColors colors, List<domain.NfcTag> tags) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(LucideIcons.tag, color: colors.honey, size: 16),
            const SizedBox(width: 8),
            Text(
              'REGISTERED TAGS',
              style: TextStyle(
                  color: colors.textPrimary,
                  fontWeight: FontWeight.w900,
                  fontSize: 11,
                  letterSpacing: 1),
            ),
            const Spacer(),
            Text(
              '${tags.length} TOTAL',
              style: TextStyle(color: colors.textSecondary, fontSize: 10),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (tags.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(
                children: [
                  Icon(LucideIcons.nfc, color: colors.textSecondary, size: 48),
                  const SizedBox(height: 16),
                  Text('No NFC tags registered',
                      style: TextStyle(color: colors.textSecondary, fontSize: 14)),
                  const SizedBox(height: 8),
                  Text('Tap the button below to register your first tag',
                      style: TextStyle(color: colors.textSecondary.withValues(alpha: 0.6), fontSize: 12),
                      textAlign: TextAlign.center),
                ],
              ),
            ),
          )
        else
          ...tags.asMap().entries.map((entry) {
            final i = entry.key;
            final tag = entry.value;
            return _buildTagTile(context, colors, tag, i);
          }),
      ],
    ).animate().fadeIn(duration: 500.ms, delay: 200.ms);
  }

  Widget _buildTagTile(BuildContext context, ThemeColors colors, domain.NfcTag tag, int index) {
    Color typeColor;
    IconData typeIcon;
    switch (tag.tagType) {
      case 'equipment':
        typeColor = AppColors.warning;
        typeIcon = LucideIcons.package;
        break;
      case 'location':
        typeColor = AppColors.info;
        typeIcon = LucideIcons.mapPin;
        break;
      case 'vehicle':
        typeColor = const Color(0xFF8B5CF6);
        typeIcon = LucideIcons.car;
        break;
      case 'field_work':
        typeColor = const Color(0xFF0D9488);
        typeIcon = LucideIcons.briefcase;
        break;
      case 'mixed':
        typeColor = AppColors.success;
        typeIcon = LucideIcons.layers;
        break;
      default:
        typeColor = colors.honey;
        typeIcon = LucideIcons.clock;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: colors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: tag.active ? colors.border : colors.border.withValues(alpha: 0.3),
        ),
        boxShadow: colors.cardShadow,
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(18),
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: () => _showTagDetailSheet(context, colors, tag),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Tag Type Icon
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: typeColor.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: typeColor.withValues(alpha: 0.2)),
                  ),
                  child: Icon(typeIcon, color: typeColor, size: 20),
                ),
                const SizedBox(width: 14),
                // Tag Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              tag.tagName,
                              style: TextStyle(
                                  color: tag.active ? colors.textPrimary : colors.textSecondary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: (tag.active ? typeColor : colors.textSecondary).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Text(
                              tag.active ? tag.tagType.toUpperCase() : 'INACTIVE',
                              style: TextStyle(
                                color: tag.active ? typeColor : colors.textSecondary,
                                fontSize: 8,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin, color: colors.textSecondary, size: 11),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${tag.latitude.toStringAsFixed(4)}, ${tag.longitude.toStringAsFixed(4)}  •  ${tag.radius.toInt()}m radius',
                              style: TextStyle(color: colors.textSecondary, fontSize: 11),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(LucideIcons.hash, color: colors.textSecondary, size: 11),
                          const SizedBox(width: 4),
                          Text(
                            tag.tagId,
                            style: TextStyle(
                                color: colors.textSecondary.withValues(alpha: 0.6), fontSize: 10, fontFamily: 'monospace'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Icon(LucideIcons.chevronRight, color: colors.textSecondary, size: 14),
              ],
            ),
          ),
        ),
      ),
    ).animate(delay: (index * 60).ms).fadeIn(duration: 300.ms).slideX(begin: 0.05);
  }

  void _showTagDetailSheet(BuildContext context, ThemeColors colors, domain.NfcTag tag) {
    final userRole = (ref.read(currentUserProfileProvider).value?['role']?.toString() ?? 'member').toLowerCase().trim();
    final isAdmin = userRole == 'admin';

    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(100)),
              ),
            ),
            const SizedBox(height: 20),
            Text(tag.tagName, style: AppTypography.h2.copyWith(color: colors.textPrimary)),
            const SizedBox(height: 4),
            Text(tag.tagId, style: TextStyle(color: colors.textSecondary, fontSize: 12, fontFamily: 'monospace')),
            const SizedBox(height: 20),
            _buildInfoRow(colors, 'Type', tag.tagType.toUpperCase(), LucideIcons.tag),
            const SizedBox(height: 16),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildInfoRow(colors, 'Location', '${tag.latitude.toStringAsFixed(5)}, ${tag.longitude.toStringAsFixed(5)}', LucideIcons.mapPin),
                      const SizedBox(height: 12),
                      _buildInfoRow(colors, 'Radius', '${tag.radius.toInt()}m', LucideIcons.circle),
                      const SizedBox(height: 12),
                      _buildInfoRow(colors, 'Registered Acc.', tag.accuracy != null ? '±${tag.accuracy!.toStringAsFixed(1)}m' : 'N/A', LucideIcons.shieldAlert),
                      const SizedBox(height: 12),
                      _buildInfoRow(colors, 'Status', tag.active ? 'Active' : 'Inactive', LucideIcons.checkCircle),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: colors.border, width: 2),
                  ),
                  child: QrImageView(
                    data: QrSignatureService.generatePayload(tag.tagId),
                    version: QrVersions.auto,
                    size: 110,
                    gapless: false,
                    eyeStyle: const QrEyeStyle(
                      eyeShape: QrEyeShape.square,
                      color: Colors.black,
                    ),
                    dataModuleStyle: const QrDataModuleStyle(
                      dataModuleShape: QrDataModuleShape.square,
                      color: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: colors.surface,
                foregroundColor: colors.textPrimary,
                side: BorderSide(color: colors.border),
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                minimumSize: const Size(double.infinity, 48),
              ),
              onPressed: () async {
                final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=${tag.latitude},${tag.longitude}');
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              },
              icon: const Icon(LucideIcons.map, size: 16),
              label: const Text('VIEW ON GOOGLE MAPS', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5)),
            ),
            const SizedBox(height: 16),
            if (isAllowedToEdit) ...[
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.surface,
                  foregroundColor: colors.honey,
                  side: BorderSide(color: colors.honey.withValues(alpha: 0.5)),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  minimumSize: const Size(double.infinity, 48),
                ),
                onPressed: () {
                  Navigator.pop(ctx); // Close the detail sheet first
                  _showEditSheet(context, colors, tag);
                },
                icon: const Icon(LucideIcons.pencil, size: 16),
                label: const Text('EDIT TAG PROPERTIES', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5)),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: colors.honey,
                  foregroundColor: colors.backgroundPrimary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  minimumSize: const Size(double.infinity, 48),
                ),
                onPressed: () {
                  Navigator.pop(ctx); // Close the detail sheet first
                  _showExportOptionsSheet(context, colors, tag);
                },
                icon: const Icon(LucideIcons.printer, size: 16),
                label: const Text('PRINT / EXPORT QR CODE', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5)),
              ),
              const SizedBox(height: 16),
              if (tag.active)
                GestureDetector(
                  onTap: () async {
                    final confirm = await showDialog<bool>(
                      context: ctx,
                      builder: (d) => AlertDialog(
                        backgroundColor: colors.backgroundSecondary,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        title: Text('Retire Tag', style: TextStyle(color: colors.textPrimary)),
                        content: Text('This tag will be soft deleted and can no longer be used for check-ins.', style: TextStyle(color: colors.textSecondary)),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(d, false), child: Text('Cancel', style: TextStyle(color: colors.textSecondary))),
                          TextButton(onPressed: () => Navigator.pop(d, true), child: const Text('Retire', style: TextStyle(color: AppColors.error))),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      await ref.read(attendanceRepositoryProvider).deleteTag(tag.id);
                      ref.invalidate(allNfcTagsProvider);
                      ref.invalidate(activeNfcTagsProvider);
                      if (ctx.mounted) Navigator.pop(ctx);
                      if (mounted) _showSnack(colors, 'Tag retired successfully', isSuccess: true);
                    }
                  },
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(LucideIcons.trash2, color: AppColors.error, size: 16),
                        SizedBox(width: 8),
                        Text('RETIRE TAG', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w900, fontSize: 12)),
                      ],
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }

  void _showExportOptionsSheet(BuildContext context, ThemeColors colors, domain.NfcTag tag) {
    showModalBottomSheet(
      context: context,
      useRootNavigator: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(100)),
                ),
              ),
              const SizedBox(height: 20),
              Text('EXPORT QR / PDF', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
              const SizedBox(height: 4),
              Text('Choose an export method for ${tag.tagName}', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
              const SizedBox(height: 24),
              
              // Print / View PDF option
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: colors.honey.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(LucideIcons.printer, color: colors.honey, size: 20),
                ),
                title: Text('Print / View PDF', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Generate a printable PDF sheet containing the tag QR code', style: TextStyle(color: colors.textSecondary, fontSize: 11)),
                onTap: () {
                  Navigator.pop(ctx);
                  _exportPdf(colors, tag);
                },
              ),
              const Divider(),
              
              // Save PNG to Gallery option
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.download, color: AppColors.success, size: 20),
                ),
                title: Text('Save PNG to Gallery', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Save the QR Code image directly to your photo gallery', style: TextStyle(color: colors.textSecondary, fontSize: 11)),
                onTap: () {
                  Navigator.pop(ctx);
                  _downloadPng(colors, tag);
                },
              ),
              const Divider(),
              
              // Share via System option
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.info.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Icon(LucideIcons.share2, color: AppColors.info, size: 20),
                ),
                title: Text('Share / Save / Print (System)', style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text('Open native share sheet for printing, sharing, or cloud storage', style: TextStyle(color: colors.textSecondary, fontSize: 11)),
                onTap: () {
                  Navigator.pop(ctx);
                  _shareQr(colors, tag);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _downloadPng(ThemeColors colors, domain.NfcTag tag) async {
    try {
      final qrPayload = QrSignatureService.generatePayload(tag.tagId);
      final qrValidation = QrValidator.validate(
        data: qrPayload,
        version: QrVersions.auto,
        errorCorrectionLevel: QrErrorCorrectLevel.L,
      );
      if (qrValidation.status != QrValidationStatus.valid) {
        throw Exception('QR generation failed');
      }
      final qrCode = qrValidation.qrCode!;
      final painter = QrPainter.withQr(
        qr: qrCode,
        color: Colors.black,
        emptyColor: Colors.white,
        gapless: true,
      );
      final imageData = await painter.toImageData(300);
      if (imageData == null) throw Exception('Image data generation failed');
      final pngBytes = imageData.buffer.asUint8List();

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/${tag.tagName.replaceAll(' ', '_')}_qr.png');
      await file.writeAsBytes(pngBytes);

      await Gal.putImage(file.path);
      if (mounted) {
        _showSnack(colors, 'QR Code saved to gallery', isSuccess: true);
      }
    } catch (e) {
      if (mounted) {
        _showSnack(colors, 'Failed to save QR code: $e');
      }
    }
  }

  Future<void> _exportPdf(ThemeColors colors, domain.NfcTag tag) async {
    try {
      final pdf = pw.Document();
      final qrPayload = QrSignatureService.generatePayload(tag.tagId);

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Center(
              child: pw.Container(
                width: 400,
                padding: const pw.EdgeInsets.all(32),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey400, width: 2),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(16)),
                ),
                child: pw.Column(
                  mainAxisSize: pw.MainAxisSize.min,
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Text(
                      'MediaHive Attendance',
                      style: pw.TextStyle(
                        fontSize: 28,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.amber700,
                      ),
                    ),
                    pw.SizedBox(height: 8),
                    pw.Text(
                      'SCAN QR CODE FOR CHECK-IN / CHECK-OUT',
                      style: pw.TextStyle(
                        fontSize: 10,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.grey700,
                      ),
                    ),
                    pw.SizedBox(height: 24),
                    pw.Container(
                      width: 220,
                      height: 220,
                      padding: const pw.EdgeInsets.all(12),
                      decoration: pw.BoxDecoration(
                        border: pw.Border.all(color: PdfColors.black, width: 3),
                        borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8)),
                      ),
                      child: pw.BarcodeWidget(
                        barcode: pw.Barcode.qrCode(),
                        data: qrPayload,
                        color: PdfColors.black,
                      ),
                    ),
                    pw.SizedBox(height: 24),
                    pw.Text(
                      tag.tagName.toUpperCase(),
                      style: pw.TextStyle(
                        fontSize: 20,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.black,
                      ),
                    ),
                    if (tag.campusName != null && tag.campusName!.isNotEmpty) ...[
                      pw.SizedBox(height: 6),
                      pw.Text(
                        'Campus: ${tag.campusName}',
                        style: const pw.TextStyle(
                          fontSize: 14,
                          color: PdfColors.grey800,
                        ),
                      ),
                    ],
                    pw.SizedBox(height: 12),
                    pw.Divider(color: PdfColors.grey400),
                    pw.SizedBox(height: 12),
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(
                          'Geofence Radius: ${tag.radius.toInt()} meters',
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                        ),
                        pw.Text(
                          'Coordinates: ${tag.latitude.toStringAsFixed(6)}, ${tag.longitude.toStringAsFixed(6)}',
                          style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      );

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/${tag.tagName.replaceAll(' ', '_')}_qr.pdf');
      await file.writeAsBytes(await pdf.save());

      await OpenFilex.open(file.path);
      if (mounted) {
        _showSnack(colors, 'Printable PDF generated & opened. Use your system viewer to print.', isSuccess: true);
      }
    } catch (e) {
      if (mounted) {
        _showSnack(colors, 'Failed to export PDF: $e');
      }
    }
  }

  Future<void> _shareQr(ThemeColors colors, domain.NfcTag tag) async {
    try {
      final qrPayload = QrSignatureService.generatePayload(tag.tagId);
      final qrValidation = QrValidator.validate(
        data: qrPayload,
        version: QrVersions.auto,
        errorCorrectionLevel: QrErrorCorrectLevel.L,
      );
      if (qrValidation.status != QrValidationStatus.valid) {
        throw Exception('QR generation failed');
      }
      final qrCode = qrValidation.qrCode!;
      final painter = QrPainter.withQr(
        qr: qrCode,
        color: Colors.black,
        emptyColor: Colors.white,
        gapless: true,
      );
      final imageData = await painter.toImageData(300);
      if (imageData == null) throw Exception('Image data generation failed');
      final pngBytes = imageData.buffer.asUint8List();

      final tempDir = await getTemporaryDirectory();
      final file = File('${tempDir.path}/${tag.tagName.replaceAll(' ', '_')}_qr.png');
      await file.writeAsBytes(pngBytes);

      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'MediaHive Attendance QR Code for ${tag.tagName}',
        subject: 'Attendance QR Code: ${tag.tagName}',
      );
    } catch (e) {
      if (mounted) {
        _showSnack(colors, 'Failed to share QR: $e');
      }
    }
  }

  Future<void> _performRealNfcScan(BuildContext context, ThemeColors colors, StateSetter setSheetState) async {
    try {
      final availability = await NfcManager.instance.checkAvailability();
      if (availability != NfcAvailability.enabled) {
        _showSnack(colors, availability == NfcAvailability.disabled 
            ? 'NFC is disabled. Please enable it in Settings.' 
            : 'NFC hardware is not supported on this device.');
        return;
      }

      bool tagFound = false;
      if (!mounted) return;
      
      BuildContext? scanDialogContext;

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (dialogCtx) {
          scanDialogContext = dialogCtx;
          return WillPopScope(
            onWillPop: () async {
              await NfcManager.instance.stopSession();
              return true;
            },
            child: AlertDialog(
              backgroundColor: colors.backgroundSecondary,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Center(
                child: Text('READY TO SCAN',
                    style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 10),
                  Icon(LucideIcons.nfc, size: 50, color: colors.honey)
                      .animate(onPlay: (controller) => controller.repeat(reverse: true))
                      .scale(begin: const Offset(1, 1), end: const Offset(1.2, 1.2), duration: 1000.ms),
                  const SizedBox(height: 20),
                  Text(
                    'Approach your device to the physical NFC tag.',
                    style: TextStyle(color: colors.textSecondary, fontSize: 12),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 10),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () async {
                    await NfcManager.instance.stopSession();
                    if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                  },
                  child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
                ),
              ],
            ),
          );
        },
      );

      await NfcManager.instance.startSession(
        pollingOptions: {
          NfcPollingOption.iso14443,
          NfcPollingOption.iso15693,
          NfcPollingOption.iso18092,
        },
        onDiscovered: (NfcTag tag) {
          Future.microtask(() async {
            String identifier = 'UNKNOWN';
            try {
              final dynamic rawData = (tag as dynamic).data;
              if (rawData != null) {
                final dynamic id = (rawData as dynamic).id;
                if (id is Uint8List) {
                  identifier = id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
                }
              }
            } catch (_) {}

            if (identifier == 'UNKNOWN') {
              await NfcManager.instance.stopSession();
              if (scanDialogContext != null && scanDialogContext!.mounted) {
                Navigator.pop(scanDialogContext!);
              }
              if (context.mounted) {
                _showSnack(colors, 'Could not read NFC Tag serial ID. Please use a standard ISO14443/NfcA tag.', isSuccess: false);
              }
              return;
            }
            
            // Write NDEF payload for deep-linking
            bool writeSuccess = false;
            String? writeError;
            try {
              final ndef = Ndef.from(tag);
              if (ndef != null) {
                if (ndef.isWritable) {
                  final uriBytes = utf8.encode('mediahive://attendance/scan?tagId=$identifier&v=1');
                  final payload = Uint8List.fromList([0x00, ...uriBytes]);
                  final message = NdefMessage(records: [
                    NdefRecord(
                      typeNameFormat: TypeNameFormat.wellKnown,
                      type: Uint8List.fromList([0x55]),
                      identifier: Uint8List(0),
                      payload: payload,
                    ),
                  ]);
                  await ndef.write(message: message);
                  writeSuccess = true;
                } else {
                  writeError = 'Tag is read-only or locked';
                }
              } else {
                writeError = 'Tag is not NDEF formatable';
              }
            } catch (e) {
              writeError = e.toString();
              debugPrint('Failed to write NDEF payload: $e');
            }

            tagFound = true;
            await NfcManager.instance.stopSession();
            if (scanDialogContext != null && scanDialogContext!.mounted) {
              Navigator.pop(scanDialogContext!);
            }
            
            if (context.mounted) {
              _tagIdController.text = identifier;
              setSheetState(() {});
              if (writeSuccess) {
                _showSnack(colors, 'NFC Tag ID captured & Payload written: $identifier', isSuccess: true);
              } else {
                _showSnack(colors, 'Tag ID captured ($identifier) but deep-link failed: $writeError', isSuccess: false);
              }
            }
          });
        },
        alertMessageIos: 'Hold your iPhone near the NFC tag.',
      );
    } catch (e) {
      if (context.mounted) {
        _showSnack(colors, 'NFC scanning failed: $e');
      }
    }
  }

  Future<void> _scanNfcTagForRegistration(BuildContext context, ThemeColors colors, StateSetter setSheetState) async {
    await _performRealNfcScan(context, colors, setSheetState);
  }

  void _showEditSheet(BuildContext context, ThemeColors colors, domain.NfcTag tag) {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: tag.tagName);
    final tagIdController = TextEditingController(text: tag.tagId);
    final campusNameController = TextEditingController(text: tag.campusName ?? '');
    final campusIdController = TextEditingController(text: tag.campusId ?? '');
    final locationGroupController = TextEditingController(text: tag.locationGroup ?? '');
    final wifiSsidsController = TextEditingController(text: tag.wifiSsids ?? '');
    
    double editLatitude = tag.latitude;
    double editLongitude = tag.longitude;
    double editRadius = tag.radius;
    double editAccuracy = tag.accuracy ?? 0.0;
    String editTagType = tag.tagType;
    bool editActive = tag.active;
    bool isLocationConfirmed = true; 
    bool isSubmittingEdit = false;
    bool isCapturingLocationLocal = false;
    String gpsProgressLocal = "";

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          Future<void> saveEdit() async {
            if (formKey.currentState?.validate() != true) return;
            if (editLatitude == 0.0 && editLongitude == 0.0) {
              _showSnack(colors, 'Please select location on map first');
              return;
            }
            if (!isLocationConfirmed) {
              _showSnack(colors, 'Please lock and confirm coordinates before saving');
              return;
            }
            setSheetState(() => isSubmittingEdit = true);
            try {
              final campusName = campusNameController.text.trim();
              final locationGroup = locationGroupController.text.trim();
              final wifiSsids = wifiSsidsController.text.trim();
              String? campusId = campusIdController.text.trim();

              if (campusId.isEmpty && campusName.isNotEmpty) {
                campusId = const Uuid().v4();
              } else if (campusId.isEmpty) {
                campusId = null;
              }

              final repo = ref.read(attendanceRepositoryProvider);
              await repo.updateTag(tag.id, {
                'tagName': nameController.text.trim(),
                'tagId': tagIdController.text.trim(),
                'tagType': editTagType,
                'latitude': editLatitude,
                'longitude': editLongitude,
                'radius': editRadius,
                'accuracy': editAccuracy,
                'active': editActive,
                'campusId': campusId,
                'campusName': campusName.isNotEmpty ? campusName : null,
                'locationGroup': locationGroup.isNotEmpty ? locationGroup : null,
                'wifi_ssids': wifiSsids.isNotEmpty ? wifiSsids : null,
              });

              if (mounted) {
                ref.invalidate(allNfcTagsProvider);
                ref.invalidate(activeNfcTagsProvider);
                _showSnack(colors, 'NFC tag updated successfully', isSuccess: true);
                Navigator.pop(ctx);
              }
            } catch (e) {
              _showSnack(colors, 'Update failed: $e');
            } finally {
              setSheetState(() => isSubmittingEdit = false);
            }
          }

          return Padding(
            padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(ctx).viewInsets.bottom),
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Container(
                        width: 36, height: 4,
                        decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(100)),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text('EDIT NFC TAG', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                    const SizedBox(height: 4),
                    Text('Modify properties of an existing NFC check-in spot', style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                    const SizedBox(height: 24),
                    _buildFormField(
                      colors: colors,
                      controller: nameController,
                      label: 'Tag Name',
                      hint: 'e.g. Main Entrance',
                      icon: LucideIcons.tag,
                      validator: (v) => v?.isEmpty == true ? 'Tag name required' : null,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: _buildFormField(
                            colors: colors,
                            controller: tagIdController,
                            label: 'Physical Tag ID',
                            hint: 'e.g. NFC_UID_HERE',
                            icon: LucideIcons.hash,
                            validator: (v) => v?.isEmpty == true ? 'Tag ID required' : null,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: SizedBox(
                            height: 56,
                            child: ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: colors.honey,
                                foregroundColor: colors.backgroundPrimary,
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                              onPressed: () async {
                                final availability = await NfcManager.instance.checkAvailability();
                                if (availability != NfcAvailability.enabled) {
                                  _showSnack(colors, availability == NfcAvailability.disabled 
                                      ? 'NFC is disabled. Please enable it in Settings.' 
                                      : 'NFC hardware is not supported on this device.');
                                  return;
                                }

                                if (!context.mounted) return;
                                
                                BuildContext? scanDialogContext;
                                showDialog(
                                  context: context,
                                  barrierDismissible: false,
                                  builder: (dialogCtx) {
                                    scanDialogContext = dialogCtx;
                                    return WillPopScope(
                                      onWillPop: () async {
                                        await NfcManager.instance.stopSession();
                                        return true;
                                      },
                                      child: AlertDialog(
                                        backgroundColor: colors.backgroundSecondary,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                                        title: Center(
                                          child: Text('READY TO SCAN',
                                              style: TextStyle(color: colors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                                        ),
                                        content: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            const SizedBox(height: 10),
                                            Icon(LucideIcons.nfc, size: 50, color: colors.honey)
                                                .animate(onPlay: (controller) => controller.repeat(reverse: true))
                                                .scale(begin: const Offset(1, 1), end: const Offset(1.2, 1.2), duration: 1000.ms),
                                            const SizedBox(height: 20),
                                            Text(
                                              'Approach your device to the physical NFC tag.',
                                              style: TextStyle(color: colors.textSecondary, fontSize: 12),
                                              textAlign: TextAlign.center,
                                            ),
                                            const SizedBox(height: 10),
                                          ],
                                        ),
                                        actions: [
                                          TextButton(
                                            onPressed: () async {
                                              await NfcManager.instance.stopSession();
                                              if (dialogCtx.mounted) Navigator.pop(dialogCtx);
                                            },
                                            child: Text('Cancel', style: TextStyle(color: colors.textSecondary)),
                                          ),
                                        ],
                                      ),
                                    );
                                  },
                                );

                                await NfcManager.instance.startSession(
                                  pollingOptions: {
                                    NfcPollingOption.iso14443,
                                    NfcPollingOption.iso15693,
                                    NfcPollingOption.iso18092,
                                  },
                                  onDiscovered: (NfcTag scannedTag) {
                                    Future.microtask(() async {
                                      String identifier = 'UNKNOWN';
                                      try {
                                        final dynamic rawData = (scannedTag as dynamic).data;
                                        if (rawData != null) {
                                          final dynamic id = (scannedTag as dynamic).id;
                                          if (id is Uint8List) {
                                            identifier = id.map((b) => b.toRadixString(16).padLeft(2, '0')).join(':').toUpperCase();
                                          }
                                        }
                                      } catch (_) {}

                                      if (identifier == 'UNKNOWN') {
                                        await NfcManager.instance.stopSession();
                                        if (scanDialogContext != null && scanDialogContext!.mounted) {
                                          Navigator.pop(scanDialogContext!);
                                        }
                                        _showSnack(colors, 'Could not read NFC Tag serial ID.', isSuccess: false);
                                        return;
                                      }
                                      
                                      bool writeSuccess = false;
                                      try {
                                        final ndef = Ndef.from(scannedTag);
                                        if (ndef != null && ndef.isWritable) {
                                          final uriBytes = utf8.encode('mediahive://attendance/scan?tagId=$identifier&v=1');
                                          final payload = Uint8List.fromList([0x00, ...uriBytes]);
                                          final message = NdefMessage(records: [
                                            NdefRecord(
                                              typeNameFormat: TypeNameFormat.wellKnown,
                                              type: Uint8List.fromList([0x55]),
                                              identifier: Uint8List(0),
                                              payload: payload,
                                            ),
                                          ]);
                                          await ndef.write(message: message);
                                          writeSuccess = true;
                                        }
                                      } catch (_) {}

                                      await NfcManager.instance.stopSession();
                                      if (scanDialogContext != null && scanDialogContext!.mounted) {
                                        Navigator.pop(scanDialogContext!);
                                      }
                                      
                                      tagIdController.text = identifier;
                                      setSheetState(() {});
                                      _showSnack(colors, 'NFC Tag ID captured: $identifier', isSuccess: true);
                                    });
                                  },
                                );
                              },
                              icon: const Icon(LucideIcons.nfc, size: 16),
                              label: const Text('SCAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      colors: colors,
                      controller: campusNameController,
                      label: 'Campus Name (Optional)',
                      hint: 'e.g. Thaiba Garden',
                      icon: LucideIcons.building,
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      colors: colors,
                      controller: campusIdController,
                      label: 'Campus ID (Optional - Auto-generates if blank)',
                      hint: 'Leave blank to generate or enter UUID',
                      icon: LucideIcons.shieldAlert,
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      colors: colors,
                      controller: locationGroupController,
                      label: 'Location Group (Optional)',
                      hint: 'e.g. main_entrance, reception',
                      icon: LucideIcons.layers,
                    ),
                    const SizedBox(height: 16),
                    _buildFormField(
                      colors: colors,
                      controller: wifiSsidsController,
                      label: 'Approved Office WiFi SSID(s) (Optional)',
                      hint: 'e.g. MH_OFFICE, THAIBA_MAIN (comma separated)',
                      icon: LucideIcons.wifi,
                      suffixIcon: IconButton(
                        icon: Icon(LucideIcons.refreshCw, color: colors.honey, size: 16),
                        onPressed: () async {
                          try {
                            final info = NetworkInfo();
                            String? rawSsid = await info.getWifiName();
                            if (rawSsid != null) {
                              final cleanSsid = rawSsid.replaceAll('"', '');
                              final currentText = wifiSsidsController.text.trim();
                              if (currentText.isEmpty) {
                                wifiSsidsController.text = cleanSsid;
                              } else {
                                final list = currentText.split(',').map((s) => s.trim()).toList();
                                if (!list.contains(cleanSsid)) {
                                  wifiSsidsController.text = '$currentText, $cleanSsid';
                                }
                              }
                              _showSnack(colors, 'Captured WiFi SSID: $cleanSsid', isSuccess: true);
                            }
                          } catch (_) {}
                        },
                      ),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Text(
                          'ACTIVE STATUS',
                          style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1),
                        ),
                        const Spacer(),
                        Switch(
                          value: editActive,
                          activeColor: colors.honey,
                          onChanged: (val) => setSheetState(() => editActive = val),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text('TAG TYPE', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        {'id': 'attendance', 'label': 'ATTENDANCE', 'icon': LucideIcons.clock},
                        {'id': 'equipment', 'label': 'EQUIPMENT', 'icon': LucideIcons.package},
                        {'id': 'vehicle', 'label': 'VEHICLE', 'icon': LucideIcons.car},
                        {'id': 'location', 'label': 'LOCATION', 'icon': LucideIcons.mapPin},
                        {'id': 'field_work', 'label': 'FIELD WORK', 'icon': LucideIcons.briefcase},
                      ].map((t) {
                        final isSelected = editTagType == t['id'];
                        return GestureDetector(
                          onTap: () => setSheetState(() => editTagType = t['id'] as String),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: isSelected ? colors.honey.withValues(alpha: 0.1) : colors.surface,
                              borderRadius: BorderRadius.circular(100),
                              border: Border.all(
                                color: isSelected ? colors.honey.withValues(alpha: 0.5) : colors.border,
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(t['icon'] as IconData, color: isSelected ? colors.honey : colors.textSecondary, size: 12),
                                const SizedBox(width: 6),
                                Text(
                                  t['label'] as String,
                                  style: TextStyle(
                                    color: isSelected ? colors.honey : colors.textSecondary,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                    GestureDetector(
                      onTap: () => _openMapPicker(
                        context: context,
                        colors: colors,
                        setSheetState: setSheetState,
                        initialLatitude: editLatitude,
                        initialLongitude: editLongitude,
                        initialRadius: editRadius,
                        onConfirm: (lat, lng) {
                          setSheetState(() {
                            editLatitude = lat;
                            editLongitude = lng;
                            isLocationConfirmed = true;
                          });
                        },
                      ),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        decoration: BoxDecoration(
                          color: editLatitude != 0.0 ? AppColors.success.withValues(alpha: 0.1) : colors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: editLatitude != 0.0 ? AppColors.success.withValues(alpha: 0.4) : colors.border,
                          ),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              editLatitude != 0.0 ? LucideIcons.checkCircle : LucideIcons.map,
                              color: editLatitude != 0.0 ? AppColors.success : colors.honey,
                              size: 16,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    editLatitude != 0.0 ? 'LOCATION LOCKED' : 'SELECT LOCATION ON MAP',
                                    style: TextStyle(
                                      color: editLatitude != 0.0 ? AppColors.success : colors.textPrimary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    editLatitude != 0.0
                                        ? 'Coordinates set: ${editLatitude.toStringAsFixed(6)}, ${editLongitude.toStringAsFixed(6)}'
                                        : 'Tap to place a pin on the map',
                                    style: TextStyle(color: colors.textSecondary, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            Icon(LucideIcons.chevronRight, color: colors.textSecondary, size: 16),
                          ],
                        ),
                      ),
                    ),
                    if (editLatitude != 0.0 && editLongitude != 0.0) ...[
                      const SizedBox(height: 12),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: colors.surface,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: colors.border),
                        ),
                        child: Row(
                          children: [
                            Icon(LucideIcons.locate, color: colors.honey, size: 18),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'SELECTED COORDINATES',
                                    style: TextStyle(
                                      color: colors.honey,
                                      fontSize: 9,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 1,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Latitude: $editLatitude\nLongitude: $editLongitude',
                                    style: TextStyle(
                                      color: colors.textPrimary,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      fontFamily: 'monospace',
                                      height: 1.35,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: isCapturingLocationLocal
                          ? null
                          : () async {
                              await _captureLocationGeneric(
                                setSheetState: setSheetState,
                                onProgress: (isCapturing, progress) {
                                  setSheetState(() {
                                    isCapturingLocationLocal = isCapturing;
                                    gpsProgressLocal = progress;
                                  });
                                },
                                onSuccess: (lat, lng, acc) {
                                  setSheetState(() {
                                    editLatitude = lat;
                                    editLongitude = lng;
                                    editAccuracy = acc;
                                    isLocationConfirmed = true;
                                  });
                                },
                                onError: (err) {
                                  _showSnack(colors, err);
                                },
                              );
                            },
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                        decoration: BoxDecoration(
                          color: editLatitude != 0.0
                              ? (editAccuracy > 15.0 ? Colors.orange.withValues(alpha: 0.1) : AppColors.success.withValues(alpha: 0.1))
                              : colors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: editLatitude != 0.0
                                ? (editAccuracy > 15.0 ? Colors.orange.withValues(alpha: 0.4) : AppColors.success.withValues(alpha: 0.4))
                                : colors.border,
                          ),
                        ),
                        child: Row(
                          children: [
                            isCapturingLocationLocal
                                ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: colors.honey))
                                : Icon(
                                    editLatitude != 0.0
                                        ? (editAccuracy > 15.0 ? LucideIcons.alertTriangle : LucideIcons.checkCircle)
                                        : LucideIcons.locateFixed,
                                    color: editLatitude != 0.0
                                        ? (editAccuracy > 15.0 ? Colors.orange : AppColors.success)
                                        : colors.honey,
                                    size: 16,
                                  ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    editLatitude != 0.0
                                        ? (editAccuracy > 15.0 ? 'GPS Location (Poor Accuracy)' : 'GPS Location Stabilized')
                                        : 'GET CURRENT GPS LOCATION (CONVENIENCE)',
                                    style: TextStyle(
                                        color: editLatitude != 0.0
                                            ? (editAccuracy > 15.0 ? Colors.orange : AppColors.success)
                                            : colors.textPrimary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w900,
                                        letterSpacing: 0.5),
                                  ),
                                  const SizedBox(height: 4),
                                  if (editLatitude != 0.0) ...[
                                    Text(
                                      'Latitude:\n$editLatitude',
                                      style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Longitude:\n$editLongitude',
                                      style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Best Accuracy:\n±${editAccuracy.toStringAsFixed(1)}m',
                                      style: TextStyle(
                                        color: editAccuracy > 15.0 ? Colors.orange : colors.textPrimary,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ] else ...[
                                    Text(
                                      isCapturingLocationLocal ? gpsProgressLocal : 'Tap to capture stabilized GPS coordinates',
                                      style: TextStyle(color: colors.textSecondary, fontSize: 11),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('RADIUS', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        Expanded(
                          child: Slider(
                            value: editRadius,
                            min: 25,
                            max: 200,
                            divisions: 7,
                            activeColor: colors.honey,
                            inactiveColor: colors.border,
                            onChanged: (v) => setSheetState(() => editRadius = v),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: colors.surface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: colors.border),
                          ),
                          child: Text(
                            '${editRadius.toInt()}m',
                            style: TextStyle(color: colors.honey, fontWeight: FontWeight.w900, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    GestureDetector(
                      onTap: isSubmittingEdit ? null : saveEdit,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (isSubmittingEdit)
                              SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: colors.backgroundPrimary))
                            else
                              Icon(LucideIcons.save, color: colors.backgroundPrimary, size: 16),
                            const SizedBox(width: 10),
                            Text(
                              isSubmittingEdit ? 'SAVING...' : 'SAVE CHANGES',
                              style: TextStyle(
                                color: colors.backgroundPrimary,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoRow(ThemeColors colors, String label, String value, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: colors.honey, size: 14),
        const SizedBox(width: 10),
        Text('$label: ', style: TextStyle(color: colors.textSecondary, fontSize: 12)),
        Expanded(child: Text(value, style: TextStyle(color: colors.textPrimary, fontSize: 12, fontWeight: FontWeight.bold))),
      ],
    );
  }

  // ─── Register Sheet ─────────────────────────────────────────────────────────
  void _showRegisterSheet(BuildContext context, ThemeColors colors) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: colors.backgroundSecondary,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.fromLTRB(24, 24, 24, 24 + MediaQuery.of(ctx).viewInsets.bottom),
          child: Form(
            key: _formKey,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Center(
                    child: Container(
                      width: 36, height: 4,
                      decoration: BoxDecoration(color: colors.border, borderRadius: BorderRadius.circular(100)),
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text('REGISTER NFC TAG', style: AppTypography.h3.copyWith(color: colors.textPrimary)),
                  const SizedBox(height: 4),
                  Text('Add a new NFC tag to the MediaHive registry', style: TextStyle(color: colors.textSecondary, fontSize: 13)),
                  const SizedBox(height: 24),
                  // Tag Name
                  _buildFormField(
                    colors: colors,
                    controller: _nameController,
                    label: 'Tag Name',
                    hint: 'e.g. Main Entrance',
                    icon: LucideIcons.tag,
                    validator: (v) => v?.isEmpty == true ? 'Tag name required' : null,
                  ),
                  const SizedBox(height: 16),
                  // Physical Tag ID
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: _buildFormField(
                          colors: colors,
                          controller: _tagIdController,
                          label: 'Physical Tag ID',
                          hint: 'e.g. MEDIA_ENTRANCE_01 or NFC UID',
                          icon: LucideIcons.hash,
                          validator: (v) => v?.isEmpty == true ? 'Tag ID required' : null,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Padding(
                        padding: const EdgeInsets.only(top: 4),
                        child: SizedBox(
                          height: 56, // Match text field height
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: colors.honey,
                              foregroundColor: colors.backgroundPrimary,
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              elevation: 0,
                            ),
                            onPressed: () => _scanNfcTagForRegistration(context, colors, setSheetState),
                            icon: const Icon(LucideIcons.nfc, size: 16),
                            label: const Text('SCAN', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // Campus Name
                  _buildFormField(
                    colors: colors,
                    controller: _campusNameController,
                    label: 'Campus Name (Optional)',
                    hint: 'e.g. Thaiba Garden',
                    icon: LucideIcons.building,
                  ),
                  const SizedBox(height: 16),
                  // Campus ID
                  _buildFormField(
                    colors: colors,
                    controller: _campusIdController,
                    label: 'Campus ID (Optional - Auto-generates if blank)',
                    hint: 'Leave blank to generate or enter UUID',
                    icon: LucideIcons.shieldAlert,
                  ),
                  const SizedBox(height: 16),
                  // Location Group
                   _buildFormField(
                    colors: colors,
                    controller: _locationGroupController,
                    label: 'Location Group (Optional)',
                    hint: 'e.g. main_entrance, reception',
                    icon: LucideIcons.layers,
                  ),
                  const SizedBox(height: 16),
                  // Approved WiFi SSIDs
                  _buildFormField(
                    colors: colors,
                    controller: _wifiSsidsController,
                    label: 'Approved Office WiFi SSID(s) (Optional)',
                    hint: 'e.g. MH_OFFICE, THAIBA_MAIN (comma separated)',
                    icon: LucideIcons.wifi,
                    suffixIcon: IconButton(
                      icon: Icon(LucideIcons.refreshCw, color: colors.honey, size: 16),
                      tooltip: 'Get current connected WiFi SSID',
                      onPressed: () async {
                        try {
                          final info = NetworkInfo();
                          String? rawSsid = await info.getWifiName();
                          if (rawSsid != null) {
                            final cleanSsid = rawSsid.replaceAll('"', '');
                            final currentText = _wifiSsidsController.text.trim();
                            if (currentText.isEmpty) {
                              _wifiSsidsController.text = cleanSsid;
                            } else {
                              final list = currentText.split(',').map((s) => s.trim()).toList();
                              if (!list.contains(cleanSsid)) {
                                _wifiSsidsController.text = '$currentText, $cleanSsid';
                              }
                            }
                            _showSnack(colors, 'Captured WiFi SSID: $cleanSsid', isSuccess: true);
                          } else {
                            _showSnack(colors, 'Could not detect WiFi SSID. Ensure WiFi is turned on and connected.', isSuccess: false);
                          }
                        } catch (e) {
                          _showSnack(colors, 'Failed to read WiFi: $e', isSuccess: false);
                        }
                      },
                    ),
                  ),
                  const SizedBox(height: 16),
                  // Tag Type Selector
                  Text('TAG TYPE', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  const SizedBox(height: 8),
                  _buildTypeSelector(colors, setSheetState),
                  const SizedBox(height: 16),
                  // Interactive Map Location Picker (Primary)
                  GestureDetector(
                    onTap: () => _openMapPicker(
                      context: context,
                      colors: colors,
                      setSheetState: setSheetState,
                      initialLatitude: _latitude,
                      initialLongitude: _longitude,
                      initialRadius: _radius,
                      onConfirm: (lat, lng) {
                        setState(() {
                          _latitude = lat;
                          _longitude = lng;
                          _isLocationConfirmed = true;
                        });
                        setSheetState(() {});
                      },
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      decoration: BoxDecoration(
                        color: _latitude != 0.0 ? AppColors.success.withValues(alpha: 0.1) : colors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _latitude != 0.0 ? AppColors.success.withValues(alpha: 0.4) : colors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _latitude != 0.0 ? LucideIcons.checkCircle : LucideIcons.map,
                            color: _latitude != 0.0 ? AppColors.success : colors.honey,
                            size: 16,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _latitude != 0.0 ? 'LOCATION LOCKED' : 'SELECT LOCATION ON MAP',
                                  style: TextStyle(
                                    color: _latitude != 0.0 ? AppColors.success : colors.textPrimary,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _latitude != 0.0
                                      ? 'Coordinates set: ${_latitude.toStringAsFixed(6)}, ${_longitude.toStringAsFixed(6)}'
                                      : 'Tap to place a pin on the map (Primary method)',
                                  style: TextStyle(color: colors.textSecondary, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                          Icon(LucideIcons.chevronRight, color: colors.textSecondary, size: 16),
                        ],
                      ),
                    ),
                  ),
                  if (_latitude != 0.0 && _longitude != 0.0) ...[
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: colors.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: colors.border),
                      ),
                      child: Row(
                        children: [
                          Icon(LucideIcons.locate, color: colors.honey, size: 18),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'SELECTED COORDINATES',
                                  style: TextStyle(
                                    color: colors.honey,
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Latitude: $_latitude\nLongitude: $_longitude',
                                  style: TextStyle(
                                    color: colors.textPrimary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    fontFamily: 'monospace',
                                    height: 1.35,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                  const SizedBox(height: 12),
                  // GPS Capture (Convenience Option)
                  GestureDetector(
                    onTap: _isCapturingLocation
                        ? null
                        : () async {
                            await _captureLocation(setSheetState);
                          },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                      decoration: BoxDecoration(
                        color: _latitude != 0.0
                            ? (_accuracy > 15.0 ? Colors.orange.withValues(alpha: 0.1) : AppColors.success.withValues(alpha: 0.1))
                            : colors.surface,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: _latitude != 0.0
                              ? (_accuracy > 15.0 ? Colors.orange.withValues(alpha: 0.4) : AppColors.success.withValues(alpha: 0.4))
                              : colors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          _isCapturingLocation
                              ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: colors.honey))
                              : Icon(
                                  _latitude != 0.0
                                      ? (_accuracy > 15.0 ? LucideIcons.alertTriangle : LucideIcons.checkCircle)
                                      : LucideIcons.locateFixed,
                                  color: _latitude != 0.0
                                      ? (_accuracy > 15.0 ? Colors.orange : AppColors.success)
                                      : colors.honey,
                                  size: 16,
                                ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _latitude != 0.0
                                      ? (_accuracy > 15.0 ? 'GPS Location (Poor Accuracy)' : 'GPS Location Stabilized')
                                      : 'GET CURRENT GPS LOCATION (CONVENIENCE)',
                                  style: TextStyle(
                                      color: _latitude != 0.0
                                          ? (_accuracy > 15.0 ? Colors.orange : AppColors.success)
                                          : colors.textPrimary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5),
                                ),
                                const SizedBox(height: 4),
                                if (_latitude != 0.0) ...[
                                  Text(
                                    'Latitude:\n$_latitude',
                                    style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Longitude:\n$_longitude',
                                    style: TextStyle(color: colors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Best Accuracy:\n±${_accuracy.toStringAsFixed(1)}m',
                                    style: TextStyle(
                                      color: _accuracy > 15.0 ? Colors.orange : colors.textPrimary,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  if (_accuracy > 15.0) ...[
                                    const SizedBox(height: 6),
                                    const Text(
                                      'Warning: GPS accuracy is poor. Check-ins near this tag may fail due to GPS drift.',
                                      style: TextStyle(color: Colors.orange, fontSize: 9, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton.icon(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: colors.honey,
                                        foregroundColor: colors.backgroundPrimary,
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                        padding: const EdgeInsets.symmetric(vertical: 10),
                                        elevation: 0,
                                      ),
                                      onPressed: () async {
                                        final url = Uri.parse('https://www.google.com/maps/search/?api=1&query=$_latitude,$_longitude');
                                        if (await canLaunchUrl(url)) {
                                          await launchUrl(url, mode: LaunchMode.externalApplication);
                                        }
                                      },
                                      icon: const Icon(LucideIcons.map, size: 14),
                                      label: const Text('CONFIRM ON GOOGLE MAPS', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                    ),
                                  ),
                                ] else ...[
                                  Text(
                                    _isCapturingLocation ? _gpsProgress : 'Tap to capture stabilized GPS coordinates',
                                    style: TextStyle(color: colors.textSecondary, fontSize: 11),
                                  ),
                                ],
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  if (_latitude != 0.0) ...[
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      value: _isLocationConfirmed,
                      onChanged: (bool? val) {
                        setState(() {
                          _isLocationConfirmed = val ?? false;
                        });
                        setSheetState(() {});
                      },
                      title: Text(
                        'LOCK & CONFIRM COORDINATES',
                        style: TextStyle(
                          color: colors.textPrimary,
                          fontSize: 10,
                          fontWeight: FontWeight.w900,
                          letterSpacing: 0.5,
                        ),
                      ),
                      subtitle: Text(
                        'Verify on Google Maps that the pin correctly represents this tag.',
                        style: TextStyle(color: colors.textSecondary, fontSize: 9),
                      ),
                      activeColor: colors.honey,
                      checkColor: colors.backgroundPrimary,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Radius Slider
                  Text('RADIUS', style: TextStyle(color: colors.textSecondary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: Slider(
                          value: _radius,
                          min: 25,
                          max: 200,
                          divisions: 7,
                          activeColor: colors.honey,
                          inactiveColor: colors.border,
                          onChanged: (v) => setSheetState(() => _radius = v),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: colors.surface,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: colors.border),
                        ),
                        child: Text(
                          '${_radius.toInt()}m',
                          style: TextStyle(color: colors.honey, fontWeight: FontWeight.w900, fontSize: 12),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [25, 50, 100, 200].map((r) => GestureDetector(
                      onTap: () => setSheetState(() => _radius = r.toDouble()),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: _radius == r ? colors.honey.withValues(alpha: 0.15) : colors.surface,
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(
                            color: _radius == r ? colors.honey.withValues(alpha: 0.5) : colors.border,
                          ),
                        ),
                        child: Text(
                          '${r}m',
                          style: TextStyle(
                            color: _radius == r ? colors.honey : colors.textSecondary,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    )).toList(),
                  ),
                  const SizedBox(height: 24),
                  GestureDetector(
                    onTap: _isSubmitting ? null : () async { await _registerTag(); if (!mounted) return; if (Navigator.canPop(ctx)) Navigator.pop(ctx); },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        gradient: colors.isDark ? AppColors.primaryGradient : AppColors.lightPrimaryGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: colors.isDark ? [] : [],
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (_isSubmitting)
                            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: colors.backgroundPrimary))
                          else
                            Icon(LucideIcons.plus, color: colors.backgroundPrimary, size: 16),
                          const SizedBox(width: 10),
                          Text(
                            _isSubmitting ? 'REGISTERING...' : 'REGISTER TAG',
                            style: TextStyle(
                              color: colors.backgroundPrimary,
                              fontWeight: FontWeight.w900,
                              fontSize: 13,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildFormField({
    required ThemeColors colors,
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    Widget? suffixIcon,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      style: TextStyle(color: colors.textPrimary),
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
        labelStyle: TextStyle(color: colors.textSecondary),
        hintStyle: TextStyle(color: colors.textSecondary.withValues(alpha: 0.4)),
        filled: true,
        fillColor: colors.surface,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.border)),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: colors.honey)),
        prefixIcon: Icon(icon, color: colors.honey, size: 18),
        suffixIcon: suffixIcon,
      ),
    );
  }

  Widget _buildTypeSelector(ThemeColors colors, StateSetter setSheetState) {
    final types = [
      {'id': 'attendance', 'label': 'ATTENDANCE', 'icon': LucideIcons.clock},
      {'id': 'equipment', 'label': 'EQUIPMENT', 'icon': LucideIcons.package},
      {'id': 'vehicle', 'label': 'VEHICLE', 'icon': LucideIcons.car},
      {'id': 'location', 'label': 'LOCATION', 'icon': LucideIcons.mapPin},
      {'id': 'field_work', 'label': 'FIELD WORK', 'icon': LucideIcons.briefcase},
    ];

    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: types.map((t) {
        final isSelected = _tagType == t['id'];
        return GestureDetector(
          onTap: () => setSheetState(() => _tagType = t['id'] as String),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: isSelected ? colors.honey.withValues(alpha: 0.1) : colors.surface,
              borderRadius: BorderRadius.circular(100),
              border: Border.all(
                color: isSelected ? colors.honey.withValues(alpha: 0.5) : colors.border,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(t['icon'] as IconData, color: isSelected ? colors.honey : colors.textSecondary, size: 12),
                const SizedBox(width: 6),
                Text(
                  t['label'] as String,
                  style: TextStyle(
                    color: isSelected ? colors.honey : colors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildErrorCard(ThemeColors colors, String error) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          const Icon(LucideIcons.alertCircle, color: AppColors.error, size: 18),
          const SizedBox(width: 12),
          Expanded(child: Text(error, style: const TextStyle(color: AppColors.error, fontSize: 12))),
        ],
      ),
    );
  }
}
