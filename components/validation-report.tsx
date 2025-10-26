"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { CheckCircle2, AlertTriangle, XCircle, FileCode2, Download, RotateCcw, Rocket } from "lucide-react"
import { FileBrowser } from "@/components/file-browser"
import type { ValidationResult } from "@/app/page"

type ValidationReportProps = {
  result: ValidationResult
  onStartOver: () => void
}

export function ValidationReport({ result, onStartOver }: ValidationReportProps) {
  console.log("[v0] ValidationReport result:", result)
  const handleDownload = async () => {
    if (!(result as any).projectId) {
      alert("Project ID not found")
      return
    }

    try {
      console.log("[v0] Downloading project:", (result as any).projectId)
      const response = await fetch(`http://localhost:8000/api/projects/${(result as any).projectId}/download`)

      if (!response.ok) {
        throw new Error("Failed to download project")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${(result as any).projectId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log("[v0] Download complete")
    } catch (error) {
      console.error("[v0] Error downloading project:", error)
      alert("Failed to download project. Make sure the backend is running.")
    }
  }

  const handleDeploy = async () => {
    if (!(result as any).projectId) {
      alert("Project ID not found")
      return
    }

    try {
      console.log("[v0] Deploying project:", (result as any).projectId)
      const response = await fetch(`http://localhost:8000/api/projects/${(result as any).projectId}/deploy`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to get deployment instructions")
      }

      const data = await response.json()
      console.log("[v0] Deployment instructions:", data)

      // Show deployment instructions in an alert (could be improved with a modal)
      alert(
        `Deployment Instructions:\n\nRailway: ${data.instructions.railway}\nRender: ${data.instructions.render}\nDocker: ${data.instructions.docker}`,
      )
    } catch (error) {
      console.error("[v0] Error getting deployment instructions:", error)
      alert("Failed to get deployment instructions. Make sure the backend is running.")
    }
  }

  const fileIcons: Record<string, string> = {
    sql: "🗄️",
    schema: "🔷",
    orm: "🔷",
    api: "🚀",
    frontend: "⚛️",
    templates: "🎨",
    requirements: "📦",
    readme: "📖",
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Status Header */}
      <div className="text-center space-y-4 py-8">
        <div
          className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${
            result.success
              ? "bg-accent/10 border-2 border-accent/30"
              : "bg-destructive/10 border-2 border-destructive/30"
          }`}
        >
          {result.success ? (
            <CheckCircle2 className="w-10 h-10 text-accent" />
          ) : (
            <XCircle className="w-10 h-10 text-destructive" />
          )}
        </div>
        <h2 className="text-4xl font-bold text-foreground">
          {result.success ? "Generation Complete!" : "Generation Failed"}
        </h2>
        <p className="text-lg text-muted-foreground">
          {result.success ? "Your application has been successfully generated" : "There were errors during generation"}
        </p>
      </div>

      {/* Errors */}
      {result.errors.length > 0 && (
        <Card className="p-6 bg-destructive/5 border-destructive/30">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-destructive">Errors</h3>
              <ul className="space-y-1">
                {result.errors.map((error, index) => (
                  <li key={index} className="text-sm text-destructive/90">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Warnings */}
      {result.warnings.length > 0 && (
        <Card className="p-6 bg-yellow-500/5 border-yellow-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-yellow-500">Warnings</h3>
              <ul className="space-y-1">
                {result.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-500/90">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Generated Files Summary */}
      {result.success && (
        <Card className="p-6 bg-card border-border space-y-4">
          <div className="flex items-center gap-3">
            <FileCode2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Generated Files</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(result.generatedFiles).map(([type, path]) => (
              <div
                key={type}
                className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 border border-border hover:border-primary/30 transition-colors group"
              >
                <span className="text-2xl">{fileIcons[type] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground capitalize">{type}</p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{path}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {result.success && (result as any).projectId && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Browse Generated Code</h3>
          <FileBrowser projectId={(result as any).projectId} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 pt-4">
        {result.success && (
          <>
            <Button
              onClick={handleDownload}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Project
            </Button>

            <Button
              onClick={handleDeploy}
              variant="outline"
              size="lg"
              className="border-accent text-accent hover:bg-accent/10 bg-transparent"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Deploy
            </Button>
          </>
        )}
        <Button
          onClick={onStartOver}
          variant="outline"
          size="lg"
          className="border-border text-foreground bg-transparent"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Over
        </Button>
      </div>
    </div>
  )
}
