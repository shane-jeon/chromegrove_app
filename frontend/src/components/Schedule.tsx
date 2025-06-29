import React, { useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import ClassScheduleList from "./ClassScheduleList";

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

interface ScheduleProps {
  classes: ClassItem[];
  role: "student" | "management";
  onBookClass?: (classItem: ClassItem) => void;
  onCancelClass?: (classItem: ClassItem) => void;
  onDeleteClass?: (classItem: ClassItem) => void;
}

type ViewType = "list" | "calendar";

function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

const Schedule: React.FC<ScheduleProps> = ({
  classes,
  role,
  onBookClass,
  onCancelClass,
  onDeleteClass,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewType, setViewType] = useState<ViewType>("calendar");

  // Filter classes based on role
  const getFilteredClasses = () => {
    if (role === "student") {
      // For students, show all available classes in list view
      // and enrolled classes in calendar view
      return classes;
    } else {
      // For management, show all classes
      return classes;
    }
  };

  const filteredClasses = getFilteredClasses();

  // Filtering logic for selected day
  const classesForSelectedDay = filteredClasses.filter((c) =>
    isSameDay(new Date(c.start_time), selectedDate),
  );

  // Sort classes by start time for list view
  const sortedClasses = [...filteredClasses].sort(
    (a, b) =>
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
  );

  return (
    <div className="schedule-container">
      {/* Schedule Header */}
      <div className="schedule-header">
        <h2 className="schedule-title">Schedule</h2>
      </div>

      {/* View Toggle Tabs */}
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewType === "list" ? "active" : ""}`}
          onClick={() => setViewType("list")}>
          List View
        </button>
        <button
          className={`toggle-btn ${viewType === "calendar" ? "active" : ""}`}
          onClick={() => setViewType("calendar")}>
          Calendar View
        </button>
      </div>

      {/* Content */}
      <div className="schedule-content">
        {viewType === "calendar" ? (
          <>
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
                  filteredClasses.some((c) =>
                    isSameDay(new Date(c.start_time), date),
                  )
                ) {
                  return <div className="calendar-dot" />;
                }
                return null;
              }}
              showNeighboringMonth={false}
            />
            <div className="calendar-classes">
              <h3 className="calendar-classes-title">
                Classes on {selectedDate.toLocaleDateString()}
              </h3>
              <ClassScheduleList
                classes={classesForSelectedDay}
                viewType={role}
                onBookClass={onBookClass}
                onCancelClass={onCancelClass}
                onDeleteClass={onDeleteClass}
                emptyMessage="No classes found for this date."
              />
            </div>
          </>
        ) : (
          <div className="list-view">
            <h3 className="list-view-title">
              {role === "student"
                ? "All Available Classes"
                : "All Studio Classes"}
            </h3>
            <ClassScheduleList
              classes={sortedClasses}
              viewType={role}
              onBookClass={onBookClass}
              onCancelClass={onCancelClass}
              onDeleteClass={onDeleteClass}
              emptyMessage={
                role === "student"
                  ? "No classes available."
                  : "No classes found."
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Schedule;
