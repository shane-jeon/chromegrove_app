import { useUser } from "@clerk/nextjs";

export function useSendUserDataToBackend() {
  const { user } = useUser();

  const sendUserDataToBackend = async (role: string) => {
    if (!user) {
      console.error("No Clerk user found.");
      return;
    }
    const clerk_user_id = user.id;
    const email = user.primaryEmailAddress?.emailAddress || "";

    console.log("Sending to backend:", { clerk_user_id, email, role });

    try {
      const res = await fetch("http://localhost:5000/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_user_id, email, role }),
      });
      const data = await res.json();
      console.log("Backend response:", data);
    } catch (err) {
      console.error("Error sending user data to backend:", err);
    }
  };

  return sendUserDataToBackend;
}
