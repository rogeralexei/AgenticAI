# Technical Documentation

## Architecture Overview

This application serves as the frontend interface for an AI-powered database application generator. It implements a multi-step wizard pattern that guides users through the process of generating a complete full-stack application.

## System Architecture

### Frontend Architecture

\`\`\`
┌─────────────────────────────────────────────────────────┐
│                     Main Application                     │
│                      (app/page.tsx)                      │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐   │
│  │   Step 1   │→ │   Step 2   │→ │   Step 3/4     │   │
│  │   Prompt   │  │   Mockup   │  │ Refine/Report  │   │
│  └────────────┘  └────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Backend Orchestration System                │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Director   │→ │  DB/ORM      │  │  Frontend    │ │
│  │    Agent     │  │   Agent      │  │   Agent      │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                    ┌──────────────┐                     │
│                    │  Backend/API │                     │
│                    │    Agent     │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
\`\`\`

### Component Hierarchy

\`\`\`
App (page.tsx)
├── PromptScreen
│   ├── Textarea (prompt input)
│   ├── Input (entity name)
│   └── Checkbox (CRUD operations)
├── MockupEditor
│   ├── FieldCard (for each field)
│   │   ├── Input (field name)
│   │   ├── Input (field label)
│   │   ├── Select (field type)
│   │   └── Checkbox (required)
│   └── Button (add field)
└── ValidationReport
    ├── Badge (status indicator)
    ├── Alert (errors/warnings)
    └── FilePreview (generated code)
\`\`\`

## State Management

### Application State

The main application state is managed in `app/page.tsx` using React hooks:

\`\`\`typescript
interface Field {
  id: string
  name: string
  type: string
  label: string
  required: boolean
}

interface AppState {
  currentStep: number
  prompt: string
  entityName: string
  operations: string[]
  schema: { fields: Field[] }
  validationResult: ValidationResult | null
}
\`\`\`

### State Flow

1. **Step 1 (Prompt)**: User input is captured and stored
2. **Step 2 (Mockup)**: Schema is generated (simulated) and made editable
3. **Step 3 (Refine)**: User can modify prompt and regenerate
4. **Step 4 (Report)**: Final orchestration results are displayed

## Data Models

### Field Schema

\`\`\`typescript
interface Field {
  id: string          // Unique identifier (UUID)
  name: string        // Field name in database (e.g., "email")
  type: string        // Data type (string, number, boolean, etc.)
  label: string       // Display label (e.g., "Email Address")
  required: boolean   // Validation flag
}
\`\`\`

### Validation Result

\`\`\`typescript
interface ValidationResult {
  status: 'success' | 'warning' | 'error'
  validations: {
    errors: string[]
    warnings: string[]
  }
  generatedFiles: GeneratedFile[]
  metrics: {
    totalFiles: number
    linesOfCode: number
    generationTime: string
  }
}

interface GeneratedFile {
  name: string        // File name (e.g., "user.model.ts")
  type: string        // File type (model, api, component)
  content: string     // File content
  size: string        // File size (e.g., "2.4 KB")
}
\`\`\`

## Component Documentation

### PromptScreen Component

**Purpose**: Captures user requirements and configuration

**Props**:
\`\`\`typescript
interface PromptScreenProps {
  prompt: string
  setPrompt: (value: string) => void
  entityName: string
  setEntityName: (value: string) => void
  operations: string[]
  setOperations: (value: string[]) => void
  onNext: () => void
}
\`\`\`

**Features**:
- Rich text prompt input with character counter
- Entity name validation
- CRUD operations multi-select
- Form validation before proceeding

### MockupEditor Component

**Purpose**: Displays and allows editing of generated schema

**Props**:
\`\`\`typescript
interface MockupEditorProps {
  schema: { fields: Field[] }
  setSchema: (schema: { fields: Field[] }) => void
  onBack: () => void
  onRefine: () => void
  onConfirm: () => void
}
\`\`\`

**Features**:
- Field list with inline editing
- Add/remove fields
- Drag-and-drop reordering (future enhancement)
- Type selection with icons
- Required field toggle

**Field Types Supported**:
- string (text input)
- number (numeric input)
- boolean (checkbox)
- date (date picker)
- email (email validation)
- url (URL validation)
- text (textarea)
- select (dropdown)

### ValidationReport Component

**Purpose**: Displays orchestration results and generated code

**Props**:
\`\`\`typescript
interface ValidationReportProps {
  result: ValidationResult
  onBack: () => void
  onStartNew: () => void
}
\`\`\`

**Features**:
- Status badge (success/warning/error)
- Error and warning lists
- Generated files preview with syntax highlighting
- Metrics display
- Download functionality (future enhancement)

## Styling System

### Design Tokens

Defined in `app/globals.css`:

\`\`\`css
@theme inline {
  /* Colors */
  --color-background: #0a0a0a;
  --color-foreground: #ededed;
  --color-primary: #06b6d4;
  --color-accent: #3b82f6;
  --color-muted: #262626;
  --color-border: #27272a;
  
  /* Typography */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Spacing */
  --radius: 0.5rem;
}
\`\`\`

### Utility Classes

Custom utilities for consistent styling:

- `.step-indicator` - Progress indicator styling
- `.field-card` - Schema field card styling
- `.code-preview` - Code block styling with syntax highlighting

## API Integration Points

### Generate Schema Endpoint

**Endpoint**: `POST /api/generate-schema`

**Purpose**: Converts natural language prompt into structured schema

**Current Implementation**: Simulated with mock data

**Future Implementation**: 
- Call Director Agent to analyze prompt
- Invoke DB/ORM Agent to generate schema
- Return structured field definitions

### Orchestration Endpoint

**Endpoint**: `POST /api/orchestrate`

**Purpose**: Triggers full application generation

**Current Implementation**: Simulated with mock validation results

**Future Implementation**:
- Validate schema structure
- Coordinate all Worker Agents (DB, Backend, Frontend)
- Generate complete application code
- Run validations and tests
- Return comprehensive report

## Performance Considerations

### Optimization Strategies

1. **Component Memoization**: Use `React.memo` for field cards to prevent unnecessary re-renders
2. **Lazy Loading**: Code preview components can be lazy-loaded
3. **Debouncing**: Input fields use debouncing to reduce state updates
4. **Virtual Scrolling**: For large schemas with many fields (future enhancement)

### Bundle Size

- Next.js automatic code splitting
- Dynamic imports for heavy components
- Tree-shaking for unused UI components

## Security Considerations

### Input Validation

- Sanitize user prompts before sending to backend
- Validate entity names (alphanumeric, no special characters)
- Limit prompt length to prevent abuse
- Validate field names against SQL injection patterns

### API Security

- Implement rate limiting on generation endpoints
- Add authentication for production use
- Validate schema structure before orchestration
- Sanitize generated code before display

## Testing Strategy

### Unit Tests

- Component rendering tests
- State management logic tests
- Validation function tests
- Mock API response handling

### Integration Tests

- Multi-step workflow tests
- Form submission and validation
- Schema editing operations
- Error handling scenarios

### E2E Tests

- Complete user journey from prompt to report
- Edge cases and error scenarios
- Browser compatibility testing
- Responsive design testing

## Deployment

### Environment Variables

\`\`\`env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.example.com

# Feature Flags
NEXT_PUBLIC_ENABLE_REFINEMENT=true
NEXT_PUBLIC_ENABLE_DOWNLOAD=true
\`\`\`

### Build Configuration

\`\`\`json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
\`\`\`

### Deployment Platforms

- **Vercel**: Recommended (native Next.js support)
- **Netlify**: Supported with adapter
- **Docker**: Container configuration available

## Future Enhancements

### Planned Features

1. **Real-time Collaboration**: Multiple users editing same schema
2. **Version History**: Track schema iterations with diff view
3. **Template Library**: Pre-built schemas for common use cases
4. **Export Options**: Download as SQL, Prisma, TypeORM, etc.
5. **AI Suggestions**: Real-time field suggestions while editing
6. **Validation Rules**: Advanced field validation configuration
7. **Relationships**: Define foreign keys and relationships between entities
8. **Preview Mode**: Live preview of generated UI components

### Technical Debt

- Add comprehensive error boundaries
- Implement proper loading states
- Add accessibility improvements (ARIA labels, keyboard navigation)
- Optimize re-renders with better state management
- Add comprehensive TypeScript types for all components

## Troubleshooting

### Common Issues

**Issue**: Schema not generating
- **Solution**: Check console for API errors, verify prompt is not empty

**Issue**: Fields not saving edits
- **Solution**: Ensure field names are unique, check for validation errors

**Issue**: Validation report not displaying
- **Solution**: Verify orchestration endpoint response format

## Contributing Guidelines

### Code Style

- Use TypeScript for all new components
- Follow ESLint configuration
- Use Prettier for formatting
- Write descriptive commit messages

### Component Guidelines

- Keep components small and focused
- Use composition over inheritance
- Implement proper prop types
- Add JSDoc comments for complex logic

### Pull Request Process

1. Create feature branch from `main`
2. Implement changes with tests
3. Update documentation
4. Submit PR with description
5. Address review comments
6. Merge after approval

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

---

Last Updated: January 2025
