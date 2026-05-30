
class Institution {
  final String id;
  final String name;
  final String type;

  Institution({required this.id, required this.name, this.type = 'Institution'});

  factory Institution.fromJson(Map<String, dynamic> json) {
    return Institution(
      id: json['id'] as String,
      name: json['name'] as String,
      type: (json['type'] ?? 'Institution') as String,
    );
  }
}

class Department {
  final int id;
  final String name;
  final String code;

  Department({required this.id, required this.name, this.code = 'DEPT'});

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as int,
      name: json['name'] as String,
      code: (json['code'] ?? 'DEPT') as String,
    );
  }
}

class UserProfile {
  final String id;
  final String fullName;
  final String role;
  final String? avatarUrl;

  UserProfile({
    required this.id,
    required this.fullName,
    required this.role,
    this.avatarUrl,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      fullName: (json['full_name'] ?? json['email'] ?? 'Unknown User') as String,
      role: (json['role'] ?? 'member') as String,
      avatarUrl: json['avatar_url'] as String?,
    );
  }
}
