# FieldFlow - Appointment Reminder System

## Overview

FieldFlow is a comprehensive appointment management and reminder system designed for service businesses. The application automates appointment reminders through SMS and email, integrates with existing calendars, and provides analytics to reduce no-shows. Built as a full-stack web application with a React frontend and Express backend, it leverages modern technologies to deliver a seamless user experience for managing customer appointments and communications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The client-side application is built with **React 18** using TypeScript and follows a component-based architecture. Key architectural decisions include:

- **UI Framework**: Uses shadcn/ui components built on Radix UI primitives for accessibility and consistency
- **Styling**: Tailwind CSS with a custom design system using CSS variables for theming
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation for type-safe form management
- **Build Tool**: Vite for fast development and optimized production builds

The frontend follows a pages-based structure with reusable UI components, hooks for business logic, and utility functions for common operations.

### Backend Architecture

The server-side application uses **Node.js with Express** and follows a RESTful API design:

- **Framework**: Express.js with TypeScript for type safety
- **Database Access**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Replit Auth integration using OpenID Connect with session-based authentication
- **Session Management**: PostgreSQL session store using connect-pg-simple
- **API Structure**: Route-based organization with middleware for authentication and error handling

The backend implements a storage abstraction layer that encapsulates all database operations, making it easy to test and maintain.

### Database Design

The application uses **PostgreSQL** as the primary database with the following core entities:

- **Users**: Stores user profiles and business information
- **Appointments**: Central entity tracking customer appointments with status management
- **Reminder Templates**: Configurable message templates for automated communications
- **Calendar Integrations**: Settings for external calendar synchronization
- **Sessions**: Session storage for authentication (required by Replit Auth)

The schema uses UUIDs for primary keys and includes proper foreign key relationships with cascade deletes for data integrity.

### Authentication & Authorization

The system implements **Replit Auth** as the primary authentication mechanism:

- **OAuth Provider**: Replit's OpenID Connect service
- **Session Strategy**: Server-side sessions stored in PostgreSQL
- **Security**: HTTP-only cookies with secure flags for production
- **User Management**: Automatic user creation and profile management

All API endpoints (except auth routes) require authentication, with user context passed through middleware.

### Development & Deployment

The application is configured for **Replit deployment** with development-friendly features:

- **Hot Reload**: Vite dev server with React Fast Refresh
- **Development Tools**: Runtime error overlay and cartographer for debugging
- **Build Process**: Separate frontend (Vite) and backend (esbuild) build pipelines
- **Environment**: TypeScript throughout with strict type checking

## External Dependencies

### Core Framework Dependencies

- **@neondatabase/serverless**: PostgreSQL database connectivity optimized for serverless environments
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **@tanstack/react-query**: Server state management and caching for the frontend
- **wouter**: Lightweight routing library for React applications

### UI & Styling Dependencies

- **@radix-ui/***: Comprehensive set of accessible React primitives for building the component system
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Type-safe CSS class management for component variants
- **lucide-react**: Icon library providing consistent iconography

### Authentication & Session Management

- **passport**: Authentication middleware for Node.js
- **openid-client**: OpenID Connect client implementation for Replit Auth
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Session middleware for Express applications

### Development & Build Tools

- **vite**: Frontend build tool and development server
- **esbuild**: Fast JavaScript bundler for backend compilation
- **typescript**: Type checking and compilation
- **drizzle-kit**: Database migration and schema management tools

### Validation & Utilities

- **zod**: Schema validation library for runtime type checking
- **react-hook-form**: Form state management and validation
- **date-fns**: Date manipulation and formatting utilities
- **clsx & tailwind-merge**: Utility functions for conditional CSS classes

The application is designed to integrate with external services for SMS/email delivery and calendar synchronization, though specific providers are configurable based on business requirements.