import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/router";

const Header = () => {
  const { isSignedIn } = useUser();
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    router.push("/sign-up/student");
  };

  return (
    <>
      <header className="header flex items-center justify-between bg-white px-8 py-4 shadow-sm">
        <span
          className="brand text-2xl font-bold tracking-wide"
          style={{ letterSpacing: 1 }}>
          Chrome Grove
        </span>
        <div className="flex items-center gap-4">
          {!isSignedIn && (
            <div className="flex items-center gap-3">
              <button
                className="font-semibold text-white transition-colors duration-200"
                onClick={handleSignIn}
                style={{
                  backgroundColor: "#805ad5",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#6b46c1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#805ad5";
                }}>
                Sign In
              </button>
              <button
                className="font-semibold text-white transition-colors duration-200"
                onClick={handleSignUp}
                style={{
                  backgroundColor: "#805ad5",
                  borderRadius: "8px",
                  padding: "12px 20px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#6b46c1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#805ad5";
                }}>
                Sign Up
              </button>
            </div>
          )}
          {isSignedIn && <UserButton afterSignOutUrl="/" />}
        </div>
      </header>
      {/* Gradient bar below header */}
      <div className="header-gradient" />
    </>
  );
};

export default Header;
