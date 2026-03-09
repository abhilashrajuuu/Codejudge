# CodeJudge — Online Code Compiler & IDE ⚡

CodeJudge is a premium, web-based code execution environment that allows you to write, run, and debug code in multiple programming languages directly from your browser. It features a modern dark-themed UI, AI-powered debugging, and persistent user sessions.

## 🚀 Features

- **Multi-Language Support**: Support for Python, C++, Java, and JavaScript.
- **Premium Editor**: Integrated with **Monaco Editor** (the engine behind VS Code) for a professional coding experience.
- **Advanced Authentication**:
  - **Google Sign-In**: One-click authentication using your Google account.
  - **Email/Password**: Traditional registration and login system.
- **AI Debugger**: Intelligent code analysis and bug fixing suggestions powered by **Groq / DeepSeek LLMs**.
- **User Persistence**:
  - **Saved Programs**: Save your code snippets to your profile and access them from any device.
  - **Execution History**: Track all your past code runs, including performance metrics and output.
- **Premium Design**: Sleek, responsive, and interactive UI with glassmorphism and smooth animations.

## 🛠️ Tech Stack

### Frontend
- **Core**: HTML5, Vanilla JavaScript (ES6+)
- **Styling**: Vanilla CSS3 (Custom Design System)
- **Editor**: Monaco Editor (CDN)
- **Auth**: Google Identity Services (GIS)

### Backend
- **Framework**: Node.js & Express
- **Database**: MongoDB (via Mongoose)
- **Authentication**: JSON Web Tokens (JWT) & `bcryptjs`
- **Compiler API**: High-performance code execution engine

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v16+)
- MongoDB (Local or Atlas)
- Google Cloud Console Project (for Google Auth)
- Groq / DeepSeek API Key (for AI features)

### 1. Clone the repository
```bash
git clone https://github.com/abhilashrajuuu/netflixclone.git
cd netflixclone
```

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add the following:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   GOOGLE_CLIENT_ID=your_google_client_id
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Serve the `frontend` directory using any static file server (e.g., `http-server`):
   ```bash
   npx http-server ./frontend -p 8080
   ```
2. Open `http://localhost:8080` in your browser.

## 📝 License
This project is licensed under the MIT License.
