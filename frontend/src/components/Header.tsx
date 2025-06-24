import Link from "next/link";

const Header = () => (
  <header className="flex items-center justify-between bg-blue-200 px-8 py-4 text-gray-900">
    <nav className="flex gap-4">
      <Link
        href="/sign-in"
        className="font-medium text-gray-900 no-underline hover:underline">
        Sign In
      </Link>
      <Link
        href="/sign-up"
        className="font-medium text-gray-900 no-underline hover:underline">
        Sign Up
      </Link>
    </nav>
    <div className="text-2xl font-bold tracking-wide">Chrome Grove</div>
  </header>
);

export default Header;
