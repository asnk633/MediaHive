import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/supabase_service.dart';
import '../models/institutional_data.dart';

final supabaseServiceProvider = Provider((ref) => SupabaseService());

final institutionsProvider = FutureProvider<List<Institution>>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  return service.getInstitutions();
});

final departmentsProvider = FutureProvider<List<Department>>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  return service.getDepartments();
});

final mediaTeamProvider = FutureProvider<List<UserProfile>>((ref) async {
  final service = ref.watch(supabaseServiceProvider);
  return service.getMediaTeam();
});
