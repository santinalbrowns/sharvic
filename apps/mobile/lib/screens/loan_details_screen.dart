import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/screens/payment_screen.dart';
import 'package:sharvic_mobile/services/api_service.dart';

class LoanDetailsScreen extends StatefulWidget {
  final String loanId;

  const LoanDetailsScreen({super.key, required this.loanId});

  @override
  State<LoanDetailsScreen> createState() => _LoanDetailsScreenState();
}

class _LoanDetailsScreenState extends State<LoanDetailsScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _loan;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadLoanDetails();
  }

  Future<void> _loadLoanDetails() async {
    setState(() => _isLoading = true);
    try {
      final loan = await _apiService.getLoanDetails(widget.loanId);
      if (!mounted) return;
      setState(() {
        _loan = loan;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading loan details: $e')),
        );
      }
    }
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'N/A';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return 'N/A';
    return DateFormat('MMM dd, yyyy').format(parsed);
  }

  Future<void> _openRepayLoan() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final memberId = authProvider.memberId;
    if (memberId == null) return;

    final outstanding = (_loan?['outstandingBalance'] as num?)?.toDouble() ?? 0;

    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => PaymentScreen(
          title: 'Repay Loan',
          description: 'Repay loan ${_loan?['loanNo']} with mobile money.',
          memberId: memberId,
          initialAmount: outstanding,
          initiatePayment: ({
            required double amount,
            required String phone,
            required String operator,
          }) {
            return _apiService.initiateLoanRepayment(
              loanId: widget.loanId,
              amount: amount,
              phone: phone,
              operator: operator,
            );
          },
          onSuccess: _loadLoanDetails,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loan Details')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    if (_loan == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Loan Details')),
        body: const Center(child: Text('Loan not found')),
      );
    }

    final currencyFormat = NumberFormat.currency(symbol: 'K', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: Text(_loan!['loanNo'] ?? 'Loan Details'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadLoanDetails,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _DetailRow('Loan Number', _loan!['loanNo']?.toString() ?? 'N/A'),
                      const Divider(),
                      _DetailRow('Status', _loan!['status']?.toUpperCase() ?? 'N/A'),
                      const Divider(),
                      _DetailRow('Principal Amount', currencyFormat.format(_loan!['principalAmount'])),
                      const Divider(),
                      _DetailRow('Interest Rate', '${_loan!['interestRate']}%'),
                      const Divider(),
                      _DetailRow('Interest Amount', currencyFormat.format(_loan!['interestAmount'])),
                      const Divider(),
                      _DetailRow('Total Repayable', currencyFormat.format(_loan!['totalRepayable'])),
                      const Divider(),
                      _DetailRow('Outstanding Balance', 
                        currencyFormat.format(_loan!['outstandingBalance']),
                        valueColor: _loan!['outstandingBalance'] > 0 ? Colors.red : Colors.green,
                      ),
                      const Divider(),
                      _DetailRow('Term', '${_loan!['termMonths']} months'),
                      const Divider(),
                      _DetailRow('Purpose', _loan!['purpose']?.toString() ?? 'N/A'),
                    ],
                  ),
                ),
              ),
              if (_loan!['status'] == 'disbursed' &&
                  ((_loan!['outstandingBalance'] as num?) ?? 0) > 0) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _openRepayLoan,
                    icon: const Icon(Icons.payments),
                    label: const Text('Repay Loan with Mobile Money'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ],
              const SizedBox(height: 16),
              if (_loan!['repayments'] != null && (_loan!['repayments'] as List).isNotEmpty) ...[
                Text('Repayment History', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...(_loan!['repayments'] as List).map((repayment) => Card(
                  child: ListTile(
                    leading: const Icon(Icons.payment, color: Colors.green),
                    title: Text(currencyFormat.format(repayment['amount'])),
                    subtitle: Text(repayment['receiptNo'] ?? 'N/A'),
                    trailing: Text(
                      _formatDate(repayment['receivedAt']),
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                )),
              ],
              const SizedBox(height: 16),
              if (_loan!['schedule'] != null && (_loan!['schedule'] as List).isNotEmpty) ...[
                Text('Repayment Schedule', style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 8),
                ...(_loan!['schedule'] as List).map((schedule) => Card(
                  child: ListTile(
                    leading: Icon(
                      schedule['status'] == 'paid' ? Icons.check_circle : Icons.pending,
                      color: schedule['status'] == 'paid' 
                          ? Colors.green 
                          : schedule['status'] == 'overdue' 
                              ? Colors.red 
                              : Colors.orange,
                    ),
                    title: Text('Installment ${schedule['installmentNumber']}'),
                    subtitle: Text(
                      'Due: ${_formatDate(schedule['dueDate'])}'
                    ),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(currencyFormat.format(schedule['totalDue'])),
                        Text(
                          schedule['status']?.toUpperCase() ?? 'N/A',
                          style: TextStyle(
                            fontSize: 10,
                            color: schedule['status'] == 'paid' 
                                ? Colors.green 
                                : schedule['status'] == 'overdue' 
                                    ? Colors.red 
                                    : Colors.orange,
                          ),
                        ),
                      ],
                    ),
                  ),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _DetailRow(this.label, this.value, {this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          Text(
            value,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: valueColor,
            ),
          ),
        ],
      ),
    );
  }
}
