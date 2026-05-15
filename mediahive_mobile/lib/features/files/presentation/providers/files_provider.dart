import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../domain/models/file_asset.dart';
import '../../data/repositories/supabase_file_repository.dart';

final fileRepositoryProvider = Provider((ref) => SupabaseFileRepository(Supabase.instance.client));

final filesListProvider = FutureProvider<List<FileAsset>>((ref) async {
  final repo = ref.watch(fileRepositoryProvider);
  final result = await repo.getFiles();
  return result.fold(
    (failure) => throw failure,
    (files) => files,
  );
});

final storageSummaryProvider = Provider((ref) {
  final files = ref.watch(filesListProvider).valueOrNull ?? [];
  final totalSize = files.fold<int>(0, (sum, f) => sum + f.size);
  
  // Basic categorization
  final videosSize = files.where((f) => f.mimeType.contains('video')).fold<int>(0, (sum, f) => sum + f.size);
  final imagesSize = files.where((f) => f.mimeType.contains('image')).fold<int>(0, (sum, f) => sum + f.size);
  final docsSize = totalSize - videosSize - imagesSize;

  return {
    'total': totalSize,
    'videos': videosSize,
    'images': imagesSize,
    'docs': docsSize,
  };
});
