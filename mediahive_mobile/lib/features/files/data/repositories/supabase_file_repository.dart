import 'package:flutter/foundation.dart';
import 'package:dartz/dartz.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../../core/error/failure.dart';
import '../../domain/models/file_asset.dart';
import '../../domain/repositories/file_repository.dart';

class SupabaseFileRepository implements FileRepository {
  final SupabaseClient _supabaseClient;

  SupabaseFileRepository(this._supabaseClient);

  @override
  Future<Either<Failure, List<FileAsset>>> getFiles() async {
    try {
      debugPrint('[FILE_REPO] Fetching files from remote...');
      final response = await _supabaseClient
          .from('files')
          .select()
          .order('created_at', ascending: false);
      
      debugPrint('[FILE_REPO] Received response from Supabase. Count: ${(response as List).length}');
      
      final files = (response as List).map((json) {
        return FileAsset.fromJson({
          ...json,
          // Handle the messy column names in DB
          'mimeType': json['mimeType'] ?? json['mime_type'] ?? 'application/octet-stream',
          'downloadLink': json['downloadLink'] ?? json['download_link'],
          'size': int.tryParse(json['size']?.toString() ?? '0') ?? 0,
          'createdAt': json['created_at'],
        });
      }).where((file) {
        // Filter out inventory asset images
        final isInventory = file.uploadContext == 'inventory_asset' || 
                            file.name.startsWith('INV_');
        return !isInventory;
      }).toList();

      // De-duplicate items to prevent duplicate transfers/files listing
      final seenIds = <String>{};
      final seenFiles = <String>{}; // combination of name and size
      final uniqueFiles = <FileAsset>[];
      for (var file in files) {
        final fileKey = '${file.name}_${file.size}';
        if (!seenIds.contains(file.id) && !seenFiles.contains(fileKey)) {
          seenIds.add(file.id);
          seenFiles.add(fileKey);
          uniqueFiles.add(file);
        }
      }
      
      return Right(uniqueFiles);
    } catch (e) {
      debugPrint('[FILE_REPO] Error: $e');
      return Left(ServerFailure(e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> uploadFile(FileAsset file) async {
    // Basic implementation for now
    return Left(ServerFailure('Upload not implemented yet'));
  }

  @override
  Future<Either<Failure, void>> deleteFile(String id) async {
    try {
      await _supabaseClient.from('files').delete().eq('id', id);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(e.toString()));
    }
  }
}
