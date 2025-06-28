import React, { useState } from "react";

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

interface AddClassDropdownFormProps {
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

const AddClassDropdownForm: React.FC<AddClassDropdownFormProps> = ({
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

  if (!show) return null;
  return (
    <div className="dropdown-form-panel dropdown-form-animate">
      <div
        className="dropdown-form-header-bar"
        style={{ position: "relative" }}>
        <span className="dropdown-form-title">Add New Class</span>
        <button
          className="form-close-btn"
          onClick={onClose}
          aria-label="Close"
          type="button"
          style={{ position: "absolute", top: 0, right: 0 }}>
          &times;
        </button>
      </div>
      <form onSubmit={onSubmit} className="dropdown-form">
        <div className="form-group">
          <label className="form-label">Class Name</label>
          <input
            name="class_name"
            value={form.class_name}
            onChange={handleChange}
            placeholder="Class Name"
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Description"
            className="form-textarea"
          />
        </div>
        <div className="form-group form-row">
          <div style={{ position: "relative" }}>
            <label className="form-label">Date</label>
            <input
              name="date_display"
              value={selectedDate || "Select Date"}
              onClick={() => setShowDatePicker(true)}
              readOnly
              placeholder="Select Date"
              className="form-input"
              required
              style={{ cursor: "pointer" }}
            />
            {showDatePicker && (
              <div className="picker-popup">
                <div className="picker-header">
                  <span>Select Date</span>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(false)}
                    className="picker-close">
                    &times;
                  </button>
                </div>
                <div className="picker-content">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="form-input"
                    style={{ marginBottom: "1rem" }}
                  />
                </div>
                <div className="picker-footer">
                  <button
                    type="button"
                    className="picker-save-btn"
                    onClick={handleDateSave}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
          <div style={{ position: "relative" }}>
            <label className="form-label">Start Time</label>
            <input
              name="time_display"
              value={formatDisplayTime()}
              onClick={() => setShowTimePicker(true)}
              readOnly
              placeholder="Select Time"
              className="form-input"
              required
              style={{ cursor: "pointer" }}
            />
            {showTimePicker && (
              <div className="picker-popup">
                <div className="picker-header">
                  <span>Select Time</span>
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(false)}
                    className="picker-close">
                    &times;
                  </button>
                </div>
                <div className="picker-content">
                  <div className="time-picker-grid">
                    <div className="time-picker-column">
                      <div className="time-picker-label">Hour</div>
                      <div className="time-picker-scroll">
                        {hourOptions.map((hour) => (
                          <button
                            key={hour}
                            type="button"
                            className={`time-picker-option ${
                              selectedHour === hour ? "selected" : ""
                            }`}
                            onClick={() => setSelectedHour(hour)}>
                            {hour}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-picker-column">
                      <div className="time-picker-label">Minute</div>
                      <div className="time-picker-scroll">
                        {minuteOptions.map((minute) => (
                          <button
                            key={minute}
                            type="button"
                            className={`time-picker-option ${
                              selectedMinute === minute ? "selected" : ""
                            }`}
                            onClick={() => setSelectedMinute(minute)}>
                            {minute}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="time-picker-column">
                      <div className="time-picker-label">AM/PM</div>
                      <div className="time-picker-scroll">
                        {periodOptions.map((period) => (
                          <button
                            key={period}
                            type="button"
                            className={`time-picker-option ${
                              selectedPeriod === period ? "selected" : ""
                            }`}
                            onClick={() => setSelectedPeriod(period)}>
                            {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="picker-footer">
                  <button
                    type="button"
                    className="picker-save-btn"
                    onClick={handleTimeSave}>
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="form-group form-row">
          <div>
            <label className="form-label">Duration (min)</label>
            <input
              name="duration"
              value={form.duration}
              onChange={handleChange}
              placeholder="Duration"
              className="form-input"
              type="number"
              min={1}
              required
            />
          </div>
          <div>
            <label className="form-label">Instructor</label>
            <select
              name="instructor_id"
              value={form.instructor_id}
              onChange={handleSelectChange}
              className="form-select"
              required>
              <option value="">Select Instructor</option>
              {staffList.map((i: Instructor) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.email})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-group form-row">
          <div>
            <label className="form-label">Max Capacity</label>
            <input
              name="max_capacity"
              value={form.max_capacity}
              onChange={handleChange}
              placeholder="Max Capacity"
              className="form-input"
              type="number"
              min={1}
              required
            />
          </div>
          <div>
            <label className="form-label">Recurrence</label>
            <select
              name="recurrence_pattern"
              value={form.recurrence_pattern}
              onChange={handleSelectChange}
              className="form-select"
              required>
              <option value="">Select Recurrence</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-weekly</option>
              <option value="monthly">Monthly</option>
              <option value="pop-up">Pop-up Event</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Requirements</label>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={handleChange}
            placeholder="Requirements"
            className="form-textarea"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Recommended Attire</label>
          <input
            name="recommended_attire"
            value={form.recommended_attire}
            onChange={handleChange}
            placeholder="Recommended Attire"
            className="form-input"
          />
        </div>
        <button type="submit" className="form-button" disabled={loading}>
          {loading ? "Saving..." : "Create Class"}
        </button>
      </form>
    </div>
  );
};

export default AddClassDropdownForm;
