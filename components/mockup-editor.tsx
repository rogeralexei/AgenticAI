"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, RefreshCw, CheckCircle2, Loader2, GripVertical, Database } from "lucide-react"
import type { SchemaDefinition, FieldDefinition } from "@/app/page"

type MockupEditorProps = {
  schema: SchemaDefinition
  onUpdate: (schema: SchemaDefinition) => void
  onRegenerate: (feedback: string) => void
  onConfirm: () => void
  isGenerating: boolean
}

export function MockupEditor({ schema, onUpdate, onRegenerate, onConfirm, isGenerating }: MockupEditorProps) {
  const [feedback, setFeedback] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)

  const updateField = (fieldId: string, updates: Partial<FieldDefinition>) => {
    const updatedFields = schema.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field))
    onUpdate({ ...schema, fields: updatedFields })
  }

  const addField = () => {
    const newField: FieldDefinition = {
      id: Date.now().toString(),
      name: "new_field",
      label: "New Field",
      type: "string",
      required: false,
    }
    onUpdate({ ...schema, fields: [...schema.fields, newField] })
  }

  const removeField = (fieldId: string) => {
    onUpdate({
      ...schema,
      fields: schema.fields.filter((f) => f.id !== fieldId),
    })
  }

  const updateOperation = (op: keyof SchemaDefinition["operations"]) => {
    onUpdate({
      ...schema,
      operations: { ...schema.operations, [op]: !schema.operations[op] },
    })
  }

  const handleRegenerate = () => {
    onRegenerate(feedback)
    setFeedback("")
    setShowFeedback(false)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-foreground">Schema Mockup</h2>
          <p className="text-muted-foreground">Review and edit the generated schema before final generation</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowFeedback(!showFeedback)}
            className="border-border text-foreground"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refine
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isGenerating}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirm & Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Feedback Section */}
      {showFeedback && (
        <Card className="p-4 bg-secondary/50 border-border space-y-3">
          <Label className="text-sm font-medium text-foreground">Provide feedback to refine the schema</Label>
          <Textarea
            placeholder="e.g., 'Add an email field', 'Make author field required', 'Change stock to quantity'"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="bg-background border-input text-foreground"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRegenerate}
              disabled={!feedback.trim() || isGenerating}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Regenerating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-2" />
                  Regenerate Schema
                </>
              )}
            </Button>
            <Button onClick={() => setShowFeedback(false)} variant="ghost" size="sm" className="text-foreground">
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {/* Entity Info */}
      <Card className="p-6 bg-card border-border space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
            <Database className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <Label className="text-sm text-muted-foreground">Entity Name</Label>
            <Input
              value={schema.entityName}
              onChange={(e) => onUpdate({ ...schema, entityName: e.target.value })}
              className="mt-1 bg-background border-input text-foreground font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <Label className="text-sm font-medium text-foreground mb-3 block">CRUD Operations</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(schema.operations).map(([op, enabled]) => (
              <div
                key={op}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  enabled ? "bg-primary/5 border-primary/30" : "bg-secondary/30 border-border"
                }`}
              >
                <Checkbox
                  id={`op-${op}`}
                  checked={enabled}
                  onCheckedChange={() => updateOperation(op as keyof SchemaDefinition["operations"])}
                />
                <Label htmlFor={`op-${op}`} className="text-sm capitalize cursor-pointer text-foreground">
                  {op}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Fields Editor */}
      <Card className="p-6 bg-card border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Fields</h3>
          <Button
            onClick={addField}
            variant="outline"
            size="sm"
            className="border-border text-foreground bg-transparent"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>

        <div className="space-y-3">
          {schema.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex items-start gap-3 p-4 rounded-lg bg-secondary/30 border border-border group hover:border-primary/30 transition-colors"
            >
              <div className="flex items-center justify-center mt-2 text-muted-foreground cursor-move">
                <GripVertical className="w-4 h-4" />
              </div>

              <div className="flex-1 grid md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Field Name</Label>
                  <Input
                    value={field.name}
                    onChange={(e) => updateField(field.id, { name: e.target.value })}
                    className="bg-background border-input text-foreground font-mono text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Label</Label>
                  <Input
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="bg-background border-input text-foreground text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select
                    value={field.type}
                    onValueChange={(value) => updateField(field.id, { type: value as FieldDefinition["type"] })}
                  >
                    <SelectTrigger className="bg-background border-input text-foreground text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Default Value</Label>
                  <Input
                    value={field.defaultValue || ""}
                    onChange={(e) => updateField(field.id, { defaultValue: e.target.value })}
                    placeholder="Optional"
                    className="bg-background border-input text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => updateField(field.id, { required: !!checked })}
                  />
                  <Label htmlFor={`required-${field.id}`} className="text-xs cursor-pointer text-foreground">
                    Required
                  </Label>
                </div>
                <Button
                  onClick={() => removeField(field.id)}
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
