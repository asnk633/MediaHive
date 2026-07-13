import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mediahive_mobile/core/theme_provider.dart';
import 'package:mediahive_mobile/core/utils/layout_helpers.dart';
import 'package:mediahive_mobile/features/inventory/presentation/screens/inventory_screen.dart';
import 'package:mediahive_mobile/features/files/presentation/screens/downloads_screen.dart';

class AssetsScreen extends ConsumerStatefulWidget {
  const AssetsScreen({super.key});

  @override
  ConsumerState<AssetsScreen> createState() => _AssetsScreenState();
}

class _AssetsScreenState extends ConsumerState<AssetsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(_handleTabSelection);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final tabParam = GoRouterState.of(context).uri.queryParameters['tab'];
    final targetIndex = tabParam == 'files' ? 1 : 0;
    if (_tabController.index != targetIndex) {
      _tabController.index = targetIndex;
    }
  }

  void _handleTabSelection() {
    if (!_tabController.indexIsChanging) {
      final tabName = _tabController.index == 1 ? 'files' : 'equipment';
      final currentQueryTab = GoRouterState.of(context).uri.queryParameters['tab'];
      if (currentQueryTab != tabName) {
        context.go('/assets?tab=$tabName');
      }
    }
  }

  @override
  void dispose() {
    _tabController.removeListener(_handleTabSelection);
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colors = ref.watch(themeColorsProvider);
    final headerHeight = ref.watch(headerHeightProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Content Area containing the nested screens
          Positioned.fill(
            child: TabBarView(
              controller: _tabController,
              children: const [
                InventoryScreen(),
                DownloadsScreen(),
              ],
            ),
          ),

          // Floating Custom Tab Selector positioned directly below the GlobalHeader
          Positioned(
            top: headerHeight == 0 ? 115.0 : headerHeight + 8.0,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: colors.surface.withValues(alpha: 0.85),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: colors.border.withValues(alpha: 0.5)),
              ),
              child: Theme(
                data: Theme.of(context).copyWith(
                  hoverColor: Colors.transparent,
                  splashColor: Colors.transparent,
                  highlightColor: Colors.transparent,
                ),
                child: TabBar(
                  controller: _tabController,
                  dividerColor: Colors.transparent,
                  indicator: BoxDecoration(
                    color: colors.honey,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: colors.honey.withValues(alpha: 0.35),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  indicatorSize: TabBarIndicatorSize.tab,
                  labelColor: Colors.black,
                  unselectedLabelColor: colors.textSecondary.withValues(alpha: 0.7),
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    letterSpacing: 1.2,
                  ),
                  unselectedLabelStyle: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 10,
                    letterSpacing: 1.2,
                  ),
                  tabs: const [
                    Tab(
                      height: 38,
                      child: Center(child: Text('EQUIPMENT')),
                    ),
                    Tab(
                      height: 38,
                      child: Center(child: Text('FILES')),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
