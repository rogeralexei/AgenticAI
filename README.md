# AI-Powered Database Application Generator

A modern, interactive full-stack application for generating database applications using AI-powered multi-agent orchestration. This tool allows users to describe their application needs in natural language and receive a complete, validated database schema with ORM models, API endpoints, and UI components.

## Overview

This application implements a complete workflow for AI-powered code generation with both frontend and backend components. It provides a streamlined process for:

1. **Prompt Input** - Describe your application requirements in natural language
2. **Schema Mockup** - Review and edit the AI-generated database schema
3. **Refinement Loop** - Iterate and improve the schema before final generation
4. **Code Generation** - Generate complete SQLAlchemy models, FastAPI endpoints, and frontend templates
5. **Validation Report** - View the generated code, validations, and potential issues

## Features

### Prompt Input Screen
- Natural language prompt input with rich text support
- Configurable parameters:
  - Entity name (e.g., "User", "Product", "Order")
  - CRUD operations selection (Create, Read, Update, Delete)
  - LLM model selection (GPT-4o-mini, Claude, etc.)
- Real-time validation
- Smart suggestions for common use cases

### Interactive Schema Mockup Editor
- Visual field editor with drag-and-drop reordering
- Editable field properties:
  - Field name and label
  - Data type (string, number, boolean, date, email, text)
  - Required/optional toggle
  - Default values
- Add/remove fields dynamically
- Real-time preview of schema structure
- CRUD operations configuration

### AI-Powered Refinement Loop
- Natural language feedback for schema modifications
- Intelligent schema updates based on user input
- Preserves existing structure while applying changes
- Multiple LLM provider support via LiteLLM

### Complete Code Generation
- **SQLAlchemy ORM Models** - Type-safe database models with relationships
- **FastAPI Backend** - RESTful API with CRUD endpoints
- **Frontend Templates** - Jinja2 templates with HTMX
- **Database Migrations** - Ready-to-run SQL scripts

### Validation Report
- Comprehensive validation results
- Color-coded status indicators (success, warning, error)
- Generated file preview with syntax highlighting
- Real code previews from generated files
- Detailed error messages and suggestions

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **LLM Integration**: LiteLLM (supports OpenAI, Anthropic, Groq, DeepSeek, etc.)
- **ORM**: SQLAlchemy 2.0
- **Database**: SQLite (configurable)

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Python** 3.11+
- **API Keys** for at least one LLM provider (OpenAI, Anthropic, etc.)

### Quick Start

#### 1. Backend Setup

