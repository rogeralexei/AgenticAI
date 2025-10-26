from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
import re
import time
import uuid
import json
import shutil
from litellm import completion
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(title="AI App Generator Orchestrator", version="1.0")

# CORS configuration for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple JSON database for projects
PROJECTS_DB_FILE = Path("projects_db.json")

def load_projects_db():
    """Load projects from JSON file"""
    if PROJECTS_DB_FILE.exists():
        with open(PROJECTS_DB_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_projects_db(projects):
    """Save projects to JSON file"""
    with open(PROJECTS_DB_FILE, 'w') as f:
        json.dump(projects, f, indent=2)

def save_project(project_id: str, schema: dict, status: str = "completed"):
    """Save project metadata to database"""
    projects = load_projects_db()
    projects[project_id] = {
        "id": project_id,
        "entityName": schema.get("entityName", "Unknown"),
        "created_at": time.time(),
        "status": status,
        "schema": schema,
        "path": f"generated/{project_id}"
    }
    save_projects_db(projects)

# Request/Response Models
class GenerateSchemaRequest(BaseModel):
    prompt: str
    entityName: Optional[str] = None
    operations: List[str] = ["create", "read", "update", "delete"]
    model: str = "gpt-4o-mini"

class FieldDefinition(BaseModel):
    id: str
    name: str
    label: str
    type: str
    required: bool
    defaultValue: Optional[str] = None

class SchemaDefinition(BaseModel):
    entityName: str
    fields: List[FieldDefinition]
    operations: Dict[str, bool]

class RefineSchemaRequest(BaseModel):
    currentSchema: SchemaDefinition
    feedback: str
    model: str = "gpt-4o-mini"

class GenerateAppRequest(BaseModel):
    schema: SchemaDefinition
    model: str = "gpt-4o-mini"

class ValidationResult(BaseModel):
    success: bool
    errors: List[str]
    warnings: List[str]
    generatedFiles: Dict[str, str]
    codePreview: Dict[str, str]
    projectId: str

# Utility functions
def clean_code(text: str) -> str:
    """Remove markdown-style fences."""
    return re.sub(r"```[a-zA-Z]*\n?|```", "", text).strip()

def ask_model(model: str, prompt: str, temperature: float = 0.4):
    """Call LLM via LiteLLM."""
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": "You are an expert database and application architect. Return structured, valid responses."},
            {"role": "user", "content": prompt},
        ],
    }
    
    if not model.lower().startswith("gpt-5"):
        kwargs["temperature"] = temperature
    
    try:
        response = completion(**kwargs)
    except TypeError:
        if "temperature" in kwargs:
            del kwargs["temperature"]
        response = completion(**kwargs)
    
    content = response["choices"][0]["message"]["content"].strip()
    return clean_code(content)

# API Endpoints
@app.post("/api/generate-schema", response_model=SchemaDefinition)
async def generate_schema(request: GenerateSchemaRequest):
    """Generate initial schema from user prompt."""
    try:
        print(f"🧠 Generating schema for: {request.prompt}")
        
        analysis_prompt = f"""
        Analyze this application description and identify the main entity, its fields, and data types.
        
        User description: {request.prompt}
        Entity name hint: {request.entityName or 'auto-detect'}
        
        Return a JSON object with:
        - entityName: string (singular, PascalCase)
        - fields: array of objects with name (snake_case), label (Title Case), type (string/number/boolean/date/email/text), required (boolean)
        
        Example:
        {{
          "entityName": "Book",
          "fields": [
            {{"name": "title", "label": "Title", "type": "string", "required": true}},
            {{"name": "author", "label": "Author", "type": "string", "required": true}},
            {{"name": "publication_year", "label": "Publication Year", "type": "number", "required": false}}
          ]
        }}
        
        Return ONLY valid JSON, no markdown or explanations.
        """
        
        response = ask_model(request.model, analysis_prompt)
        
        import json
        try:
            schema_data = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                schema_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse schema from LLM response")
        
        fields = schema_data.get("fields", [])
        if not any(f["name"] == "id" for f in fields):
            fields.insert(0, {
                "name": "id",
                "label": "ID",
                "type": "number",
                "required": True
            })
        
        schema = SchemaDefinition(
            entityName=schema_data.get("entityName", request.entityName or "Entity"),
            fields=[
                FieldDefinition(
                    id=str(i),
                    name=f["name"],
                    label=f["label"],
                    type=f["type"],
                    required=f.get("required", False),
                    defaultValue=f.get("defaultValue")
                )
                for i, f in enumerate(fields)
            ],
            operations={op: True for op in request.operations}
        )
        
        print(f"✅ Generated schema for {schema.entityName} with {len(schema.fields)} fields")
        return schema
        
    except Exception as e:
        print(f"❌ Error generating schema: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate schema: {str(e)}")

