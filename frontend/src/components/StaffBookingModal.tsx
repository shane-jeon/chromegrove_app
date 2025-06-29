import React from "react";
import styled from "styled-components";

interface StaffBookingModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: () => void;
  classItem?: {
    class_name: string;
    start_time: string;
    duration: number;
  } | null;
  loading?: boolean;
  isCancellation?: boolean;
}

// Modal Styles
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
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 24px 0 24px;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #2d3748;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #718096;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f7fafc;
    color: #4a5568;
  }
`;

const ClassInfo = styled.div`
  margin-bottom: 20px;
  padding: 16px;
  background: #f7fafc;
  border-radius: 8px;

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
    color: #2d3748;
  }

  p {
    margin: 0;
    font-size: 14px;
    color: #4a5568;
  }
`;

const ModalBody = styled.div`
  flex-grow: 1;
  padding: 24px;
`;

const ConfirmationText = styled.p`
  font-size: 14px;
  color: #4a5568;
  margin: 0;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-shrink: 0;
  padding: 0 24px 24px 24px;
`;

const CancelButton = styled.button`
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
  background: #e2e8f0;
  color: #4a5568;

  &:hover:not(:disabled) {
    background: #cbd5e0;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const ConfirmButton = styled.button`
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
  background: #805ad5;
  color: white;

  &:hover:not(:disabled) {
    background: #6b46c1;
  }

  &:disabled {
    background: #a0aec0;
    cursor: not-allowed;
  }
`;

const StaffBookingModal: React.FC<StaffBookingModalProps> = ({
  show,
  onClose,
  onConfirm,
  classItem,
  loading = false,
  isCancellation = false,
}) => {
  if (!show) return null;

  const formatClassTime = (startTime: string, duration: number): string => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + duration * 60000);

    return `${start.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })} - ${end.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  };

  const formatClassDate = (startTime: string): string => {
    const date = new Date(startTime);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            {isCancellation ? "Cancel Class Booking" : "Confirm Class Booking"}
          </ModalTitle>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>

        <ModalBody>
          {classItem && (
            <ClassInfo>
              <h3>{classItem.class_name}</h3>
              <p>
                {formatClassDate(classItem.start_time)} •{" "}
                {formatClassTime(classItem.start_time, classItem.duration)}
              </p>
            </ClassInfo>
          )}

          <ConfirmationText>
            {isCancellation
              ? "Are you sure you want to cancel your booking for this class? This action cannot be undone."
              : "You are about to book this class. As a staff member, this booking will be free of charge."}
          </ConfirmationText>
        </ModalBody>

        <ModalFooter>
          <CancelButton onClick={onClose} disabled={loading}>
            Cancel
          </CancelButton>
          <ConfirmButton onClick={onConfirm} disabled={loading}>
            {loading
              ? "Processing..."
              : isCancellation
              ? "Cancel Booking"
              : "Confirm Booking"}
          </ConfirmButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default StaffBookingModal;
