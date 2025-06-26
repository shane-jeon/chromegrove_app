import React, { useEffect, useState } from "react";
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
}

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  date_created: string;
}

const DashboardContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 32px;
  padding: 32px;
`;

const ScheduleContainer = styled.div`
  flex: 2;
  background: #f7f6fa;
  border-radius: 16px;
  padding: 24px;
  min-width: 400px;
`;

const BulletinContainer = styled.div`
  flex: 1;
  background: #f3eaff;
  border-radius: 16px;
  padding: 24px;
  min-width: 300px;
  height: fit-content;
`;

const DateHeader = styled.div`
  background: rgba(128, 90, 213, 0.7);
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
  border-radius: 8px;
  padding: 8px 16px;
  margin-top: 24px;
  margin-bottom: 8px;
`;

const ClassRow = styled.div<{ full: boolean }>`
  display: flex;
  align-items: center;
  background: ${({ full }) => (full ? "#e0e0e0" : "white")};
  opacity: ${({ full }) => (full ? 0.6 : 1)};
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
  position: relative;
  border: 1px solid #e5e5e5;
`;

const ClassFullOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(128, 90, 213, 0.7);
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  z-index: 2;
`;

const TimeCol = styled.div`
  flex: 0 0 90px;
  font-weight: 500;
`;
const InfoCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;
const ActionCol = styled.div`
  flex: 0 0 120px;
  display: flex;
  justify-content: flex-end;
`;
const BookButton = styled.button<{ booked: boolean }>`
  background: ${({ booked }) => (booked ? "#bdbdbd" : "#805ad5")};
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 1rem;
  cursor: ${({ booked }) => (booked ? "not-allowed" : "pointer")};
`;
const ArrowButton = styled.button`
  background: #805ad5;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  margin: 0 8px;
  cursor: pointer;
`;

const TabBox = styled.div`
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(128, 90, 213, 0.07);
  margin-bottom: 32px;
  padding: 20px 24px 8px 24px;
`;
const TabHeader = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
`;
const TabButton = styled.button<{ active: boolean }>`
  background: ${({ active }) => (active ? "#805ad5" : "#eae2f8")};
  color: ${({ active }) => (active ? "white" : "#805ad5")};
  border: none;
  border-radius: 6px 6px 0 0;
  padding: 8px 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
`;
const CancelButton = styled.button`
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 18px;
  font-size: 1rem;
  cursor: pointer;
