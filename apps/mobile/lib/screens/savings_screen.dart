import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/screens/payment_screen.dart';
import 'package:sharvic_mobile/services/api_service.dart';

class SavingsScreen extends StatefulWidget {
  const SavingsScreen({super.key});

  @override
  State<SavingsScreen> createState() => _SavingsScreenState();
}

class _SavingsScreenState extends State<SavingsScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _savingsAccount;
  List<dynamic> _contributions = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSavings();
  }

  Future<void> _loadSavings() async {
    setState(() => _isLoading = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      final savings = await _apiService.getMySavings(authProvider.memberId!);
      if (!mounted) return;

      setState(() {
        _savingsAccount = (savings['account'] as Map?)?.cast<String, dynamic>();
        _contributions = (savings['contributions'] as List?) ?? [];
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading savings: $e')),
        );
      }
    }
  }

  Future<void> _openAddSavings() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final memberId = authProvider.memberId;
    if (memberId == null) return;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          title: 'Add Savings',
          description: 'Top up your savings account with mobile money.',
          memberId: memberId,
          initiatePayment: ({
            required double amount,
            required String phone,
            required String operator,
          }) {
            return _apiService.initiateSavingsPayment(
              memberId: memberId,
              amount: amount,
              phone: phone,
              operator: operator,
            );
          },
          onSuccess: _loadSavings,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Savings')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final currencyFormat = NumberFormat.currency(symbol: 'K', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Savings'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadSavings,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total Savings Balance',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        currencyFormat.format(_savingsAccount?['balance'] ?? 0),
                        style: Theme.of(context).textTheme.headlineLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Account: ${_savingsAccount?['accountNo'] ?? 'N/A'}',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _openAddSavings,
                  icon: const Icon(Icons.add),
                  label: const Text('Add Savings'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Contribution History',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  Text(
                    '${_contributions.length} total',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_contributions.isEmpty)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(32),
                    child: Text('No contributions yet'),
                  ),
                )
              else
                ..._contributions.map((contribution) {
                  final dateFormat = DateFormat('MMM yyyy');
                  final receivedAt = contribution['receivedAt'];
                  final receivedDate = receivedAt != null
                      ? DateTime.tryParse(receivedAt.toString())
                      : null;
                  
                  return Card(
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: Theme.of(context).colorScheme.primary,
                        child: const Icon(Icons.add, color: Colors.white),
                      ),
                      title: Text(currencyFormat.format(contribution['amount'])),
                      subtitle: Text('Receipt: ${contribution['receiptNo']}'),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            receivedDate != null ? dateFormat.format(receivedDate) : '',
                            style: Theme.of(context).textTheme.bodySmall,
                          ),
                          Text(
                            contribution['contributionMonth'] ?? '',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
