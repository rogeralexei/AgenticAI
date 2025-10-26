"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Rocket, Eye, Trash2, Code2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { FileBrowser } from "@/components/file-browser"

type Project = {
  id: string
  entityName: string
  created_at: number
  status: string
  schema: any
  path: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/projects")
      if (!response.ok) throw new Error("Failed to load projects")
      
      const data = await response.json()
      setProjects(data.projects.sort((a: Project, b: Project) => b.created_at - a.created_at))
    } catch (error) {
      console.error("Error loading projects:", error)
      alert("Failed to load projects. Make sure the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (projectId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/download`)
      if (!response.ok) throw new Error("Failed to download project")
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${projectId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading project:", error)
      alert("Failed to download project")
    }
  }

  const handleDeploy = async (projectId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/deploy`, {
        method: "POST",
      })
      if (!response.ok) throw new Error("Failed to get deployment instructions")
      
      const data = await response.json()
      alert(
        `Deployment Instructions:\n\nRailway:\n${data.instructions.railway}\n\nRender:\n${data.instructions.render}\n\nDocker:\n${data.instructions.docker}`
      )
    } catch (error) {
      console.error("Error getting deployment instructions:", error)
      alert("Failed to get deployment instructions")
    }
  }

  const handleDelete = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    
    // This would need a backend endpoint to delete projects
    alert("Delete functionality coming soon!")
  }

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedProject(null)}
                className="text-foreground"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Projects
              </Button>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <FileBrowser projectId={selectedProject} />
        </main>
      </div>
    )
  }

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
                <h1 className="text-xl font-bold text-foreground">My Projects</h1>
                <p className="text-xs text-muted-foreground">View and manage your generated applications</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline" className="border-border text-foreground">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Generator
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <Card className="p-12 text-center bg-card border-border">
            <Code2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Projects Yet</h2>
            <p className="text-muted-foreground mb-6">
              Generate your first application to see it here
            </p>
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Create New Project
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card key={project.id} className="p-6 bg-card border-border hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{project.entityName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(project.created_at * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="px-2 py-1 rounded bg-accent/10 border border-accent/30">
                    <span className="text-xs text-accent font-medium">{project.status}</span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground mb-4">
                  Project ID: <code className="font-mono text-xs">{project.id}</code>
                </p>

                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedProject(project.id)}
                    className="flex-1 border-border text-foreground"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(project.id)}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>

                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeploy(project.id)}
                    className="flex-1 border-accent text-accent hover:bg-accent/10"
                  >
                    <Rocket className="w-3 h-3 mr-1" />
                    Deploy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(project.id)}
                    className="border-destructive text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}