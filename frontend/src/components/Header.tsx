import { useUser, UserButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const Header = () => {
  const { isSignedIn } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    setDropdownOpen(false);
    router.push("/sign-up/student");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
            <div
              ref={dropdownRef}
              style={{ position: "relative" }}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}>
              <button
                className="flex items-center font-semibold text-white transition-colors duration-200 hover:bg-purple-700"
                onClick={handleSignIn}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: "#805ad5",
                  borderRadius: "9999px",
                  padding: "8px 16px",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#6b46c1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#805ad5";
                }}>
                Sign In
                <span style={{ marginLeft: 4, fontSize: 12, color: "white" }}>
                  ▼
                </span>
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 rounded border bg-white shadow-lg"
                  style={{ minWidth: 120 }}>
                  <button
                    className="block w-full px-4 py-2 text-left transition-colors duration-150"
                    onClick={handleSignUp}
                    style={{
                      color: "#805ad5",
                      fontWeight: "600",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f3e8ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "white";
                    }}>
                    Sign Up
                  </button>
                </div>
              )}
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
