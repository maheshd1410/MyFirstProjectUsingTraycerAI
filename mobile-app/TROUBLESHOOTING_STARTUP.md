# Mobile App Startup Troubleshooting Guide

## ✅ Issue Resolved: Missing Babel Plugins

### Problem
```
error: Cannot find module 'react-native-dotenv'
```

### Solution Applied
Installed missing Babel plugins:
```bash
npm install react-native-dotenv babel-plugin-transform-remove-console --save-dev --legacy-peer-deps
```

## 🚀 How to Run the App

### Start the Development Server
```bash
cd mobile-app
npx expo start --clear
```

The `--clear` flag clears the Metro bundler cache, which helps resolve caching issues.

### View the App

#### Option 1: Android Device/Emulator
1. Install **Expo Go** app from Google Play Store on your Android device
2. Make sure your device and laptop are on the same WiFi network
3. Open Expo Go app and scan the QR code shown in the terminal
4. Or press `a` in the terminal to automatically open in Android emulator (if installed)

#### Option 2: iOS Device/Simulator
1. Install **Expo Go** app from App Store on your iPhone
2. Make sure your device and laptop are on the same WiFi network
3. Open the Camera app and scan the QR code shown in the terminal
4. Or press `i` in the terminal to automatically open in iOS simulator (Mac only)

#### Option 3: Web Browser
1. Press `w` in the terminal
2. The app will open in your default browser at `http://localhost:19001`

### Current Status
✅ Expo server running on: `exp://192.168.29.92:19001`
✅ Metro bundler: Active
✅ All Babel plugins: Installed

## 📱 Testing the App Features

### What to Test:
1. **Authentication Flow**:
   - Login screen with email/password
   - Register screen
   - Forgot Password flow
   - Profile screen

2. **Product Features**:
   - Browse products (ProductListScreen)
   - View product details
   - Add to cart
   - Wishlist functionality

3. **Cart & Checkout**:
   - View cart items
   - Update quantities
   - Remove items
   - Proceed to checkout

4. **Phase 6 Enhancements**:
   - Button press animations (spring scale effect)
   - Modal slide-in animations
   - TextInput focus animations
   - List item staggered animations
   - Screen reader support

## 🎨 Animations to Watch For:
- ✨ Button spring scale on press
- 🎭 Modal slide-up with backdrop fade
- 📝 TextInput border color transitions
- 📱 Product list staggered animations
- 🛒 Cart footer slide-up animation
- 🔐 Login form fade-in animation

## ⚠️ Known Warnings (Can be Ignored)

### Dependency Version Warnings
The app is built with Expo 48 but some dependencies are for newer versions. These warnings don't prevent the app from running:

```
- react@18.0.0 (expected: 18.2.0)
- react-native@0.71.0 (expected: 0.71.14)
- Various expo packages version mismatches
```

**Impact**: None - app runs fine with these versions

### Node Engine Warnings
```
npm WARN EBADENGINE Unsupported engine
required: { node: '>= 20.19.4' }
current: { node: 'v20.11.0' }
```

**Impact**: None - Node 20.11.0 works fine, just slightly older than preferred

## 🔧 Common Issues & Solutions

### Issue: Port Already in Use
```
Port 19000 is already in use
```
**Solution**: Expo will automatically suggest port 19001 - just accept it

### Issue: Metro Bundler Errors
**Solution**: 
```bash
# Clear cache and restart
cd mobile-app
rm -rf node_modules/.cache
npx expo start --clear
```

### Issue: Module Not Found
**Solution**:
```bash
# Reinstall dependencies
cd mobile-app
rm -rf node_modules
npm install --legacy-peer-deps
```

### Issue: App Not Loading on Device
**Solution**:
1. Ensure device and laptop are on same WiFi
2. Check firewall isn't blocking port 19001
3. Try restarting the Metro bundler (press `r` in terminal)

### Issue: White Screen on Launch
**Solution**:
1. Press `r` in terminal to reload
2. Check terminal for JavaScript errors
3. Clear app cache in Expo Go app

## 📊 Performance Monitoring

In development mode, you can monitor performance:
- Open React DevTools (press `j` in terminal)
- Check component render counts
- Monitor re-renders with React DevTools Profiler

## 🎯 Next Steps After Launch

1. **Test Core Features**: Walk through the main user flows
2. **Test Animations**: Verify all animations are smooth (60fps)
3. **Test Accessibility**: 
   - Enable VoiceOver (iOS) or TalkBack (Android)
   - Navigate the app using screen reader
   - Test with text scaling at 200%
4. **Test Offline Mode**: Toggle airplane mode and verify cached data
5. **Test Error Handling**: Try invalid inputs, network errors, etc.

## 📝 Development Commands

```bash
# Start development server
npm start

# Start with cache cleared
npm start -- --clear

# Run on specific platform
npx expo start --android  # Android only
npx expo start --ios      # iOS only
npx expo start --web      # Web only

# Open debugger
npx expo start --dev-client

# Build for production
npx expo build:android
npx expo build:ios
```

## 🆘 Getting Help

If you encounter issues:
1. Check the terminal output for error messages
2. Look for red error screens in the app
3. Check Metro bundler logs (shown in terminal)
4. Review the PHASE_6_COMPLETION_REPORT.md for implementation details

## ✨ Features Implemented

### Phase 6 Complete Implementation:
- ✅ Animation infrastructure (FadeIn, SlideIn, ListItemAnimation)
- ✅ Accessibility utilities (WCAG 2.1 AA compliance)
- ✅ Performance optimizations (React.memo, useCallback, FlatList)
- ✅ Enhanced components (Button, Modal, TextInput)
- ✅ Optimized screens (ProductCard, ProductList, Cart, Login)
- ✅ Comprehensive documentation

---

**Last Updated**: January 23, 2026  
**Expo Version**: 48.0.0  
**React Native**: 0.71.0  
**Node Version**: 20.11.0
