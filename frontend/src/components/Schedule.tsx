import React, { useState } from "react";
import dynamic from "next/dynamic";
import ClassScheduleList from "./ClassScheduleList";

// Dynamically import the entire calendar component to avoid SSR issues
const CalendarView = dynamic(() => import("./CalendarView"), {
  ssr: false,
  loading: () => <div>Loading calendar...</div>,
});

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
  payment_type?: string;
}

interface ScheduleProps {
  classes: ClassItem[];
  role: "student" | "management";
  onBookClass?: (classItem: ClassItem) => void;
  onCancelClass?: (classItem: ClassItem) => void;
  onDeleteClass?: (classItem: ClassItem) => void;
}

type ViewType = "list" | "calendar";

const Schedule: React.FC<ScheduleProps> = ({
  classes,
  role,
  onBookClass,
  onCancelClass,
  onDeleteClass,
}) => {
  const [viewType, setViewType] = useState<ViewType>("calendar");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Filtering logic for selected day (for list view)
  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
  const classesForSelectedDay = classes.filter((c) =>
    isSameDay(new Date(c.start_time), selectedDate),
  );
  const sortedClasses = [...classes].sort(
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
          <CalendarView
            classes={classes}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            classesForSelectedDay={classesForSelectedDay}
            role={role}
            onBookClass={onBookClass}
            onCancelClass={onCancelClass}
            onDeleteClass={onDeleteClass}
          />
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
