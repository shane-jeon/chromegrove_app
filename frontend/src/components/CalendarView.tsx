import React, { useState } from "react";
import styled from "styled-components";
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
  payment_type?: string;
}

interface CalendarViewProps {
  classes: ClassItem[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  classesForSelectedDay: ClassItem[];
  role: "student" | "management";
  onBookClass?: (classItem: ClassItem) => void;
  onCancelClass?: (classItem: ClassItem) => void;
  onDeleteClass?: (classItem: ClassItem) => void;
}

// Enhanced Styled Components for professional look
const CalendarContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const MonthYear = styled.h2`
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const NavigationButtons = styled.div`
  display: flex;
  gap: 12px;
`;

const NavButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  color: white;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const WeekdaysHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
`;

const Weekday = styled.div`
  padding: 16px 12px;
  text-align: center;
  font-weight: 700;
  font-size: 14px;
  color: #374151;
  border-right: 1px solid #e2e8f0;
  text-transform: uppercase;
  letter-spacing: 0.05em;

  &:last-child {
    border-right: none;
  }
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
`;

const CalendarDay = styled.div<{
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  hasClasses: boolean;
}>`
  min-height: 100px;
  padding: 12px 8px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: ${(props) => {
    if (props.isSelected)
      return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
    if (props.isToday) return "#fef3c7";
    if (!props.isCurrentMonth) return "#f9fafb";
    return "white";
  }};
  color: ${(props) => {
    if (props.isSelected) return "white";
    if (!props.isCurrentMonth) return "#9ca3af";
    return "#1f2937";
  }};

  &:hover {
    background: ${(props) => {
      if (props.isSelected)
        return "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)";
      if (props.isCurrentMonth) return "#f3f4f6";
      return "#f9fafb";
    }};
    transform: ${(props) => (props.isCurrentMonth ? "scale(1.02)" : "none")};
    box-shadow: ${(props) =>
      props.isCurrentMonth ? "0 4px 12px rgba(0, 0, 0, 0.1)" : "none"};
  }

  &:nth-child(7n) {
    border-right: none;
  }
`;

const DayNumber = styled.div`
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
`;

const ClassIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 8px;
`;

const ClassDot = styled.div`
  width: 8px;
  height: 8px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.3);
`;

const TodayIndicator = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: #10b981;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(16, 185, 129, 0.3);
`;

const CalendarView: React.FC<CalendarViewProps> = ({
  classes,
  selectedDate,
  onDateChange,
  classesForSelectedDay,
  role,
  onBookClass,
  onCancelClass,
  onDeleteClass,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Get the first day of the month and the number of days
  const firstDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1,
  );
  const lastDayOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0,
  );
  const daysInMonth = lastDayOfMonth.getDate();

  // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
  // Adjust for Monday start: 0 = Monday, 1 = Tuesday, ..., 6 = Sunday
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;

  // Calculate how many days from previous month to show
  const daysFromPrevMonth = firstDayOfWeek;

  // Get the last day of the previous month
  const lastDayOfPrevMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    0,
  );
  const daysInPrevMonth = lastDayOfPrevMonth.getDate();

  // Generate calendar days
  const calendarDays = [];

  // Add days from previous month
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - 1,
      day,
    );
    calendarDays.push({
      date,
      isCurrentMonth: false,
      dayNumber: day,
    });
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    calendarDays.push({
      date,
      isCurrentMonth: true,
      dayNumber: day,
    });
  }

  // Add days from next month to fill the grid
  const remainingDays = 42 - calendarDays.length; // 6 rows * 7 days = 42
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      day,
    );
    calendarDays.push({
      date,
      isCurrentMonth: false,
      dayNumber: day,
    });
  }

  // Check if a day has classes
  const hasClassesOnDay = (date: Date) => {
    return classes.some((classItem) => {
      const classDate = new Date(classItem.start_time);
      return (
        classDate.getFullYear() === date.getFullYear() &&
        classDate.getMonth() === date.getMonth() &&
        classDate.getDate() === date.getDate()
      );
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isSelected = (date: Date) => {
    return (
      date.getFullYear() === selectedDate.getFullYear() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getDate() === selectedDate.getDate()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === "prev") {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <>
      <CalendarContainer>
        <CalendarHeader>
          <MonthYear>{formatMonthYear(currentMonth)}</MonthYear>
          <NavigationButtons>
            <NavButton onClick={() => navigateMonth("prev")}>
              ← Previous
            </NavButton>
            <NavButton onClick={() => navigateMonth("next")}>Next →</NavButton>
          </NavigationButtons>
        </CalendarHeader>

        <WeekdaysHeader>
          {weekdays.map((day) => (
            <Weekday key={day}>{day}</Weekday>
          ))}
        </WeekdaysHeader>

        <CalendarGrid>
          {calendarDays.map(({ date, isCurrentMonth, dayNumber }) => (
            <CalendarDay
              key={date.toISOString()}
              isCurrentMonth={isCurrentMonth}
              isSelected={isSelected(date)}
              isToday={isToday(date)}
              hasClasses={hasClassesOnDay(date)}
              onClick={() => onDateChange(date)}>
              <DayNumber>{dayNumber}</DayNumber>
              {isToday(date) && <TodayIndicator />}
              {hasClassesOnDay(date) && (
                <ClassIndicator>
                  <ClassDot />
                </ClassIndicator>
              )}
            </CalendarDay>
          ))}
        </CalendarGrid>
      </CalendarContainer>

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
  );
};

export default CalendarView;
