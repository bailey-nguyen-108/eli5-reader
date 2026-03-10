# Development Build Workflow (iPhone)

This replaces Expo Go for day-to-day iOS testing.

## One-time setup
1. Login:
```bash
npx eas login
```

2. Register your iPhone (required for internal iOS dev builds):
```bash
npx eas device:create
```

3. Build and install the development client on your iPhone:
```bash
npm run eas:build:ios:dev
```

After build finishes, install it from the Expo build link/QR.

## Daily loop
1. Start metro for dev client:
```bash
npm run start:dev-client
```

2. Open your installed development app on iPhone and connect to this metro session.

3. Code + reload quickly without TestFlight.

## When to use TestFlight
Use TestFlight only for release candidate validation and sharing:
```bash
npm run eas:build:ios
npm run eas:submit:ios
```

## Optional (simulator build)
If you ever use iOS Simulator on Mac:
```bash
npm run eas:build:ios:dev-sim
```
