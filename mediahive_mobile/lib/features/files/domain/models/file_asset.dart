class FileAsset {
  final String id;
  final String name;
  final String path;
  final String mimeType;
  final int size;
  final DateTime createdAt;
  final String? downloadLink;
  final String? thumbnailLink;
  final String? uploadedByName;
  final String? category;
  final String? driveFileId;

  FileAsset({
    required this.id,
    required this.name,
    required this.path,
    required this.mimeType,
    required this.size,
    required this.createdAt,
    this.downloadLink,
    this.thumbnailLink,
    this.uploadedByName,
    this.category,
    this.driveFileId,
  });

  factory FileAsset.fromJson(Map<String, dynamic> json) {
    return FileAsset(
      id: json['id'] as String,
      name: json['name'] as String? ?? 'Untitled',
      path: json['path'] as String? ?? '',
      mimeType: json['mimeType'] as String? ?? json['mime_type'] as String? ?? 'application/octet-stream',
      size: int.tryParse(json['size']?.toString() ?? '0') ?? 0,
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'] as String) 
        : (json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now()),
      downloadLink: json['downloadLink'] as String? ?? json['download_link'] as String?,
      thumbnailLink: _constructThumbnail(json),
      uploadedByName: json['uploadedByName'] as String? ?? json['uploaded_by_name'] as String?,
      category: json['category'] as String? ?? json['type'] as String?,
      driveFileId: json['driveFileId'] as String? ?? json['drive_file_id'] as String?,
    );
  }

  static String? _constructThumbnail(Map<String, dynamic> json) {
    final driveId = json['driveFileId'] as String? ?? json['drive_file_id'] as String?;
    final originalLink = json['thumbnailLink'] as String? ?? json['thumbnail_link'] as String?;
    
    // If we have a drive ID, construct a high-quality, direct lh3 link
    if (driveId != null && driveId.isNotEmpty) {
      return 'https://lh3.googleusercontent.com/d/$driveId=s1000';
    }
    
    return originalLink;
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'path': path,
      'mimeType': mimeType,
      'size': size,
      'createdAt': createdAt.toIso8601String(),
      'downloadLink': downloadLink,
      'thumbnailLink': thumbnailLink,
      'uploadedByName': uploadedByName,
      'category': category,
      'driveFileId': driveFileId,
    };
  }
}
