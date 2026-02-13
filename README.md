# Football Mobile App

A modern mobile application for organizing amateur football matches. Find games, create matches, and manage your team lineup with an intuitive interface.

Built with React Native, Expo, and Firebase.

---

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn**
- **Expo Go** app on your phone
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Android Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/RayaneAm/Voetbal-Mobile-App.git
   cd Voetbal-Mobile-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase configuration**
   - Copy `config/firebase.example.ts` to `config/firebase.ts`
   - Add your Firebase credentials (contact project maintainers)

4. **Start the development server**
   ```bash
   npx expo start --tunnel
   ```
   
   > **Note:** Use `--tunnel` flag for iOS devices or if you're on a different network

5. **Open the app**
   - Scan the QR code with your phone camera (iOS)
   - Or scan with Expo Go app (Android)

### Troubleshooting

**App not loading?**
```bash
# Clear cache and restart
npx expo start -c --tunnel
```

**Module errors?**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```
---

## Features

### Implemented
- **Authentication System**
  - User registration with email/password
  - Secure login with Firebase Auth
  - Persistent sessions with AsyncStorage
  
- **Profile Management**
  - Edit name and favorite positions
  - View personal stats (rating, matches played)
  - Logout functionality

- **Match Creation**
  - Create new football matches
  - Set date, time, and location
  - Choose skill level (Beginner, Intermediate, Advanced, All)
  - Define max players (2-22)

- **Match Discovery**
  - Browse all available matches
  - Filter by status (All, Open, Upcoming)
  - View match details (date, time, location, players)
  - Pull-to-refresh functionality

- **Field Visualization**
  - Interactive football field layout
  - Multiple formations (4-3-3, 4-4-2, 3-5-2, 4-2-3-1)
  - Player positioning system
  - Formation switcher

- **Modern UI/UX**
  - Gradient design system
  - Reusable components (Button, Input, Card)
  - Consistent typography and spacing
  - Smooth animations and transitions

### Coming Soon
- Match detail view with lineup
- Join/leave match functionality
- Real-time player chat
- Field reservation system
- Player rating system
- Match history

---

## Tech Stack

| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile development |
| **Expo** | Development toolchain and SDK |
| **TypeScript** | Type-safe JavaScript |
| **Firebase Auth** | User authentication |
| **Cloud Firestore** | NoSQL database |
| **Expo Router** | File-based navigation |
| **React Native Async Storage** | Persistent local storage |
| **Expo Linear Gradient** | Gradient backgrounds |

---

## Design System

### Color Palette
- **Primary Green:** `#10B981` (Emerald)
- **Accent:** `#059669` (Dark Green)
- **Background:** `#F9FAFB` (Light Gray)
- **Text:** `#111827` (Near Black)

### Components
All UI components follow a consistent design language with:
- Gradient backgrounds for primary actions
- Rounded corners (8-24px)
- Elevation shadows for depth
- Responsive touch feedback

---

## Testing

### Test Account
**Email:** `test@test.com`  
**Password:** `test123`

### Creating Your Own Account
1. Open the app
2. Tap "Register here"
3. Fill in your details
4. Start playing!

---

## Team

**Developed by:**
- [Rayane Amarchouh](https://github.com/RayaneAm)
- [Sergiu Neagu](https://github.com/sergiuNE)

**Course:** Intro Mobile  
**Year:** 2026

---

## License

This project is created for educational purposes.

---