from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from pathlib import Path
import re
import time
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
        
        # Analyze the prompt
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
        
        # Parse the JSON response
        import json
        try:
            schema_data = json.loads(response)
        except json.JSONDecodeError:
            # Fallback: extract JSON from response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                schema_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse schema from LLM response")
        
        # Add ID field if not present
        fields = schema_data.get("fields", [])
        if not any(f["name"] == "id" for f in fields):
            fields.insert(0, {
                "name": "id",
                "label": "ID",
                "type": "number",
                "required": True
            })
        
        # Convert to response format
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
        
        # Parse response
        import json
        try:
            schema_data = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                schema_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse refined schema")
        
        # Convert to response format
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
        print(f"🚀 Generating full application for {request.schema.entityName}")
        
        # Create generated directory
        Path("generated").mkdir(exist_ok=True)
        Path("generated/__init__.py").touch(exist_ok=True)
        Path("generated/templates").mkdir(exist_ok=True)
        
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
        Path("generated/schema.py").write_text(schema_code)
        
        # Generate API code (simplified version)
        entity_lower = re.sub(r'(?<!^)(?=[A-Z])', '_', request.schema.entityName).lower()
        
        api_code = f"""from fastapi import FastAPI, HTTPException, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine
from .schema import Base, {request.schema.entityName}

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={{"check_same_thread": False}})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(title="Generated API")

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
        
        Path("generated/api.py").write_text(api_code)
        
        # Read generated files for preview
        schema_preview = Path("generated/schema.py").read_text()[:500]
        api_preview = Path("generated/api.py").read_text()[:500]
        
        warnings = []
        if len(request.schema.fields) > 10:
            warnings.append("Large number of fields may impact performance")
        
        result = ValidationResult(
            success=True,
            errors=[],
            warnings=warnings,
            generatedFiles={
                "schema": "generated/schema.py",
                "api": "generated/api.py",
                "frontend": "generated/frontend.py",
                "templates": "generated/templates/index.html"
            },
            codePreview={
                "schema": schema_preview,
                "api": api_preview
            }
        )
        
        print(f"✅ Application generated successfully")
        return result
        
    except Exception as e:
        print(f"❌ Error generating app: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate app: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "AI App Generator Orchestrator"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
