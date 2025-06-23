# WeddingPix - Interactive Gallery Platform

## Overview

WeddingPix is a full-stack interactive gallery platform designed for creating and sharing themed photo galleries for special events like weddings, birthdays, and vacations. The application allows users to create galleries where visitors can upload photos, videos, and stories, interact with content through likes and comments, and share music requests.

## System Architecture

The application follows a modern full-stack architecture with:

- **Frontend**: React with TypeScript, using Vite as the build tool
- **Backend**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM (configured but not fully implemented)
- **Storage**: Firebase integration for authentication and data storage
- **Styling**: Tailwind CSS with shadcn/ui components
- **Deployment**: Replit hosting with autoscale deployment

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application with client-side routing using Wouter
- **State Management**: React Context for authentication, gallery, and visitor state
- **UI Components**: shadcn/ui library for consistent design system
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for server state management

### Backend Architecture
- **Express Server**: RESTful API server with middleware for logging and error handling
- **Authentication**: Firebase Auth integration
- **File Storage**: Firebase Storage for media uploads
- **Database**: Dual setup with both Firebase Firestore and PostgreSQL/Drizzle support

### Data Storage Solutions
- **Primary**: Firebase Firestore for real-time data synchronization
- **Secondary**: PostgreSQL with Drizzle ORM (configured for future migration)
- **File Storage**: Firebase Storage for images and videos
- **Session Management**: Express sessions with PostgreSQL store

## Data Flow

1. **User Authentication**: Firebase Auth handles user registration and login
2. **Gallery Creation**: Gallery owners create themed galleries with profile information
3. **Visitor Registration**: Visitors join galleries using device fingerprinting
4. **Media Upload**: Real-time file uploads to Firebase Storage with thumbnail generation
5. **Social Features**: Real-time likes, comments, and music requests
6. **Admin Panel**: Gallery owners can moderate content and view analytics

## External Dependencies

- **Firebase**: Authentication, Firestore database, and file storage
- **Spotify API**: Music search and playlist integration
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

- **Development**: Local development with Vite dev server and Express backend
- **Production**: 
  - Build process: Vite builds client, esbuild bundles server
  - Deployment target: Replit autoscale
  - Port configuration: Internal port 5000, external port 80
  - Static file serving: Built client served from Express in production

## Changelog

- June 23, 2025. Initial setup
- June 23, 2025. Complete WeddingPix platform implementation:
  - Firebase authentication and real-time database integration
  - Multi-theme gallery system (wedding, birthday, vacation, custom)
  - Device-based visitor identification system
  - Complete media management with stories (24h expiration)
  - Spotify music request integration
  - Admin panel with full content moderation
  - Gallery isolation ensuring complete data separation

## User Preferences

Preferred communication style: Simple, everyday language.