# Football Mobile App

A modern mobile application for organizing amateur football matches in Antwerp. Find games, create matches, challenge players, and manage your team.

Built with React Native, Expo, and Firebase.

---

## Quick Start

### Requirements

- **Node.js** (version 16+) - [Download](https://nodejs.org/)
- **Expo Go** app on your phone:
  - [iOS](https://apps.apple.com/app/expo-go/id982107779)
  - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)

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

3. **Configure Firebase**
   - Copy `config/firebase.example.ts` to `config/firebase.ts`
   - Add your Firebase credentials

4. **Start the app**

   ```bash
   npx expo start --tunnel
   ```

5. **Open on your phone**
   - Scan the QR code with your camera (iOS)
   - Or scan with Expo Go app (Android)

### Troubleshooting

```bash
# Clear cache and restart
npx expo start -c --tunnel
```

---

## Features

### Authentication & Security

- Email/password registration and login
- Secure password validation (8+ characters, uppercase, number)
- Real-time password strength indicator (Weak/Medium/Strong)
- Password visibility toggle
- Persistent sessions with auto-login
- Secure token management with Firebase Auth

### Profile Management

- Upload profile photo from camera roll
- Edit profile name and bio
- Select favorite positions (GK, CB, LB, RB, CDM, CM, CAM, LW, RW, ST, CF)
- View personal statistics (rating, matches played, goals)
- Beautiful gradient avatar with initials
- Real-time profile updates
- Online/offline status indicators

### Match Management

- Create matches with custom details (date, time, location)
- Set skill level (Beginner, Intermediate, Advanced, All)
- Define max players (2-22)
- Select preferred formation (4-3-3, 4-4-2, 3-5-2, 4-2-3-1)
- Browse and filter matches (Upcoming, Past, Open, All)
- Join matches with position selection
- Leave matches
- View detailed match information
- Track match statistics (score, shots on target)
- Manage player positions (match creator only)
- Jersey numbers in lineup
- Pull-to-refresh functionality

### Field Visualization

- Interactive football field layout
- Multiple tactical formations
- Real-time player positioning with jersey numbers
- Formation switcher
- Tap players to view their profiles

### Field Reservation System

- Reserve football fields in Antwerp (8 locations available)
- Select date and time slots
- View your active reservations
- Available locations:
  - Wilrijkse Pleinen
  - Deurne Park
  - Middelheim Sports Complex
  - Sportoase Borgerhout
  - Ekeren Football Fields
  - Luchtbal Sports Park
  - Merksem Complex
  - Hoboken Sports Fields

### Social Features

- View any player's profile with stats and positions
- Real-time chat system with WhatsApp-style interface
- Online/offline status indicators
- Challenge system (Penalty Shootout, 1v1 Match)
- Accept or decline challenges
- Rating system (1-10 scale)
- View average player ratings
- Real-time message delivery

### Notifications

- Push notifications for new messages
- Push notifications for challenges
- Push notifications for ratings
- In-app notification center
- Accept/decline challenges directly from notifications
- Real-time notification updates
- Tap notifications to navigate to relevant screen

### Design & User Experience

- Modern emerald green gradient theme
- Liquid glass navigation bar with smooth spring animations
- Glassmorphism effects with frosted glass appearance
- Dynamic page titles (username or screen name)
- Edge-to-edge design
- Beautiful empty states
- Loading indicators
- Pull-to-refresh functionality
- Error handling with helpful messages
- Custom reusable components (Button, Input, Card)
- Consistent typography and spacing system

---

## Testing

### Test Accounts

| Email           | Password | Name   | Position |
| --------------- | -------- | ------ | -------- |
| test@test.com   | test123  | Sergiu | LW/RW    |
| test1@test.com  | Test1234 | Rayane | RB/LB    |
| john@test.com   | test123  | John   | ST       |
| mike@test.com   | test123  | Mike   | CM       |
| alex@test.com   | test123  | Alex   | CM/ST    |
| maggie@test.com | test123  | Maggie | CB       |

### Test Scenarios

**Create a match**

1. Login with any account
2. Go to "Create" tab
3. Fill in match details
4. Create and find your match in "Search"

**Challenge a player**

1. Open a player profile
2. Click "Challenge"
3. Choose type (Penalty Shootout or 1v1)
4. Other player receives notification

**Chat with player**

1. Open player profile
2. Click "Send Message"
3. Type your message
4. Real-time chat interface

**Rate a player**

1. Open player profile
2. Click "Give Rating"
3. Select rating (1-10)
4. Rating updates instantly

### Create Your Own Account

1. Open the app
2. Tap "Register here"
3. Enter name, email and strong password
4. Select favorite positions
5. Start playing

---

## Team

**Developed by:**

- [Sergiu Neagu](https://github.com/sergiuNE)
- [Rayane Amarchouh](https://github.com/RayaneAm)

**Course:** Intro Mobile  
**Institution:** AP Hogeschool  
**Year:** 2026

---
