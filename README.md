# WeddingPix - Interactive Gallery Platform

A comprehensive interactive gallery platform for special events like weddings, birthdays, and vacations. Built with React, TypeScript, Firebase, and Tailwind CSS.

## 🌟 Features Implemented

### Core Gallery System
- **Multi-theme Support**: Wedding (pink), Birthday (yellow), Vacation (blue), Custom themes
- **Gallery Owner Registration**: Email/password authentication via Firebase Auth
- **Gallery Creation**: Themed galleries with profile images, names, and bios
- **Complete Gallery Isolation**: Each gallery has separate database collections

### Visitor System
- **Device-based Identification**: Automatic visitor tracking using device fingerprinting
- **No Registration Required**: Visitors get unique IDs automatically
- **Visitor Onboarding**: Name registration with themed welcome screens
- **Activity Tracking**: Last active timestamps and session management

### Media Management
- **Photo & Video Uploads**: Firebase Storage integration
- **Stories Feature**: 24-hour expiring content (like Instagram Stories)
- **Caption Support**: Optional text captions for all media
- **Thumbnail Generation**: Automatic image optimization
- **Real-time Gallery Feed**: Live updates using Firebase listeners

### Social Features
- **Like System**: Visitors can like photos and videos
- **Comment System**: Real-time commenting on all media
- **Author Attribution**: Display visitor names on their uploads
- **Content Moderation**: Gallery owners can delete any content

### Music Integration
- **Spotify Integration**: Search and request songs
- **Music Request Queue**: Visitors submit song requests
- **Admin Approval**: Gallery owners approve/deny music requests
- **Playlist Management**: Integration with Spotify playlists

### Timeline Features
- **Event Timeline**: Chronological gallery milestones
- **Automatic Events**: Gallery creation, first uploads, etc.
- **Custom Events**: Gallery owners can add custom timeline entries

### Admin Panel
- **Content Management**: View and delete all gallery media
- **Visitor Overview**: See all gallery visitors and activity
- **Music Moderation**: Approve/deny song requests
- **Gallery Settings**: Manage gallery configuration

## 🏗️ Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and hot module replacement
- **Tailwind CSS** for styling with custom theme colors
- **shadcn/ui** component library for consistent design
- **Wouter** for client-side routing
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation

### Backend & Database
- **Firebase Authentication** for gallery owner accounts
- **Firebase Firestore** for real-time database
- **Firebase Storage** for file uploads and media storage
- **Express.js** server for development and API routing
- **Drizzle ORM** configured for future PostgreSQL migration

### State Management
- **React Context** for authentication, gallery, and visitor state
- **Local Storage** for device identification and visitor persistence
- **Firebase Listeners** for real-time data synchronization

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Firebase project with Authentication, Firestore, and Storage enabled
- Replit environment (configured)

### Installation
```bash
npm install
```

### Environment Variables
Set up these Firebase configuration variables:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Firebase Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /galleries/{galleryId} {
      allow read, write: if request.auth != null;
      match /{subcollection}/{document} {
        allow read, write: if request.auth != null;
      }
      match /{subcollection}/{document}/{nestedCollection}/{nestedDocument} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

**Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /galleries/{galleryId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Development
```bash
npm run dev
```
Server runs on port 5000 with hot reload enabled.

## 📁 Project Structure

```
├── client/src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── AdminPanel.tsx  # Gallery management
│   │   ├── GalleryFeed.tsx # Media display
│   │   ├── UploadModal.tsx # File uploads
│   │   └── ...
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Firebase auth
│   │   ├── GalleryContext.tsx # Gallery state
│   │   └── VisitorContext.tsx # Visitor state
│   ├── lib/               # Utilities
│   │   ├── firebase.ts    # Firebase config
│   │   ├── storage.ts     # Database operations
│   │   └── spotify.ts     # Spotify integration
│   └── pages/             # Route components
├── server/                # Express server
├── shared/               # Shared types and schemas
└── firebase-rules.txt    # Security rules reference
```

## 🎨 Theme System

### Available Themes
- **Wedding**: Pink/purple gradient with heart icons
- **Birthday**: Yellow/orange gradient with gift icons  
- **Vacation**: Blue/teal gradient with plane icons
- **Custom**: Gray gradient with camera icons

### Theme Features
- Automatic color schemes throughout the app
- Themed icons and gradients
- Consistent visual identity per gallery type

## 🔧 Key Components

### Gallery Onboarding
- Theme selection with visual previews
- Profile image upload
- Bio and description setup
- Automatic gallery ID generation

### Visitor Flow
1. Automatic device detection
2. Welcome screen with gallery theme
3. Name registration
4. Access to upload and interact

### Upload System
- Multi-file drag & drop support
- Photo/video/story type selection
- Live preview before upload
- Caption support

### Real-time Features
- Live gallery feed updates
- Real-time comments and likes
- Instant visitor activity tracking
- Auto-refreshing content

## 🚧 Current Status

### ✅ Completed Features
- Complete authentication system
- Gallery creation and management  
- Device-based visitor identification
- File upload and storage
- Real-time database integration
- Theme system implementation
- Admin panel functionality
- Spotify music integration
- Timeline features
- Social interactions (likes, comments)

### 🔄 Known Issues
- Visitor registration needs completion before content posting
- Dialog accessibility warnings (minor UI issue)
- Firebase composite index requirements for complex queries

### 🎯 Next Steps
- Fix visitor onboarding completion
- Implement gallery sharing links
- Add mobile responsive design
- Performance optimizations
- Deploy to production

## 🧰 Dependencies

### Core Dependencies
- React 18, TypeScript, Vite
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS, shadcn/ui
- TanStack Query, React Hook Form
- Wouter routing, Zod validation

### Development Tools
- ESBuild for server bundling
- Hot module replacement
- TypeScript compilation
- Tailwind CSS processing

## 📱 Browser Support
- Modern browsers with ES2020+ support
- Mobile browsers (responsive design)
- Firebase compatible environments

## 🤝 Contributing
Built on Replit with modular architecture for easy feature additions and modifications.

---

**Last Updated**: June 23, 2025  
**Version**: 2.0  
**Status**: Development Complete, Minor Issues Being Resolved