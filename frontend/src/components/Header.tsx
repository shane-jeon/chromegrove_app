import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/my-classes", label: "My Classes" },
  { href: "/book-classes", label: "Book Classes" },
  { href: "/announcements", label: "Announcements" },
  { href: "/staff-portal", label: "Staff Portal" },
  { href: "/management", label: "Management" },
];

const Header = () => {
  const { isSignedIn } = useUser();

  return (
    <>
      <header className="header">
        <span className="brand">Chrome Grove</span>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        {isSignedIn && (
          <div style={{ marginLeft: "auto" }}>
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        )}
      </header>
      {/* Gradient bar below header */}
      <div className="header-gradient" />
    </>
  );
};

export default Header;
