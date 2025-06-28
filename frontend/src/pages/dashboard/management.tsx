import { useEffect, useState } from "react";
import AddClassDropdownForm, {
  type AddClassForm,
} from "../../components/AddClassDropdownForm";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

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
  instance_id?: string;
  enrolled_count?: number;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
}

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function ManagementDashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [form, setForm] = useState<AddClassForm>({
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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showInstructors, setShowInstructors] = useState(false);

  // Fetch all classes on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []));
  }, []);

  // Fetch all staff when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      fetch("http://localhost:5000/api/instructors/search?query=")
        .then((res) => res.json())
        .then((data) => setStaffList(data.instructors || []));
    }
  }, [showDropdown]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Ensure start_time is always a full ISO string (with seconds)
    let startTime = form.start_time;
    if (startTime && startTime.length === 16) {
      // 'YYYY-MM-DDTHH:MM'
      startTime = startTime + ":00";
    }
    // Optionally, convert to UTC if needed:
    // const isoString = new Date(startTime).toISOString();
    const res = await fetch("http://localhost:5000/api/studio-classes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        start_time: startTime,
        duration: Number(form.duration),
        max_capacity: Number(form.max_capacity),
        instructor_id: Number(form.instructor_id),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.success && data.studio_class) {
      setClasses((prev) => [...prev, data.studio_class]);
      setShowDropdown(false);
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

  // Filtering logic for selected day
  const classesForSelectedDay = classes.filter((c) =>
    isSameDay(new Date(c.start_time), selectedDate),
  );

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-purple-700">
          Management Dashboard
        </h1>
        <div
          className="flex flex-row items-stretch justify-center gap-8"
          style={{ minHeight: "500px" }}>
          {/* Left Column: Schedule, vertically centered */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="schedule-box mx-auto rounded-lg border border-gray-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-purple-700">
                  Schedule
                </h2>
              </div>
              <Calendar
                value={selectedDate}
                onChange={(date) => setSelectedDate(date as Date)}
                tileClassName={({ date, view }) =>
                  view === "month" && isSameDay(date, selectedDate)
                    ? "calendar-selected-day"
                    : undefined
                }
                tileContent={({ date, view }) => {
                  if (
                    view === "month" &&
                    classes.some((c) => isSameDay(new Date(c.start_time), date))
                  ) {
                    return <div className="calendar-dot" />;
                  }
                  return null;
                }}
                showNeighboringMonth={false}
              />
              <div className="mt-4">
                <h3 className="text-md mb-2 font-semibold text-purple-700">
                  Classes on {selectedDate.toLocaleDateString()}
                </h3>
                {classesForSelectedDay.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No classes found.
                  </div>
                ) : (
                  <div className="divide-y">
                    {classesForSelectedDay.map((c) => (
                      <div
                        key={c.instance_id || c.id}
                        className="rounded px-2 py-3 transition hover:bg-purple-50">
                        <div className="font-bold text-purple-800">
                          {c.class_name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {c.description}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Start:{" "}
                          {new Date(c.start_time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          | Duration: {c.duration} min
                        </div>
                        <div className="text-xs text-gray-500">
                          Roster: {"enrolled_count" in c ? c.enrolled_count : 0}
                          /{c.max_capacity}
                        </div>
                        <div className="text-xs text-gray-500">
                          Max: {c.max_capacity} | Recurrence:{" "}
                          {c.recurrence_pattern || "None"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Right Column: Add Class, button and form centered horizontally, start at top */}
          <div className="flex flex-1 flex-col items-center justify-start">
            <div className="flex w-full flex-col items-center">
              <button
                className={`add-class-btn mb-2 flex items-center rounded-full px-8 py-3 text-lg font-semibold text-white shadow transition gap-2${
                  showDropdown ? " open" : ""
                }`}
                style={{
                  background: "#805ad5",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#6b46c1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#805ad5";
                }}
                onClick={() => setShowDropdown((prev) => !prev)}
                type="button">
                + Add Class <span className="arrow">▼</span>
              </button>
              <AddClassDropdownForm
                show={showDropdown}
                onClose={() => setShowDropdown(false)}
                onSubmit={handleSubmit}
                form={form}
                staffList={staffList}
                loading={loading}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
              {/* Instructors Button and Dropdown */}
              <button
                className="add-class-btn mt-4 flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-white shadow transition"
                style={{
                  background: "#805ad5",
                  border: "none",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#6b46c1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#805ad5";
                }}
                onClick={async () => {
                  if (!staffList.length) {
                    // Fetch staff if not already loaded
                    const res = await fetch(
                      "http://localhost:5000/api/instructors/search?query=",
                    );
                    const data = await res.json();
                    setStaffList(data.instructors || []);
                  }
                  setShowInstructors((prev) => !prev);
                }}
                type="button">
                Instructors <span className="arrow">▼</span>
              </button>
              {showInstructors && (
                <div className="dropdown-form-panel dropdown-form-animate mt-2 w-full max-w-md">
                  <div className="dropdown-form-header-bar mb-2 font-semibold text-purple-700">
                    All Instructors
                  </div>
                  {staffList.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No instructors found.
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {staffList.map((i) => (
                        <li key={i.id} className="p-3">
                          <div className="font-bold text-purple-800">
                            {i.name}
                          </div>
                          <div className="text-sm text-gray-600">{i.email}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
