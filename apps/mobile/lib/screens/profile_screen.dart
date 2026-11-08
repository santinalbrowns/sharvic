import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:sharvic_mobile/providers/auth_provider.dart';
import 'package:sharvic_mobile/services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _member;
  double? _creditScore;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    try {
      final member = await _apiService.getMemberProfile(authProvider.memberId!);
      final creditScore = await _apiService.getCreditScore(authProvider.memberId!);
      if (!mounted) return;

      setState(() {
        _member = member;
        _creditScore = creditScore;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading profile: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(title: const Text('My Profile')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final currencyFormat = NumberFormat.currency(symbol: 'K', decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              showDialog(
                context: context,
                builder: (context) => AlertDialog(
                  title: const Text('Logout'),
                  content: const Text('Are you sure you want to logout?'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancel'),
                    ),
                    TextButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Provider.of<AuthProvider>(context, listen: false).logout();
                      },
                      child: const Text('Logout'),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadProfile,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: Text(
                        '${_member?['firstName']?[0] ?? ''}${_member?['lastName']?[0] ?? ''}',
                        style: const TextStyle(fontSize: 32, color: Colors.white),
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      '${_member?['firstName'] ?? ''} ${_member?['lastName'] ?? ''}',
                      style: Theme.of(context).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _member?['memberNo'] ?? 'N/A',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              if (_creditScore != null)
                Card(
                  color: _getCreditScoreColor(_creditScore!),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Credit Score',
                              style: TextStyle(color: Colors.white),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${_creditScore!.toStringAsFixed(0)}/100',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        Icon(
                          _getCreditScoreIcon(_creditScore!),
                          color: Colors.white,
                          size: 48,
                        ),
                      ],
                    ),
                  ),
                ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Personal Information',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const Divider(),
                      _InfoRow('Member Type', _member?['memberType']?.toUpperCase() ?? 'N/A'),
                      _InfoRow('Status', _member?['status']?.toUpperCase() ?? 'N/A'),
                      _InfoRow('Phone', _member?['phone'] ?? 'N/A'),
                      _InfoRow('Gender', _member?['gender']?.toUpperCase() ?? 'N/A'),
                      if (_member?['nationalId'] != null)
                        _InfoRow('National ID', _member!['nationalId']),
                      _InfoRow('Joined', _formatDate(_member?['joinedAt'])),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Membership',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                      const Divider(),
                      _InfoRow('Membership Fee', 
                        currencyFormat.format(_member?['membershipFeeAmount'] ?? 0)),
                      _InfoRow('Fee Status', 
                        _member?['membershipFeePaid'] == true ? 'PAID' : 'PENDING'),
                      if (_member?['membershipFeePaidAt'] != null)
                        _InfoRow('Paid On', _formatDate(_member!['membershipFeePaidAt'])),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(dynamic value) {
    if (value == null) return 'N/A';
    final parsed = DateTime.tryParse(value.toString());
    if (parsed == null) return 'N/A';
    return DateFormat('MMM dd, yyyy').format(parsed);
  }

  Color _getCreditScoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.blue;
    if (score >= 40) return Colors.orange;
    return Colors.red;
  }

  IconData _getCreditScoreIcon(double score) {
    if (score >= 80) return Icons.star;
    if (score >= 60) return Icons.thumb_up;
    if (score >= 40) return Icons.warning;
    return Icons.error;
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;

  const _InfoRow(this.label, this.value);

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
            ),
          ),
        ],
      ),
    );
  }
}
