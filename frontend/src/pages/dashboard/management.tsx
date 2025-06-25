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

interface Instructor {
  id: number;
  name: string;
  email: string;
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
  const [staffList, setStaffList] = useState<Instructor[]>([]);

  // Fetch all classes on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []));
  }, []);

  // Fetch all staff when modal opens
  useEffect(() => {
    if (showModal) {
      fetch("http://localhost:5000/api/instructors/search?query=")
        .then((res) => res.json())
        .then((data) => setStaffList(data.instructors || []));
    }
  }, [showModal]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, instructor_id: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("http://localhost:5000/api/studio-classes/create", {
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
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-3xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-purple-700">
          Management Dashboard
        </h1>
        <div className="mb-6 flex justify-end">
          <button
            className="rounded-full bg-purple-500 px-6 py-2 text-lg font-semibold text-white shadow transition hover:bg-purple-600"
            style={{ background: "#a78bfa" }}
            onClick={() => setShowModal(true)}>
            + Add Class
          </button>
        </div>

        {/* Modal Overlay */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
              className="absolute inset-0 z-40 bg-black bg-opacity-50"
              onClick={() => setShowModal(false)}
            />
            {/* Modal Window */}
            <div className="animate-fade-in relative z-50 flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 shadow-2xl">
              <button
                className="absolute right-3 top-3 text-2xl font-bold text-gray-400 hover:text-gray-700"
                onClick={() => setShowModal(false)}
                aria-label="Close">
                &times;
              </button>
              <h2 className="mb-4 text-2xl font-semibold text-purple-700">
                Add New Class
              </h2>
              <form
                onSubmit={handleSubmit}
                className="flex w-full flex-col gap-4">
                <input
                  name="class_name"
                  value={form.class_name}
                  onChange={handleChange}
                  placeholder="Class Name"
                  className="rounded border p-2"
                  required
                />
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Description"
                  className="rounded border p-2"
                />
                <input
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  placeholder="Start Time (YYYY-MM-DDTHH:MM)"
                  className="rounded border p-2"
                  required
                  type="datetime-local"
                />
                <input
                  name="duration"
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="Duration (minutes)"
                  className="rounded border p-2"
                  type="number"
                  min={1}
                  required
                />
                {/* Instructor Dropdown */}
                <div>
                  <label className="mb-1 block font-medium">Instructor</label>
                  <select
                    name="instructor_id"
                    value={form.instructor_id}
                    onChange={handleSelectChange}
                    className="w-full rounded border p-2"
                    required>
                    <option value="">Select Instructor</option>
                    {staffList.map((i: Instructor) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.email})
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  name="max_capacity"
                  value={form.max_capacity}
                  onChange={handleChange}
                  placeholder="Max Capacity"
                  className="rounded border p-2"
                  type="number"
                  min={1}
                  required
                />
                <textarea
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  placeholder="Requirements"
                  className="rounded border p-2"
                />
                <input
                  name="recommended_attire"
                  value={form.recommended_attire}
                  onChange={handleChange}
                  placeholder="Recommended Attire"
                  className="rounded border p-2"
                />
                <input
                  name="recurrence_pattern"
                  value={form.recurrence_pattern}
                  onChange={handleChange}
                  placeholder="Recurrence Pattern"
                  className="rounded border p-2"
                />
                <button
                  type="submit"
                  className="mt-2 rounded-full bg-purple-500 py-2 text-lg font-semibold text-white transition hover:bg-purple-600"
                  style={{ background: "#a78bfa" }}
                  disabled={loading}>
                  {loading ? "Saving..." : "Create Class"}
                </button>
              </form>
            </div>
          </div>
        )}

        <h2 className="mb-4 mt-10 text-xl font-semibold text-purple-700">
          All Classes
        </h2>
        <div className="divide-y rounded-lg bg-white shadow">
          {classes.length === 0 && (
            <div className="p-6 text-center text-gray-500">No classes yet.</div>
          )}
          {classes.map((c) => (
            <div
              key={c.id}
              className="flex flex-col gap-2 p-4 transition hover:bg-purple-50 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-bold text-purple-800">
                  {c.class_name}
                </div>
                <div className="text-sm text-gray-600">{c.description}</div>
                <div className="mt-1 text-xs text-gray-500">
                  Start: {c.start_time} | Duration: {c.duration} min |
                  Instructor ID: {c.instructor_id}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-700 md:mt-0">
                Max: {c.max_capacity} | Recurrence:{" "}
                {c.recurrence_pattern || "None"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
