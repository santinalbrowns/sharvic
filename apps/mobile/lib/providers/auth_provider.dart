import 'package:flutter/foundation.dart';
import 'package:sharvic_mobile/services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  bool _isAuthenticated = false;
  bool _isInitializing = true;
  Map<String, dynamic>? _user;
  String? _memberId;

  bool get isAuthenticated => _isAuthenticated;
  bool get isInitializing => _isInitializing;
  Map<String, dynamic>? get user => _user;
  String? get memberId => _memberId;
  bool get hasMemberProfile => _memberId != null;

  AuthProvider() {
    checkAuthStatus();
  }

  Future<void> checkAuthStatus() async {
    final token = await _apiService.getToken();
    _user = await _apiService.getStoredUser();
    _memberId = await _apiService.getStoredMemberId();
    _isAuthenticated = token != null;
    _isInitializing = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await _apiService.login(email, password);
      _user = (response['user'] as Map?)?.cast<String, dynamic>();
      _memberId = response['memberId'] as String?;
      _isAuthenticated = true;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    }
  }

  Future<void> logout() async {
    await _apiService.clearToken();
    _user = null;
    _memberId = null;
    _isAuthenticated = false;
    notifyListeners();
  }
}
