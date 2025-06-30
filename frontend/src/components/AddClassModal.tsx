import React, { useState, useEffect } from "react";
import styled from "styled-components";

interface Instructor {
  id: number;
  name: string;
  email: string;
}

export interface AddClassForm {
  class_name: string;
  description: string;
  start_time: string;
  duration: number | string;
  instructor_id: number | string;
  max_capacity: number | string;
  requirements: string;
  recommended_attire: string;
  recurrence_pattern: string;
}

interface AddClassModalProps {
  show: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  form: AddClassForm;
  staffList: Instructor[];
  loading: boolean;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
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
  max-width: 700px;
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
  position: relative;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
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
  min-height: 80px;
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
    background: #805ad5;
    color: white;
    
    &:hover:not(:disabled) {
      background: #6b46c1;
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

const AddClassModal: React.FC<AddClassModalProps> = ({
  show,
  onClose,
  onSubmit,
  form,
  staffList,
  loading,
  handleSelectChange,
  handleChange,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedHour, setSelectedHour] = useState("12");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [selectedPeriod, setSelectedPeriod] = useState("PM");

  // Generate 15-minute interval options
  const minuteOptions = ["00", "15", "30", "45"];
  const hourOptions = Array.from({ length: 12 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const periodOptions = ["AM", "PM"];

  // Handle clicking outside pickers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".date-picker") &&
        !target.closest(".time-picker") &&
        !target.closest('[name="date_display"]') &&
        !target.closest('[name="time_display"]')
      ) {
        setShowDatePicker(false);
        setShowTimePicker(false);
      }
    };

    if (showDatePicker || showTimePicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showDatePicker, showTimePicker]);

  // Parse current start_time to initialize form
  React.useEffect(() => {
    if (form.start_time) {
      const dateTime = new Date(form.start_time);
      setSelectedDate(dateTime.toISOString().split("T")[0]);

      const hours = dateTime.getHours();
      const minutes = dateTime.getMinutes();

      // Convert to 12-hour format
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedHour(displayHour.toString().padStart(2, "0"));
      setSelectedMinute(minutes.toString().padStart(2, "0"));
      setSelectedPeriod(hours >= 12 ? "PM" : "AM");
    } else {
      // Initialize with today's date if no start_time
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      setSelectedDate(todayStr);

      // Set default time to current time
      const hours = today.getHours();
      const minutes = today.getMinutes();
      const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      setSelectedHour(displayHour.toString().padStart(2, "0"));
      setSelectedMinute(minutes.toString().padStart(2, "0"));
      setSelectedPeriod(hours >= 12 ? "PM" : "AM");

      // Initialize the form's start_time with default values
      updateStartTime(
        todayStr,
        displayHour.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        hours >= 12 ? "PM" : "AM",
      );
    }
  }, [form.start_time]);

  const updateStartTime = (
    date: string,
    hour: string,
    minute: string,
    period: string,
  ) => {
    if (!date || !hour || !minute || !period) return;

    // Convert 12-hour to 24-hour format
    let hour24 = parseInt(hour);
    if (period === "PM" && hour24 !== 12) hour24 += 12;
    if (period === "AM" && hour24 === 12) hour24 = 0;

    // Create datetime string
    const timeString = `${hour24.toString().padStart(2, "0")}:${minute}:00`;
    const dateTimeString = `${date}T${timeString}`;

    // Update form
    const event = {
      target: {
        name: "start_time",
        value: dateTimeString,
      },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(event);
  };

  const handleDateSave = () => {
    updateStartTime(selectedDate, selectedHour, selectedMinute, selectedPeriod);
    setShowDatePicker(false);
  };

  const handleTimeSave = () => {
    updateStartTime(selectedDate, selectedHour, selectedMinute, selectedPeriod);
    setShowTimePicker(false);
  };

  const formatDisplayTime = () => {
    if (!selectedHour || !selectedMinute || !selectedPeriod)
      return "Select Time";
    return `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    // Validate that start_time is set
    if (!form.start_time) {
      e.preventDefault();
      alert("Please select a date and time for the class.");
      return;
    }
    onSubmit(e);
  };

  if (!show) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <CloseButton onClick={onClose}>&times;</CloseButton>
          <ModalTitle>Add New Class</ModalTitle>
          <ModalSubtitle>
            Create a new studio class with all the details
          </ModalSubtitle>
        </ModalHeader>

        <Form onSubmit={handleFormSubmit}>
          <FormGroup>
            <Label>Class Name *</Label>
            <Input
              name="class_name"
              value={form.class_name}
              onChange={handleChange}
              placeholder="Enter class name"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Description</Label>
            <TextArea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter class description"
            />
          </FormGroup>

          <FormRow>
            <FormGroup>
              <Label>Date *</Label>
              <Input
                name="date_display"
                value={selectedDate || "Select Date"}
                onClick={() => setShowDatePicker(true)}
                readOnly
                placeholder="Select Date"
                required
                style={{ cursor: "pointer" }}
              />
              {showDatePicker && (
                <div
                  className="date-picker"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px",
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}>
                    <span style={{ fontWeight: "600" }}>Select Date</span>
                    <button
                      type="button"
                      onClick={() => setShowDatePicker(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#4a5568",
                      }}>
                      &times;
                    </button>
                  </div>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    style={{ marginBottom: "12px" }}
                  />
                  <Button type="button" onClick={handleDateSave}>
                    Save
                  </Button>
                </div>
              )}
            </FormGroup>

            <FormGroup>
              <Label>Start Time *</Label>
              <Input
                name="time_display"
                value={formatDisplayTime()}
                onClick={() => setShowTimePicker(true)}
                readOnly
                placeholder="Select Time"
                required
                style={{ cursor: "pointer" }}
              />
              {showTimePicker && (
                <div
                  className="time-picker"
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "white",
                    border: "1px solid #e2e8f0",
                    borderRadius: "8px",
                    padding: "16px",
                    zIndex: 1000,
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                  }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}>
                    <span style={{ fontWeight: "600" }}>Select Time</span>
                    <button
                      type="button"
                      onClick={() => setShowTimePicker(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "18px",
                        cursor: "pointer",
                        color: "#4a5568",
                      }}>
                      &times;
                    </button>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "12px",
                      marginBottom: "12px",
                    }}>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}>
                        Hour
                      </div>
                      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                        {hourOptions.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            onClick={() => setSelectedHour(hour)}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "4px 8px",
                              background:
                                selectedHour === hour
                                  ? "#805ad5"
                                  : "transparent",
                              color:
                                selectedHour === hour ? "white" : "#4a5568",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}>
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}>
                        Minute
                      </div>
                      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                        {minuteOptions.map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            onClick={() => setSelectedMinute(minute)}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "4px 8px",
                              background:
                                selectedMinute === minute
                                  ? "#805ad5"
                                  : "transparent",
                              color:
                                selectedMinute === minute ? "white" : "#4a5568",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}>
                            {minute}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          marginBottom: "4px",
                        }}>
                        AM/PM
                      </div>
                      <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                        {periodOptions.map((period) => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => setSelectedPeriod(period)}
                            style={{
                              display: "block",
                              width: "100%",
                              padding: "4px 8px",
                              background:
                                selectedPeriod === period
                                  ? "#805ad5"
                                  : "transparent",
                              color:
                                selectedPeriod === period ? "white" : "#4a5568",
                              border: "none",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                            }}>
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button type="button" onClick={handleTimeSave}>
                    Save
                  </Button>
                </div>
              )}
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Duration (minutes) *</Label>
              <Input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="60"
                type="number"
                min={1}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Instructor *</Label>
              <Select
                name="instructor_id"
                value={form.instructor_id}
                onChange={handleSelectChange}
                required>
                <option value="">Select Instructor</option>
                {staffList.map((instructor: Instructor) => (
                  <option key={instructor.id} value={instructor.id}>
                    {instructor.name} ({instructor.email})
                  </option>
                ))}
              </Select>
            </FormGroup>
          </FormRow>

          <FormRow>
            <FormGroup>
              <Label>Max Capacity *</Label>
              <Input
                name="max_capacity"
                value={form.max_capacity}
                onChange={handleChange}
                placeholder="20"
                type="number"
                min={1}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>Recurrence *</Label>
              <Select
                name="recurrence_pattern"
                value={form.recurrence_pattern}
                onChange={handleSelectChange}
                required>
                <option value="">Select Recurrence</option>
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="pop-up">Pop-up Event</option>
              </Select>
            </FormGroup>
          </FormRow>

          <FormGroup>
            <Label>Requirements</Label>
            <TextArea
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              placeholder="Enter class requirements"
            />
          </FormGroup>

          <FormGroup>
            <Label>Recommended Attire</Label>
            <Input
              name="recommended_attire"
              value={form.recommended_attire}
              onChange={handleChange}
              placeholder="Enter recommended attire"
            />
          </FormGroup>

          <ModalActions>
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </ModalActions>
        </Form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default AddClassModal;
