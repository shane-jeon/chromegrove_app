import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CompleteProfile() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
    }
  }, [user, isLoaded, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const role = localStorage.getItem("signup_role");
    if (!user || !role) {
      alert("Missing user or role information.");
      setLoading(false);
      return;
    }
    const clerk_user_id = user.id;
    const email = user.primaryEmailAddress?.emailAddress || "";
    const res = await fetch("http://localhost:5000/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clerk_user_id, email, role, name }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      localStorage.removeItem("signup_role");
      router.replace(`/dashboard/${role}`);
    } else {
      alert("Failed to create user: " + data.error);
    }
  };

  return (
    <div className="mt-10 flex flex-col items-center">
      <h2 className="mb-4 text-2xl">Complete Your Profile</h2>
      <form onSubmit={handleSubmit} className="flex w-80 flex-col gap-4">
        <label>
          Name
          <input
            className="w-full border p-2"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          className="rounded bg-purple-500 py-2 text-white"
          disabled={loading}>
          {loading ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
