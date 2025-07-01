import React from "react";
import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalTitle,
  ModalSubtitle,
  ModalActions,
  ModalButton,
} from "../styles/StudentDashboardStyles";

type StudentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  actions,
  children,
}) => {
  if (!isOpen) return null;
  return (
    <ModalOverlay>
      <ModalContent>
        <ModalHeader>
          {title && <ModalTitle>{title}</ModalTitle>}
          {subtitle && <ModalSubtitle>{subtitle}</ModalSubtitle>}
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </ModalHeader>
        {children}
        {actions && <ModalActions>{actions}</ModalActions>}
      </ModalContent>
    </ModalOverlay>
  );
};

export default StudentModal;
