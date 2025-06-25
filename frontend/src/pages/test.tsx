import { useSendUserDataToBackend } from "@/utils/sendUserDataToBackend";
import { useUser } from "@clerk/nextjs";

export default function TestPage() {
  const sendUserDataToBackend = useSendUserDataToBackend();
  const { user } = useUser();

  return (
    <div style={{ padding: 32 }}>
      <h1>Test Clerk User Data to Backend</h1>
      <button
        onClick={() => sendUserDataToBackend("student")}
        style={{
          padding: "12px 24px",
          background: "#a78bfa",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontSize: 18,
          cursor: "pointer",
        }}>
        Send User Data as Student
      </button>
      <div style={{ marginTop: 24 }}>
        <strong>Current Clerk User:</strong>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}
