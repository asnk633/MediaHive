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
      final response = await _supabaseClient
          .from('files')
          .select()
          .or('upload_context.is.null,upload_context.neq.inventory_asset')
          .order('created_at', ascending: false);
      
      final files = (response as List).map((json) {
        return FileAsset.fromJson({
          ...json,
          // Handle the messy column names in DB
          'mimeType': json['mimeType'] ?? json['mime_type'] ?? 'application/octet-stream',
          'downloadLink': json['downloadLink'] ?? json['download_link'] ?? '',
          'size': int.tryParse(json['size']?.toString() ?? '0') ?? 0,
          'createdAt': json['created_at'],
        });
      }).toList();
      
      return Right(files);
    } catch (e) {
      print('[FILE_REPO] Error: $e');
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
