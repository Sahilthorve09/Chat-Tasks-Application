# Chat & Tasks Application

A full-stack web application where users can register, authenticate, chat in real-time, and manage their todo lists. This README is humanized and aligned with the actual dependencies found in the repo (Express, Sequelize with MySQL/SQLite, JWT, bcrypt, React, Vite, Tailwind).

## Quick facts (what you use and how it’s organized)

- Frameworks (backend): Node.js + Express, Socket.IO, Sequelize ORM
- Frameworks (frontend): React 19 + Vite, React Router, Tailwind CSS
- Authentication tools: bcryptjs (hashing), jsonwebtoken (JWT), auth middleware
- Transport/HTTP: Express REST API, Socket.IO (real-time)
- Data layer: Sequelize + mysql2 (production), sqlite3 (local/dev option)
- Project structure: monorepo with `backend/` and `frontend/`

---

## Features

### Authentication
- User registration with email validation
- JWT-based authentication (token in Authorization header)
- Password security with bcryptjs hashing
- Protected routes via auth middleware

### Real-time Chat
- Socket.IO powered real-time messaging
- Rooms support (e.g., general)
- Message history persistence
- Online status indicators
- Responsive chat interface

### Todo Management
- Full CRUD operations (Create, Read, Update, Delete)
- Priority levels (Low, Medium, High)
- Due date tracking with overdue indicators
- Task completion tracking
- Filters (All, Active, Completed)
- Task statistics

### UI/UX
- Tailwind CSS styling
- Mobile-friendly layout
- Clean card-based UI
- Smooth animations and transitions
- Accessibility-conscious

---

## Tech Stack

### Backend
- Node.js with Express
- Sequelize ORM
  - mysql2 (typical production choice)
  - sqlite3 (convenient local/dev option)
- Socket.IO for real-time communication
- JWT (jsonwebtoken) for authentication
- bcryptjs for password hashing
- CORS for cross-origin requests
- dotenv for environment variables
- nodemon for local development

### Frontend
- React 19 with Vite 7
- React Router for navigation
- Axios for HTTP requests
- Socket.IO Client for real-time features
- Tailwind CSS + PostCSS + Autoprefixer
- ESLint + React hooks/refresh plugins

Note: The previous README referenced MongoDB/Mongoose, but the current dependencies show SQL via Sequelize. This doc reflects the actual deps.

---

## Prerequisites

- Node.js 18+ (recommended)
- One of the following databases:
  - MySQL 8+ (recommended for production)
  - OR SQLite (simple local file DB for development)
- npm or yarn

---

## Installation & Setup

### 1) Clone and navigate
```bash
git clone <repository-url>
cd chat-tasks-app
```

### 2) Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory. Choose one of the following configurations:

MySQL example:
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_complex
DB_DIALECT=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=chat_tasks
```

SQLite example (local/dev):
```env
PORT=5000
JWT_SECRET=your_super_secure_jwt_secret_key_here_make_it_long_and_complex
DB_DIALECT=sqlite
SQLITE_STORAGE=./dev.sqlite
```

### 3) Frontend setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Running the Application

### Start Backend Server
Make sure your database is available.
- For MySQL: create the database (chat_tasks) and ensure credentials are correct in `.env`.
- For SQLite: no external service needed; the file will be created per config.

Then run:
```bash
cd backend
npm run dev
# Server: http://localhost:5000
```

### Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Frontend: http://localhost:5174
```

---

## Usage

1. Registration: Create a new account
2. Login: Authenticate and receive a JWT
3. Chat: Join the real-time chat
4. Todos: Create, update, mark complete, and delete tasks
5. Navigate between Chat and Todos using the navbar

---

## API Endpoints (snapshot)

### Authentication
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login user
- `GET /api/auth/me` — Get current user

### Todos
- `GET /api/todos` — Get user's todos
- `POST /api/todos` — Create new todo
- `PUT /api/todos/:id` — Update todo
- `DELETE /api/todos/:id` — Delete todo
- `PATCH /api/todos/:id/toggle` — Toggle todo completion

### Chat
- `GET /api/chat/messages/:room` — Get message history
- `GET /api/chat/rooms` — Get available rooms
- `DELETE /api/chat/messages/:id` — Delete message

### Socket.IO Events
- `send_message` — Send a new message
- `receive_message` — Receive new messages
- `join_room` — Join a chat room

---

## Security Features

- JWT tokens passed in Authorization headers
- Password hashing with bcryptjs (with salt)
- Protected API routes
- Input validation and sanitization
- CORS configuration

---

## Project Structure

```
chat-tasks-app/
├── backend/
│   ├── models/          # Sequelize models
│   ├── routes/          # Express API routes
│   ├── middleware/      # Authentication middleware (JWT verification)
│   ├── server.js        # Main server file (Express + Socket.IO)
│   └── .env             # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Route pages (Login, Register, Chat, Todos)
│   │   ├── context/     # React context providers
│   │   ├── hooks/       # Custom hooks (e.g. useAuth, useSocket)
│   │   ├── services/    # API services (axios)
│   │   └── App.jsx      # Main app component
│   └── .env             # Environment variables
└── README.md
```

---

## Development Notes

- JWT tokens are expected in the Authorization header (Bearer scheme)
- If using Socket.IO auth, validate the token on connection
- Ensure DB configuration matches your chosen dialect
- React Context can manage auth/session and app state
- Tailwind CSS is configured with custom animations and an Inter-based font stack

---

## Troubleshooting

1) Database connection errors
- MySQL: verify service is running, creds/host/port are correct, and DB exists
- SQLite: check the `SQLITE_STORAGE` path and file permissions

2) Socket.IO connection failed
- Confirm backend server is running
- Check CORS configuration
- Ensure your token is valid and sent correctly (if required)

3) JWT token issues
- Clear localStorage and re-login
- Verify `JWT_SECRET` in backend `.env`

4) Port conflicts
- Backend default: 5000
- Frontend default: 5174
- Change ports in `.env` if needed

---

## Future Enhancements

- Private messaging between users
- File sharing in chat
- Todo categories and tags
- Dark mode support
- Email notifications
- Mobile app version
- Group chat rooms
- Todo sharing and collaboration

---

## License

This project is licensed under the MIT License.
