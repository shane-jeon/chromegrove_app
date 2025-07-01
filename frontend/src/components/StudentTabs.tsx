import React from "react";
import {
  TabContainer,
  TabHeader,
  TabButton,
  TabContent,
} from "../styles/StudentDashboardStyles";

type TabType = string;

type StudentTabsProps = {
  tabs: { label: string; value: TabType }[];
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  children: React.ReactNode;
};

const StudentTabs: React.FC<StudentTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  children,
}) => (
  <TabContainer>
    <TabHeader>
      {tabs.map((tab) => (
        <TabButton
          key={tab.value}
          active={activeTab === tab.value}
          onClick={() => onTabChange(tab.value)}>
          {tab.label}
        </TabButton>
      ))}
    </TabHeader>
    <TabContent>{children}</TabContent>
  </TabContainer>
);

export default StudentTabs;
