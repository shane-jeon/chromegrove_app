import React, { useState } from "react";
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
  showDeleteButtons?: boolean;
  onDeleteAnnouncement?: (announcementId: number) => void;
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
  position: relative;

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

const DeleteButton = styled.button`
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background: #c53030;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  color: #718096;
  padding: 20px;
`;

// Delete Confirmation Modal Styles
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  flex-shrink: 0;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background: #e2e8f0;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  color: #4a5568;
  transition: background-color 0.2s;

  &:hover {
    background: #cbd5e0;
    color: #2d3748;
  }
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const ModalSubtitle = styled.p`
  font-size: 14px;
  color: #718096;
  margin: 0;
`;

const AnnouncementInfo = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const AnnouncementTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const AnnouncementDetails = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 4px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-shrink: 0;
`;

const Button = styled.button<{ variant?: "primary" | "secondary" }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ variant }) =>
    variant === "primary"
      ? `
    background: #e53e3e;
    color: white;
    
    &:hover:not(:disabled) {
      background: #c53030;
    }
    
    &:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
  `
      : `
    background: #e2e8f0;
    color: #4a5568;
    
    &:hover:not(:disabled) {
      background: #cbd5e0;
    }
    
    &:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
  `}
`;

const BulletinBoard: React.FC<BulletinBoardProps> = ({
  announcements,
  title = "Bulletin Board",
  className,
  showStaffIndicators = false,
  showDeleteButtons = false,
  onDeleteAnnouncement,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<AnnouncementItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteClick = (announcement: AnnouncementItem) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteModal(true);
  };

  const handleCloseModal = () => {
    if (!deleteLoading) {
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedAnnouncement || !onDeleteAnnouncement) return;

    setDeleteLoading(true);
    try {
      await onDeleteAnnouncement(selectedAnnouncement.id);
      setShowDeleteModal(false);
      setSelectedAnnouncement(null);
    } catch {
      // Error handling is done in the parent component
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
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
                  {showStaffIndicators &&
                    announcement.board_type === "staff" && (
                      <StaffBadge>🔒 STAFF ONLY</StaffBadge>
                    )}
                </BulletinItemTitleContainer>
                {showDeleteButtons && (
                  <DeleteButton
                    onClick={() => handleDeleteClick(announcement)}
                    title="Delete announcement">
                    ×
                  </DeleteButton>
                )}
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedAnnouncement && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <CloseButton onClick={handleCloseModal} disabled={deleteLoading}>
                ×
              </CloseButton>
              <ModalTitle>Delete Announcement</ModalTitle>
              <ModalSubtitle>
                Are you sure you want to delete this announcement?
              </ModalSubtitle>
            </ModalHeader>

            <AnnouncementInfo>
              <AnnouncementTitle>
                {selectedAnnouncement.title}
              </AnnouncementTitle>
              <AnnouncementDetails>
                {new Date(
                  selectedAnnouncement.date_created,
                ).toLocaleDateString()}{" "}
                • By {selectedAnnouncement.author_name} (
                {selectedAnnouncement.author_role})
              </AnnouncementDetails>
              {selectedAnnouncement.board_type && (
                <AnnouncementDetails>
                  Board: {selectedAnnouncement.board_type}
                </AnnouncementDetails>
              )}
            </AnnouncementInfo>

            <ModalActions>
              <Button
                variant="secondary"
                onClick={handleCloseModal}
                disabled={deleteLoading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}>
                {deleteLoading ? "Deleting..." : "Delete Announcement"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
};

export default BulletinBoard;
export type { AnnouncementItem };
