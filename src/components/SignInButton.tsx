'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignInButton() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    try {
      setError(null);
      const result = await signIn("microsoft", { 
        callbackUrl: window.location.origin,
        redirect: false 
      });
      
      if (result?.error) {
        setError(result.error);
      } else if (result?.url) {
        router.push(result.url);
      }
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error("Sign in error:", err);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center gap-4">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
        <span>Loading...</span>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <span>{session.user?.name}</span>
        <button
          onClick={() => signOut({ callbackUrl: window.location.origin })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleSignIn}
        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#fb8110] hover:bg-[#e6740e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#fb8110] transition-all duration-200"
      >
        Sign in with Microsoft
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
} 