@app.post("/api/refine-schema", response_model=SchemaDefinition)
async def refine_schema(request: RefineSchemaRequest):
    """Refine existing schema based on user feedback."""
    try:
        print(f"🔄 Refining schema with feedback: {request.feedback}")
        
        current_fields = [
            {
                "name": f.name,
                "label": f.label,
                "type": f.type,
                "required": f.required,
                "defaultValue": f.defaultValue
            }
            for f in request.currentSchema.fields
        ]
        
        refine_prompt = f"""
        Modify this database schema based on user feedback.
        
        Current schema:
        Entity: {request.currentSchema.entityName}
        Fields: {json.dumps(current_fields, indent=2)}
        
        User feedback: {request.feedback}
        
        Return the updated schema as JSON with the same structure:
        {{
          "entityName": "...",
          "fields": [...]
        }}
        
        Apply the requested changes while maintaining data integrity.
        Return ONLY valid JSON, no markdown or explanations.
        """
        
        response = ask_model(request.model, refine_prompt)
        
        import json
        try:
            schema_data = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                schema_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse refined schema")
        
        refined_schema = SchemaDefinition(
            entityName=schema_data.get("entityName", request.currentSchema.entityName),
            fields=[
                FieldDefinition(
                    id=str(i),
                    name=f["name"],
                    label=f["label"],
                    type=f["type"],
                    required=f.get("required", False),
                    defaultValue=f.get("defaultValue")
                )
                for i, f in enumerate(schema_data["fields"])
            ],
            operations=request.currentSchema.operations
        )
        
        print(f"✅ Refined schema for {refined_schema.entityName}")
        return refined_schema
        
    except Exception as e:
        print(f"❌ Error refining schema: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to refine schema: {str(e)}")

@app.post("/api/generate-app", response_model=ValidationResult)
async def generate_app(request: GenerateAppRequest):
    """Generate complete application code from schema."""
    try:
        # Generate unique project ID
        project_id = str(uuid.uuid4())[:8]
        print(f"🚀 Generating application {project_id} for {request.schema.entityName}")
        
        # Create project directory
        project_dir = Path(f"generated/{project_id}")
        project_dir.mkdir(parents=True, exist_ok=True)
        (project_dir / "__init__.py").touch(exist_ok=True)
        (project_dir / "templates").mkdir(exist_ok=True)
        
        # Generate schema.py
        schema_prompt = f"""
        Write valid Python 3.11 SQLAlchemy 2.0 code for this entity:
        
        Entity: {request.schema.entityName}
        Fields: {[(f.name, f.type, f.required) for f in request.schema.fields]}
        
        Requirements:
        - Use DeclarativeBase
        - Import: from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
        - Import: from sqlalchemy import Integer, String, Text, DateTime, Boolean
        - Define class Base(DeclarativeBase)
        - Create class {request.schema.entityName}(Base) with __tablename__
        - Use mapped_column for all fields
        - Map types: string→String, number→Integer, boolean→Boolean, date→DateTime, text→Text
        
        Return ONLY the Python code, no markdown.
        """
        
        schema_code = ask_model(request.model, schema_prompt)
        schema_code = schema_code.replace('(Base())', '(Base)')
        (project_dir / "schema.py").write_text(schema_code)
        
        # Generate API code
        entity_lower = re.sub(r'(?<!^)(?=[A-Z])', '_', request.schema.entityName).lower()
        
        api_code = f"""from fastapi import FastAPI, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine
from .schema import Base, {request.schema.entityName}

SQLALCHEMY_DATABASE_URL = "sqlite:///./app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={{"check_same_thread": False}})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="{request.schema.entityName} API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

@app.post("/{entity_lower}/")
async def create_{entity_lower}(db: Session = Depends(get_db)):
    # Implementation here
    pass

@app.get("/{entity_lower}/")
async def read_{entity_lower}s(db: Session = Depends(get_db)):
    return db.query({request.schema.entityName}).all()

@app.delete("/{entity_lower}/{{item_id}}")
async def delete_{entity_lower}(item_id: int, db: Session = Depends(get_db)):
    item = db.query({request.schema.entityName}).filter({request.schema.entityName}.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404)
    db.delete(item)
    db.commit()
    return {{"message": "Deleted"}}
"""
        
        (project_dir / "api.py").write_text(api_code)
        
        # Generate frontend.py
        frontend_code = f"""from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pathlib import Path

app = FastAPI(title="{request.schema.entityName} Frontend")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse("index.html", {{"request": request, "title": "{request.schema.entityName}"}})
"""
        (project_dir / "frontend.py").write_text(frontend_code)
        
        # Generate index.html template
        template_html = f"""<!DOCTYPE html>
<html>
<head>
    <title>{{{{ title }}}} Manager</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        h1 {{ color: #333; }}
    </style>
</head>
<body>
    <h1>{{{{ title }}}} Management System</h1>
    <p>Welcome to your generated application!</p>
</body>
</html>
"""
        (project_dir / "templates" / "index.html").write_text(template_html)
        
        # Generate requirements.txt
        requirements = """fastapi==0.115.0
uvicorn[standard]==0.32.0
sqlalchemy==2.0.36
jinja2==3.1.4
"""
        (project_dir / "requirements.txt").write_text(requirements)
        
        # Generate README
        readme = f"""# {request.schema.entityName} Application

Generated by AI App Generator

## Installation

```bash
pip install -r requirements.txt
```

## Run API Server

```bash
uvicorn api:app --reload --port 8000
```

## Run Frontend

```bash
uvicorn frontend:app --reload --port 8001
```

Visit http://localhost:8001
"""
        (project_dir / "README.md").write_text(readme)
        
        # Save project to database
        save_project(project_id, request.schema.dict())
        
        # Read generated files for preview
        schema_preview = (project_dir / "schema.py").read_text()[:500]
        api_preview = (project_dir / "api.py").read_text()[:500]
        
        warnings = []
        if len(request.schema.fields) > 10:
            warnings.append("Large number of fields may impact performance")
        
        result = ValidationResult(
            success=True,
            errors=[],
            warnings=warnings,
            generatedFiles={
                "schema": f"generated/{project_id}/schema.py",
                "api": f"generated/{project_id}/api.py",
                "frontend": f"generated/{project_id}/frontend.py",
                "templates": f"generated/{project_id}/templates/index.html",
                "requirements": f"generated/{project_id}/requirements.txt",
                "readme": f"generated/{project_id}/README.md"
            },
            codePreview={
                "schema": schema_preview,
                "api": api_preview
            },
            projectId=project_id
        )
        
        print(f"✅ Application {project_id} generated successfully")
        return result
        
    except Exception as e:
        print(f"❌ Error generating app: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate app: {str(e)}")

