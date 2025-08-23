# Ionic CLI Guide for ZapAround

## Overview
This guide covers how to use Ionic CLI with your existing Capacitor project. Ionic CLI provides powerful commands for building, testing, and deploying your app across platforms.

## What is Ionic CLI?
Ionic CLI is a command-line interface that provides tools for building, testing, and deploying Ionic applications. It integrates seamlessly with Capacitor and provides additional features beyond the basic Capacitor CLI.

## Installation Status
✅ **Ionic CLI v7.2.1** is already installed and configured for your project.

## Available Ionic CLI Commands

### Project Information
```bash
# Get project information
ionic info

# Check project status
ionic --help
```

### Development Server
```bash
# Start development server (equivalent to npm run dev)
ionic serve

# Start with specific options
ionic serve --external --host=0.0.0.0 --port=3000
```

### Build Commands
```bash
# Build web assets for production
ionic build

# Build for specific platform
ionic build --prod
```

### Capacitor Integration (Most Important!)
```bash
# Add native platform
ionic capacitor add ios
ionic capacitor add android

# Sync web assets with native platforms
ionic capacitor sync

# Sync specific platform
ionic capacitor sync ios

# Copy web assets to native platforms
ionic capacitor copy ios

# Open native project in IDE
ionic capacitor open ios

# Run on device/simulator
ionic capacitor run ios

# Update native platforms and plugins
ionic capacitor update

# Build native project
ionic capacitor build ios
```

## Ionic CLI vs Capacitor CLI

### Ionic CLI Commands (Recommended)
```bash
ionic capacitor sync ios      # Instead of: npx cap sync ios
ionic capacitor open ios      # Instead of: npx cap open ios
ionic capacitor run ios       # Instead of: npx cap run ios
ionic capacitor copy ios      # Instead of: npx cap copy ios
ionic capacitor update        # Instead of: npx cap update
```

### Capacitor CLI Commands (Still Work)
```bash
npx cap sync ios
npx cap open ios
npx cap run ios
```

## Development Workflow with Ionic CLI

### 1. Start Development
```bash
# Start dev server with live reload
ionic serve

# Start with external access (for mobile testing)
ionic serve --external
```

### 2. Build and Sync
```bash
# Build for production
ionic build

# Sync with iOS
ionic capacitor sync ios
```

### 3. Open and Run
```bash
# Open in Xcode
ionic capacitor open ios

# Run on simulator/device
ionic capacitor run ios
```

### 4. Live Reload Development
```bash
# Terminal 1: Start dev server
ionic serve --external

# Terminal 2: Run with live reload
ionic capacitor run ios --livereload --external
```

## Advanced Ionic CLI Features

### Configuration Management
```bash
# Get configuration values
ionic config get

# Set configuration values
ionic config set integrations.capacitor.enabled true

# List all configurations
ionic config list
```

### Project Repair
```bash
# Fix dependency issues
ionic repair
```

### Integrations
```bash
# List available integrations
ionic integrations list

# Enable/disable integrations
ionic integrations enable capacitor
ionic integrations disable cordova
```

## NPM Scripts Integration

I've added Ionic CLI commands to your `package.json` for easy access:

### Available Scripts
```bash
# Ionic CLI commands
npm run ionic:serve          # Start dev server
npm run ionic:build          # Build project
npm run ionic:sync:ios       # Sync with iOS
npm run ionic:open:ios       # Open iOS in Xcode
npm run ionic:run:ios        # Run on iOS
npm run ionic:copy:ios       # Copy to iOS
npm run ionic:update         # Update platforms

# Combined workflows
npm run ionic:ios:dev        # Build + sync + open
npm run ionic:ios:run        # Build + sync + run
```

## Best Practices

### 1. Use Ionic CLI for Capacitor Operations
- **Preferred**: `ionic capacitor sync ios`
- **Alternative**: `npx cap sync ios`

### 2. Development Workflow
```bash
# Development
ionic serve --external

# Build and deploy
ionic build
ionic capacitor sync ios
ionic capacitor open ios
```

### 3. Live Reload Setup
```bash
# Terminal 1: Dev server
ionic serve --external

# Terminal 2: Native run
ionic capacitor run ios --livereload --external
```

### 4. Platform-Specific Commands
```bash
# iOS
ionic capacitor sync ios
ionic capacitor open ios
ionic capacitor run ios

# Android (when added)
ionic capacitor sync android
ionic capacitor open android
ionic capacitor run android
```

## Troubleshooting

### Common Issues

#### 1. Ionic CLI Not Recognizing Project
```bash
# Reinitialize Ionic
ionic init --type=react --capacitor
```

#### 2. Build Failures
```bash
# Clean and rebuild
ionic repair
ionic build
ionic capacitor sync ios
```

#### 3. Sync Issues
```bash
# Force update
ionic capacitor update
ionic capacitor sync ios
```

### Debug Commands
```bash
# Check project status
ionic info

# Verify Capacitor integration
ionic integrations list

# Check configuration
ionic config list
```

## Quick Reference

### Daily Development
```bash
# Start development
ionic serve --external

# Build and sync
ionic build && ionic capacitor sync ios

# Open in Xcode
ionic capacitor open ios

# Run on device
ionic capacitor run ios
```

### Production Build
```bash
# Build for production
ionic build --prod

# Sync with native platforms
ionic capacitor sync

# Open and test
ionic capacitor open ios
```

### Live Reload Development
```bash
# Terminal 1
ionic serve --external

# Terminal 2
ionic capacitor run ios --livereload --external
```

## Next Steps

### Immediate Actions
1. Test Ionic CLI: `ionic info`
2. Try development server: `ionic serve`
3. Test Capacitor integration: `ionic capacitor sync ios`

### Future Enhancements
- Add Android platform: `ionic capacitor add android`
- Configure live updates: `ionic live-update configure`
- Set up CI/CD with Ionic Appflow

## Resources

- [Ionic CLI Documentation](https://ionicframework.com/docs/cli)
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Ionic Framework Documentation](https://ionicframework.com/docs)
- [Community Forum](https://forum.ionicframework.com/)

## Support

For Ionic CLI issues:
- Check the [Ionic CLI documentation](https://ionicframework.com/docs/cli)
- Visit the [GitHub repository](https://github.com/ionic-team/ionic-cli)
- Join the [community forum](https://forum.ionicframework.com/)

For project-specific issues:
- Review this documentation
- Check the project's issue tracker
- Consult the development team
