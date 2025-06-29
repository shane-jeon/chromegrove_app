import React, { useState } from "react";
import styled from "styled-components";

interface AddAnnouncementForm {
  title: string;
  body: string;
  board_type: string;
}

interface AddAnnouncementModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (form: AddAnnouncementForm) => Promise<void>;
  loading: boolean;
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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
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
  transition: all 0.2s ease;

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

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  font-weight: 600;
  color: #2d3748;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #805ad5;
    box-shadow: 0 0 0 3px rgba(128, 90, 213, 0.1);
  }
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  min-height: 120px;
  resize: vertical;
  font-family: inherit;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #805ad5;
    box-shadow: 0 0 0 3px rgba(128, 90, 213, 0.1);
  }
`;

const Select = styled.select`
  padding: 12px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    outline: none;
    border-color: #805ad5;
    box-shadow: 0 0 0 3px rgba(128, 90, 213, 0.1);
  }
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
    background: #48bb78;
    color: white;
    
    &:hover:not(:disabled) {
      background: #38a169;
    }
    
    &:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
  `
      : `
    background: #e53e3e;
    color: white;
    
    &:hover:not(:disabled) {
      background: #c53030;
    }
    
    &:disabled {
      background: #a0aec0;
      cursor: not-allowed;
    }
  `}
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
`;

const AddAnnouncementModal: React.FC<AddAnnouncementModalProps> = ({
  show,
  onClose,
  onSubmit,
  loading,
}) => {
  const [form, setForm] = useState<AddAnnouncementForm>({
    title: "",
    body: "",
    board_type: "student",
  });
  const [error, setError] = useState<string>("");

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate form
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!form.body.trim()) {
      setError("Message is required");
      return;
    }

    try {
      await onSubmit(form);
      // Reset form on success
      setForm({
        title: "",
        body: "",
        board_type: "student",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create announcement",
      );
    }
  };

  const handleClose = () => {
    if (!loading) {
      setForm({
        title: "",
        body: "",
        board_type: "student",
      });
      setError("");
      onClose();
    }
  };

  if (!show) return null;

  return (
    <ModalOverlay onClick={handleClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={handleClose} disabled={loading}>
            &times;
          </CloseButton>
          <ModalTitle>Add Announcement</ModalTitle>
          <ModalSubtitle>
            Create a new announcement for the bulletin board
          </ModalSubtitle>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={handleChange}
              placeholder="Enter announcement title"
              disabled={loading}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="body">Message *</Label>
            <TextArea
              id="body"
              name="body"
              value={form.body}
              onChange={handleChange}
              placeholder="Enter announcement message"
              disabled={loading}
              required
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="board_type">Target Audience</Label>
            <Select
              id="board_type"
              name="board_type"
              value={form.board_type}
              onChange={handleChange}
              disabled={loading}>
              <option value="student">Students</option>
              <option value="staff">Staff</option>
            </Select>
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>

        <ModalActions>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            onClick={handleSubmit}
            disabled={loading || !form.title.trim() || !form.body.trim()}>
            {loading ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </ModalActions>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddAnnouncementModal;
export type { AddAnnouncementForm };
