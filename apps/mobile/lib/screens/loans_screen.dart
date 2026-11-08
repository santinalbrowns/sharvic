import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/services/api_service.dart';
import 'package:sharvic_mobile/screens/loan_details_screen.dart';
import 'package:sharvic_mobile/screens/apply_loan_screen.dart';

class LoansScreen extends StatefulWidget {
  final int initialTab;
  
  const LoansScreen({super.key, this.initialTab = 0});

  @override
  State<LoansScreen> createState() => _LoansScreenState();
}

class _LoansScreenState extends State<LoansScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ApiService _apiService = ApiService();
  List<dynamic> _loans = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
    _loadLoans();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadLoans() async {
    setState(() => _isLoading = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.memberId == null) {
      setState(() => _isLoading = false);
      return;
    }
    try {
      final loans = await _apiService.getMyLoans(authProvider.memberId!);
      if (!mounted) return;
      setState(() {
        _loans = loans;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading loans: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Loans'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Active Loans'),
            Tab(text: 'Apply for Loan'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildLoansTab(),
          ApplyLoanScreen(
            onApplied: () {
              _tabController.animateTo(0);
              _loadLoans();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLoansTab() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_loans.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.inbox, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text('No loans yet', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            const Text('Apply for your first loan to get started'),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadLoans,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _loans.length,
        itemBuilder: (context, index) {
          final loan = _loans[index];
          return _LoanCard(
            loan: loan,
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => LoanDetailsScreen(loanId: loan['id']),
                ),
              );
            },
          );
        },
      ),
    );
  }
}

class _LoanCard extends StatelessWidget {
  final Map<String, dynamic> loan;
  final VoidCallback onTap;

  const _LoanCard({required this.loan, required this.onTap});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'approved':
        return Colors.blue;
      case 'disbursed':
        return Colors.green;
      case 'completed':
        return Colors.grey;
      case 'rejected':
        return Colors.red;
      case 'defaulted':
        return Colors.red.shade900;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat.currency(symbol: 'K', decimalDigits: 2);
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    loan['loanNo'] ?? 'N/A',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(loan['status']),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      (loan['status'] ?? '').toUpperCase(),
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Principal',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        currencyFormat.format(loan['principalAmount']),
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        'Outstanding',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                      Text(
                        currencyFormat.format(loan['outstandingBalance']),
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: loan['outstandingBalance'] > 0 ? Colors.red : Colors.green,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: loan['outstandingBalance'] > 0
                  ? (1 - (loan['outstandingBalance'] / loan['totalRepayable']))
                    .toDouble()
                  : 1.0,
                backgroundColor: Colors.grey[300],
                valueColor: AlwaysStoppedAnimation<Color>(
                  loan['outstandingBalance'] > 0 ? Colors.orange : Colors.green,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
