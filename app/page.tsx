"use client"

import { useState } from "react"
import { PromptScreen } from "@/components/prompt-screen"
import { MockupEditor } from "@/components/mockup-editor"
import { ValidationReport } from "@/components/validation-report"
import { Sparkles, Database, Code2, CheckCircle2 } from "lucide-react"

export type FieldDefinition = {
  id: string
  name: string
  label: string
  type: "string" | "number" | "boolean" | "date" | "email" | "text"
  required: boolean
  defaultValue?: string
}

export type SchemaDefinition = {
  entityName: string
  fields: FieldDefinition[]
  operations: {
    create: boolean
    read: boolean
    update: boolean
    delete: boolean
  }
}

export type ValidationResult = {
  success: boolean
  errors: string[]
  warnings: string[]
  generatedFiles: {
    sql?: string
    schema?: string
    orm?: string
    api?: string
    frontend?: string
    templates?: string
    requirements?: string
    readme?: string
  }
  projectId?: string
  codePreview?: {
    schema?: string
    api?: string
  }
}

export default function Home() {
  const [currentStep, setCurrentStep] = useState<"prompt" | "mockup" | "report">("prompt")
  const [schema, setSchema] = useState<SchemaDefinition | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const handlePromptSubmit = async (prompt: string, params: any) => {
    setIsGenerating(true)

    try {
      const response = await fetch("http://localhost:8000/api/generate-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          entityName: params.entityName,
          operations: params.operations,
          model: "gpt-4o-mini",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate schema")
      }

      const generatedSchema = await response.json()
      setSchema(generatedSchema)
      setCurrentStep("mockup")
    } catch (error) {
      console.error("Error generating schema:", error)
      alert("Failed to generate schema. Make sure the backend is running on port 8000.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSchemaUpdate = (updatedSchema: SchemaDefinition) => {
    setSchema(updatedSchema)
  }

  const handleRegenerate = async (feedback: string) => {
    if (!schema) return

    setIsGenerating(true)

    try {
      const response = await fetch("http://localhost:8000/api/refine-schema", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentSchema: schema,
          feedback,
          model: "gpt-4o-mini",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to refine schema")
      }

      const refinedSchema = await response.json()
      setSchema(refinedSchema)
    } catch (error) {
      console.error("Error refining schema:", error)
      alert("Failed to refine schema. Make sure the backend is running.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirm = async () => {
    if (!schema) return

    setIsGenerating(true)

    try {
      const response = await fetch("http://localhost:8000/api/generate-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema,
          model: "gpt-4o-mini",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate application")
      }

      const result = await response.json()
      setValidationResult(result)
      setCurrentStep("report")
    } catch (error) {
      console.error("Error generating app:", error)
      alert("Failed to generate application. Make sure the backend is running.")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleStartOver = () => {
    setCurrentStep("prompt")
    setSchema(null)
    setValidationResult(null)
  }

  const steps = [
    { id: "prompt", label: "Prompt", icon: Sparkles, active: currentStep === "prompt" },
    { id: "mockup", label: "Schema", icon: Database, active: currentStep === "mockup" },
    { id: "report", label: "Generate", icon: CheckCircle2, active: currentStep === "report" },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                <Code2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">AI App Generator</h1>
                <p className="text-xs text-muted-foreground">Multi-Agent Database Application Builder</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="hidden md:flex items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      step.active ? "bg-primary/10 border border-primary/30 text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <step.icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.label}</span>
                  </div>
                  {index < steps.length - 1 && <div className="w-8 h-px bg-border mx-1" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {currentStep === "prompt" && <PromptScreen onSubmit={handlePromptSubmit} isGenerating={isGenerating} />}

        {currentStep === "mockup" && schema && (
          <MockupEditor
            schema={schema}
            onUpdate={handleSchemaUpdate}
            onRegenerate={handleRegenerate}
            onConfirm={handleConfirm}
            isGenerating={isGenerating}
          />
        )}

        {currentStep === "report" && validationResult && (
          <ValidationReport result={validationResult} onStartOver={handleStartOver} />
        )}
      </main>
    </div>
  )
}
