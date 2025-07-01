import React from "react";
import { EmptyState as StyledEmptyState } from "../styles/StudentDashboardStyles";

type EmptyStateProps = {
  children: React.ReactNode;
};

const EmptyState: React.FC<EmptyStateProps> = ({ children }) => (
  <StyledEmptyState>{children}</StyledEmptyState>
);

export default EmptyState;
