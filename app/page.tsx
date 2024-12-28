"use client";

import { Button } from "@/components/ui/button";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { StickyHeader } from "@/components/layout/sticky-header";
import { InitUser, TodosAndNotes } from "./components/signed-in-content";

export default function Home() {
  return (
    <>
      <StickyHeader className="px-4 py-2 bg-[#23325A] text-white">
        <div className="flex justify-between items-center">
          <span className="font-semibold">Todo & Notes App</span>
          <SignInAndSignUpButtons />
        </div>
      </StickyHeader>
      <main className="container max-w-4xl flex flex-col gap-8 p-4 bg-[#F7E6D3] min-h-screen">
        <Authenticated>
          <InitUser>
            <TodosAndNotes />
          </InitUser>
        </Authenticated>
        <Unauthenticated>
          <div className="text-center mt-20 text-[#23325A]">
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
