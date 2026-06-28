import 'package:dartz/dartz.dart';
import 'package:mediahive_mobile/core/error/failure.dart';
import 'package:mediahive_mobile/features/files/domain/models/file_asset.dart';

abstract class FileRepository {
  Future<Either<Failure, List<FileAsset>>> getFiles();
  Future<Either<Failure, void>> uploadFile(FileAsset file);
  Future<Either<Failure, void>> deleteFile(String id);
}