\`\`\`bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your API keys (OPENAI_API_KEY, etc.)

# Start the backend server
python orchestrator.py
\`\`\`

Backend will run on **http://localhost:8000**

#### 2. Frontend Setup

\`\`\`bash
# Navigate to project root (if in backend/)
cd ..

# Install dependencies
npm install

# Start the development server
npm run dev
\`\`\`

Frontend will run on **http://localhost:3000**

#### 3. Open the Application

Navigate to **http://localhost:3000** in your browser and start generating applications!

### Detailed Setup Instructions

For comprehensive setup instructions, troubleshooting, and configuration options, see **[SETUP.md](./SETUP.md)**.

## Usage Guide

### Step 1: Enter Your Prompt

1. Navigate to the prompt input screen
2. Describe your application in natural language:
   - Example: "Create a library management system with books, authors, and publication years"
3. Configure parameters:
   - Set the main entity name (optional - AI will auto-detect)
   - Select required CRUD operations
4. Click "Generate Schema" to proceed

### Step 2: Review and Edit Schema

1. Review the AI-generated database schema
2. Edit field properties:
   - Click on any field to modify its name, type, or label
   - Toggle the "Required" checkbox for validation rules
   - Add default values where needed
   - Use the trash icon to remove unwanted fields
3. Add new fields using the "Add Field" button
4. Reorder fields by dragging them
5. Configure CRUD operations for the entity

### Step 3: Refine (Optional)

1. Click "Refine" to provide feedback
2. Describe changes in natural language:
   - "Add an email field"
   - "Make author field required"
   - "Change stock to quantity"
3. Click "Regenerate Schema" to apply changes
4. Review the updated schema
5. Repeat until satisfied

### Step 4: Generate and Review

1. Click "Confirm & Generate" to trigger code generation
2. Wait for the AI to generate the complete application
3. Review the validation report:
   - Check for any errors or warnings
   - Preview generated code files (schema.py, api.py)
   - View file paths and structure
4. Download the complete application package

### Step 5: Run Your Generated App

\`\`\`bash
# Start the generated API backend
uvicorn generated.api:app --reload --port 8000

# Start the generated frontend (new terminal)
uvicorn generated.frontend:app --reload --port 8001

# Open http://localhost:8001 to see your app!
\`\`\`

## Project Structure

\`\`\`
ai-app-generator/
├── app/
│   ├── layout.tsx              # Root layout with fonts and metadata
│   ├── page.tsx                # Main application with state management
│   └── globals.css             # Global styles and design tokens
├── components/
│   ├── prompt-screen.tsx       # Step 1: Prompt input interface
│   ├── mockup-editor.tsx       # Step 2: Schema editor interface
│   └── validation-report.tsx   # Step 3: Results and validation
├── components/ui/              # shadcn/ui components
├── backend/
│   ├── orchestrator.py         # FastAPI orchestrator server
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example            # Environment variables template
│   └── .env                    # Your API keys (create this)
├── generated/                  # Generated applications appear here
│   ├── schema.py               # SQLAlchemy ORM models
│   ├── api.py                  # FastAPI CRUD endpoints
│   ├── frontend.py             # Frontend server
│   └── templates/              # Jinja2 templates
├── SETUP.md                    # Detailed setup instructions
├── DOCUMENTATION.md            # Technical documentation
└── README.md                   # This file
\`\`\`

## API Endpoints

The backend orchestrator exposes these endpoints:

### `POST /api/generate-schema`
Generates initial schema from user prompt using LLM.

**Request:**
\`\`\`json
{
  "prompt": "Create a library management system",
  "entityName": "Book",
  "operations": ["create", "read", "update", "delete"],
  "model": "gpt-4o-mini"
}
\`\`\`

**Response:** `SchemaDefinition` object with fields and operations

### `POST /api/refine-schema`
Refines existing schema based on natural language feedback.

**Request:**
\`\`\`json
{
  "currentSchema": { ... },
  "feedback": "Add an email field and make author required",
  "model": "gpt-4o-mini"
}
\`\`\`

**Response:** Updated `SchemaDefinition` object

### `POST /api/generate-app`
Generates complete application code from confirmed schema.

**Request:**
\`\`\`json
{
  "schema": { ... },
  "model": "gpt-4o-mini"
}
\`\`\`

**Response:** `ValidationResult` with generated files and code previews

### `GET /health`
Health check endpoint for monitoring.

## Design System

### Color Palette

- **Background**: Dark theme with `#0a0a0a` base
- **Foreground**: `#ededed` for primary text
- **Primary**: Cyan (`#06b6d4`) for interactive elements
- **Accent**: Blue (`#3b82f6`) for highlights and success states
- **Muted**: `#262626` for secondary backgrounds
- **Border**: `#27272a` for subtle divisions

### Typography

- **Headings**: Geist Sans (600-700 weight)
- **Body**: Geist Sans (400 weight)
- **Code**: Geist Mono

### Spacing

Follows Tailwind's spacing scale (4px base unit) for consistent rhythm throughout the interface.

## Supported LLM Providers

Via LiteLLM, the backend supports:

- **OpenAI**: GPT-4o-mini, GPT-5, GPT-4-turbo
- **Anthropic**: Claude 3 Opus, Claude Sonnet 4.5
- **Groq**: Llama models
- **DeepSeek**: DeepSeek Coder
- **Mistral**: Mistral Large
- And many more...

Configure your preferred provider in the `.env` file.

## Troubleshooting

### Backend won't start
- Ensure Python 3.11+ is installed
- Activate virtual environment: `source venv/bin/activate`
- Check API keys in `.env` file
- Verify port 8000 is not in use

### Frontend can't connect to backend
- Verify backend is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Ensure backend allows `http://localhost:3000` in CORS origins

### Generation fails
- Check backend logs for LLM API errors
- Verify API keys are valid and have credits
- Try a different model (e.g., switch from GPT-5 to GPT-4o-mini)

For more troubleshooting help, see **[SETUP.md](./SETUP.md)**.

## Contributing

This is an academic research project. For contributions or questions, please contact the project maintainers.

## License

This project is part of academic research. Please refer to the institution's guidelines for usage and distribution.

## Acknowledgments

- Built with Next.js and Vercel
- UI components from shadcn/ui
- Icons from Lucide
- LLM integration via LiteLLM
- Inspired by modern developer tools like v0, Vercel, and Braintrust

## Support

For issues, questions, or feedback:
1. Check **[SETUP.md](./SETUP.md)** for detailed instructions
2. Review **[DOCUMENTATION.md](./DOCUMENTATION.md)** for technical details
3. Open an issue in the repository
4. Contact the development team

---

**Ready to build?** Follow the [Quick Start](#quick-start) guide above and start generating full-stack applications with AI! 🚀
