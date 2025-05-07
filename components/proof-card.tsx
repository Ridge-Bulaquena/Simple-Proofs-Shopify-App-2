"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, X, Image, MessageSquare } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { formatDate } from "@/lib/utils"
import { ProofWithComments } from "@/lib/types"

interface ProofCardProps {
  proof: ProofWithComments
  orderId: string
  isCustomer?: boolean
  onApprove?: () => void
  onRequestChanges?: () => void
  hideActions?: boolean
}

export function ProofCard({
  proof,
  orderId,
  isCustomer = false,
  onApprove,
  onRequestChanges,
  hideActions = false,
}: ProofCardProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const supabase = createBrowserSupabaseClient()

  const handleAddComment = async () => {
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert({
        proof_id: proof.id,
        content: comment,
        is_customer: isCustomer,
      })

      if (error) throw error

      toast({
        title: "Comment added",
        description: "Your comment has been added successfully",
      })
      setComment("")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "There was an error adding your comment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Proof</span>
          <span className="text-sm font-normal text-muted-foreground">
            {formatDate(proof.created_at)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border rounded-md overflow-hidden">
          {proof.file_path.endsWith(".pdf") ? (
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <a
                href={proof.file_path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 text-primary"
              >
                <Image className="h-12 w-12 mb-2" />
                <span>View PDF Proof</span>
              </a>
            </div>
          ) : (
            <img
              src={proof.file_path}
              alt="Proof"
              className="w-full h-auto object-contain"
            />
          )}
        </div>

        {proof.comments && proof.comments.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Comments
            </h4>
            <div className="space-y-2">
              {proof.comments.map((comment) => (
                <div
                  key={comment.id}
                  className={`p-3 rounded-md text-sm ${
                    comment.is_customer
                      ? "bg-blue-50 dark:bg-blue-900/20 ml-4"
                      : "bg-gray-50 dark:bg-gray-800 mr-4"
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <span className="font-medium">
                      {comment.is_customer ? "Customer" : "Store"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddComment}
            disabled={!comment.trim() || isSubmitting}
          >
            Add Comment
          </Button>
        </div>
      </CardContent>

      {!hideActions && isCustomer && (
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            className="border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950"
            onClick={onRequestChanges}
          >
            <X className="mr-2 h-4 w-4" />
            Request Changes
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={onApprove}
          >
            <Check className="mr-2 h-4 w-4" />
            Approve
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
