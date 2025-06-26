import React from "react";

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
          <div>
            <label className="form-label">Start Time</label>
            <input
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              placeholder="Start Time"
              className="form-input"
              required
              type="datetime-local"
            />
          </div>
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
        </div>
        <div className="form-group">
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
