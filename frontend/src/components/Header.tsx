import { useUser, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import { useRouter } from "next/router";

const Header = () => {
  const { isSignedIn } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const handleSignUp = () => {
    setDropdownOpen(false);
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
            <div style={{ position: "relative" }}>
              <button
                className="flex items-center rounded bg-purple-500 px-4 py-2 font-semibold text-white"
                onClick={handleSignIn}
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() =>
                  setTimeout(() => setDropdownOpen(false), 200)
                }
                style={{ display: "flex", alignItems: "center", gap: 4 }}>
                Sign In
                <span style={{ marginLeft: 4, fontSize: 12 }}>▼</span>
              </button>
              {dropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 rounded border bg-white shadow-lg"
                  onMouseEnter={() => setDropdownOpen(true)}
                  onMouseLeave={() => setDropdownOpen(false)}
                  style={{ minWidth: 120 }}>
                  <button
                    className="block w-full px-4 py-2 text-left hover:bg-purple-100"
                    onClick={handleSignUp}>
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
