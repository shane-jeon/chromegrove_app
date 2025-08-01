import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";

interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  role: string;
  type: string;
  name: string;
}

interface AuthFlowState {
  isLoading: boolean;
  error: string | null;
  currentUser: User | null;
}

export function useAuthFlow() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [state, setState] = useState<AuthFlowState>({
    isLoading: true,
    error: null,
    currentUser: null,
  });

  // Use refs to track loading state and prevent rapid changes
  const loadingStartTime = useRef<number | null>(null);
  const minLoadingTime = 800; // Minimum 800ms loading time
  const isProcessing = useRef(false);

  useEffect(() => {
    const handleAuthFlow = async () => {
      // Prevent multiple simultaneous auth flows
      if (isProcessing.current) {
        return;
      }

      // If Clerk is still loading, keep loading state
      if (!isLoaded) {
        if (!state.isLoading) {
          setState((prev) => ({ ...prev, isLoading: true }));
          loadingStartTime.current = Date.now();
        }
        return;
      }

      // If user is not signed in, stop loading and show sign-in form
      if (!isSignedIn || !user) {
        // Ensure minimum loading time has passed
        if (
          loadingStartTime.current &&
          Date.now() - loadingStartTime.current < minLoadingTime
        ) {
          setTimeout(() => {
            setState((prev) => ({ ...prev, isLoading: false }));
          }, minLoadingTime - (Date.now() - loadingStartTime.current));
        } else {
          setState((prev) => ({ ...prev, isLoading: false }));
        }
        return;
      }

      // User is signed in, check their role in the system
      if (!isProcessing.current) {
        isProcessing.current = true;

        try {
          // Start loading if not already loading
          if (!state.isLoading) {
            setState((prev) => ({ ...prev, isLoading: true, error: null }));
            loadingStartTime.current = Date.now();
          }

          const response = await fetch(
            `http://localhost:5000/api/users/by-clerk-id?clerk_user_id=${user.id}`,
          );
          const data = await response.json();

          // Ensure minimum loading time
          const elapsed = Date.now() - (loadingStartTime.current || Date.now());
          const remainingTime = Math.max(0, minLoadingTime - elapsed);

          setTimeout(() => {
            if (data.success && data.user && data.user.role) {
              // User exists and has a role, redirect to appropriate dashboard
              setState((prev) => ({
                ...prev,
                isLoading: false,
                currentUser: data.user,
              }));
              router.replace(`/dashboard/${data.user.role}`);
            } else {
              // User not found in system, redirect to complete profile
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error:
                  "User not found in system. Please complete your profile.",
              }));
              router.replace("/complete-profile");
            }
            isProcessing.current = false;
          }, remainingTime);
        } catch (err) {
          console.error("Auth flow error:", err);

          // Ensure minimum loading time even for errors
          const elapsed = Date.now() - (loadingStartTime.current || Date.now());
          const remainingTime = Math.max(0, minLoadingTime - elapsed);

          setTimeout(() => {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: "Failed to fetch user role. Please try again.",
            }));
            isProcessing.current = false;
          }, remainingTime);
        }
      }
    };

    handleAuthFlow();
  }, [isLoaded, isSignedIn, user, router, state.isLoading]);

  return {
    ...state,
    user,
    isSignedIn,
    isLoaded,
  };
}
