import { useEffect } from "react";
import { useRouter } from "next/router";
import { useUser } from "@clerk/nextjs";

export default function RoleHandler() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    const role = localStorage.getItem("signup_role");
    if (!user || !role) {
      // Fallback: redirect to home or error
      router.replace("/");
      return;
    }

    const sendToBackend = async () => {
      const clerk_user_id = user.id;
      const email = user.primaryEmailAddress?.emailAddress || "";
      const res = await fetch("http://localhost:5000/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_user_id, email, role }),
      });
      const data = await res.json();
      if (data.success) {
        // Optionally: clear the role from localStorage
        localStorage.removeItem("signup_role");
        // Redirect to dashboard or role-specific page
        router.replace(`/dashboard/${role}`);
      } else {
        // Handle error
        alert("Failed to create user: " + data.error);
        router.replace("/");
      }
    };

    sendToBackend();
  }, [user, isLoaded, router]);

  return <div>Setting up your account...</div>;
}
