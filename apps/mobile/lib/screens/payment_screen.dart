import 'dart:async';

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/services/api_service.dart';

typedef PaymentInitiator = Future<Map<String, dynamic>> Function({
  required double amount,
  required String phone,
  required String operator,
});

class PaymentScreen extends StatefulWidget {
  final String title;
  final String description;
  final String memberId;
  final double? initialAmount;
  final PaymentInitiator initiatePayment;
  final VoidCallback? onSuccess;

  const PaymentScreen({
    super.key,
    required this.title,
    required this.description,
    required this.memberId,
    required this.initiatePayment,
    this.initialAmount,
    this.onSuccess,
  });

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  final _amountController = TextEditingController();
  final _phoneController = TextEditingController();

  static final List<Map<String, dynamic>> _fallbackOperators = [
    {'code': 'airtel', 'name': 'Airtel Money'},
    {'code': 'tnm', 'name': 'TNM Mpamba'},
  ];

  List<Map<String, dynamic>> _operators = _fallbackOperators;
  String? _selectedOperator = 'airtel';

  bool _isLoading = true;
  bool _isStarting = false;
  bool _isCheckingStatus = false;
  String? _error;

  Map<String, dynamic>? _payment;
  String _status = 'pending';
  String _message = '';
  bool _successHandled = false;

  Timer? _pollTimer;
  int _pollAttempts = 0;

  @override
  void initState() {
    super.initState();
    if (widget.initialAmount != null && widget.initialAmount! > 0) {
      _amountController.text = widget.initialAmount!.toStringAsFixed(2);
    }
    _loadFormData();
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _amountController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadFormData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    String phone = authProvider.user?['phone']?.toString() ?? '';
    List<Map<String, dynamic>> operators = _fallbackOperators;

    try {
      final member = await _apiService.getMemberProfile(widget.memberId);
      phone = member['phone']?.toString() ?? phone;
    } catch (_) {
      // Fall back to the phone number on the login account.
    }

    try {
      final result = await _apiService.getPaymentOperators();
      if (result.isNotEmpty) {
        operators = result
            .map((operator) => (operator as Map).cast<String, dynamic>())
            .toList();
      }
    } catch (_) {
      // Fall back to the built-in operator list.
    }

    if (!mounted) return;
    setState(() {
      _phoneController.text = phone;
      _operators = operators;
      _selectedOperator = operators.first['code']?.toString();
      _isLoading = false;
    });
  }

