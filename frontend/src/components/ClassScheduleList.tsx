import React from "react";

interface ClassItem {
  instance_id: string;
  id?: number;
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
  recurrence_pattern?: string;
  is_enrolled?: boolean;
  enrollment_id?: number;
}

interface ClassScheduleListProps {
  classes: ClassItem[];
  viewType: "student" | "management";
  onBookClass?: (classItem: ClassItem) => void;
  onCancelClass?: (classItem: ClassItem) => void;
  emptyMessage?: string;
}

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

  const startTimeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endTimeStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startTimeStr} - ${endTimeStr}`;
}

const ClassScheduleList: React.FC<ClassScheduleListProps> = ({
  classes,
  viewType,
  onBookClass,
  onCancelClass,
  emptyMessage = "No classes found.",
}) => {
  const renderClassCard = (classItem: ClassItem) => {
    const isBooked = classItem.is_enrolled || false;
    const isFull = (classItem.enrolled_count || 0) >= classItem.max_capacity;
    const key =
      classItem.instance_id || classItem.id || `class-${Math.random()}`;

    return (
      <div key={key} className="class-card">
        <div className="class-card-content">
          {/* Date and Time */}
          <div className="date-time-section">
            <div className="date-text">
              {formatClassDate(classItem.start_time)}
            </div>
            <div className="time-text">
              {formatClassTime(classItem.start_time, classItem.duration)}
            </div>
          </div>

          {/* Class Information */}
          <div className="class-info-section">
            <h3 className="class-name">{classItem.class_name}</h3>
            <div className="instructor-name">
              Instructor: {classItem.instructor_name || classItem.instructor_id}
            </div>
            <div className="class-description">
              {classItem.description ||
                "Join us for an exciting class experience!"}
            </div>
            <div className="class-details">
              <div className="detail-item">
                <strong>Requirements:</strong>{" "}
                {classItem.requirements || "No special requirements"}
              </div>
              <div className="detail-item">
                <strong>Attire:</strong>{" "}
                {classItem.recommended_attire || "Comfortable athletic wear"}
              </div>
              <div className="detail-item">
                <strong>Capacity:</strong> {classItem.enrolled_count || 0}/
                {classItem.max_capacity}
              </div>
              {viewType === "management" && (
                <div className="detail-item">
                  <strong>Recurrence:</strong>{" "}
                  {classItem.recurrence_pattern || "One-time"}
                </div>
              )}
            </div>
          </div>

          {/* Action Section */}
          <div className="action-section">
            {viewType === "student" ? (
              // Student view actions
              isBooked ? (
                <div>
                  <div className="enrolled-badge">Already Enrolled</div>
                  {onCancelClass && (
                    <button
                      className="cancel-button"
                      onClick={() => onCancelClass(classItem)}>
                      Cancel
                    </button>
                  )}
                </div>
              ) : isFull ? (
                <button className="book-button disabled" disabled>
                  Full
                </button>
              ) : (
                <button
                  className="book-button"
                  onClick={() => onBookClass?.(classItem)}>
                  Book Class
                </button>
              )
            ) : (
              // Management view - just show a badge
              <div className="management-badge">Management View</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="class-schedule-list">
      {classes.length === 0 ? (
        <div className="empty-state">
          <p>{emptyMessage}</p>
        </div>
      ) : (
        <div className="classes-list">{classes.map(renderClassCard)}</div>
      )}
    </div>
  );
};

export default ClassScheduleList;
