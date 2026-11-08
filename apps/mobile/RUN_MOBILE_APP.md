# How to Run the Mobile App

Follow these steps to get the Sharvic mobile app running on your device.

## Prerequisites

1. **Flutter SDK** installed (3.0.0 or higher)
   ```bash
   flutter --version
   ```
   If not installed, follow: https://docs.flutter.dev/get-started/install

2. **Backend API running**
   ```bash
   # In the project root
   cd apps/api
   npm run dev
   # Should be running at http://localhost:4000
   ```

3. **Device or Emulator**
   - Android: Android Studio + Emulator OR physical device
   - iOS: Xcode + Simulator (Mac only)

## Step-by-Step Setup

### 1. Navigate to Mobile Directory
```bash
cd /Users/santinal/Desktop/loans/sharvic-village-banking/apps/mobile
```

### 2. Install Flutter Dependencies
```bash
flutter pub get
```

Expected output:
```
Running "flutter pub get" in mobile...
Resolving dependencies...
✓ Got dependencies!
```

### 3. Configure API URL

The app detects the host automatically:

- Android emulator: `http://10.0.2.2:4000/api`
- iOS simulator / web: `http://localhost:4000/api`

For a physical device, edit `lib/services/api_service.dart` and replace `localhost`
with your computer's LAN IP:

```dart
static const String baseUrl = 'http://192.168.1.XXX:4000/api';
```

**To find your computer's IP:**
```bash
# On Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# On Windows
ipconfig
```

### 4. Check Connected Devices
```bash
flutter devices
```

You should see your emulator or physical device listed.

### 5. Run the App

**Option A: Run on any available device**
```bash
flutter run
```

**Option B: Run on specific device**
```bash
# List devices first
flutter devices

# Run on specific device
flutter run -d <device-id>

# Examples:
flutter run -d emulator-5554           # Android emulator
flutter run -d iPhone                  # iOS simulator
flutter run -d 00008030-001234567890   # Physical device
```

**Option C: Run as a web app**
```bash
flutter run -d chrome --web-port 5500
```

### 6. Wait for Build

First build takes 3-5 minutes. Subsequent builds are faster (hot reload).

You'll see:
```
Launching lib/main.dart on Android SDK built for x86 in debug mode...
Running Gradle task 'assembleDebug'...
✓ Built build/app/outputs/flutter-apk/app-debug.apk.
Installing build/app/outputs/flutter-apk/app.apk...
Syncing files to device Android SDK built for x86...
Flutter run key commands.
r Hot reload. 
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).
```

## Testing the App

### 1. Initial Screen
You should see the login screen with:
- Sharvic Village Banking logo
- Email and password fields
- Login button

### 2. Test Login

**Option A: Demo member**
A demo member login already exists:
```
Email: dem@sharvic.com
Password: demo123
```

**Option B: Create a member login**
In the web dashboard, add a member with a **Login Email** and **Mobile App Password**.
For an existing member, call `POST /api/members/:id/create-account` with
`{ "email": "...", "password": "..." }`.

> The admin login (`admin@sharvic.com`) has no member profile, so the mobile app
> shows an "Account Not Linked" screen if you sign in with it.

### 3. After Login
You should see:
- Dashboard with welcome message
- Quick action cards
- Bottom navigation bar (Dashboard, Loans, Savings, Profile)

## Troubleshooting

### Problem: "flutter: command not found"
**Solution:** Flutter not installed or not in PATH
```bash
# Add to ~/.zshrc or ~/.bash_profile
export PATH="$PATH:/path/to/flutter/bin"
source ~/.zshrc
```

### Problem: "No devices found"
**Solution:** Start an emulator

**Android:**
```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd <avd-name>
```

**iOS (Mac only):**
```bash
# Open simulator
open -a Simulator
```

### Problem: "Error connecting to localhost"
**Solution:** Update API URL

- Android Emulator: Use `10.0.2.2` instead of `localhost`
- iOS Simulator: Use `localhost`
- Physical Device: Use your computer's IP address

**Test API connectivity:**
```bash
# From your device/emulator, test if API is reachable
curl http://10.0.2.2:4000/api/health
```

### Problem: Gradle build failures
**Solution:** 
```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
flutter run
```

### Problem: iOS CocoaPods issues (Mac)
**Solution:**
```bash
cd ios
pod deintegrate
pod install
cd ..
flutter run
```

### Problem: "Waiting for another flutter command to release the startup lock"
**Solution:**
```bash
killall -9 dart
rm -rf /path/to/flutter/bin/cache/lockfile
```

### Problem: Hot reload not working
**Solution:**
```bash
# Press 'R' in terminal for hot restart
# Or restart the app completely:
# Press 'q' to quit, then 'flutter run' again
```

## Development Tips

### Hot Reload
While app is running, make code changes and press:
- `r` - Hot reload (preserves state)
- `R` - Hot restart (resets state)

### Debug Console
In terminal, press:
- `p` - Toggle debug painting
- `w` - Dump widget hierarchy
- `t` - Dump rendering tree

### Install on Physical Device

**Android:**
1. Enable Developer Options on device
2. Enable USB Debugging
3. Connect via USB
4. Run `flutter run`

**iOS:**
1. Connect iPhone via USB
2. Trust computer on device
3. In Xcode, add your Apple ID
4. Run `flutter run`

## Building Release Versions

### Android APK
```bash
flutter build apk --release

# Output: build/app/outputs/flutter-apk/app-release.apk
```

### Android App Bundle (for Play Store)
```bash
flutter build appbundle --release

# Output: build/app/outputs/bundle/release/app-release.aab
```

### iOS (Mac only)
```bash
flutter build ios --release

# Then open in Xcode to archive and upload
open ios/Runner.xcworkspace
```

## Quick Commands Reference

```bash
# Check Flutter setup
flutter doctor

# Install dependencies
flutter pub get

# Run app
flutter run

# Run with specific flavor
flutter run --flavor dev

# Build release APK
flutter build apk --release

# Clean build files
flutter clean

# Analyze code
flutter analyze

# Run tests
flutter test

# Update Flutter
flutter upgrade
```

## Test User Credentials

After running seed script (`node scripts/seed-test-data.js`):

**Admin (for testing admin features):**
- Email: admin@sharvic.com
- Password: admin123

**Test Members:**
Members created through web dashboard can login using their email/phone and password set during creation.

## Expected App Flow

1. **Login** → Enter credentials
2. **Dashboard** → See welcome and quick actions
3. **Loans Tab** → View active loans or apply for new loan
4. **Check Eligibility** → Enter amount, see credit score
5. **Apply** → Submit loan application
6. **Savings Tab** → View balance and contribution history
7. **Profile Tab** → View personal info and credit score
8. **Logout** → Return to login screen

## Performance Notes

- First build: 3-5 minutes
- Subsequent builds: 10-30 seconds
- Hot reload: < 1 second
- App size: ~20-30 MB (debug), ~10-15 MB (release)

## Next Steps

Once app is running:

1. Test all features (see TESTING_GUIDE.md)
2. Report any bugs or issues
3. Customize branding (colors, logo, app name)
4. Add additional features as needed
5. Prepare for production deployment

## Support

If you encounter issues:
1. Check error messages in terminal
2. Run `flutter doctor` to check setup
3. Review this guide step-by-step
4. Check Flutter documentation: https://docs.flutter.dev
5. Search for specific error messages online

---

**Ready to run!** Execute: `flutter run` from the mobile directory.
