# Sharvic Village Banking Mobile App

Flutter mobile application for Sharvic Micro-Finance Group members.

## Features

- **Member Authentication** - Secure login for members
- **Dashboard** - Quick overview of member activities
- **Loan Management**
  - View all loans (active, pending, completed)
  - Apply for new loans
  - Check loan eligibility with credit score
  - View detailed loan information
  - Track repayment schedules
- **Savings Management**
  - View total savings balance
  - Track monthly contributions
  - View contribution history
- **Member Profile**
  - View personal information
  - View credit score
  - View membership status

## Prerequisites

- Flutter SDK (>=3.0.0)
- Dart SDK
- Android Studio / Xcode for emulators
- Running Sharvic API backend (see `apps/api`)

## Installation

1. Install Flutter dependencies:
```bash
cd apps/mobile
flutter pub get
```

2. API endpoint:
The app selects the host automatically:
- Android emulator: `http://10.0.2.2:4000/api`
- iOS simulator / web: `http://localhost:4000/api`
- Physical device: edit `lib/services/api_service.dart` and use your computer's IP address

3. Run the app:
```bash
flutter run
```

## Project Structure

```
lib/
├── main.dart                      # App entry point
├── providers/
│   └── auth_provider.dart        # Authentication state management
├── screens/
│   ├── login_screen.dart         # Login page
│   ├── home_screen.dart          # Main dashboard
│   ├── loans_screen.dart         # Loans list
│   ├── loan_details_screen.dart  # Individual loan details
│   ├── apply_loan_screen.dart    # Loan application form
│   ├── savings_screen.dart       # Savings & contributions
│   └── profile_screen.dart       # Member profile & credit score
└── services/
    └── api_service.dart          # API communication layer
```

## Key Features Implementation

### Authentication
- JWT token-based authentication
- Secure token storage using `flutter_secure_storage`
- Auto-logout on token expiration

### Loan Eligibility Check
Before applying, members can check:
- Credit score (0-100 scale)
- Eligibility status
- Specific reasons for ineligibility if not qualified

### Credit Scoring Factors
- Repayment history (40 points)
- Outstanding loans (20 points)
- Savings consistency (20 points)
- Membership duration (10 points)
- Guarantor history (10 points)

### Loan Application Flow
1. Enter loan amount and check eligibility
2. If eligible, complete application form
3. Submit with purpose and term
4. Track application status in real-time

## Development

### Build for Android
```bash
flutter build apk --release
```

### Build for iOS
```bash
flutter build ios --release
```

### Run Tests
```bash
flutter test
```

## Configuration

### API Endpoints Used
- `POST /api/auth/login` - Member login
- `GET /api/members/:id` - Get member profile
- `GET /api/loans` - List member loans
- `GET /api/loans/:id` - Get loan details
- `POST /api/loans/check-eligibility` - Check loan eligibility
- `POST /api/loans/apply` - Apply for loan
- `GET /api/savings/member/:id` - Get member savings
- `GET /api/savings/contributions/:id` - Get contributions
- `GET /api/reports/credit-score/:id` - Get credit score

## Notes

- Ensure the API backend is running before using the mobile app
- The mobile app is designed for members, not administrators
- For administrative functions, use the web dashboard
- Update the API base URL for production deployment