`;

function formatDateHeader(date: Date) {
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(start: string, duration: number) {
  const startDate = new Date(start);
  const endDate = new Date(startDate.getTime() + duration * 60000);
  return `${startDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })} - ${endDate.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function StudentDashboard() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentStart, setCurrentStart] = useState(new Date());
  const daysToShow = 7;
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    // Fetch classes for the next 30 days (filter in UI)
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setClasses(data.classes || []));
    // Fetch announcements
    fetch("http://localhost:5000/api/announcements?board_type=student")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []));
  }, []);

  // Group classes by date
  const grouped: { [date: string]: ClassItem[] } = {};
  classes.forEach((c) => {
    const d = new Date(c.start_time);
    const key = d.toDateString();
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });

  // Pagination logic
  const startDate = new Date(currentStart);
  startDate.setHours(0, 0, 0, 0);
  const days = Array.from({ length: daysToShow }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const handlePrev = () => {
    const prev = new Date(currentStart);
    prev.setDate(prev.getDate() - daysToShow);
    setCurrentStart(prev);
  };
  const handleNext = () => {
    const next = new Date(currentStart);
    next.setDate(next.getDate() + daysToShow);
    setCurrentStart(next);
  };

  // Placeholder: get booked class IDs for this student (replace with real logic)
  const bookedClassIds: string[] = [];
  const bookedClassDetails: ClassItem[] = classes.filter((c) =>
    bookedClassIds.includes(c.instance_id),
  );
  const now = new Date();
  const upcomingBooked = bookedClassDetails.filter(
    (c) => new Date(c.start_time) > now,
  );
  const pastBooked = bookedClassDetails.filter(
    (c) => new Date(c.start_time) <= now,
  );

  return (
    <DashboardContainer>
      <ScheduleContainer>
        {/* My Schedule Tabbed Box */}
        <TabBox>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 8 }}>
            My Schedule
          </h2>
          <TabHeader>
            <TabButton
              active={tab === "upcoming"}
              onClick={() => setTab("upcoming")}>
              Upcoming
            </TabButton>
            <TabButton active={tab === "past"} onClick={() => setTab("past")}>
              Past
            </TabButton>
          </TabHeader>
          <div>
            {(tab === "upcoming" ? upcomingBooked : pastBooked).length === 0 ? (
              <div style={{ color: "#888", margin: "12px 0 24px 0" }}>
                No classes.
              </div>
            ) : (
              (tab === "upcoming" ? upcomingBooked : pastBooked).map(
                (c, idx, arr) => (
                  <div key={c.instance_id}>
                    <ClassRow full={false}>
                      <TimeCol>
                        {formatTimeRange(c.start_time, c.duration)}
                      </TimeCol>
                      <InfoCol>
                        <div style={{ fontWeight: 600 }}>{c.class_name}</div>
                        <div style={{ color: "#805ad5" }}>
                          Instructor: {c.instructor_name || c.instructor_id}
                        </div>
                      </InfoCol>
                      <ActionCol>
                        {tab === "upcoming" && (
                          <CancelButton>Cancel</CancelButton>
                        )}
                      </ActionCol>
                    </ClassRow>
                    {idx < arr.length - 1 && (
                      <hr
                        style={{
                          border: 0,
                          borderTop: "1px solid #e0e0e0",
                          margin: 0,
                        }}
                      />
                    )}
                  </div>
                ),
              )
            )}
          </div>
        </TabBox>
        {/* Class Schedule */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
          <ArrowButton onClick={handlePrev}>&lt;</ArrowButton>
          <h2 style={{ fontSize: "1.5rem", fontWeight: 700 }}>
            Class Schedule
          </h2>
          <ArrowButton onClick={handleNext}>&gt;</ArrowButton>
        </div>
        {days.map((date) => {
          const key = date.toDateString();
          const dayClasses = (grouped[key] || []).sort(
            (a, b) =>
              new Date(a.start_time).getTime() -
              new Date(b.start_time).getTime(),
          );
          return (
            <div key={key}>
              <DateHeader>{formatDateHeader(date)}</DateHeader>
              {dayClasses.length === 0 ? (
                <div style={{ color: "#888", margin: "12px 0 24px 0" }}>
                  No classes scheduled.
                </div>
              ) : (
                dayClasses.map((c, idx) => {
                  const isFull = c.enrolled_count >= c.max_capacity;
                  const isBooked = bookedClassIds.includes(c.instance_id);
                  return (
                    <div key={c.instance_id}>
                      <ClassRow full={isFull}>
                        <TimeCol>
                          {formatTimeRange(c.start_time, c.duration)}
                        </TimeCol>
                        <InfoCol>
                          <div style={{ fontWeight: 600 }}>{c.class_name}</div>
                          <div style={{ color: "#805ad5" }}>
                            Instructor: {c.instructor_name || c.instructor_id}
                          </div>
                        </InfoCol>
                        <ActionCol>
                          {isFull ? (
                            <></>
                          ) : (
                            <BookButton booked={isBooked} disabled={isBooked}>
                              {isBooked ? "you're booked!" : "book class"}
                            </BookButton>
                          )}
                        </ActionCol>
                        {isFull && (
                          <ClassFullOverlay>CLASS FULL</ClassFullOverlay>
                        )}
                      </ClassRow>
                      {idx < dayClasses.length - 1 && (
                        <hr
                          style={{
                            border: 0,
                            borderTop: "1px solid #e0e0e0",
                            margin: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </ScheduleContainer>
      <BulletinContainer>
        <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: 16 }}>
          Bulletin Board
        </h2>
        {announcements.length === 0 ? (
          <div style={{ color: "#888" }}>No announcements</div>
        ) : (
          announcements.map((a) => (
            <div key={a.id} style={{ marginBottom: 18 }}>
              <div style={{ fontWeight: 600 }}>{a.title}</div>
              <div style={{ color: "#805ad5", fontSize: "0.95rem" }}>
                {a.body}
              </div>
              <div style={{ color: "#aaa", fontSize: "0.85rem" }}>
                {new Date(a.date_created).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </BulletinContainer>
    </DashboardContainer>
  );
}
