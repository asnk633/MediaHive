abstract class Failure {
  final String message;
  Failure(this.message);

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  ServerFailure([super.message = 'A server error occurred']);
}

class NetworkFailure extends Failure {
  NetworkFailure([super.message = 'No internet connection']);
}

class AuthFailure extends Failure {
  AuthFailure([super.message = 'Authentication failed']);
}

class CacheFailure extends Failure {
  CacheFailure([super.message = 'Cache error']);
}
