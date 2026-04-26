"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Inbox,
  Mail,
  MailOpen,
  Star,
  TrendingUp,
  Clock,
  Copy,
  ExternalLink,
  MessageSquare,
  Eye,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { ClientMessage as Message } from "@/types/ClientMessage"
import { User } from "next-auth"

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-7">
        <Skeleton className="h-80 rounded-xl lg:col-span-4" />
        <Skeleton className="h-80 rounded-xl lg:col-span-3" />
      </div>
    </div>
  )
}

export default function Overview() {
  const { data: session, status } = useSession()
  const user: User = session?.user as User
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/get-messages")
      const data = await res.json()
      if (!data.success) return
      setMessages(data.data || [])
    } catch (err) {
      console.error("Error fetching overview data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchMessages()
  }, [session])

  const stats = useMemo(() => {
    const total = messages.length
    const unread = messages.filter((m) => !m.read).length
    const starred = messages.filter((m) => m.starred).length
    const read = messages.filter((m) => m.read).length

    // Messages in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentCount = messages.filter(
      (m) => new Date(m.createdAt) > sevenDaysAgo
    ).length

    // Messages in the 7 days before that
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    const prevWeekCount = messages.filter(
      (m) => new Date(m.createdAt) > fourteenDaysAgo && new Date(m.createdAt) <= sevenDaysAgo
    ).length

    const weeklyGrowth = prevWeekCount === 0
      ? recentCount > 0 ? 100 : 0
      : Math.round(((recentCount - prevWeekCount) / prevWeekCount) * 100)

    return { total, unread, starred, read, recentCount, weeklyGrowth }
  }, [messages])

  const recentMessages = useMemo(() => {
    return [...messages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
  }, [messages])

  // Group messages by day for the last 7 days
  const activityData = useMemo(() => {
    const days: { label: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dayStr = d.toLocaleDateString("en-US", { weekday: "short" })
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)
      const count = messages.filter((m) => {
        const t = new Date(m.createdAt)
        return t >= dayStart && t < dayEnd
      }).length
      days.push({ label: dayStr, count })
    }
    return days
  }, [messages])

  const maxActivity = Math.max(...activityData.map((d) => d.count), 1)

  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${user?.username}`
    : ""

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
  }

  if (isLoading || status === "loading") return <OverviewSkeleton />

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {getGreeting()}, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s what&apos;s happening with your Secret Box
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit gap-2 bg-transparent"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Sparkles className="h-4 w-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy your link
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Inbox className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">
                {stats.weeklyGrowth >= 0 ? "+" : ""}{stats.weeklyGrowth}%
              </span>
              <span>vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unread</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <Mail className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unread}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.unread > 0
                ? `${stats.unread} message${stats.unread > 1 ? "s" : ""} waiting for you`
                : "All caught up!"}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Read</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <MailOpen className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.read}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round((stats.read / stats.total) * 100)}% read rate`
                : "No messages yet"}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Starred</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2">
              <Star className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.starred}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.starred > 0
                ? `Your ${stats.starred} favorite${stats.starred > 1 ? "s" : ""}`
                : "Star messages to save them"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Activity chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">Weekly Activity</CardTitle>
            <CardDescription>Messages received in the last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-48 items-end gap-2">
              {activityData.map((day, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{day.count}</span>
                  <div
                    className="w-full rounded-md bg-primary/80 transition-all duration-500 hover:bg-primary"
                    style={{
                      height: `${Math.max((day.count / maxActivity) * 100, 4)}%`,
                      minHeight: day.count > 0 ? "12px" : "4px",
                    }}
                  />
                  <span className="text-[11px] text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">This week</span>
              <span className="font-semibold">
                {stats.recentCount} message{stats.recentCount !== 1 ? "s" : ""}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Recent Messages</CardTitle>
              <CardDescription>Latest anonymous messages</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/user-dashboard/messages">
                View all
                <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <div className="rounded-full bg-muted p-3">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">No messages yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Share your link to start receiving anonymous messages
                  </p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/user-dashboard/share-link">Share your link</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className="group flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="mt-0.5 shrink-0">
                      {msg.read ? (
                        <Eye className="h-4 w-4 text-muted-foreground/50" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm leading-snug line-clamp-2">{msg.content}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {timeAgo(msg.createdAt)}
                        </span>
                        {msg.starred && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        )}
                        {!msg.read && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            New
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/user-dashboard/messages">
                <Inbox className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">View Messages</span>
                <span className="text-[11px] text-muted-foreground">
                  {stats.unread > 0 ? `${stats.unread} unread` : "All caught up"}
                </span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/user-dashboard/share-link">
                <Copy className="h-5 w-5 text-emerald-500" />
                <span className="text-sm font-medium">Share Link</span>
                <span className="text-[11px] text-muted-foreground">Get more messages</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto flex-col gap-2 py-4 bg-transparent" asChild>
              <Link href="/user-dashboard/profile">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user?.image || ""} />
                  <AvatarFallback className="text-[10px]">U</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Edit Profile</span>
                <span className="text-[11px] text-muted-foreground">Update your info</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