  Future<void> _startPayment() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isStarting = true;
      _error = null;
      _message = '';
    });

    try {
      final response = await widget.initiatePayment(
        amount: double.parse(_amountController.text.trim()),
        phone: _phoneController.text.trim(),
        operator: _selectedOperator!,
      );

      if (!mounted) return;
      final payment = (response['payment'] as Map?)?.cast<String, dynamic>();
      setState(() {
        _payment = payment;
        _status = payment?['status']?.toString() ?? 'pending';
        _message = response['message']?.toString() ?? '';
        _isStarting = false;
      });

      if (_status == 'successful') {
        _handleSuccess();
      } else if (_status == 'pending') {
        _startPolling();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isStarting = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollAttempts = 0;
    _pollTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      if (!mounted) {
        timer.cancel();
        return;
      }
      _pollAttempts++;
      if (_pollAttempts > 40) {
        timer.cancel();
        setState(() {
          _message = 'Still waiting for confirmation. You can check again below.';
        });
        return;
      }
      await _checkStatus();
    });
  }

  Future<void> _checkStatus() async {
    final payment = _payment;
    if (payment == null || _isCheckingStatus) return;

    _isCheckingStatus = true;
    try {
      final response = await _apiService.getPaymentStatus(payment['id'].toString());
      if (!mounted) return;

      final refreshed = (response['payment'] as Map?)?.cast<String, dynamic>();
      final status = response['status']?.toString() ?? _status;

      setState(() {
        if (refreshed != null) _payment = refreshed;
        _status = status;
        _message = response['message']?.toString() ?? _message;
      });

      if (status == 'successful') {
        _pollTimer?.cancel();
        _handleSuccess();
      } else if (status == 'failed') {
        _pollTimer?.cancel();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _message = 'Could not reach the payment service. Retrying...';
      });
    } finally {
      _isCheckingStatus = false;
    }
  }

  void _handleSuccess() {
    if (_successHandled) return;
    _successHandled = true;
    widget.onSuccess?.call();
  }

  void _tryAgain() {
    _pollTimer?.cancel();
    setState(() {
      _payment = null;
      _status = 'pending';
      _message = '';
      _error = null;
      _successHandled = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'K', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(title: Text(widget.title)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: _payment == null
                  ? _buildForm(currencyFormat)
                  : _buildStatus(currencyFormat),
            ),
    );
  }

  Widget _buildForm(NumberFormat currencyFormat) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Icon(Icons.phone_android, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(width: 12),
                  Expanded(child: Text(widget.description)),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _amountController,
            decoration: const InputDecoration(
              labelText: 'Amount (K)',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.payments),
            ),
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            validator: (value) {
              final amount = double.tryParse((value ?? '').trim());
              if (amount == null || amount <= 0) {
                return 'Enter a valid amount';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          TextFormField(
            controller: _phoneController,
            decoration: const InputDecoration(
              labelText: 'Mobile Money Number',
              hintText: '0991234567',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.phone),
            ),
            keyboardType: TextInputType.phone,
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Enter the mobile money number';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
          DropdownButtonFormField<String>(
            initialValue: _selectedOperator,
            decoration: const InputDecoration(
              labelText: 'Mobile Money Operator',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.account_balance_wallet),
            ),
            items: _operators.map((operator) {
              return DropdownMenuItem<String>(
                value: operator['code']?.toString(),
                child: Text(operator['name']?.toString() ?? ''),
              );
            }).toList(),
            onChanged: (value) => setState(() => _selectedOperator = value),
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.red[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.red[200]!),
              ),
              child: Text(_error!, style: TextStyle(color: Colors.red[800])),
            ),
          ],
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _isStarting ? null : _startPayment,
            icon: _isStarting
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.lock),
            label: Text(_isStarting ? 'Starting payment...' : 'Pay with Mobile Money'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'A payment prompt will be sent to your phone. Approve it with your mobile money PIN.',
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }

  Widget _buildStatus(NumberFormat currencyFormat) {
    final isSuccessful = _status == 'successful';
    final isFailed = _status == 'failed';
    final color = isSuccessful
        ? Colors.green
        : isFailed
            ? Colors.red
            : Colors.orange;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                Icon(
                  isSuccessful
                      ? Icons.check_circle
                      : isFailed
                          ? Icons.cancel
                          : Icons.hourglass_top,
                  size: 72,
                  color: color,
                ),
                const SizedBox(height: 16),
                Text(
                  isSuccessful
                      ? 'Payment Successful'
                      : isFailed
                          ? 'Payment Failed'
                          : 'Waiting for Confirmation',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: color,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  currencyFormat.format(_payment?['amount'] ?? 0),
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                const SizedBox(height: 8),
                Text(
                  _message.isNotEmpty
                      ? _message
                      : isSuccessful
                          ? 'Your payment has been recorded.'
                          : 'Approve the payment prompt on your phone.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 16),
                if (!isSuccessful && !isFailed) ...[
                  const LinearProgressIndicator(),
                  const SizedBox(height: 16),
                ],
                _StatusRow('Reference', _payment?['reference']?.toString() ?? 'N/A'),
                _StatusRow('Phone', _payment?['phone']?.toString() ?? 'N/A'),
                _StatusRow('Operator', _payment?['operator']?.toString() ?? 'N/A'),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        if (!isSuccessful && !isFailed)
          OutlinedButton.icon(
            onPressed: _isCheckingStatus ? null : _checkStatus,
            icon: const Icon(Icons.refresh),
            label: Text(_isCheckingStatus ? 'Checking...' : 'Check Status'),
          ),
        if (isFailed)
          ElevatedButton.icon(
            onPressed: _tryAgain,
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
          ),
        if (isSuccessful)
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.done),
            label: const Text('Done'),
          ),
      ],
    );
  }
}

class _StatusRow extends StatelessWidget {
  final String label;
  final String value;

  const _StatusRow(this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodySmall),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
        ],
      ),
    );
  }
}
