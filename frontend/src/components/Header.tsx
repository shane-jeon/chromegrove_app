import { useUser, UserButton } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

const Header = () => {
  const { isSignedIn } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSignIn = () => {
    setDropdownOpen(false);
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    setDropdownOpen(false);
    router.push("/sign-up/student");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
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
            <div ref={dropdownRef} style={{ position: "relative" }}>
              <button
                className="flex items-center font-semibold text-white transition-colors duration-200"
                onClick={toggleDropdown}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
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
                <span style={{ fontSize: 12, color: "white" }}>
                  {dropdownOpen ? "▲" : "▼"}
                </span>
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-1 rounded border bg-white shadow-lg"
                  style={{
                    minWidth: 120,
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                    overflow: "hidden",
                  }}>
                  <button
                    className="block w-full px-4 py-3 text-left transition-colors duration-150"
                    onClick={handleSignIn}
                    style={{
                      color: "#4a5568",
                      fontWeight: "500",
                      fontSize: "14px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f7fafc";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}>
                    Sign In
                  </button>
                  <button
                    className="block w-full px-4 py-3 text-left transition-colors duration-150"
                    onClick={handleSignUp}
                    style={{
                      color: "white",
                      fontWeight: "500",
                      fontSize: "14px",
                      border: "none",
                      backgroundColor: "#805ad5",
                      cursor: "pointer",
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
