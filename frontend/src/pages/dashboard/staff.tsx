import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import DashboardScheduleTabs from "../../components/DashboardScheduleTabs";
import StaffBookingModal from "../../components/StaffBookingModal";
import BulletinBoard, {
  type AnnouncementItem,
} from "../../components/BulletinBoard";
import LoadingSpinner from "../../components/LoadingSpinner";
import {
  DashboardContainer,
  LeftSideContainer,
  RightSideContainer,
  AssignedClassesBox,
  AssignedClassesHeader,
  AssignedClassesContent,
  BoxTitle,
  ClassCard,
  ClassHeader,
  ClassInfo,
  ClassName,
  ClassDetails,
  InstructorBadge,
  ExpandButton,
  StudentRoster,
  StudentItem,
  StudentInfo,
  StudentName,
  StudentEmail,
  AttendanceButtons,
  AttendanceButton,
  AttendanceStatus,
  CheckedInStudent,
  CheckInUnavailable,
  EmptyState,
} from "../../styles/StaffDashboardStyles";

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

  const [showTeachingAlert, setShowTeachingAlert] = useState(false);

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
        // Comment out debug logs
        // console.error("Failed to fetch assigned classes:", data.error);
        setAssignedClasses([]);
      }
    } catch {
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
        // Comment out debug logs
        // console.error("Failed to fetch announcements:", data.error);
      }
    } catch {
      // Comment out debug logs
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
    } catch {
      // Comment out debug logs
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
    } catch {
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
      setShowTeachingAlert(true);
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
    } catch {
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
    } catch {
      alert("Error cancelling class. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", width: "100%" }}>
        <LoadingSpinner text="Loading staff dashboard..." size="medium" />
      </div>
    );
  }

  return (
    <DashboardContainer>
      <LeftSideContainer>
        {/* Assigned Upcoming Classes Box */}
        <AssignedClassesBox>
          <AssignedClassesHeader>
            <BoxTitle>Your Upcoming Classes</BoxTitle>
            <button onClick={fetchAssignedClasses}>Refresh</button>
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
                          return isCheckedIn ? (
                            <CheckedInStudent key={student.enrollment_id}>
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
                                <AttendanceStatus status={student.status}>
                                  {student.status === "attended"
                                    ? "Checked In"
                                    : "Missed"}
                                </AttendanceStatus>
                              </div>
                            </CheckedInStudent>
                          ) : (
                            <StudentItem key={student.enrollment_id}>
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
                                ) : null}
                              </div>
                            </StudentItem>
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
      {/* Teaching Alert Modal */}
      {showTeachingAlert && (
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
            zIndex: 1000,
          }}>
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              maxWidth: "400px",
              textAlign: "center",
            }}>
            <h2>Cannot Book Class</h2>
            <p>
              You are the instructor for this class and cannot book it as a
              staff member.
            </p>
            <button
              onClick={() => setShowTeachingAlert(false)}
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
