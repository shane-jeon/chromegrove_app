import { SignIn } from "@clerk/nextjs";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [checkingRole, setCheckingRole] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      setCheckingRole(true);
      fetch(
        `http://localhost:5000/api/users/by-clerk-id?clerk_user_id=${user.id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user && data.user.role) {
            router.replace(`/dashboard/${data.user.role}`);
          } else {
            setError("User not found in system. Please complete your profile.");
            router.replace("/complete-profile");
          }
        })
        .catch(() => {
          setError("Failed to fetch user role. Please try again.");
        })
        .finally(() => setCheckingRole(false));
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (checkingRole) {
    return (
      <div className="mt-10 flex justify-center text-lg text-purple-700">
        Checking your role and redirecting...
      </div>
    );
  }

  return (
    <div className="mt-10 flex justify-center">
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up/student"
        afterSignInUrl="/sign-in"
      />
      {error && <div className="mt-4 text-red-500">{error}</div>}
    </div>
  );
}
