"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, X, File } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"

interface FileUploaderProps {
  onUploadComplete: (filePath: string) => void
  storeId: string
  bucketName?: string
  maxSizeMB?: number
  acceptedFileTypes?: string[]
  className?: string
}

export function FileUploader({
  onUploadComplete,
  storeId,
  bucketName = "proofs",
  maxSizeMB = 5,
  acceptedFileTypes = ["image/jpeg", "image/png", "image/gif", "application/pdf"],
  className,
}: FileUploaderProps) {
  const [uploadedFile, setUploadedFile] = useState<{ name: string; path: string } | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()
  
  const maxSize = maxSizeMB * 1024 * 1024 // Convert MB to bytes

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      
      const file = acceptedFiles[0]
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `Maximum file size is ${maxSizeMB}MB`,
          variant: "destructive",
        })
        return
      }
      
      setIsUploading(true)
      
      try {
        // Create a unique file path for this file
        const fileExt = file.name.split(".").pop()
        const fileName = `${storeId}/${uuidv4()}.${fileExt}`
        
        const { error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file)
          
        if (error) {
          throw error
        }
        
        const { data } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName)
          
        setUploadedFile({
          name: file.name,
          path: data.publicUrl,
        })
        
        onUploadComplete(data.publicUrl)
        
        toast({
          title: "File uploaded",
          description: "Your file has been uploaded successfully",
        })
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "There was an error uploading your file",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    },
    [storeId, maxSize, maxSizeMB, bucketName, supabase, onUploadComplete, toast]
  )
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => ({
      ...acc,
      [type]: [],
    }), {}),
    maxSize,
    multiple: false,
  })
  
  const removeFile = () => {
    setUploadedFile(null)
  }
  
  return (
    <div className={cn("w-full", className)}>
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer transition-colors",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/20 hover:border-primary/50",
          )}
        >
          <input {...getInputProps()} />
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-center text-muted-foreground mb-1">
            {isDragActive
              ? "Drop the file here"
              : "Drag and drop a file here, or click to select"}
          </p>
          <p className="text-xs text-center text-muted-foreground">
            Accepted file types: {acceptedFileTypes.join(", ")} (Max: {maxSizeMB}MB)
          </p>
          {isUploading && (
            <div className="mt-4 w-full">
              <div className="h-1 w-full bg-muted rounded overflow-hidden">
                <div className="h-full bg-primary animate-pulse" style={{ width: "100%" }} />
              </div>
              <p className="text-xs text-center mt-1 text-muted-foreground">Uploading...</p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center">
            <File className="h-5 w-5 text-primary mr-2" />
            <span className="text-sm truncate max-w-[200px]">{uploadedFile.name}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={removeFile}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
