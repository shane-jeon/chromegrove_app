import Header from "../../components/Header";

export default function StudentDashboard() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <Header view="student" />
      <div className="mx-auto w-full max-w-4xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-purple-700">
          Student Dashboard
        </h1>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-600">
          Welcome to your student dashboard! (Content coming soon)
        </div>
      </div>
    </div>
  );
}
