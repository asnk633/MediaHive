import 'package:flutter_riverpod/flutter_riverpod.dart';

enum NavItem { dashboard, tasks, events, inventory, files, governance }

final navigationProvider = StateProvider<NavItem>((ref) => NavItem.dashboard);

/// Provider to control the visibility of the floating navigation dock
final bottomNavVisibleProvider = StateProvider<bool>((ref) => true);
