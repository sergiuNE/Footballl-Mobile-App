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
  - Auto-login on app restart
  
- **Profile Management**
  - Edit name and favorite positions
  - View personal stats (rating, matches played, goals)
  - Beautiful gradient avatar with user initials
  - Logout functionality

- **Match Management**
  - Create new football matches
  - Set date, time, and location with native pickers
  - Choose skill level (Beginner, Intermediate, Advanced, All)
  - Define max players (2-22)
  - Join/leave matches
  - View match details with lineup
  - Manage player positions (creator only)
  - Match statistics (score, shots on target)

- **Match Discovery**
  - Browse all available matches
  - Filter by status (Upcoming, Past, All, Open)
  - View match details (date, time, location, players)
  - Pull-to-refresh functionality
  - Past matches in History tab

- **Field Visualization**
  - Interactive football field layout
  - Multiple formations (4-3-3, 4-4-2, 3-5-2, 4-2-3-1)
  - Player positioning system with jersey numbers
  - Formation switcher
  - Click players to view their profiles

- **Field Reservation**
  - Reserve football fields in Antwerp
  - 8 available locations
  - Choose date and time slots
  - View your reservations

- **Social Features**
  - View other player profiles
  - Real-time chat with players
  - Send challenges (Penalty Shootout, 1v1)
  - Give ratings to other players (1-10)
  - View player statistics
  - Accept/decline challenges

- **Notifications**
  - Challenge notifications
  - Accept/decline challenges
  - Real-time updates

- **Modern UI/UX**
  - Gradient design system (emerald green theme)
  - Reusable components (Button, Input, Card)
  - Consistent typography and spacing
  - Smooth animations and transitions
  - WhatsApp-style chat interface
  - Beautiful empty states

---

## Testing

### Test Account 1 (Sergiu)
**Email:** `test@test.com`  
**Password:** `test123`

### Test Account 2 (Rayane)
**Email:** `test1@test.com`  
**Password:** `Test1234`

### Test Account 3 (John)
**Email:** `john@test.com`  
**Password:** `test123`

### Test Account 4 (Mike)
**Email:** `mike@test.com`  
**Password:** `test123`

### Test Account 5 (Alex)
**Email:** `alex@test.com`  
**Password:** `test123`

### Test Account 6 (Maggie)
**Email:** `maggie@test.com`  
**Password:** `test123`


### Pre-loaded Users
The app includes 5 pre-loaded users for testing:
- **Sergiu** (LW/RW) - Rating: 8.5
- **Rayane** (RB/LB) - Rating: 9.2
- **John** (ST) - Rating: 7.8
- **Mike** (CM) - Rating: 8.1
- **Alex** (CM/ST) - Rating: 6.9

### Creating Your Own Account
1. Open the app
2. Tap "Register here"
3. Fill in your details
4. Start playing!

---

## Team

**Developed by:**
- [Sergiu Neagu](https://github.com/sergiuNE)
- [Rayane Amarchouh](https://github.com/RayaneAm)

**Course:** Intro Mobile   
**Institution:** AP Hogeschool  
**Year:** 2026-2027

---
