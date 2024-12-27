"use client";

import { Button } from "@/components/ui/button";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { StickyHeader } from "@/components/layout/sticky-header";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <>
      <StickyHeader className="px-4 py-2">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Todo & Notes App</span>
          <SignInAndSignUpButtons />
        </div>
      </StickyHeader>
      <main className="container max-w-4xl flex flex-col gap-8 p-4">
        <Authenticated>
          <SignedInContent />
        </Authenticated>
        <Unauthenticated>
          <div className="text-center mt-20">
            <h2 className="text-2xl font-bold mb-4">Welcome to Todo & Notes</h2>
            <p className="mb-4">
              Please sign in to manage your todos and notes.
            </p>
          </div>
        </Unauthenticated>
      </main>
    </>
  );
}

function SignInAndSignUpButtons() {
  return (
    <div className="flex gap-4">
      <Authenticated>
        <UserButton afterSignOutUrl="#" />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal">
          <Button variant="ghost">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button>Sign up</Button>
        </SignUpButton>
      </Unauthenticated>
    </div>
  );
}

function SignedInContent() {
  return (
    <div className="space-y-8">
      {/* Todos Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Todos</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((todo) => (
            <div key={todo} className="flex items-center gap-3">
              <Checkbox />
              <div className="flex-1">
                <span>My first todo</span>
                <span className="ml-2 text-sm text-gray-500">due tomorrow</span>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Tag 1</Badge>
                <Badge variant="secondary">Tag 2</Badge>
              </div>
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <Input placeholder="Add new todo..." className="flex-1" />
            <Button>Add</Button>
          </div>
        </div>
      </section>

      {/* Notes Section */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Notes</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <Input placeholder="Note title" className="mb-2" />
            <Textarea placeholder="Note content" className="min-h-[100px]" />
          </div>
          {[1, 2, 3].map((note) => (
            <div key={note} className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Note title</h3>
              <p className="text-gray-600">Note body text</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
