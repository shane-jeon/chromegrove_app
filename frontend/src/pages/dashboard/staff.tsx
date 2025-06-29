import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "@clerk/nextjs";
import DashboardScheduleTabs from "../../components/DashboardScheduleTabs";
import StaffBookingModal from "../../components/StaffBookingModal";
import BulletinBoard, {
  type AnnouncementItem,
} from "../../components/BulletinBoard";
import LoadingSpinner from "../../components/LoadingSpinner";

interface AssignedClass {
  instance_id: string;
  class_id: number;
  class_name: string;
  description: string;
  start_time: string;
  end_time: string;
  duration: number;
  max_capacity: number;
  enrolled_count: number;
  students: Student[];
  is_instructor: boolean;
}

interface Student {
  id: number;
  name: string;
  email: string;
  enrollment_id: number;
  status: string;
  attendance_marked_at?: string;
}

interface ClassItem {
  instance_id: string;
  class_name: string;
  instructor_id: string;
  instructor_name?: string;
  start_time: string;
  duration: number;
  max_capacity: number;
  enrolled_count: number;
  description?: string;
  requirements?: string;
  recommended_attire?: string;
  is_enrolled?: boolean;
  enrollment_id?: number;
  payment_type?: string;
  is_instructing?: boolean;
}

// Main Layout
const DashboardContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px;
  }
`;

// Left Side - Assigned Classes + Schedule (70%)
const LeftSideContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// Right Side - Announcements
const RightSideContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 320px;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// Assigned Classes Box
const AssignedClassesBox = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 500px;

  @media (max-width: 768px) {
    height: 450px;
  }

  @media (max-width: 480px) {
    height: 400px;
  }
`;

const AssignedClassesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const AssignedClassesContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;

    &:hover {
      background: #a0aec0;
    }
  }
`;

const BoxTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
`;

const ClassCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ClassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const ClassInfo = styled.div`
  flex: 1;
`;

const ClassName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
`;

const ClassDetails = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 4px;
`;

const InstructorBadge = styled.span`
  background: #805ad5;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #805ad5;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background-color 0.2s;

  &:hover {
    background: #f7fafc;
  }
`;

const StudentRoster = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

const StudentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;

  &:last-child {
    border-bottom: none;
  }
`;

const StudentInfo = styled.div`
  flex: 1;
`;

const StudentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
`;

const StudentEmail = styled.div`
  font-size: 12px;
  color: #718096;
`;

const AttendanceButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const AttendanceButton = styled.button<{
  variant: "checkin" | "noshow";
  disabled?: boolean;
}>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
  transition: all 0.2s;

  ${({ variant }) =>
    variant === "checkin"
      ? `
        background: #48bb78;
        color: white;
        &:hover:not(:disabled) {
          background: #38a169;
        }
      `
      : `
        background: #f56565;
        color: white;
        &:hover:not(:disabled) {
          background: #e53e3e;
        }
      `}
`;

const AttendanceStatus = styled.div<{ status: string }>`
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  ${({ status }) =>
    status === "attended"
      ? `
        background: #c6f6d5;
        color: #22543d;
      `
      : status === "missed"
      ? `
        background: #fed7d7;
        color: #742a2a;
      `
      : `
        background: #e2e8f0;
        color: #4a5568;
      `}
`;

const CheckedInStudent = styled(StudentItem)`
  opacity: 0.6;
  color: #718096;

  ${StudentName} {
    color: #718096 !important;
  }

  ${StudentEmail} {
    color: #a0aec0 !important;
  }
`;

const CheckInUnavailable = styled.div`
  font-size: 12px;
  color: #a0aec0;
  font-style: italic;
  padding: 4px 8px;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #718096;

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

