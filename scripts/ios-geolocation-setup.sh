#!/bin/bash

echo "🚀 Setting up iOS Geolocation for ZapAround..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📱 Building project for iOS..."
npm run build

echo "🔄 Syncing with Capacitor..."
npx cap sync ios

echo "📦 Installing iOS dependencies..."
cd ios/App
pod install
cd ../..

echo "🔧 Updating iOS project..."
npx cap update ios

echo "✅ iOS Geolocation setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open the iOS project: npm run cap:open:ios"
echo "2. Build and run on device/simulator"
echo "3. Test geolocation permissions"
echo ""
echo "🔍 To test geolocation:"
echo "- Add GeolocationTest component to a page"
echo "- Request location permissions"
echo "- Check console for location data"
echo ""
echo "⚠️  Important: Test on a physical device for best results!"
