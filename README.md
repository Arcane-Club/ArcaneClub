# Arcane Club

A modern, full-stack community forum application built with **Express.js**, **Next.js**, and **PostgreSQL**. 

Arcane Club offers a robust platform for online communities with features like user authentication, rich content management, real-time interactions, and a comprehensive admin dashboard.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-%5E5.0-blue.svg)

## ✨ Features

- **🔐 User Authentication**
  - Secure Login & Register with Slider Captcha protection.
  - JWT-based session management.
  - Personal User Profiles and Avatars.
  - "Bing Daily Image" integration for beautiful auth pages.

- **📝 Content Management**
  - Create, Edit, and Delete Posts.
  - Rich Text/Markdown support.
  - Commenting system.
  - Organized Boards and Categories.

- **🛡️ Admin Dashboard**
  - **Dashboard Stats**: Overview of system activity.
  - **User Management**: Manage users and roles.
  - **Content Moderation**: Manage posts, comments, and banned words.
  - **System Settings**: Configure site name, description, logo, and navigation bar dynamically.
  - **CMS Pages**: Built-in Markdown editor to create custom static pages (e.g., About, Terms).

- **🎨 Modern UI/UX**
  - Built with **Next.js 15** (App Router) and **React 19**.
  - Styled with **Tailwind CSS**.
  - Components from **Shadcn UI** (Radix UI).
  - Fully responsive design.

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Security**: Helmet, BCrypt, JWT
- **Image Processing**: Jimp

### Frontend
- **Framework**: Next.js 16
- **Library**: React 19
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI / Radix UI
- **State/Data**: Axios, SWR/React Query (implied), Zod
- **Forms**: React Hook Form

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/arcane-club/arcaneclub.git
   cd arcane-club
   ```

2. **Install Backend Dependencies**
   ```bash
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Database Setup**
   - Create a PostgreSQL database (e.g., `arcane_club`).
   - Configure your environment variables (see below).
   - Push the schema to the database:
     ```bash
     npx prisma db push
     # or
     npx prisma migrate dev
     ```
   - (Optional) Seed the database:
     ```bash
     npx prisma db seed
     ```

### Configuration

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_key
DATABASE_URL="postgresql://user:password@localhost:5432/arcane_club?schema=public"

# SMTP Configuration (for emails)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
SMTP_FROM=no-reply@example.com

# Cloudflare Turnstile (Optional)
TURNSTILE_SECRET_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
```

### Running the Application

1. **Start the Backend Server**
   ```bash
   npm run dev
   ```
   Server will start on `http://localhost:3000`.

2. **Start the Frontend Development Server**
   Open a new terminal:
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will start on `http://localhost:3001` (or 3000 if backend port is different).