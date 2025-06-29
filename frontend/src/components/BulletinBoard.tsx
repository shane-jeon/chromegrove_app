import React from "react";
import styled from "styled-components";

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  date_created: string;
  author_name: string;
  author_role: string;
  board_type?: string;
}

interface BulletinBoardProps {
  announcements: AnnouncementItem[];
  title?: string;
  className?: string;
  showStaffIndicators?: boolean;
}

// Bulletin Board Styles
const BulletinContainer = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  height: fit-content;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 24px;

  @media (max-width: 768px) {
    max-height: none;
    position: static;
  }
`;

const BulletinTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
`;

const BulletinItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BulletinItemTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const BulletinItemBody = styled.p`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 8px 0;
`;

const BulletinItemDate = styled.div`
  font-size: 12px;
  color: #718096;
  font-weight: 500;
`;

const BulletinItemAuthor = styled.div`
  font-size: 12px;
  color: #805ad5;
  font-weight: 600;
  margin-top: 4px;
`;

const StaffBadge = styled.span`
  background: #e53e3e;
  color: white;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
  display: inline-block;
`;

const BulletinItemHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const BulletinItemTitleContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 20px;
`;

const BulletinBoard: React.FC<BulletinBoardProps> = ({
  announcements,
  title = "Bulletin Board",
  className,
  showStaffIndicators = false,
}) => {
  return (
    <BulletinContainer className={className}>
      <BulletinTitle>{title}</BulletinTitle>
      {announcements.length === 0 ? (
        <EmptyState>
          <p>No announcements at this time.</p>
        </EmptyState>
      ) : (
        announcements.map((announcement) => (
          <BulletinItem key={announcement.id}>
            <BulletinItemHeader>
              <BulletinItemTitleContainer>
                <BulletinItemTitle>{announcement.title}</BulletinItemTitle>
                {showStaffIndicators && announcement.board_type === "staff" && (
                  <StaffBadge>🔒 STAFF ONLY</StaffBadge>
                )}
              </BulletinItemTitleContainer>
            </BulletinItemHeader>
            <BulletinItemBody>{announcement.body}</BulletinItemBody>
            <BulletinItemDate>
              {new Date(announcement.date_created).toLocaleDateString()}
            </BulletinItemDate>
            <BulletinItemAuthor>
              By {announcement.author_name} ({announcement.author_role})
            </BulletinItemAuthor>
          </BulletinItem>
        ))
      )}
    </BulletinContainer>
  );
};

export default BulletinBoard;
export type { AnnouncementItem };
