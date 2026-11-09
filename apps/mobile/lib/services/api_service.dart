import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  // Android emulators reach the host machine through 10.0.2.2.
  static String get baseUrl {
    if (!kIsWeb && defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:4000/api';
    }
    return 'http://localhost:4000/api';
  }

  final _storage = const FlutterSecureStorage();

  Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }

  Future<void> saveToken(String token) async {
    await _storage.write(key: 'auth_token', value: token);
  }

  Future<void> saveSession(Map<String, dynamic> user, String? memberId) async {
    await _storage.write(key: 'auth_user', value: jsonEncode(user));
    if (memberId != null) {
      await _storage.write(key: 'member_id', value: memberId);
    } else {
      await _storage.delete(key: 'member_id');
    }
  }

  Future<Map<String, dynamic>?> getStoredUser() async {
    final raw = await _storage.read(key: 'auth_user');
    if (raw == null) return null;
    try {
      return jsonDecode(raw) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  Future<String?> getStoredMemberId() async {
    return await _storage.read(key: 'member_id');
  }

  Future<void> clearToken() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'auth_user');
    await _storage.delete(key: 'member_id');
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Auth
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      if (data['token'] != null) {
        await saveToken(data['token']);
      }
      if (data['user'] != null) {
        await saveSession(
          (data['user'] as Map).cast<String, dynamic>(),
          data['memberId'] as String?,
        );
      }
      return data;
    } else {
      final body = jsonDecode(response.body);
      throw Exception(body['error'] ?? 'Login failed');
    }
  }

  Future<void> logout() async {
    await clearToken();
  }

  // Members
  Future<Map<String, dynamic>> getMemberProfile(String memberId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/members/$memberId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load member profile');
    }
  }

  // Loans
  Future<List<dynamic>> getMyLoans(String memberId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/loans?memberId=$memberId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load loans');
    }
  }

  Future<Map<String, dynamic>> checkLoanEligibility(String memberId, double amount) async {
    final response = await http.post(
      Uri.parse('$baseUrl/loans/check-eligibility'),
      headers: await _getHeaders(),
      body: jsonEncode({'memberId': memberId, 'requestedAmount': amount}),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to check eligibility');
    }
  }

  Future<Map<String, dynamic>> applyForLoan({
    required String memberId,
    required double principalAmount,
    required int termMonths,
    required String purpose,
    List<Map<String, dynamic>>? guarantors,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/loans/apply'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'memberId': memberId,
        'principalAmount': principalAmount,
        'termMonths': termMonths,
        'purpose': purpose,
        'guarantors': guarantors ?? [],
      }),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['error'] ?? 'Failed to apply for loan');
    }
  }

  Future<Map<String, dynamic>> getLoanDetails(String loanId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/loans/$loanId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load loan details');
    }
  }

  // Savings
  Future<Map<String, dynamic>> getMySavings(String memberId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/savings/member/$memberId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load savings');
    }
  }

  Future<List<dynamic>> getContributions(String memberId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/savings/contributions/$memberId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to load contributions');
    }
  }

  // Payments (PayChangu mobile money)
  Future<List<dynamic>> getPaymentOperators() async {
    final response = await http.get(
      Uri.parse('$baseUrl/payments/operators'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    } else {
      throw Exception('Failed to load payment operators');
    }
  }

  Future<Map<String, dynamic>> initiateSavingsPayment({
    required String memberId,
    required double amount,
    required String phone,
    required String operator,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments/savings/initiate'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'memberId': memberId,
        'amount': amount,
        'phone': phone,
        'operator': operator,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception(_errorMessage(response.body, 'Failed to start savings payment'));
    }
  }

  Future<Map<String, dynamic>> initiateLoanRepayment({
    required String loanId,
    required double amount,
    required String phone,
    required String operator,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/payments/loans/$loanId/repay/initiate'),
      headers: await _getHeaders(),
      body: jsonEncode({
        'amount': amount,
        'phone': phone,
        'operator': operator,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception(_errorMessage(response.body, 'Failed to start loan repayment'));
    }
  }

  Future<Map<String, dynamic>> getPaymentStatus(String paymentId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/payments/$paymentId/status'),
      headers: await _getHeaders(),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } else {
      throw Exception(_errorMessage(response.body, 'Failed to check payment status'));
    }
  }

  String _errorMessage(String body, String fallback) {
    try {
      final data = jsonDecode(body);
      if (data is Map && data['error'] != null) {
        final error = data['error'];
        if (error is String) return error;
        return jsonEncode(error);
      }
    } catch (_) {
      // Ignore malformed error bodies.
    }
    return fallback;
  }

  // Reports
  Future<double> getCreditScore(String memberId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/reports/credit-score/$memberId'),
      headers: await _getHeaders(),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['creditScore'] as num).toDouble();
    } else {
      throw Exception('Failed to load credit score');
    }
  }
}
