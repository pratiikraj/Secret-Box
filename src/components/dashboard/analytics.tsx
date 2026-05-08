"use client"

import { useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Users,
  UserCheck,
  UserX,
  MessageSquare,
  Trash2,
  Search,
  Shield,
  ShieldCheck,
  Clock,
  TrendingUp,
} from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

type AnalyticsUser = {
  _id: string
  name: string
  username: string
  email: string
  image: string
  role: "admin" | "user"
  isVerify: boolean
  isAcceptingMessages: boolean
  messageCount: number
  createdAt: string
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </div>
  )
}

export default function Analytics() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<AnalyticsUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<AnalyticsUser | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/admin/analytics")
      if (!res.ok) {
        toast.error("Failed to fetch analytics")
        return
      }
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message || "Failed to fetch analytics")
        return
      }
      setUsers(data.users || [])
    } catch (err) {
      console.error("Error fetching analytics:", err)
      toast.error("Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchUsers()
  }, [session])

  const handleDeleteUser = async () => {
    if (!userToDelete) return
    try {
      setIsDeleting(true)
      const res = await fetch("/api/admin/analytics", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete._id }),
      })
      if (!res.ok) {
        toast.error("Failed to delete user")
        return
      }
      const data = await res.json()
      if (!data.success) {
        toast.error(data.message)
        return
      }
      toast.success(data.message)
      setUsers((prev) => prev.filter((u) => u._id !== userToDelete._id))
    } catch (err) {
      console.error("Error deleting user:", err)
      toast.error("Failed to delete user")
    } finally {
      setIsDeleting(false)
      setConfirmOpen(false)
      setUserToDelete(null)
    }
  }

  const stats = useMemo(() => {
    const total = users.length
    const verified = users.filter((u) => u.isVerify).length
    const unverified = total - verified
    const totalMessages = users.reduce((sum, u) => sum + u.messageCount, 0)
    const admins = users.filter((u) => u.role === "admin").length

    // Users registered in the last 7 days
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const newThisWeek = users.filter((u) => new Date(u.createdAt) > sevenDaysAgo).length

    return { total, verified, unverified, totalMessages, admins, newThisWeek }
  }, [users])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    )
  }, [users, searchQuery])

  if (isLoading || status === "loading") return <AnalyticsSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl flex items-center gap-2">
          <ShieldCheck className="h-7 w-7 text-primary" />
          Admin Analytics
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Monitor and manage all registered users on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <div className="rounded-lg bg-blue-500/10 p-2">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-500 font-medium">+{stats.newThisWeek}</span>
              <span>this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <UserCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.verified}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.total > 0 ? `${Math.round((stats.verified / stats.total) * 100)}%` : "0%"} verification rate
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unverified</CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <UserX className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.unverified}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stats.unverified > 0 ? "Pending verification" : "All users verified!"}
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            <div className="rounded-lg bg-purple-500/10 p-2">
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMessages}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Across all users
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Registered Users</CardTitle>
              <CardDescription>{filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Role</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-center">Messages</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={u.image?.replace("/upload/", "/upload/w_50,h_50,c_fill/")} alt={u.name} />
                            <AvatarFallback>{u.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{u.name}</p>
                            <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate max-w-[200px]">
                        {u.email}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {u.role === "admin" ? (
                          <Badge className="gap-1 bg-primary/10 text-primary hover:bg-primary/20 border-0">
                            <Shield className="h-3 w-3" />
                            Admin
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            User
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {u.isVerify ? (
                          <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800">
                            <UserCheck className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-medium">{u.messageCount}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role === "admin" ? (
                          <span className="text-xs text-muted-foreground">Protected</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              setUserToDelete(u)
                              setConfirmOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>@{userToDelete?.username}</strong>&apos;s account
              and all {userToDelete?.messageCount || 0} of their messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner />
                  Deleting...
                </>
              ) : (
                "Delete Account"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
