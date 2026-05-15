import 'package:dartz/dartz.dart';
import '../../../../core/error/failure.dart';
import '../models/file_asset.dart';

abstract class FileRepository {
  Future<Either<Failure, List<FileAsset>>> getFiles();
  Future<Either<Failure, void>> uploadFile(FileAsset file);
  Future<Either<Failure, void>> deleteFile(String id);
}
