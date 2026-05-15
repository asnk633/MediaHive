import 'package:flutter_riverpod/flutter_riverpod.dart';

enum NavItem { dashboard, tasks, events, inventory, files, governance }

final navigationProvider = StateProvider<NavItem>((ref) => NavItem.dashboard);
