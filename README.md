# Dipak Personal AI Assistant

A personal AI assistant web application built with Express, TypeScript, and MySQL, powered by Google's Gemini AI model.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher)
- [MySQL](https://www.mysql.com/) (v8.0 or higher)
- [Git](https://git-scm.com/)

## Installation Steps

1. **Clone the Repository**
   ```bash
   git clone <your-repository-url>
   cd DipakPersonalAi
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Create a `.env` file in the root directory with the following content:
   ```env
   DB_HOST=localhost
   DB_USER=your_mysql_username
   DB_PASSWORD=your_mysql_password
   DB_NAME=dipak_ai
   GEMINI_API_KEY=your_gemini_api_key
   ```
   Replace the values with your actual MySQL credentials and Gemini API key.

4. **Set Up the Database**
   ```bash
   # Log into MySQL and create the database
   mysql -u your_mysql_username -p
   ```
   In the MySQL prompt:
   ```sql
   CREATE DATABASE dipak_ai;
   exit;
   ```

5. **Run Database Migrations**
   ```bash
   npm run migrate
   ```

## Running the Application

1. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The server will start at http://localhost:5000

2. **Access the Application**
   - Open your web browser and navigate to http://localhost:5000
   - Register a new account or log in if you already have one
   - Start chatting with the AI assistant!

## Project Structure

```
DipakPersonalAi/
├── client/           # Frontend React application
├── server/           # Backend Express server
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database operations
│   └── ai-service.ts # Gemini AI integration
├── shared/           # Shared TypeScript types
└── drizzle.config.ts # Database configuration
```

## API Endpoints

- `POST /api/register` - Register a new user
- `POST /api/login` - Log in an existing user
- `POST /api/chat` - Send a message to the AI assistant
- `GET /api/messages/:userId` - Get chat history for a user

## Environment Variables

- `DB_HOST`: MySQL database host (default: localhost)
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: Database name (default: dipak_ai)
- `GEMINI_API_KEY`: Your Google Gemini API key

## Troubleshooting

1. **Database Connection Issues**
   - Verify MySQL is running
   - Check your database credentials in `.env`
   - Ensure the database exists

2. **AI Response Issues**
   - Verify your Gemini API key is correct
   - Check server logs for detailed error messages
   - Ensure you're connected to the internet

3. **Server Won't Start**
   - Check if port 5000 is already in use
   - Verify all dependencies are installed
   - Check the logs for any error messages

## Getting Help

If you encounter any issues:
1. Check the server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all prerequisites are installed and running
4. Check if the database is accessible

## License

This project is licensed under the MIT License - see the LICENSE file for details.
