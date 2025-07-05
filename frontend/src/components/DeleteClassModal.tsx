import React, { useState } from "react";
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
  payment_type?: string;
  recurrence_pattern?: string;
}

interface DeleteClassModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (scope: "single" | "future") => void;
  classItem: ClassItem | null;
  loading?: boolean;
}

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

const ClassInfo = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
`;

const ClassName = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const ClassDetails = styled.div`
  font-size: 14px;
  color: #4a5568;
  margin-bottom: 4px;
`;

const OptionsContainer = styled.div`
  margin-bottom: 24px;
`;

const OptionLabel = styled.label`
  display: flex;
  align-items: center;
  padding: 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const RadioInput = styled.input`
  margin-right: 12px;
  width: 18px;
  height: 18px;
  accent-color: #e53e3e;
`;

const OptionContent = styled.div`
  flex: 1;
`;

const OptionTitle = styled.div`
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 4px;
`;

const OptionDescription = styled.div`
  font-size: 14px;
  color: #718096;
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

function formatClassDate(startTime: string): string {
  const date = new Date(startTime);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatClassTime(startTime: string, duration: number): string {
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
}

const DeleteClassModal: React.FC<DeleteClassModalProps> = ({
  show,
  onClose,
  onConfirm,
  classItem,
  loading = false,
}) => {
  const [selectedScope, setSelectedScope] = useState<"single" | "future">(
    "single",
  );

  if (!show || !classItem) {
    return null;
  }

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedScope);
  };

  const hasRecurrence =
    classItem.recurrence_pattern &&
    classItem.recurrence_pattern !== "One-time" &&
    classItem.recurrence_pattern !== "pop-up";

  const isPopUp = classItem.recurrence_pattern === "pop-up";
  const isOneTime =
    classItem.recurrence_pattern === "One-time" ||
    !classItem.recurrence_pattern;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={handleClose} disabled={loading}>
            ×
          </CloseButton>
          <ModalTitle>
            {isPopUp || isOneTime ? "Delete Class" : "Cancel Class"}
          </ModalTitle>
          <ModalSubtitle>
            {isPopUp || isOneTime
              ? "Are you sure you want to delete this class?"
              : "Choose how you want to cancel this class"}
          </ModalSubtitle>
        </ModalHeader>

        <ClassInfo>
          <ClassName>{classItem.class_name}</ClassName>
          <ClassDetails>
            {formatClassDate(classItem.start_time)} •{" "}
            {formatClassTime(classItem.start_time, classItem.duration)}
          </ClassDetails>
          {hasRecurrence && (
            <ClassDetails>
              Recurrence: {classItem.recurrence_pattern}
            </ClassDetails>
          )}
        </ClassInfo>

        <OptionsContainer>
          <OptionLabel>
            <RadioInput
              type="radio"
              name="scope"
              value="single"
              checked={selectedScope === "single"}
              onChange={() => setSelectedScope("single")}
            />
            <OptionContent>
              <OptionTitle>
                {isPopUp || isOneTime
                  ? "Delete this class"
                  : "Cancel this class only"}
              </OptionTitle>
              <OptionDescription>
                {isPopUp || isOneTime
                  ? "Delete this specific class"
                  : "Cancel this specific instance of the class"}
              </OptionDescription>
            </OptionContent>
          </OptionLabel>

          {hasRecurrence && (
            <OptionLabel>
              <RadioInput
                type="radio"
                name="scope"
                value="future"
                checked={selectedScope === "future"}
                onChange={() => setSelectedScope("future")}
              />
              <OptionContent>
                <OptionTitle>Cancel this and all future instances</OptionTitle>
                <OptionDescription>
                  Cancel this instance and all future recurring instances of
                  this class
                </OptionDescription>
              </OptionContent>
            </OptionLabel>
          )}
        </OptionsContainer>

        <ModalActions>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Go Back
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={loading}>
            {loading
              ? isPopUp || isOneTime
                ? "Deleting..."
                : "Canceling..."
              : isPopUp || isOneTime
              ? "Confirm Deletion"
              : "Confirm Cancellation"}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DeleteClassModal;
