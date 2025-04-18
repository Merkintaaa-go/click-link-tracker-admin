
# Link Tracker Admin Panel

A complete link tracking SaaS solution with admin interface for managing shortened links and viewing statistics.

## Features

- Create and manage shortened links with white/black URL pairs
- Track clicks by IP, user agent, country, and bot status
- View detailed statistics per link
- Filter clicks by country and bot status
- Dockerized setup for easy deployment

## Tech Stack

### Backend
- Go with Gin web framework
- PostgreSQL database with pgx driver
- Containerized with Docker

### Frontend
- React with TypeScript
- Ant Design UI components
- Vite build tool
- React Query for data fetching

### Infrastructure
- Docker Compose for orchestration
- Nginx for serving frontend

## Project Structure

```
.
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Frontend Dockerfile
├── nginx.conf                 # Nginx configuration
├── backend/                   # Go backend
│   ├── Dockerfile             # Backend Dockerfile
│   ├── main.go                # Main application entry
│   ├── handlers.go            # API handlers
│   ├── db.go                  # Database connection and models
│   └── migrations/            # SQL migrations
│       ├── 000001_create_clicks.up.sql
│       ├── 000001_create_clicks.down.sql
│       ├── 000002_create_links.up.sql
│       └── 000002_create_links.down.sql
└── src/                       # Frontend React application
    ├── App.tsx                # Main application component
    ├── api.ts                 # API client
    └── components/            # React components
        ├── ClicksTable.tsx    # Clicks listing with filters
        ├── LinksTable.tsx     # Links listing with stats button
        └── LinkForm.tsx       # Create new link form
```

## Getting Started

1. Clone the repository

2. Create `.env` file from example
   ```
   cp .env.example .env
   ```

3. Start the application with Docker Compose
   ```
   docker-compose up -d
   ```

4. Access the admin panel at http://localhost

## Development

### Backend

To run the backend locally:

```
cd backend
go mod download
go run .
```

### Frontend

To run the frontend development server:

```
npm install
npm run dev
```

## Testing

### Backend Tests

```
cd backend
go test ./...
```

### Frontend Tests

```
npm test
```

## Deployment

The application is fully containerized and can be deployed on any platform that supports Docker.

```
docker-compose -f docker-compose.yml up -d
```
