#!/bin/bash

# Sharvic Village Banking - Mobile App Launcher
# This script helps you run the mobile app with proper setup

set -e

echo "🏦 Sharvic Village Banking - Mobile App Launcher"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Flutter is installed
echo "🔍 Checking Flutter installation..."
if ! command -v flutter &> /dev/null; then
    echo -e "${RED}❌ Flutter is not installed${NC}"
    echo "Please install Flutter from: https://docs.flutter.dev/get-started/install"
    exit 1
fi

echo -e "${GREEN}✅ Flutter found:${NC} $(flutter --version | head -n 1)"
echo ""

# Check if API is running
echo "🔍 Checking if API is running..."
if curl -s http://localhost:4000/api/auth/login > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API is running on port 4000${NC}"
else
    echo -e "${YELLOW}⚠️  API doesn't seem to be running${NC}"
    echo "Please start the API first:"
    echo "  cd apps/api"
    echo "  npm run dev"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")/apps/mobile"

# Check if dependencies are installed
if [ ! -d ".dart_tool" ]; then
    echo "📦 Installing Flutter dependencies..."
    flutter pub get
    echo ""
fi

# Get available devices
echo "📱 Available devices:"
flutter devices
echo ""

# Detect platform and suggest API URL
echo "🌐 API Configuration:"
echo "Current API URL in lib/services/api_service.dart should be:"
echo ""
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
    echo "  - For Android Emulator: http://10.0.2.2:4000/api"
    echo "  - For iOS Simulator: http://localhost:4000/api"
    echo "  - For Physical Device: http://$IP:4000/api"
else
    # Linux/Other
    IP=$(hostname -I | awk '{print $1}')
    echo "  - For Android Emulator: http://10.0.2.2:4000/api"
    echo "  - For Physical Device: http://$IP:4000/api"
fi
echo ""

# Ask which device to run on
echo "How do you want to run the app?"
echo "1) Run on any available device (automatic)"
echo "2) Choose specific device"
echo "3) Just check setup (flutter doctor)"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🚀 Launching app on default device..."
        flutter run
        ;;
    2)
        echo ""
        echo "Available devices:"
        flutter devices
        echo ""
        read -p "Enter device ID: " device_id
        echo "🚀 Launching app on $device_id..."
        flutter run -d "$device_id"
        ;;
    3)
        echo ""
        echo "🏥 Running Flutter doctor..."
        flutter doctor -v
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
