"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Sparkles, Loader2 } from "lucide-react"

type PromptScreenProps = {
  onSubmit: (prompt: string, params: any) => void
  isGenerating: boolean
}

export function PromptScreen({ onSubmit, isGenerating }: PromptScreenProps) {
  const [prompt, setPrompt] = useState("")
  const [entityName, setEntityName] = useState("")
  const [operations, setOperations] = useState<string[]>(["create", "read", "update", "delete"])

  const handleSubmit = () => {
    if (!prompt.trim()) return
    onSubmit(prompt, { entityName, operations })
  }

  const toggleOperation = (op: string) => {
    setOperations((prev) => (prev.includes(op) ? prev.filter((o) => o !== op) : [...prev, op]))
  }

  const examples = [
    "Create an app to manage a library with books, authors, and publication years",
    "Build a movie database with title, director, genre, and release date",
    "Design a product inventory system with name, SKU, price, and stock quantity",
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          <span>Powered by Multi-Agent AI System</span>
        </div>
        <h2 className="text-4xl font-bold text-foreground text-balance">Describe Your Application</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
          Our AI agents will analyze your requirements and generate a complete database schema, ORM models, API
          endpoints, and frontend components.
        </p>
      </div>

      {/* Main Input Card */}
      <Card className="p-6 space-y-6 bg-card border-border">
        <div className="space-y-2">
          <Label htmlFor="prompt" className="text-base font-semibold text-foreground">
            Application Description
          </Label>
          <Textarea
            id="prompt"
            placeholder="Describe your application in natural language... For example: 'Create an app to manage a library with books, authors, and publication years'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="min-h-[150px] bg-background border-input text-foreground resize-none"
          />
        </div>

        {/* Parameters */}
        <div className="grid md:grid-cols-2 gap-6 pt-4 border-t border-border">
          <div className="space-y-2">
            <Label htmlFor="entityName" className="text-sm font-medium text-foreground">
              Entity Name (Optional)
            </Label>
            <Input
              id="entityName"
              placeholder="e.g., Book, Movie, Product"
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              className="bg-background border-input text-foreground"
            />
            <p className="text-xs text-muted-foreground">Leave blank to let AI determine the entity name</p>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">CRUD Operations</Label>
            <div className="grid grid-cols-2 gap-3">
              {["create", "read", "update", "delete"].map((op) => (
                <div key={op} className="flex items-center gap-2">
                  <Checkbox id={op} checked={operations.includes(op)} onCheckedChange={() => toggleOperation(op)} />
                  <Label htmlFor={op} className="text-sm capitalize cursor-pointer text-foreground">
                    {op}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating Schema...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Schema
            </>
          )}
        </Button>
      </Card>

      {/* Examples */}
      <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Try these examples:</p>
        <div className="grid gap-2">
          {examples.map((example, index) => (
            <button
              key={index}
              onClick={() => setPrompt(example)}
              className="text-left p-4 rounded-lg bg-secondary/50 hover:bg-secondary border border-border transition-colors group"
            >
              <p className="text-sm text-foreground group-hover:text-accent transition-colors">{example}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
