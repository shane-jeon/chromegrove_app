import { useEffect, useState } from "react";
import AddClassModal, {
  type AddClassForm,
} from "../../components/AddClassModal";
import AddAnnouncementModal, {
  type AddAnnouncementForm,
} from "../../components/AddAnnouncementModal";
import BulletinBoard, {
  type AnnouncementItem,
} from "../../components/BulletinBoard";
import Schedule from "../../components/Schedule";
import DeleteClassModal from "../../components/DeleteClassModal";
import {
  DashboardContainer,
  MainContent,
  Title,
  FlexRow,
  LeftColumn,
  RightColumn,
  ButtonGroup,
  ActionButton,
  DropdownPanel,
  DropdownHeader,
  InstructorList,
  InstructorItem,
  InstructorName,
  InstructorEmail,
} from "./ManagementDashboardStyles";

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
  const [showAddClassModal, setShowAddClassModal] = useState(false);
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
    recurrence_pattern: "weekly",
  });
  const [loading, setLoading] = useState(false);
  const [announcementLoading, setAnnouncementLoading] = useState(false);
  const [staffList, setStaffList] = useState<Instructor[]>([]);
  const [showInstructors, setShowInstructors] = useState(false);

  // Reset form to initial state
  const resetForm = () => {
    setForm({
      class_name: "",
      description: "",
      start_time: "",
      duration: 60,
      instructor_id: "",
      max_capacity: 20,
      requirements: "",
      recommended_attire: "",
      recurrence_pattern: "weekly",
    });
  };

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

  // Fetch all staff when modal opens
  useEffect(() => {
    if (showAddClassModal) {
      fetch("http://localhost:5000/api/instructors/search?query=")
        .then((res) => res.json())
        .then((data) => setStaffList(data.instructors || []));
    }
  }, [showAddClassModal]);

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
      setShowAddClassModal(false);
      resetForm();
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
    } catch {
      alert("Error canceling class. Please try again.");
    } finally {
      setAnnouncementLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/announcements/${announcementId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh announcements
        const announcementsRes = await fetch(
          "http://localhost:5000/api/announcements?board_types=student,staff,all",
        );
        const announcementsData = await announcementsRes.json();
        setAnnouncements(announcementsData.announcements || []);
      } else {
        alert(`Failed to delete announcement: ${data.error}`);
      }
    } catch {
      alert("Error deleting announcement. Please try again.");
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
    } catch {
      alert("Error canceling class. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DashboardContainer>
      <MainContent>
        <Title>Management Dashboard</Title>
        <FlexRow>
          {/* Left Column: Schedule */}
          <LeftColumn>
            <Schedule
              classes={classes}
              role="management"
              onDeleteClass={handleDeleteClass}
            />
          </LeftColumn>
          {/* Right Column: Management Controls + Bulletin Board */}
          <RightColumn>
            {/* Management Controls */}
            <div style={{ width: "100%" }}>
              <ButtonGroup>
                <ActionButton
                  onClick={() => setShowAddClassModal(true)}
                  type="button">
                  + Add Class
                </ActionButton>
                <ActionButton
                  onClick={() => setShowAnnouncementModal(true)}
                  type="button">
                  📢 Add Announcement
                </ActionButton>
                <ActionButton
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
                </ActionButton>
              </ButtonGroup>
              <AddClassModal
                show={showAddClassModal}
                onClose={() => {
                  setShowAddClassModal(false);
                  resetForm();
                }}
                onSubmit={handleSubmit}
                form={form}
                staffList={staffList}
                loading={loading}
                handleSelectChange={handleSelectChange}
                handleChange={handleChange}
              />
              {showInstructors && (
                <DropdownPanel>
                  <DropdownHeader>All Instructors</DropdownHeader>
                  {staffList.length === 0 ? (
                    <div
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "#666",
                      }}>
                      No instructors found.
                    </div>
                  ) : (
                    <InstructorList>
                      {staffList.map((i) => (
                        <InstructorItem key={i.id}>
                          <InstructorName>{i.name}</InstructorName>
                          <InstructorEmail>{i.email}</InstructorEmail>
                        </InstructorItem>
                      ))}
                    </InstructorList>
                  )}
                </DropdownPanel>
              )}
            </div>
            {/* Bulletin Board */}
            <div style={{ width: "100%" }}>
              <BulletinBoard
                announcements={announcements}
                title="Bulletin Board"
                showStaffIndicators={true}
                showDeleteButtons={true}
                onDeleteAnnouncement={handleDeleteAnnouncement}
              />
            </div>
          </RightColumn>
        </FlexRow>
      </MainContent>
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
    </DashboardContainer>
  );
}
