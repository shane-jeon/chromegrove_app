import React from "react";
import {
  SuccessModalOverlay,
  SuccessModalContent,
  SuccessIcon,
  SuccessTitle,
  SuccessMessage,
  SuccessButton,
} from "../styles/StudentDashboardStyles";

type SuccessModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  subMessage?: string;
};

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  title,
  message,
  subMessage,
}) => {
  if (!isOpen) return null;
  return (
    <SuccessModalOverlay>
      <SuccessModalContent>
        <SuccessIcon>✅</SuccessIcon>
        <SuccessTitle>{title}</SuccessTitle>
        <SuccessMessage>{message}</SuccessMessage>
        {subMessage && <SuccessMessage>{subMessage}</SuccessMessage>}
        <SuccessButton onClick={onClose}>Close</SuccessButton>
      </SuccessModalContent>
    </SuccessModalOverlay>
  );
};

export default SuccessModal;