@app.get("/api/projects")
async def list_projects():
    """List all generated projects"""
    projects = load_projects_db()
    return {"projects": list(projects.values())}

@app.get("/api/projects/{project_id}/files")
async def get_project_files(project_id: str):
    """Get list of files in a project"""
    project_dir = Path(f"generated/{project_id}")
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    files = []
    for file_path in project_dir.rglob("*"):
        if file_path.is_file():
            relative_path = file_path.relative_to(project_dir)
            files.append({
                "name": file_path.name,
                "path": str(relative_path),
                "type": file_path.suffix[1:] if file_path.suffix else "file",
                "size": file_path.stat().st_size
            })
    
    return files

@app.get("/api/projects/{project_id}/files/{file_path:path}")
async def get_file_content(project_id: str, file_path: str):
    """Get content of a specific file"""
    full_path = Path(f"generated/{project_id}/{file_path}")
    if not full_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        content = full_path.read_text()
        return {"content": content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading file: {str(e)}")

@app.get("/api/projects/{project_id}/download")
async def download_project(project_id: str):
    """Download project as ZIP file"""
    project_dir = Path(f"generated/{project_id}")
    if not project_dir.exists():
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Create ZIP file
        zip_path = Path(f"generated/{project_id}.zip")
        shutil.make_archive(str(zip_path.with_suffix('')), 'zip', project_dir)
        
        return FileResponse(
            path=str(zip_path),
            filename=f"{project_id}.zip",
            media_type="application/zip"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating ZIP: {str(e)}")

@app.post("/api/projects/{project_id}/deploy")
async def get_deploy_instructions(project_id: str):
    """Get deployment instructions for a project"""
    projects = load_projects_db()
    if project_id not in projects:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project = projects[project_id]
    entity_name = project.get("entityName", "App")
    
    return {
        "instructions": {
            "railway": f"1. Install Railway CLI\n2. cd generated/{project_id}\n3. railway init\n4. railway up",
            "render": f"1. Connect GitHub repo\n2. Set build command: pip install -r requirements.txt\n3. Set start command: uvicorn api:app --host 0.0.0.0 --port $PORT",
            "docker": f"1. Create Dockerfile in generated/{project_id}\n2. docker build -t {entity_name.lower()}-app .\n3. docker run -p 8000:8000 {entity_name.lower()}-app"
        }
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI App Generator Orchestrator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)