import { useEffect, useState } from "react";

interface StudioClass {
  id: number;
  class_name: string;
  description: string;
  start_time: string;
  duration: number;
  instructor_id: number;
  max_capacity: number;
  requirements: string;
  recommended_attire: string;
  recurrence_pattern: string;
}

export default function ManagementDashboard() {
  const [showModal, setShowModal] = useState(false);
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [form, setForm] = useState({
    class_name: "",
    description: "",
    start_time: "",
    duration: 60,
    instructor_id: "",
    max_capacity: 20,
    requirements: "",
    recommended_attire: "",
    recurrence_pattern: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch all classes on mount
  useEffect(() => {
    fetch("/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/studio-classes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        duration: Number(form.duration),
        max_capacity: Number(form.max_capacity),
        instructor_id: Number(form.instructor_id),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success && data.studio_class) {
      setClasses((prev) => [...prev, data.studio_class]);
      setShowModal(false);
      setForm({
        class_name: "",
        description: "",
        start_time: "",
        duration: 60,
        instructor_id: "",
        max_capacity: 20,
        requirements: "",
        recommended_attire: "",
        recurrence_pattern: "",
      });
    } else {
      alert("Failed to create class: " + (data.error || "Unknown error"));
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 className="mb-6 text-2xl font-bold">Management Dashboard</h1>
      <button
        className="mb-6 rounded bg-purple-500 px-4 py-2 text-white"
        onClick={() => setShowModal(true)}>
        Add Class
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="relative w-96 rounded bg-white p-6 shadow-lg">
            <button
              className="absolute right-2 top-2 text-gray-500"
              onClick={() => setShowModal(false)}>
              &times;
            </button>
            <h2 className="mb-4 text-xl">Add New Class</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                name="class_name"
                value={form.class_name}
                onChange={handleChange}
                placeholder="Class Name"
                className="border p-2"
                required
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Description"
                className="border p-2"
              />
              <input
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                placeholder="Start Time (YYYY-MM-DDTHH:MM)"
                className="border p-2"
                required
                type="datetime-local"
              />
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="Duration (minutes)"
                className="border p-2"
                type="number"
                min={1}
                required
              />
              <input
                name="instructor_id"
                value={form.instructor_id}
                onChange={handleChange}
                placeholder="Instructor User ID"
                className="border p-2"
                required
                type="number"
              />
              <input
                name="max_capacity"
                value={form.max_capacity}
                onChange={handleChange}
                placeholder="Max Capacity"
                className="border p-2"
                type="number"
                min={1}
                required
              />
              <textarea
                name="requirements"
                value={form.requirements}
                onChange={handleChange}
                placeholder="Requirements"
                className="border p-2"
              />
              <input
                name="recommended_attire"
                value={form.recommended_attire}
                onChange={handleChange}
                placeholder="Recommended Attire"
                className="border p-2"
              />
              <input
                name="recurrence_pattern"
                value={form.recurrence_pattern}
                onChange={handleChange}
                placeholder="Recurrence Pattern"
                className="border p-2"
              />
              <button
                type="submit"
                className="mt-2 rounded bg-purple-500 py-2 text-white"
                disabled={loading}>
                {loading ? "Saving..." : "Create Class"}
              </button>
            </form>
          </div>
        </div>
      )}

      <h2 className="mb-2 mt-8 text-xl font-semibold">All Classes</h2>
      <ul className="divide-y">
        {classes.map((c) => (
          <li key={c.id} className="py-2">
            <strong>{c.class_name}</strong> &mdash; {c.start_time} (Instructor
            ID: {c.instructor_id})
          </li>
        ))}
      </ul>
    </div>
  );
}
