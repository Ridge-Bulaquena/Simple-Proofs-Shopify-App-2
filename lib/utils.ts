import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(typeof date === "string" ? new Date(date) : date)
}

export function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function generateSlug(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .substring(0, 50)
}

export function truncate(str: string, length: number) {
  if (!str) return ""
  if (str.length <= length) return str
  return str.slice(0, length) + "..."
}

export const orderStatuses = {
  AWAITING_PROOF: "awaiting_proof",
  PROOF_SENT: "proof_sent",
  APPROVED: "approved",
  CHANGES_REQUESTED: "changes_requested",
  COMPLETED: "completed",
}

export const orderStatusLabels = {
  [orderStatuses.AWAITING_PROOF]: "Awaiting Proof",
  [orderStatuses.PROOF_SENT]: "Proof Sent",
  [orderStatuses.APPROVED]: "Approved",
  [orderStatuses.CHANGES_REQUESTED]: "Changes Requested",
  [orderStatuses.COMPLETED]: "Completed",
}

export const orderStatusColors = {
  [orderStatuses.AWAITING_PROOF]: "bg-yellow-100 text-yellow-800",
  [orderStatuses.PROOF_SENT]: "bg-blue-100 text-blue-800",
  [orderStatuses.APPROVED]: "bg-green-100 text-green-800",
  [orderStatuses.CHANGES_REQUESTED]: "bg-orange-100 text-orange-800",
  [orderStatuses.COMPLETED]: "bg-purple-100 text-purple-800",
}

export function getInitials(name: string) {
  if (!name) return ""
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}
