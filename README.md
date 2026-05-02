# Expense Management App

A full-stack web application for managing personal expenses, built with modern web technologies.

## Features

- **User Authentication**: Secure login and signup with password hashing
- **Expense Tracking**: Add, edit, and delete transactions
- **Dashboard**: Visual overview of expenses with interactive charts
- **Budget Goals**: Set and monitor monthly budget goals
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router
- Recharts for data visualization
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js
- Express.js
- MySQL database
- bcrypt for password hashing
- CORS for cross-origin requests
- dotenv for environment variables

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MySQL database

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sayemkhan399/Expense-Management.git
cd Expense-Management
```

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
```

4. Set up the database:
   - Create a MySQL database
   - Update the `.env` file in the backend directory with your database credentials

5. Start the backend server:
```bash
cd backend
npm run dev
```

6. In a new terminal, start the frontend:
```bash
npm run dev
```

7. Open [http://localhost:5173](http://localhost:5173) in your browser

## Available Scripts

- `npm run dev` - Starts the development server
- `npm run build` - Builds the app for production
- `npm run preview` - Previews the production build
- `npm run lint` - Runs ESLint

## Backend Scripts

- `npm start` - Starts the server in production mode
- `nodemon start` - Starts the server with nodemon for development

## Project Structure

```
expense-management/
├── backend/          # Express.js API server
├── public/           # Static assets
├── src/
│   ├── components/   # React components
│   ├── routes/       # Application routes
│   ├── assets/       # Images and other assets
│   └── ...
├── package.json
├── vite.config.js
└── README.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [ISC License](https://opensource.org/licenses/ISC).
