"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Signin from "@/components/auth/signin"
import Signup from "@/components/auth/signup"

export default function SigninSignupPage() {
  return (
    <Tabs defaultValue="signin" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="signin" className="cursor-pointer">Sign In</TabsTrigger>
        <TabsTrigger value="signup" className="cursor-pointer">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent value="signin">
        <Signin />
      </TabsContent>
      <TabsContent value="signup">
        <Signup />
      </TabsContent>
    </Tabs>
  )
}
