import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/services/api_service.dart';

class ApplyLoanScreen extends StatefulWidget {
  final VoidCallback? onApplied;

  const ApplyLoanScreen({super.key, this.onApplied});

  @override
  State<ApplyLoanScreen> createState() => _ApplyLoanScreenState();
}

class _ApplyLoanScreenState extends State<ApplyLoanScreen> {
  final _formKey = GlobalKey<FormState>();
  final ApiService _apiService = ApiService();
  
  final _amountController = TextEditingController();
  final _termController = TextEditingController();
  final _purposeController = TextEditingController();
  
  bool _isLoading = false;
  bool _checkingEligibility = false;
  Map<String, dynamic>? _eligibilityResult;

  @override
  void dispose() {
    _amountController.dispose();
    _termController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  Future<void> _checkEligibility() async {
    if (_amountController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter loan amount')),
      );
      return;
    }

    setState(() => _checkingEligibility = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      final result = await _apiService.checkLoanEligibility(
        authProvider.memberId!,
        double.parse(_amountController.text),
      );
      if (!mounted) return;
      setState(() {
        _eligibilityResult = result;
        _checkingEligibility = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _checkingEligibility = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  Future<void> _submitLoan() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    try {
      await _apiService.applyForLoan(
        memberId: authProvider.memberId!,
        principalAmount: double.parse(_amountController.text),
        termMonths: int.parse(_termController.text),
        purpose: _purposeController.text.trim(),
      );
      if (!mounted) return;

      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Loan application submitted successfully!')),
      );
      _formKey.currentState!.reset();
      _amountController.clear();
      _termController.clear();
      _purposeController.clear();
      setState(() => _eligibilityResult = null);
      widget.onApplied?.call();
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to apply: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_eligibilityResult != null) ...[
              Card(
                color: _eligibilityResult!['eligible'] ? Colors.green[50] : Colors.red[50],
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _eligibilityResult!['eligible'] ? Icons.check_circle : Icons.cancel,
                            color: _eligibilityResult!['eligible'] ? Colors.green : Colors.red,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _eligibilityResult!['eligible'] 
                                ? 'You are eligible!' 
                                : 'Not eligible',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: _eligibilityResult!['eligible'] ? Colors.green : Colors.red,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('Credit Score: ${_eligibilityResult!['creditScore']}/100'),
                      if (!_eligibilityResult!['eligible']) ...[
                        const SizedBox(height: 8),
                        const Text('Reasons:', style: TextStyle(fontWeight: FontWeight.bold)),
                        ...(_eligibilityResult!['reasons'] as List).map((reason) => 
                          Padding(
                            padding: const EdgeInsets.only(left: 8, top: 4),
                            child: Text('• $reason', style: const TextStyle(fontSize: 12)),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],
            TextFormField(
              controller: _amountController,
              decoration: const InputDecoration(
                labelText: 'Loan Amount (K)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.money),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter loan amount';
                }
                if (double.tryParse(value) == null) {
                  return 'Please enter a valid amount';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _checkingEligibility ? null : _checkEligibility,
              icon: _checkingEligibility 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.search),
              label: const Text('Check Eligibility'),
            ),
            const SizedBox(height: 24),
            const Divider(),
            const SizedBox(height: 16),
            TextFormField(
              controller: _termController,
              decoration: const InputDecoration(
                labelText: 'Loan Term (Months)',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.calendar_month),
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'Please enter loan term';
                }
                final term = int.tryParse(value);
                if (term == null || term < 1 || term > 60) {
                  return 'Please enter a valid term (1-60 months)';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _purposeController,
              decoration: const InputDecoration(
                labelText: 'Loan Purpose',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.description),
              ),
              maxLines: 3,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Please enter loan purpose';
                }
                return null;
              },
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading || (_eligibilityResult != null && !_eligibilityResult!['eligible']) 
                  ? null 
                  : _submitLoan,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit Loan Application'),
            ),
            if (_eligibilityResult != null && !_eligibilityResult!['eligible'])
              Padding(
                padding: const EdgeInsets.only(top: 8),
                child: Text(
                  'You must meet eligibility requirements before applying',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
