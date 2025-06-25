import { useRouter } from "next/router";
import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";

export default function RoleSignupPage() {
  const router = useRouter();
  const { role } = router.query;

  useEffect(() => {
    if (role && typeof role === "string") {
      localStorage.setItem("signup_role", role);
    }
  }, [role]);

  return (
    <div className="mt-10 flex justify-center">
      <SignUp
        path={`/sign-up/${role}`}
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/role-handler"
      />
    </div>
  );
}