// Utility functions
function formatClassDate(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatClassTime(startTime: string, duration: number): string {
  const start = new Date(startTime);
  const end = new Date(start.getTime() + duration * 60000);

  return `${start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} - ${end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

function canMarkAttendance(startTime: string): boolean {
  const classStart = new Date(startTime);
  const now = new Date();
  const timeDiff = classStart.getTime() - now.getTime();
  // Allow check-in within 15 minutes before class start
  return timeDiff <= 15 * 60 * 1000 && timeDiff > -60 * 60 * 1000; // Within 15 min before, but not more than 1 hour after
}

function canMarkNoShow(startTime: string): boolean {
  const classStart = new Date(startTime);
  const now = new Date();
  const timeDiff = now.getTime() - classStart.getTime();
  return timeDiff >= 15 * 60 * 1000; // 15 minutes after class start
}

export default function StaffDashboard() {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [assignedClasses, setAssignedClasses] = useState<AssignedClass[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [expandedClasses, setExpandedClasses] = useState<Set<string>>(
    new Set(),
  );
  const [attendanceLoading, setAttendanceLoading] = useState<Set<number>>(
    new Set(),
  );

  // Schedule tabs state
  const [studioClasses, setStudioClasses] = useState<ClassItem[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<ClassItem[]>([]);
  const [pastClasses, setPastClasses] = useState<ClassItem[]>([]);

  // Staff booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [isCancellation, setIsCancellation] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successModalContent, setSuccessModalContent] = useState<{
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      const loadData = async () => {
        await fetchAssignedClasses();
        await fetchAnnouncements();
        await fetchScheduleData();
      };
      loadData();
    }
  }, [user]);

  const fetchAssignedClasses = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/staff/assigned-classes?clerk_user_id=${user?.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setAssignedClasses(data.classes || []);
      } else {
        console.error("Failed to fetch assigned classes:", data.error);
        setAssignedClasses([]);
      }
    } catch (error) {
      console.error("Error fetching assigned classes:", error);
      setAssignedClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch(
        "http://localhost:5000/api/announcements?board_types=student,staff,all",
      );
      const data = await response.json();

      if (data.success) {
        setAnnouncements(data.announcements);
      } else {
        console.error("Failed to fetch announcements:", data.error);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchScheduleData = async () => {
    try {
      // Fetch all studio classes
      const response = await fetch(
        "http://localhost:5000/api/studio-classes/list",
      );
      const data = await response.json();

      if (data.success) {
        const allClasses: ClassItem[] = data.classes.map(
          (cls: {
            instance_id: string;
            class_name: string;
            instructor_id: string;
            instructor_name?: string;
            start_time: string;
            duration: number;
            max_capacity: number;
            enrolled_count: number;
            description?: string;
            requirements?: string;
            recommended_attire?: string;
            is_enrolled?: boolean;
            enrollment_id?: number;
          }) => ({
            instance_id: cls.instance_id,
            class_name: cls.class_name,
            instructor_id: cls.instructor_id,
            instructor_name: cls.instructor_name,
            start_time: cls.start_time,
            duration: cls.duration,
            max_capacity: cls.max_capacity,
            enrolled_count: cls.enrolled_count,
            description: cls.description,
            requirements: cls.requirements,
            recommended_attire: cls.recommended_attire,
            is_enrolled: cls.is_enrolled || false,
            enrollment_id: cls.enrollment_id,
          }),
        );

        // Fetch staff's booked classes (enrolled as student)
        const bookedResponse = await fetch(
          `http://localhost:5000/api/staff/booked-classes?clerk_user_id=${user?.id}`,
        );
        const bookedData = await bookedResponse.json();

        let bookedClasses: ClassItem[] = [];
        if (bookedData.success) {
          bookedClasses = bookedData.classes.map(
            (cls: {
              instance_id: string;
              class_name: string;
              instructor_id: string;
              instructor_name?: string;
              start_time: string;
              duration: number;
              max_capacity: number;
              enrolled_count: number;
              description?: string;
              requirements?: string;
              recommended_attire?: string;
              enrollment_id?: number;
            }) => ({
              instance_id: cls.instance_id,
              class_name: cls.class_name,
              instructor_id: cls.instructor_id,
              instructor_name: cls.instructor_name,
              start_time: cls.start_time,
              duration: cls.duration,
              max_capacity: cls.max_capacity,
              enrolled_count: cls.enrolled_count,
              description: cls.description,
              requirements: cls.requirements,
              recommended_attire: cls.recommended_attire,
              is_enrolled: true,
              enrollment_id: cls.enrollment_id,
            }),
          );
        }

        // Fetch assigned classes to check which ones staff is instructing
        const assignedResponse = await fetch(
          `http://localhost:5000/api/staff/assigned-classes?clerk_user_id=${user?.id}`,
        );
        const assignedData = await assignedResponse.json();

        // Mark booked classes as enrolled in the main class list
        const bookedInstanceIds = new Set(
          bookedClasses.map((c) => c.instance_id),
        );
        allClasses.forEach((cls) => {
          if (bookedInstanceIds.has(cls.instance_id)) {
            cls.is_enrolled = true;
            const bookedClass = bookedClasses.find(
              (c) => c.instance_id === cls.instance_id,
            );
            if (bookedClass) {
              cls.enrollment_id = bookedClass.enrollment_id;
            }
          }
        });

        // Mark classes where staff is instructing
        if (assignedData.success) {
          const instructingClasses = assignedData.classes.filter(
            (cls: { is_instructor: boolean }) => cls.is_instructor,
          );
          const instructingInstanceIds = new Set(
            instructingClasses.map(
              (c: { instance_id: string }) => c.instance_id,
            ),
          );

          allClasses.forEach((cls) => {
            if (instructingInstanceIds.has(cls.instance_id)) {
              cls.is_instructing = true;
            }
          });
        }

        // Separate classes by time
        const now = new Date();
        const upcoming: ClassItem[] = [];
        const past: ClassItem[] = [];
        const studio: ClassItem[] = [];

        allClasses.forEach((cls) => {
          const classTime = new Date(cls.start_time);
          if (cls.is_enrolled) {
            if (classTime > now) {
              upcoming.push(cls);
            } else {
              past.push(cls);
            }
          } else {
            studio.push(cls);
          }
        });

        setStudioClasses(studio);
        setUpcomingClasses(upcoming);
        setPastClasses(past);
      }
    } catch (error) {
      console.error("Error fetching schedule data:", error);
    }
  };

  const toggleClassExpansion = (instanceId: string) => {
    const newExpanded = new Set(expandedClasses);
    if (newExpanded.has(instanceId)) {
      newExpanded.delete(instanceId);
    } else {
      newExpanded.add(instanceId);
    }
    setExpandedClasses(newExpanded);
  };

  const markAttendance = async (
    enrollmentId: number,
    status: "attended" | "missed",
  ) => {
    setAttendanceLoading((prev) => new Set(prev).add(enrollmentId));

    try {
      const response = await fetch(
        "http://localhost:5000/api/attendance/mark",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enrollment_id: enrollmentId,
            status: status,
            clerk_user_id: user?.id,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Update only the specific student's status in the local state
        setAssignedClasses((prevClasses) =>
          prevClasses.map((classItem) => ({
            ...classItem,
            students: classItem.students.map((student) =>
              student.enrollment_id === enrollmentId
                ? { ...student, status: status }
                : student,
            ),
          })),
        );
      } else {
        alert(`Failed to mark attendance: ${data.error}`);
      }
    } catch (error) {
      console.error("Error marking attendance:", error);
      alert("Error marking attendance. Please try again.");
    } finally {
      setAttendanceLoading((prev) => {
        const newSet = new Set(prev);
        newSet.delete(enrollmentId);
        return newSet;
      });
    }
  };

  const handleBookClass = (classItem: ClassItem) => {
    // Don't allow booking if staff is instructing this class
    if (classItem.is_instructing) {
      alert("You cannot book a class you are instructing.");
      return;
    }

    setSelectedClass(classItem);
    setIsCancellation(false);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = async () => {
    if (!selectedClass || !user) return;

    setBookingLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/studio-classes/book-staff",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            instance_id: selectedClass.instance_id,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh all data
        await fetchAssignedClasses();
        await fetchScheduleData();
        setShowBookingModal(false);
        setSelectedClass(null);

        // Show staff success modal
        setShowSuccessModal(true);
        setSuccessModalContent({
          title: "Booking confirmed",
          message: "This class has been booked using your staff membership.",
          subMessage:
            "Attendance will be logged differently for staff bookings.",
        });

        // Auto-hide after 3 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessModalContent(null);
        }, 3000);
      } else {
        alert(`Failed to book class: ${data.error}`);
      }
    } catch (error) {
      console.error("Error booking class:", error);
      alert("Error booking class. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelClass = async (classItem: ClassItem) => {
    if (!user) return;

    if (!classItem.enrollment_id) {
      alert("Cannot cancel class: enrollment information not found.");
      return;
    }

    setSelectedClass(classItem);
    setIsCancellation(true);
    setShowBookingModal(true);
  };

  const handleConfirmCancellation = async () => {
    if (!selectedClass || !user) return;

    setBookingLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/staff/cancel-booking",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            instance_id: selectedClass.instance_id,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Refresh all data
        await fetchAssignedClasses();
        await fetchScheduleData();
        setShowBookingModal(false);
        setSelectedClass(null);
        setShowSuccessModal(true);
        setSuccessModalContent({
          title: "Class Canceled",
          message: "This booking has been removed from your schedule.",
          subMessage: "Staff bookings are free and can be cancelled anytime.",
        });
      } else {
        alert(`Failed to cancel class: ${data.error}`);
      }
    } catch (error) {
      console.error("Error cancelling class:", error);
      alert("Error cancelling class. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <div style={{ textAlign: "center", width: "100%" }}>
          <LoadingSpinner text="Loading staff dashboard..." size="medium" />
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <LeftSideContainer>
        {/* Assigned Upcoming Classes Box */}
        <AssignedClassesBox>
          <AssignedClassesHeader>
            <BoxTitle>Your Upcoming Classes</BoxTitle>
            <button
              onClick={fetchAssignedClasses}
              style={{
                padding: "8px 16px",
                backgroundColor: "#805ad5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
              }}>
              Refresh
            </button>
          </AssignedClassesHeader>
          <AssignedClassesContent>
            {assignedClasses.length === 0 ? (
              <EmptyState>
                <h3>No upcoming classes</h3>
                <p>You don&apos;t have any upcoming classes assigned.</p>
              </EmptyState>
            ) : (
              assignedClasses.map((classItem) => (
                <ClassCard key={classItem.instance_id}>
                  <ClassHeader>
                    <ClassInfo>
                      <ClassName>
                        {classItem.class_name}
                        {classItem.is_instructor && (
                          <InstructorBadge>Instructor</InstructorBadge>
                        )}
                      </ClassName>
                      <ClassDetails>
                        {formatClassDate(classItem.start_time)} •{" "}
                        {formatClassTime(
                          classItem.start_time,
                          classItem.duration,
                        )}
                      </ClassDetails>
                      <ClassDetails>
                        {classItem.enrolled_count} enrolled •{" "}
                        {classItem.max_capacity} max capacity
                      </ClassDetails>
                    </ClassInfo>
                    <ExpandButton
                      onClick={() =>
                        toggleClassExpansion(classItem.instance_id)
                      }>
                      {expandedClasses.has(classItem.instance_id) ? "▼" : "▶"}{" "}
                      Roster
                    </ExpandButton>
                  </ClassHeader>

                  {expandedClasses.has(classItem.instance_id) && (
                    <StudentRoster>
                      {classItem.students.length === 0 ? (
                        <p style={{ color: "#718096", fontStyle: "italic" }}>
                          No students enrolled
                        </p>
                      ) : (
                        classItem.students.map((student) => {
                          const canCheckIn = canMarkAttendance(
                            classItem.start_time,
                          );
                          const canMarkNoShowNow = canMarkNoShow(
                            classItem.start_time,
                          );
                          const isCheckedIn =
                            student.status === "attended" ||
                            student.status === "missed";

                          const StudentComponent = isCheckedIn
                            ? CheckedInStudent
                            : StudentItem;

                          return (
                            <StudentComponent key={student.enrollment_id}>
                              <StudentInfo>
                                <StudentName>{student.name}</StudentName>
                                <StudentEmail>{student.email}</StudentEmail>
                              </StudentInfo>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}>
                                {student.status === "enrolled" ? (
                                  canCheckIn ? (
                                    <AttendanceButtons>
                                      <AttendanceButton
                                        variant="checkin"
                                        disabled={attendanceLoading.has(
                                          student.enrollment_id,
                                        )}
                                        onClick={() =>
                                          markAttendance(
                                            student.enrollment_id,
                                            "attended",
                                          )
                                        }>
                                        {attendanceLoading.has(
                                          student.enrollment_id,
                                        )
                                          ? "..."
                                          : "Check In"}
                                      </AttendanceButton>
                                      <AttendanceButton
                                        variant="noshow"
                                        disabled={
                                          attendanceLoading.has(
                                            student.enrollment_id,
                                          ) || !canMarkNoShowNow
                                        }
                                        onClick={() =>
                                          markAttendance(
                                            student.enrollment_id,
                                            "missed",
                                          )
                                        }>
                                        {attendanceLoading.has(
                                          student.enrollment_id,
                                        )
                                          ? "..."
                                          : "No Show"}
                                      </AttendanceButton>
                                    </AttendanceButtons>
                                  ) : (
                                    <CheckInUnavailable>
                                      Check-in not yet available
                                    </CheckInUnavailable>
                                  )
                                ) : (
                                  <AttendanceStatus status={student.status}>
                                    {student.status === "attended"
                                      ? "Checked In"
                                      : "Missed"}
                                  </AttendanceStatus>
                                )}
                              </div>
                            </StudentComponent>
                          );
                        })
                      )}
                    </StudentRoster>
                  )}
                </ClassCard>
              ))
            )}
          </AssignedClassesContent>
        </AssignedClassesBox>

        {/* Class Schedule Box */}
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}>
          <BoxTitle>Class Schedule</BoxTitle>
          <DashboardScheduleTabs
            userRole="staff"
            studioClasses={studioClasses}
            upcomingClasses={upcomingClasses}
            pastClasses={pastClasses}
            onBookClass={handleBookClass}
            onCancelClass={handleCancelClass}
          />
        </div>
      </LeftSideContainer>

      <RightSideContainer>
        {/* Studio Announcements Box */}
        <BulletinBoard
          announcements={announcements}
          title="Studio Announcements"
          showStaffIndicators={true}
        />
      </RightSideContainer>

      {/* Staff Booking Modal */}
      <StaffBookingModal
        show={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          setSelectedClass(null);
        }}
        onConfirm={
          isCancellation ? handleConfirmCancellation : handleConfirmBooking
        }
        classItem={selectedClass}
        loading={bookingLoading}
        isCancellation={isCancellation}
      />

      {/* Success Modal */}
      {showSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
            }}>
            <h2>{successModalContent?.title}</h2>
            <p>{successModalContent?.message}</p>
            {successModalContent?.subMessage && (
              <p>{successModalContent.subMessage}</p>
            )}
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setSuccessModalContent(null);
              }}
              style={{
                padding: "8px 16px",
                backgroundColor: "#805ad5",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: "pointer",
                fontWeight: "500",
              }}>
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardContainer>
  );
}
