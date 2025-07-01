import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LoadingSpinner from "../components/LoadingSpinner";

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
}

export default function Home() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Fetch upcoming classes
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => {
        setClasses(data.classes || []);
        setLoading(false);
      });
    // Comment out debug logs
    // .catch((error) => {
    //   console.error("Error fetching classes:", error);
    //   setLoading(false);
    // });
  }, []);

  const formatClassDate = (startTime: string): string => {
    try {
      const date = new Date(startTime);
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Date unavailable";
    }
  };

  const formatClassTime = (startTime: string, duration: number): string => {
    try {
      const startDate = new Date(startTime);
      if (isNaN(startDate.getTime())) {
        return "Invalid date";
      }
      if (!duration || isNaN(duration) || duration <= 0) {
        return "Invalid duration";
      }

      const endDate = new Date(startDate.getTime() + duration * 60000);
      const startTimeStr = startDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const endTimeStr = endDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      return `${startTimeStr} - ${endTimeStr}`;
    } catch {
      return "Time unavailable";
    }
  };

  const handleBookClass = () => {
    // Redirect to sign-in if not authenticated, otherwise to student dashboard
    router.push("/sign-in");
  };

  return (
    <main style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: "700",
            color: "#2d3748",
            marginBottom: "8px",
          }}>
          Studio Class Schedule
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "#718096",
            marginBottom: "24px",
          }}>
          Discover and book your next pole dancing class
        </p>
      </div>

      {loading ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#718096",
          }}>
          <LoadingSpinner text="Loading upcoming classes..." size="medium" />
        </div>
      ) : classes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#718096",
          }}>
          <div>No upcoming classes available at the moment.</div>
          <div style={{ marginTop: "8px" }}>
            Check back later for new class offerings!
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: "20px",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          }}>
          {classes.map((classItem) => (
            <div
              key={classItem.instance_id}
              style={{
                background: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 4px 8px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 2px 4px rgba(0, 0, 0, 0.05)";
                e.currentTarget.style.transform = "translateY(0)";
              }}>
              {/* Date and Time */}
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#805ad5",
                    marginBottom: "4px",
                  }}>
                  {formatClassDate(classItem.start_time)}
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: "#2d3748",
                  }}>
                  {formatClassTime(classItem.start_time, classItem.duration)}
                </div>
              </div>

              {/* Class Information */}
              <div style={{ marginBottom: "16px" }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#2d3748",
                    margin: "0 0 8px 0",
                  }}>
                  {classItem.class_name}
                </h3>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#805ad5",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}>
                  Instructor:{" "}
                  {classItem.instructor_name || classItem.instructor_id}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#4a5568",
                    lineHeight: "1.5",
                  }}>
                  {classItem.description ||
                    "Join us for an exciting class experience!"}
                </div>
              </div>

              {/* Class Details */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "16px",
                  marginBottom: "16px",
                }}>
                <div style={{ fontSize: "12px", color: "#718096" }}>
                  <strong style={{ color: "#4a5568" }}>Capacity:</strong>{" "}
                  {classItem.enrolled_count}/{classItem.max_capacity}
                </div>
                <div style={{ fontSize: "12px", color: "#718096" }}>
                  <strong style={{ color: "#4a5568" }}>Duration:</strong>{" "}
                  {classItem.duration} min
                </div>
              </div>

              {/* Book Class Button */}
              <button
                onClick={() => handleBookClass()}
                style={{
                  background: "#805ad5",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#6b46c1";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#805ad5";
                  e.currentTarget.style.transform = "translateY(0)";
                }}>
                Book Class
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
