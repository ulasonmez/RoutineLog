# Habit Tracker & Routine Logger

A modern, minimalist Progressive Web App (PWA) built to help you track your daily habits, medications, and routines with precision and ease.

![App Screenshot](/public/icons/app_screenshots.png)

## 🌟 Features

- **Daily Logging**: Quickly log your activities with a smart, masked time input (e.g., typing `14` becomes `14:00`).
- **Custom Catalog**: Create and manage your own library of habits, supplements, or tasks.
- **Calendar View**: Visualize your consistency with a monthly calendar view and dot indicators.
- **Detailed Stats**: Track your progress with interactive charts and streak counters.
- **PWA Support**: Installable on iOS and Android for a native app-like experience.
- **Dark Mode**: Sleek, battery-saving dark interface designed for daily use.
- **Secure**: Authentication and real-time data sync powered by Firebase.

## 🛠 Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth, Firestore)
- **Deployment**: Vercel
- **PWA**: `next-pwa`

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/habit-tracker.git
   cd habit-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

## 📱 Mobile Installation

- **iOS**: Open in Safari -> Share -> Add to Home Screen
- **Android**: Open in Chrome -> Menu -> Install App

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
