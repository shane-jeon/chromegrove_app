import styled from "styled-components";

export const DashboardContainer = styled.div`
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

export const LeftSideContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

export const RightSideContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 0 0 320px;
  min-width: 0;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

export const AssignedClassesBox = styled.div`
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

export const AssignedClassesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

export const AssignedClassesContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;

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

export const BoxTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
`;

export const ClassCard = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const ClassHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

export const ClassInfo = styled.div`
  flex: 1;
`;

export const ClassName = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 4px 0;
`;

export const ClassDetails = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 4px;
`;

export const InstructorBadge = styled.span`
  background: #805ad5;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
`;

export const ExpandButton = styled.button`
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

export const StudentRoster = styled.div`
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
`;

export const StudentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f4;

  &:last-child {
    border-bottom: none;
  }
`;

export const StudentInfo = styled.div`
  flex: 1;
`;

export const StudentName = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
`;

export const StudentEmail = styled.div`
  font-size: 12px;
  color: #718096;
`;

export const AttendanceButtons = styled.div`
  display: flex;
  gap: 8px;
`;

export const AttendanceButton = styled.button<{
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

export const AttendanceStatus = styled.div<{ status: string }>`
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

export const CheckedInStudent = styled(StudentItem)`
  opacity: 0.6;
  color: #718096;

  ${StudentName} {
    color: #718096 !important;
  }

  ${StudentEmail} {
    color: #a0aec0 !important;
  }
`;

export const CheckInUnavailable = styled.div`
  font-size: 12px;
  color: #a0aec0;
  font-style: italic;
  padding: 4px 8px;
`;

export const EmptyState = styled.div`
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
