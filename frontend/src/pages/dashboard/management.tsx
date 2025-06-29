import { useEffect, useState } from "react";
import AddClassDropdownForm, {
  type AddClassForm,
} from "../../components/AddClassDropdownForm";
import AddAnnouncementModal, {
  type AddAnnouncementForm,
} from "../../components/AddAnnouncementModal";
import BulletinBoard, {
  type AnnouncementItem,
} from "../../components/BulletinBoard";
import Schedule from "../../components/Schedule";
import DeleteClassModal from "../../components/DeleteClassModal";

interface StudioClass {
  id?: number;
  class_name: string;
  description?: string;
  start_time: string;
  duration: number;
  instructor_id: string;
  instructor_name?: string;
  max_capacity: number;
  requirements?: string;
  recommended_attire?: string;
  recurrence_pattern?: string;
  instance_id: string;
  enrolled_count: number;
  is_enrolled?: boolean;
  enrollment_id?: number;
  is_instructing?: boolean;
}

interface Instructor {
  id: number;
  name: string;
  email: string;
}

export default function ManagementDashboard() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedClassForDeletion, setSelectedClassForDeletion] =
    useState<StudioClass | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [classes, setClasses] = useState<StudioClass[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
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
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [staffList, setStaffList] = useState<Instructor[]>([]);
  const [showInstructors, setShowInstructors] = useState(false);

  // Fetch all classes on mount
  useEffect(() => {
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []));
  }, []);

  // Fetch announcements on mount
  useEffect(() => {
    fetch(
      "http://localhost:5000/api/announcements?board_types=student,staff,all",
    )
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []));
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
      // Fetch the updated list of class instances instead of just adding the studio class
      const instancesRes = await fetch(
        "http://localhost:5000/api/studio-classes/list",
      );
      const instancesData = await instancesRes.json();
      if (instancesData.success) {
        setClasses(instancesData.classes || []);
      }
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

  const handleAnnouncementSubmit = async (
    announcementForm: AddAnnouncementForm,
  ) => {
    setAnnouncementLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...announcementForm,
          author_id: 1, // TODO: Get actual management user ID
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Refresh announcements
        const announcementsRes = await fetch(
          "http://localhost:5000/api/announcements?board_types=student,staff,all",
        );
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || []);
        setShowAnnouncementModal(false);
      } else {
        throw new Error(data.error || "Failed to create announcement");
      }
    } catch (error) {
      throw error;
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteClass = (classItem: StudioClass) => {
    setSelectedClassForDeletion(classItem);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async (scope: "single" | "future") => {
    if (!selectedClassForDeletion) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/studio-classes/cancel",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            instance_id: selectedClassForDeletion.instance_id,
            scope: scope,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh the classes list
        const instancesRes = await fetch(
          "http://localhost:5000/api/studio-classes/list",
        );
        const instancesData = await instancesRes.json();
        if (instancesData.success) {
          setClasses(instancesData.classes || []);
        }
        setShowDeleteModal(false);
        setSelectedClassForDeletion(null);
      } else {
        alert(`Failed to cancel class: ${data.error}`);
      }
    } catch (error) {
      console.error("Error canceling class:", error);
      alert("Error canceling class. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <h1 className="mb-8 text-center text-3xl font-bold text-purple-700">
          Management Dashboard
        </h1>
        <div
          className="flex flex-row items-stretch justify-center gap-8"
          style={{ minHeight: "500px" }}>
          {/* Left Column: Schedule */}
          <div className="flex flex-1 flex-col items-center justify-center">
            <Schedule
              classes={classes}
              role="management"
              onDeleteClass={handleDeleteClass}
            />
          </div>
          {/* Right Column: Management Controls + Bulletin Board */}
          <div className="flex flex-1 flex-col items-center justify-start gap-6">
            {/* Management Controls */}
            <div className="flex w-full flex-col items-center gap-4">
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

              {/* Add Announcement Button */}
              <button
                className="add-class-btn flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-white shadow transition"
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
                onClick={() => setShowAnnouncementModal(true)}
                type="button">
                📢 Add Announcement
              </button>

              {/* Instructors Button and Dropdown */}
              <button
                className="add-class-btn flex items-center gap-2 rounded-full px-8 py-3 text-lg font-semibold text-white shadow transition"
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

            {/* Bulletin Board */}
            <div className="w-full">
              <BulletinBoard
                announcements={announcements}
                title="Bulletin Board"
                showStaffIndicators={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Add Announcement Modal */}
      <AddAnnouncementModal
        show={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSubmit={handleAnnouncementSubmit}
        loading={announcementLoading}
      />

      {/* Delete Class Modal */}
      <DeleteClassModal
        show={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedClassForDeletion(null);
        }}
        onConfirm={handleConfirmDelete}
        classItem={selectedClassForDeletion}
        loading={deleteLoading}
      />
    </div>
  );
}
