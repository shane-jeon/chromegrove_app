import React, { useState } from "react";
import ClassScheduleList from "./ClassScheduleList";
import styled from "styled-components";

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
  is_instructing?: boolean;
}

type TabType = "studio" | "upcoming" | "past";

interface DashboardScheduleTabsProps {
  userRole: "student" | "staff";
  studioClasses: ClassItem[];
  upcomingClasses: ClassItem[];
  pastClasses: ClassItem[];
  onBookClass: (c: ClassItem) => void;
  onCancelClass: (c: ClassItem) => void;
}

const TabContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f1f3f4;
  border-bottom: 1px solid #e2e8f0;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: ${({ active }) => (active ? "white" : "transparent")};
  color: ${({ active }) => (active ? "#805ad5" : "#666")};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ active }) => (active ? "white" : "#e2e8f0")};
  }

  ${({ active }) =>
    active &&
    `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #805ad5;
    }
  `}
`;

const TabContent = styled.div`
  padding: 24px;
  height: 400px;
  overflow-y: auto;

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

  /* Responsive height adjustments */
  @media (max-width: 768px) {
    height: 350px;
  }

  @media (max-width: 480px) {
    height: 300px;
  }
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

const DashboardScheduleTabs: React.FC<DashboardScheduleTabsProps> = ({
  userRole,
  studioClasses,
  upcomingClasses,
  pastClasses,
  onBookClass,
  onCancelClass,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("studio");

  const getTabContent = () => {
    switch (activeTab) {
      case "studio":
        return studioClasses.length === 0 ? (
          <EmptyState>
            <h3>No upcoming classes</h3>
            <p>Check back later for new class offerings!</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={studioClasses}
            viewType={userRole}
            onBookClass={onBookClass}
            onCancelClass={onCancelClass}
            emptyMessage="No upcoming classes found."
          />
        );
      case "upcoming":
        return upcomingClasses.length === 0 ? (
          <EmptyState>
            <h3>No upcoming classes</h3>
            <p>You haven&apos;t enrolled in any upcoming classes yet.</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={upcomingClasses}
            viewType={userRole}
            onBookClass={onBookClass}
            onCancelClass={onCancelClass}
            emptyMessage="You haven't enrolled in any upcoming classes yet."
          />
        );
      case "past":
        return pastClasses.length === 0 ? (
          <EmptyState>
            <h3>No past classes</h3>
            <p>You haven&apos;t taken any classes yet.</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={pastClasses}
            viewType={userRole}
            onBookClass={onBookClass}
            onCancelClass={onCancelClass}
            emptyMessage="You haven't taken any classes yet."
          />
        );
      default:
        return null;
    }
  };

  return (
    <TabContainer>
      <TabHeader>
        <TabButton
          active={activeTab === "studio"}
          onClick={() => setActiveTab("studio")}>
          Studio Schedule
        </TabButton>
        <TabButton
          active={activeTab === "upcoming"}
          onClick={() => setActiveTab("upcoming")}>
          Upcoming Classes
        </TabButton>
        <TabButton
          active={activeTab === "past"}
          onClick={() => setActiveTab("past")}>
          Past Classes
        </TabButton>
      </TabHeader>
      <TabContent>{getTabContent()}</TabContent>
    </TabContainer>
  );
};

export default DashboardScheduleTabs;
