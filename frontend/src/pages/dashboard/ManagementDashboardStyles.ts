import styled from "styled-components";

export const DashboardContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #f7f6fa;
  padding: 40px 0 0 0;
`;

export const MainContent = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
`;

export const Title = styled.h1`
  margin-bottom: 32px;
  text-align: center;
  font-size: 2.5rem;
  font-weight: bold;
  color: #805ad5;
`;

export const FlexRow = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;
  min-height: 500px;
  justify-content: center;
`;

export const LeftColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const RightColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 24px;
`;

export const ButtonGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  width: 100%;
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 14px 32px;
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  background: #805ad5;
  box-shadow: 0 2px 8px rgba(128, 90, 213, 0.08);
  cursor: pointer;
  transition: background 0.2s;
  &:hover {
    background: #6b46c1;
  }
  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

export const DropdownPanel = styled.div`
  margin-top: 8px;
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(128, 90, 213, 0.08);
  padding: 16px;
`;

export const DropdownHeader = styled.div`
  font-weight: 600;
  color: #805ad5;
  margin-bottom: 8px;
`;

export const InstructorList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

export const InstructorItem = styled.li`
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  &:last-child {
    border-bottom: none;
  }
`;

export const InstructorName = styled.div`
  font-weight: bold;
  color: #6b46c1;
`;

export const InstructorEmail = styled.div`
  font-size: 0.95rem;
  color: #666;
`;
