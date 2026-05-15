abstract class Failure {
  final String message;
  Failure(this.message);

  @override
  String toString() => message;
}

class ServerFailure extends Failure {
  ServerFailure([String message = 'A server error occurred']) : super(message);
}

class NetworkFailure extends Failure {
  NetworkFailure([String message = 'No internet connection']) : super(message);
}

class AuthFailure extends Failure {
  AuthFailure([String message = 'Authentication failed']) : super(message);
}

class CacheFailure extends Failure {
  CacheFailure([String message = 'Cache error']) : super(message);
}
