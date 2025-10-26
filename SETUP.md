# AI App Generator - Setup Guide

Complete step-by-step instructions to get the AI-powered database application generator running with the Python backend.

---

## 🎯 Overview

This application consists of two parts:
1. **Next.js Frontend** (Port 3000) - Modern UI for prompt input, schema editing, and validation reports
2. **Python FastAPI Backend** (Port 8000) - Orchestrator that uses LLMs to generate full-stack applications

---

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18+ and npm/yarn/pnpm installed
- **Python** 3.11+ installed
- **API Keys** for at least one LLM provider:
  - OpenAI (recommended: `gpt-4o-mini` or `gpt-5`)
  - Anthropic Claude
  - Or other providers supported by LiteLLM

---

## 🚀 Step 1: Backend Setup

### 1.1 Navigate to Backend Directory

\`\`\`bash
cd backend
\`\`\`

### 1.2 Create Python Virtual Environment

\`\`\`bash
# Create virtual environment
python -m venv venv

# Activate it
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
\`\`\`

### 1.3 Install Python Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

### 1.4 Configure Environment Variables

\`\`\`bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
\`\`\`

Add your API keys to `.env`:

\`\`\`env
# Required: Add at least one
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional: Other providers
GROQ_API_KEY=your-groq-key
DEEPSEEK_API_KEY=your-deepseek-key
\`\`\`

### 1.5 Start the Backend Server

\`\`\`bash
python orchestrator.py
\`\`\`

Or using uvicorn directly:

\`\`\`bash
uvicorn orchestrator:app --reload --port 8000
\`\`\`

You should see:
\`\`\`
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
\`\`\`

### 1.6 Test Backend Health

Open a new terminal and test:

\`\`\`bash
curl http://localhost:8000/health
\`\`\`

Expected response:
\`\`\`json
{"status":"healthy","service":"AI App Generator Orchestrator"}
\`\`\`

---

## 🎨 Step 2: Frontend Setup

### 2.1 Navigate to Project Root

\`\`\`bash
# If you're in backend/, go back to root
cd ..
\`\`\`

### 2.2 Install Node Dependencies

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 2.3 Start the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

You should see:
\`\`\`
  ▲ Next.js 15.x.x
  - Local:        http://localhost:3000
  - Ready in X.Xs
\`\`\`

### 2.4 Open the Application

Navigate to **http://localhost:3000** in your browser.

---

## 🎮 Step 3: Using the Application

### 3.1 Enter a Prompt

On the first screen, describe your application:

**Example prompts:**
- "Create an app to manage a library with books, authors, and publication years"
- "Build a movie database with title, director, genre, and release date"
- "Design a product inventory system with name, SKU, price, and stock quantity"

### 3.2 Review & Edit Schema

The AI will generate a database schema. You can:
- Edit field names, labels, and types
- Mark fields as required/optional
- Add or remove fields
- Provide feedback to refine the schema

### 3.3 Generate Application

Click "Confirm & Generate" to create:
- SQLAlchemy ORM models (`generated/schema.py`)
- FastAPI backend with CRUD endpoints (`generated/api.py`)
- Frontend templates (`generated/frontend.py`, `generated/templates/`)

### 3.4 Run Generated Application

Once generation is complete, you can run the generated app:

\`\`\`bash
# Terminal 1: Start the generated API
uvicorn generated.api:app --reload --port 8000

# Terminal 2: Start the generated frontend
uvicorn generated.frontend:app --reload --port 8001
\`\`\`

Then open **http://localhost:8001** to see your generated application!

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** `ModuleNotFoundError: No module named 'fastapi'`
\`\`\`bash
# Make sure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
\`\`\`

**Problem:** `401 Unauthorized` or API key errors
\`\`\`bash
# Check your .env file has valid API keys
cat backend/.env

# Make sure keys are properly formatted (no quotes, no spaces)
OPENAI_API_KEY=sk-proj-...
\`\`\`

**Problem:** Backend not responding
\`\`\`bash
# Check if port 8000 is already in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use a different port
uvicorn orchestrator:app --reload --port 8001
\`\`\`

### Frontend Issues

**Problem:** `Failed to generate schema. Make sure the backend is running on port 8000.`
- Verify backend is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Ensure backend CORS allows `http://localhost:3000`

**Problem:** `Module not found` errors
\`\`\`bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
\`\`\`

**Problem:** Port 3000 already in use
\`\`\`bash
# Use a different port
PORT=3001 npm run dev
\`\`\`

### CORS Issues

If you see CORS errors in the browser console:

1. Check backend `orchestrator.py` has correct origins:
\`\`\`python
allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"]
\`\`\`

2. Restart both frontend and backend servers

---

## 📁 Project Structure

\`\`\`
ai-app-generator/
├── app/
│   ├── page.tsx              # Main application logic
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/
│   ├── prompt-screen.tsx     # Step 1: Prompt input
│   ├── mockup-editor.tsx     # Step 2: Schema editor
│   └── validation-report.tsx # Step 3: Results
├── backend/
│   ├── orchestrator.py       # FastAPI orchestrator
│   ├── requirements.txt      # Python dependencies
│   └── .env                  # API keys (create this)
├── generated/                # Generated apps appear here
│   ├── schema.py
│   ├── api.py
│   ├── frontend.py
│   └── templates/
└── README.md
\`\`\`

---

## 🔑 API Endpoints

The backend exposes these endpoints:

### `POST /api/generate-schema`
Generate initial schema from user prompt.

**Request:**
\`\`\`json
{
  "prompt": "Create a library management system",
  "entityName": "Book",
  "operations": ["create", "read", "update", "delete"],
  "model": "gpt-4o-mini"
}
\`\`\`

### `POST /api/refine-schema`
Refine existing schema based on feedback.

**Request:**
\`\`\`json
{
  "currentSchema": { ... },
  "feedback": "Add an email field",
  "model": "gpt-4o-mini"
}
\`\`\`

### `POST /api/generate-app`
Generate complete application code.

**Request:**
\`\`\`json
{
  "schema": { ... },
  "model": "gpt-4o-mini"
}
\`\`\`

### `GET /health`
Health check endpoint.

---

## 🎯 Next Steps

1. **Customize the UI**: Edit components in `components/` to match your brand
2. **Add More Models**: Extend `orchestrator.py` to support more LLM providers
3. **Enhance Generation**: Improve prompts in `orchestrator.py` for better code quality
4. **Add Authentication**: Protect the API with auth middleware
5. **Deploy**: Deploy frontend to Vercel and backend to Railway/Render

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [LiteLLM Documentation](https://docs.litellm.ai/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the console logs (both frontend and backend)
2. Verify all environment variables are set correctly
3. Ensure both servers are running on correct ports
4. Review the troubleshooting section above

---

## ✅ Quick Start Checklist

- [ ] Python 3.11+ installed
- [ ] Node.js 18+ installed
- [ ] Created Python virtual environment
- [ ] Installed Python dependencies (`pip install -r requirements.txt`)
- [ ] Created `.env` file with API keys
- [ ] Started backend server (port 8000)
- [ ] Installed Node dependencies (`npm install`)
- [ ] Started frontend server (port 3000)
- [ ] Tested application at http://localhost:3000
- [ ] Backend health check passes

---

**You're all set! 🎉 Start building amazing applications with AI!**
