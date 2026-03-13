# Task Management Application

A full-stack, real-time, offline-capable task management and weekly planning application. Features a robust Kanban board for task organization, cross-device synchronization, offline capabilities, and detailed analytics.

## Tech Stack Overview

### Frontend
- **React.js (Vite)** with TypeScript
- **Redux Toolkit & RTK Query** for state management and API communication
- **Dexie.js** for IndexedDB local storage (Offline First)
- **Tailwind CSS** for styling
- **React Router** for navigation
- **@dnd-kit** for a flexible accessible drag-and-drop experience
- **Recharts** for visualizing task completion analytics
- **React Hook Form & Zod** for robust form handling and validation
- **React Hot Toast** for beautiful notifications

### Backend
- **Node.js & Express** with TypeScript
- **MongoDB & Mongoose** for the database layer
- **Express Validator** for strong backend request validation
- **JSON Web Tokens (JWT)** & bcryptjs for secure authentication

## Features

- **Offline-First & Auto-Sync**: Keep working even when your internet connection drops. All modifications (creates, updates, deletes, movements) are stored locally in IndexedDB using Dexie and automatically synchronized with the backend once you re-connect.
- **Kanban Boards**: Create multiple boards, share them with team members (with distinct Member/Admin roles), and visually organize tasks across columns (Todo, In Progress, Done).
- **Weekly Planner**: Plan your tasks across a 7-day view synchronized seamlessly with your backlog. 
- **Dependencies**: Establish parent/child blocker relationships between tasks warning you if you try to mark a blocked task as complete prematurely.
- **Undo / Redo Framework**: Fully integrated multi-level undo stack across drag-and-drops and offline transactions.
- **Analytics**: Visualize workflow state via responsive pie charts tracking the ratio of Pending vs Complete tasks in your boards.
- **Full Authentication**: Secure sign-up, login, password resets, and email verifications integrated with Resend/Nodemailer.

## Merge Conflict Resolution Strategy

This application utilizes a robust offline-first architecture prioritizing data integrity and transparency.

### 1. Timestamp-Based Reconciliation (Server-Wins)
When a user regains connection, the frontend compares the latest `updatedAt` timestamps of its local synchronized records against the backend's master records. 
If the server's timestamp is newer than the client's local copy, the server's version is deemed authoritative. The local version is overwritten.

### 2. Transparent Conflict Logging
Rather than silently dropping a user's offline work during a conflict, the system actively logs a conflict record to the local `db.conflicts` store. 
**Example Event**: `"Local changes to task 'Refactoring' were overwritten by a newer version from the server."`
This ensures the user is proactively notified (via the UI's `ConflictHandling` component) that their offline work was overridden by another team member's activity.

### 3. Orphan Prevention (Fallback Assignment)
If a user is working offline and modifies a task belonging to a board that another user simultaneously deletes, syncing those offline mutations would traditionally fail or result in lost data.
Instead, the sync engine checks if the target board exists before pushing task mutations. If the board was deleted, the system automatically redirects the task to the user's primary "fallback" board, and generates a conflict warning:
`"The target board for a task was deleted. The task was moved to 'Default Board'."`

## Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas Dashboard)

### Backend Setup
1. Open terminal and hit \`cd backend\`
2. Run \`npm install\` to install dependencies.
3. Establish a \`.env\` file using your MongoDB URI, JWT Secrets, SMTP settings, etc.
4. Run \`npm run dev\` to start the backend Node process.

### Frontend Setup
1. Open a new terminal and hit \`cd frontend\`
2. Run \`npm install\` to install dependencies.
3. Configure \`.env\` with \`VITE_API_URL\` pointing to the backend.
4. Run \`npm run dev\` to start the Vite development server.

## Scripts

### Frontend
- \`npm run dev\` - Starts development server 
- \`npm run build\` - Compiles TypeScript and builds for production
- \`npm run lint\` - Lints the codebase using ESLint

### Backend
- \`npm run dev\` - Starts Node.js with hot-reloading (nodemon/ts-node)
- \`npm run build\` - Compiles backend TypeScript to javascript 
- \`npm run start\` - Executes the compiled server.js
