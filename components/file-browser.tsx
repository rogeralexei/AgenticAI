"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { FileCode2, ChevronRight, ChevronDown, File } from "lucide-react"

type FileInfo = {
  name: string
  path: string
  type: string
  size: number
}

type FileBrowserProps = {
  projectId: string
}

export function FileBrowser({ projectId }: FileBrowserProps) {
  const [files, setFiles] = useState<FileInfo[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))

  useEffect(() => {
    loadFiles()
  }, [projectId])

  const loadFiles = async () => {
    try {
      console.log("[v0] Loading files for project:", projectId)
      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/files`)

      if (!response.ok) {
        throw new Error("Failed to load files")
      }

      const data = await response.json()
      console.log("[v0] Loaded files:", data)
      setFiles(data)

      // Auto-select first file
      if (data.length > 0) {
        loadFileContent(data[0].path)
      }
    } catch (error) {
      console.error("[v0] Error loading files:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadFileContent = async (filePath: string) => {
    try {
      console.log("[v0] Loading file content:", filePath)
      setSelectedFile(filePath)
      setFileContent("Loading...")

      const response = await fetch(`http://localhost:8000/api/projects/${projectId}/files/${filePath}`)

      if (!response.ok) {
        throw new Error("Failed to load file content")
      }

      const data = await response.json()
      console.log("[v0] Loaded file content for:", filePath)
      setFileContent(data.content)
    } catch (error) {
      console.error("[v0] Error loading file content:", error)
      setFileContent("Error loading file content")
    }
  }

  const getFileExtension = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase()
    return ext || ""
  }

  const getLanguageFromExtension = (filename: string) => {
    const ext = getFileExtension(filename)
    const languageMap: Record<string, string> = {
      py: "python",
      js: "javascript",
      ts: "typescript",
      tsx: "typescript",
      jsx: "javascript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      txt: "text",
    }
    return languageMap[ext] || "text"
  }

  // Organize files into a tree structure
  const fileTree: Record<string, FileInfo[]> = {}
  files.forEach((file) => {
    const parts = file.path.split("/")
    const folder = parts.length > 1 ? parts[0] : "root"
    if (!fileTree[folder]) {
      fileTree[folder] = []
    }
    fileTree[folder].push(file)
  })

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder)
    } else {
      newExpanded.add(folder)
    }
    setExpandedFolders(newExpanded)
  }

  if (loading) {
    return (
      <Card className="p-6 bg-card border-border">
        <p className="text-muted-foreground">Loading files...</p>
      </Card>
    )
  }

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      {/* File Tree */}
      <Card className="p-4 bg-card border-border h-[600px] overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
          <FileCode2 className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground">Project Files</h3>
        </div>

        <div className="space-y-1">
          {Object.entries(fileTree).map(([folder, folderFiles]) => (
            <div key={folder}>
              {/* Folder Header */}
              <button
                onClick={() => toggleFolder(folder)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors text-left"
              >
                {expandedFolders.has(folder) ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="text-sm font-medium text-foreground">{folder}</span>
              </button>

              {/* Files in Folder */}
              {expandedFolders.has(folder) && (
                <div className="ml-6 space-y-0.5 mt-1">
                  {folderFiles.map((file) => (
                    <button
                      key={file.path}
                      onClick={() => loadFileContent(file.path)}
                      className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-left transition-colors ${
                        selectedFile === file.path
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <File className="w-3.5 h-3.5" />
                      <span className="text-sm truncate">{file.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* File Content */}
      <Card className="p-6 bg-card border-border h-[600px] overflow-hidden flex flex-col">
        {selectedFile ? (
          <>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
              <div>
                <h3 className="font-semibold text-foreground">{selectedFile.split("/").pop()}</h3>
                <p className="text-xs text-muted-foreground font-mono">{selectedFile}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                {getLanguageFromExtension(selectedFile)}
              </span>
            </div>

            <div className="flex-1 overflow-auto rounded-lg bg-background border border-border p-4">
              <pre className="text-sm font-mono text-foreground">
                <code>{fileContent}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a file to view its contents
          </div>
        )}
      </Card>
    </div>
  )
}
