# Ladoo Business — Monorepo

Ladoo Business is a cross-platform e-commerce mobile application (React Native + Expo) and a Node.js + TypeScript backend (Express). This repository is organized as a monorepo with two top-level directories:

- `mobile-app/` — React Native (Expo) mobile application using TypeScript
- `backend/` — Node.js + Express API using TypeScript

## Quick Start

Prerequisites:
- Node.js 18+ and npm or Yarn
- Expo CLI (optional, can use `npx expo`)
- PostgreSQL (for later phases)

Getting started:

1. Clone repository
2. Set up mobile app:

```powershell
cd mobile-app
npm install
# copy .env.example to .env and fill values
npm start
```

3. Set up backend:

```powershell
cd backend
npm install
# copy .env.example to .env and fill values
npm run dev
```

## Architecture

This is a monorepo containing the mobile client and backend API. The client communicates with the backend via a RESTful API and uses Stripe for payments and Firebase for notifications.

## Project Structure

- `mobile-app/` — Mobile application source and config
- `backend/` — Backend server source and config

## Development Workflow

- Use feature branches
- Run linters and formatters before committing
- Add tests in `__tests__` directories

## License

See `LICENSE` for details.
