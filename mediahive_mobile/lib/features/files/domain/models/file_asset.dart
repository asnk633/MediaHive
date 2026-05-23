class FileAsset {
  final String id;
  final String name;
  final String path;
  final String mimeType;
  final int size;
  final DateTime createdAt;
  final String? downloadLink;
  final String? viewLink;
  final String? thumbnailLink;
  final String? uploadedByName;
  final String? uploadedBy;
  final String? category;
  final String? driveFileId;
  final String? uploadContext;

  FileAsset({
    required this.id,
    required this.name,
    required this.path,
    required this.mimeType,
    required this.size,
    required this.createdAt,
    this.downloadLink,
    this.viewLink,
    this.thumbnailLink,
    this.uploadedByName,
    this.uploadedBy,
    this.category,
    this.driveFileId,
    this.uploadContext,
  });

  factory FileAsset.fromJson(Map<String, dynamic> json) {
    final originalLink = json['downloadLink'] as String? ?? json['download_link'] as String?;
    String mimeType = json['mimeType'] as String? ?? json['mime_type'] as String? ?? 'application/octet-stream';
    final name = json['name'] as String? ?? 'Untitled';

    // Infer mime type if generic
    if (mimeType == 'application/octet-stream') {
      final downloadLink = _constructDownloadLink(json) ?? '';
      final extFromName = name.contains('.') ? name.split('.').last.toLowerCase() : '';
      final extFromLink = downloadLink.contains('.') ? downloadLink.split('?').first.split('.').last.toLowerCase() : '';
      
      final ext = extFromName.isNotEmpty ? extFromName : extFromLink;

      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].contains(ext)) {
        mimeType = 'image/$ext';
      } else if (['mp4', 'mov', 'avi'].contains(ext)) {
        mimeType = 'video/$ext';
      } else if (ext == 'pdf') {
        mimeType = 'application/pdf';
      }
    }
    
    return FileAsset(
      id: json['id'] as String,
      name: name,
      path: json['path'] as String? ?? '',
      mimeType: mimeType,
      size: int.tryParse(json['size']?.toString() ?? '0') ?? 0,
      createdAt: json['createdAt'] != null 
        ? DateTime.parse(json['createdAt'] as String) 
        : (json['created_at'] != null ? DateTime.parse(json['created_at'] as String) : DateTime.now()),
      downloadLink: _constructDownloadLink(json),
      viewLink: originalLink, // Keep original link for "Open" button
      thumbnailLink: _constructThumbnail(json) ?? (mimeType.startsWith('image/') ? _constructDownloadLink(json) : null),
      uploadedByName: json['uploadedByName'] as String? ?? json['uploaded_by_name'] as String?,
      uploadedBy: json['uploadedBy'] as String? ?? json['uploaded_by'] as String?,
      category: json['category'] as String? ?? json['type'] as String?,
      driveFileId: json['driveFileId'] as String? ?? json['drive_file_id'] as String?,
      uploadContext: json['uploadContext'] as String? ?? json['upload_context'] as String?,
    );
  }

  static String? _constructDownloadLink(Map<String, dynamic> json) {
    final driveId = json['driveFileId'] as String? ?? json['drive_file_id'] as String?;
    final originalLink = json['downloadLink'] as String? ?? json['download_link'] as String?;
    
    // If we have a drive ID, prefer the direct download URL over the view URL
    if (driveId != null && driveId.isNotEmpty) {
      return 'https://drive.google.com/uc?export=download&id=$driveId';
    }
    
    return (originalLink != null && originalLink.isNotEmpty) ? originalLink : null;
  }

  static String? _constructThumbnail(Map<String, dynamic> json) {
    final driveId = json['driveFileId'] as String? ?? json['drive_file_id'] as String?;
    final originalLink = json['thumbnailLink'] as String? ?? json['thumbnail_link'] as String?;
    String? mimeType = json['mimeType'] as String? ?? json['mime_type'] as String?;
    
    // If we have a drive ID, use the direct proxy with MIME support
    if (driveId != null && driveId.isNotEmpty) {
      if (mimeType?.contains('pdf') == true) {
        return 'https://drive.google.com/thumbnail?id=$driveId&sz=w1000';
      }
      return 'https://lh3.googleusercontent.com/d/$driveId=s1000';
    }
    
    // Fallback to original link
    if (originalLink != null && originalLink.isNotEmpty) return originalLink;

    // If it's an image, the file itself is the thumbnail
    if (mimeType != null && mimeType.startsWith('image/')) {
      return _constructDownloadLink(json);
    }
    
    return null;
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
      'viewLink': viewLink,
      'thumbnailLink': thumbnailLink,
      'uploadedByName': uploadedByName,
      'category': category,
      'driveFileId': driveFileId,
      'uploadContext': uploadContext,
    };
  }
}
