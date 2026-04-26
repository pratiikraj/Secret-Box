"use client"

import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { MessageHeader } from "@/components/dashboard/message-header"
import MessagesTable from "@/components/dashboard/massagesTable"
import { ClientMessage as Message } from "@/types/ClientMessage"
import { useEffect } from "react"

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  const fetchMessages = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setIsRefreshing(true)
      else setIsLoading(true)

      const res = await fetch("/api/get-messages")
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message || "Failed to fetch messages")
        return
      }
      setMessages(data.data || [])
    } catch (err) {
      console.error("Error fetching messages:", err)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchMessages()
    }
  }, [session, fetchMessages])

  return (
    <>
      <MessageHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRefresh={() => fetchMessages(true)}
        isRefreshing={isRefreshing}
      />
      <div className="flex flex-1 flex-col gap-4 p-4">
        <MessagesTable
          messages={messages}
          setMessages={setMessages}
          isLoading={isLoading}
          searchQuery={searchQuery}
        />
      </div>
    </>
  )
}
