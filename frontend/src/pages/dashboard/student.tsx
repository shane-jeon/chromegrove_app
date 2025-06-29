import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "@clerk/nextjs";
import ClassScheduleList from "../../components/ClassScheduleList";
import MembershipBox from "../../components/MembershipBox";

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
}

interface AnnouncementItem {
  id: number;
  title: string;
  body: string;
  date_created: string;
}

interface SlidingScaleOption {
  id: number;
  tier_name: string;
  price_min: number;
  price_max: number;
  description: string;
  category: string;
  stripe_price_id?: string;
}

interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  role: string;
  type: string;
  name: string;
}

interface MembershipStatus {
  has_membership: boolean;
  membership_type?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  message?: string;
}

// Main Layout
const DashboardContainer = styled.div`
  display: flex;
  gap: 24px;
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px;
  }
`;

// Left Side - Class Schedule (70%)
const ScheduleContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-width: 0; /* Allow flex item to shrink */

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// Right Side - Membership + Bulletin Board
const BulletinContainer = styled.div`
  flex: 0 0 320px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  height: fit-content;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 24px;

  @media (max-width: 768px) {
    flex: none;
    max-height: none;
    position: static;
    margin-top: 16px;
  }
`;

// Tab Container
const TabContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f1f3f4;
  border-bottom: 1px solid #e2e8f0;
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px 24px;
  border: none;
  background: ${({ active }) => (active ? "white" : "transparent")};
  color: ${({ active }) => (active ? "#805ad5" : "#666")};
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background: ${({ active }) => (active ? "white" : "#e2e8f0")};
  }

  ${({ active }) =>
    active &&
    `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background: #805ad5;
    }
  `}
`;

const TabContent = styled.div`
  padding: 24px;
  min-height: 400px;
`;

// Empty State
const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #718096;

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
`;

// Bulletin Board Styles
const BulletinTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
`;

const BulletinItem = styled.div`
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BulletinItemTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const BulletinItemBody = styled.p`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 8px 0;
`;

const BulletinItemDate = styled.div`
  font-size: 12px;
  color: #718096;
  font-weight: 500;
`;

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
  font-size: 16px;
  color: #718096;
  margin: 0;
  line-height: 1.5;
`;

// Sliding Scale Components
const TierCard = styled.div<{ selected: boolean }>`
  background: ${({ selected }) => (selected ? "#f7fafc" : "white")};
  border: 2px solid ${({ selected }) => (selected ? "#805ad5" : "#e2e8f0")};
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #805ad5;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(128, 90, 213, 0.15);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const TierName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
`;

const TierPriceRange = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #805ad5;
`;

const TierDescription = styled.p`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 16px 0;
`;

const SliderContainer = styled.div`
  margin-top: 16px;
`;

const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const SliderValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
`;

const SliderRange = styled.div`
  font-size: 14px;
  color: #718096;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #805ad5;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #805ad5;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  border: 1px solid #feb2b2;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-shrink: 0;
`;

const ModalButton = styled.button<{ primary?: boolean; loading?: boolean }>`
  background: ${({ primary }) => (primary ? "#805ad5" : "#e2e8f0")};
  color: ${({ primary }) => (primary ? "white" : "#4a5568")};
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ loading }) => (loading ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: ${({ loading }) => (loading ? 0.6 : 1)};

  &:hover {
    background: ${({ primary }) => (primary ? "#6b46c1" : "#cbd5e0")};
    transform: ${({ loading }) => (loading ? "none" : "translateY(-1px)")};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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

// Success Modal Styles
const SuccessModalOverlay = styled(ModalOverlay)``;

const SuccessModalContent = styled(ModalContent)`
  text-align: center;
  max-width: 500px;
`;

const SuccessIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const SuccessTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px 0;
`;

const SuccessMessage = styled.p`
  font-size: 16px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 24px 0;
`;

const SuccessButton = styled.button`
  background: #805ad5;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: #6b46c1;
    transform: translateY(-1px);
  }
`;

// Loading Overlay
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const LoadingContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

// Utility functions
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

  const startTimeStr = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const endTimeStr = end.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return `${startTimeStr} - ${endTimeStr}`;
}

type TabType = "studio" | "upcoming" | "past";

export default function StudentDashboard() {
  const { user } = useUser();
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingSlidingScale, setLoadingSlidingScale] = useState(false);
  const [slidingScaleOptions, setSlidingScaleOptions] = useState<
    SlidingScaleOption[]
  >([]);

  // Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassItem | null>(null);
  const [selectedOption, setSelectedOption] =
    useState<SlidingScaleOption | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string>("");

  // Success modal and loading states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [classToCancel, setClassToCancel] = useState<ClassItem | null>(null);
  const [successLoading, setSuccessLoading] = useState(false);
  const [refreshingData, setRefreshingData] = useState(false);

  // Track if component is mounted to fix initial styling
  const [isMounted, setIsMounted] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>("studio");

  // Membership status state
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Check for payment success on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");

    // Only show modal if this session_id hasn't been processed in this session
    if (
      paymentStatus === "success" &&
      sessionId &&
      !sessionStorage.getItem(`payment_processed_${sessionId}`)
    ) {
      setSuccessLoading(true);
      setShowSuccessModal(true);

      // Mark as processed
      sessionStorage.setItem(`payment_processed_${sessionId}`, "true");

      // Verify payment and refresh data
      verifyPaymentAndRefreshData(sessionId);

      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const verifyPaymentAndRefreshData = async (sessionId: string) => {
    try {
      console.log("🔄 Verifying payment for session:", sessionId);

      // Verify payment with backend
      const response = await fetch(
        `http://localhost:5000/verify-payment?session_id=${sessionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();
      console.log("📊 Payment verification response:", data);

      if (data.success) {
        console.log(
          "✅ Payment verified successfully, waiting for backend processing...",
        );

        // Wait a bit for backend to process the enrollment
        await new Promise((resolve) => setTimeout(resolve, 2000));

        console.log("🔄 Refreshing enrolled classes...");
        // Refresh enrolled classes data
        await refreshEnrolledClasses();

        // Wait a bit more and refresh again to ensure we have the latest data
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await refreshEnrolledClasses();

        // Auto-hide success modal after 4 seconds
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessLoading(false);
        }, 4000);
      } else {
        console.error("❌ Payment verification failed:", data.error);
        setSuccessLoading(false);
      }
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      setSuccessLoading(false);
    }
  };

  const refreshEnrolledClasses = async () => {
    if (!user) return;

    setRefreshingData(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/enrolled-classes?clerk_user_id=${user.id}`,
      );
      const data = await response.json();

      if (data.success) {
        setEnrolledClasses(data.classes || []);
        console.log(
          "✅ Enrolled classes refreshed:",
          data.classes?.length || 0,
          "classes",
        );
      } else {
        console.error("❌ Failed to refresh enrolled classes:", data.error);
      }
    } catch (error) {
      console.error("Error refreshing enrolled classes:", error);
    } finally {
      setRefreshingData(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    await refreshEnrolledClasses();
  };

  useEffect(() => {
    // Fetch all studio classes
    fetch("http://localhost:5000/api/studio-classes/list")
      .then((res) => res.json())
      .then((data) => setAllClasses(data.classes || []));

    // Fetch announcements
    fetch("http://localhost:5000/api/announcements?board_type=student")
      .then((res) => res.json())
      .then((data) => setAnnouncements(data.announcements || []));

    // Fetch sliding scale options
    setLoadingSlidingScale(true);
    fetch("http://localhost:5000/api/sliding-scale-options?category=drop-in")
      .then((res) => res.json())
      .then((data) => {
        // Deduplicate options based on tier_name and category
        const uniqueOptions = (data.options || []).filter(
          (
            option: SlidingScaleOption,
            index: number,
            self: SlidingScaleOption[],
          ) =>
            index ===
            self.findIndex(
              (o: SlidingScaleOption) =>
                o.tier_name === option.tier_name &&
                o.category === option.category,
            ),
        );
        setSlidingScaleOptions(uniqueOptions);
        setLoadingSlidingScale(false);
      })
      .catch((error) => {
        console.error("Error fetching sliding scale options:", error);
        setLoadingSlidingScale(false);
      });
  }, []);

  // Fetch current user and enrolled classes when clerk user is available
  useEffect(() => {
    if (user) {
      console.log("🔄 Fetching user data for clerk_user_id:", user.id);
      fetch(
        `http://localhost:5000/api/users/by-clerk-id?clerk_user_id=${user.id}`,
      )
        .then((res) => res.json())
        .then((data) => {
          console.log("📊 User data response:", data);
          if (data.success) {
            setCurrentUser(data.user);
            console.log("✅ User set, fetching enrolled classes...");
            // Fetch enrolled classes for this student
            fetch(
              `http://localhost:5000/api/students/enrolled-classes?clerk_user_id=${user.id}`,
            )
              .then((res) => res.json())
              .then((enrolledData) => {
                console.log("📊 Enrolled classes response:", enrolledData);
                if (enrolledData.success) {
                  setEnrolledClasses(enrolledData.classes || []);
                  console.log(
                    "✅ Enrolled classes set:",
                    enrolledData.classes?.length || 0,
                    "classes",
                  );
                } else {
                  console.error(
                    "❌ Failed to fetch enrolled classes:",
                    enrolledData.error,
                  );
                }
              })
              .catch((error) => {
                console.error("❌ Error fetching enrolled classes:", error);
              });
          } else {
            console.error("❌ Failed to fetch user:", data.error);
          }
        })
        .catch((error) => console.error("❌ Error fetching user:", error));
    }
  }, [user]);

  // Fetch membership status on mount or when user changes
  useEffect(() => {
    async function fetchMembershipStatus() {
      if (!user?.id) return;
      try {
        const res = await fetch("http://localhost:5000/api/membership/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clerk_user_id: user.id }),
        });
        const data = await res.json();
        setMembershipStatus(data.membership);
      } catch (error) {
        console.error("Error fetching membership status:", error);
        setMembershipStatus(null);
      }
    }
    fetchMembershipStatus();
  }, [user]);

  // Filter and sort classes based on active tab
  const now = new Date();

  // Create a set of enrolled class instance IDs for quick lookup
  const enrolledInstanceIds = new Set(
    enrolledClasses.map((c) => c.instance_id),
  );

  // Studio Schedule: All upcoming classes with enrollment status
  const studioClasses = allClasses
    .filter((c) => new Date(c.start_time) > now)
    .map((c) => ({
      ...c,
      is_enrolled: enrolledInstanceIds.has(c.instance_id),
    }))
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  // Upcoming Classes: Only enrolled classes that haven't happened yet
  const upcomingClasses = enrolledClasses
    .filter((c) => new Date(c.start_time) > now)
    .sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

  // Past Classes: Only enrolled classes that have already happened
  const pastClasses = enrolledClasses
    .filter((c) => new Date(c.start_time) <= now)
    .sort(
      (a, b) =>
        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
    );

  // Debug logging
  console.log("🔍 Data Debug:", {
    totalEnrolled: enrolledClasses.length,
    upcomingCount: upcomingClasses.length,
    pastCount: pastClasses.length,
    now: now.toISOString(),
    enrolledClasses: enrolledClasses.map((c) => ({
      instance_id: c.instance_id,
      class_name: c.class_name,
      start_time: c.start_time,
      is_future: new Date(c.start_time) > now,
    })),
  });

  // Enhance classes with placeholder data
  const enhancedStudioClasses = studioClasses.map((c) => ({
    ...c,
    description: c.description || "Join us for an exciting class experience!",
    requirements: c.requirements || "No special requirements",
    recommended_attire: c.recommended_attire || "Comfortable athletic wear",
  }));

  const enhancedUpcomingClasses = upcomingClasses.map((c) => ({
    ...c,
    description: c.description || "Join us for an exciting class experience!",
    requirements: c.requirements || "No special requirements",
    recommended_attire: c.recommended_attire || "Comfortable athletic wear",
  }));

  const enhancedPastClasses = pastClasses.map((c) => ({
    ...c,
    description: c.description || "Join us for an exciting class experience!",
    requirements: c.requirements || "No special requirements",
    recommended_attire: c.recommended_attire || "Comfortable athletic wear",
  }));

  // Get current tab content
  const getTabContent = () => {
    switch (activeTab) {
      case "studio":
        return enhancedStudioClasses.length === 0 ? (
          <EmptyState>
            <h3>No upcoming classes</h3>
            <p>Check back later for new class offerings!</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={enhancedStudioClasses}
            viewType="student"
            onBookClass={handleBookClassClick}
            onCancelClass={handleCancelClass}
            emptyMessage="No upcoming classes found."
          />
        );
      case "upcoming":
        return enhancedUpcomingClasses.length === 0 ? (
          <EmptyState>
            <h3>No upcoming classes</h3>
            <p>You haven&apos;t enrolled in any upcoming classes yet.</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={enhancedUpcomingClasses}
            viewType="student"
            onBookClass={handleBookClassClick}
            onCancelClass={handleCancelClass}
            emptyMessage="You haven't enrolled in any upcoming classes yet."
          />
        );
      case "past":
        return enhancedPastClasses.length === 0 ? (
          <EmptyState>
            <h3>No past classes</h3>
            <p>You haven&apos;t taken any classes yet.</p>
          </EmptyState>
        ) : (
          <ClassScheduleList
            classes={enhancedPastClasses}
            viewType="student"
            onBookClass={handleBookClassClick}
            onCancelClass={handleCancelClass}
            emptyMessage="You haven't taken any classes yet."
          />
        );
      default:
        return null;
    }
  };

  const handleBookClassClick = async (c: ClassItem) => {
    if (!currentUser) {
      alert("Please sign in to book a class.");
      return;
    }

    // Check membership before showing payment modal
    if (membershipStatus?.has_membership) {
      // Book the class directly (call backend API)
      try {
        const response = await fetch(
          "http://localhost:5000/api/studio-classes/book",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clerk_user_id: currentUser.clerk_user_id,
              instance_id: c.instance_id,
            }),
          },
        );
        const data = await response.json();
        if (data.success) {
          // Show confirmation modal
          setShowSuccessModal(true);
          setTimeout(() => setShowSuccessModal(false), 2000);
          // Optionally refresh enrolled classes
          await refreshEnrolledClasses();
        } else {
          alert("Failed to book class: " + (data.error || "Unknown error"));
        }
      } catch (error) {
        console.error("Error booking class:", error);
        alert("Failed to book class. Please try again.");
      }
      return;
    }

    // If no membership, show payment modal as before
    if (loadingSlidingScale) {
      alert(
        "Payment options are still loading. Please wait a moment and try again.",
      );
      return;
    }

    if (slidingScaleOptions.length === 0) {
      alert("No payment options available. Please try again later.");
      return;
    }

    setSelectedClass(c);
    setSelectedOption(null);
    setSelectedAmount(0);
    setPaymentError("");
    setShowPaymentModal(true);
  };

  const handlePaymentContinue = async () => {
    if (!currentUser || !selectedClass) {
      return;
    }

    // Validate selection
    if (!selectedOption) {
      setPaymentError("Please select a payment tier");
      return;
    }

    if (selectedAmount <= 0) {
      setPaymentError("Please select a valid payment amount");
      return;
    }

    setPaymentLoading(true);
    setPaymentError("");

    try {
      const response = await fetch(
        "http://localhost:5000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            student_id: currentUser.id,
            option_id: selectedOption?.id || null,
            class_name: selectedClass.class_name,
            instance_id: selectedClass.instance_id,
            custom_amount: selectedAmount,
          }),
        },
      );

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setPaymentError(
          "Failed to create checkout session: " +
            (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      setPaymentError("Failed to create checkout session. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleTierSelect = (option: SlidingScaleOption) => {
    setSelectedOption(option);
    // Start at the middle of the price range instead of max
    const middlePrice = Math.round((option.price_min + option.price_max) / 2);
    setSelectedAmount(middlePrice);
    setPaymentError("");
  };

  const handleAmountChange = (amount: number) => {
    setSelectedAmount(amount);
    setPaymentError("");
  };

  const isPaymentValid = () => {
    return selectedOption && selectedAmount > 0;
  };

  const handleCancelClass = async (c: ClassItem) => {
    if (!user) {
      alert("Please log in to cancel classes.");
      return;
    }

    // Show cancel confirmation modal
    setClassToCancel(c);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (!classToCancel || !user) {
      setShowCancelModal(false);
      setClassToCancel(null);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/students/cancel-enrollment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clerk_user_id: user.id,
            instance_id: classToCancel.instance_id,
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        // Show success message briefly
        setSuccessLoading(true);
        setShowCancelModal(false);
        setClassToCancel(null);

        // Refresh the enrolled classes data
        await refreshEnrolledClasses();

        // Show success modal
        setShowSuccessModal(true);
        setTimeout(() => {
          setShowSuccessModal(false);
          setSuccessLoading(false);
        }, 2000);
      } else {
        alert(`Error cancelling class: ${data.error}`);
        setShowCancelModal(false);
        setClassToCancel(null);
      }
    } catch (error) {
      console.error("Error cancelling class:", error);
      alert("Failed to cancel class. Please try again.");
      setShowCancelModal(false);
      setClassToCancel(null);
    }
  };

  return (
    <>
      <DashboardContainer>
        {/* Left Side - Class Schedule */}
        <ScheduleContainer>
          {isMounted ? (
            <TabContainer>
              <TabHeader>
                <TabButton
                  active={activeTab === "studio"}
                  onClick={() => setActiveTab("studio")}>
                  Studio Schedule
                </TabButton>
                <TabButton
                  active={activeTab === "upcoming"}
                  onClick={() => setActiveTab("upcoming")}>
                  Upcoming Classes
                </TabButton>
                <TabButton
                  active={activeTab === "past"}
                  onClick={() => setActiveTab("past")}>
                  Past Classes
                </TabButton>
                <button
                  onClick={handleManualRefresh}
                  disabled={refreshingData}
                  style={{
                    marginLeft: "auto",
                    padding: "8px 16px",
                    background: "#805ad5",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: refreshingData ? "not-allowed" : "pointer",
                    fontSize: "12px",
                    opacity: refreshingData ? 0.6 : 1,
                  }}>
                  {refreshingData ? "Refreshing..." : "🔄 Refresh"}
                </button>
              </TabHeader>
              <TabContent>{getTabContent()}</TabContent>
            </TabContainer>
          ) : (
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "24px",
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
              }}>
              <div style={{ color: "#718096" }}>Loading...</div>
            </div>
          )}
        </ScheduleContainer>

        {/* Right Side - Membership + Bulletin Board */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: "0 0 320px",
            minWidth: 0,
          }}>
          <MembershipBox />
          <BulletinContainer>
            <BulletinTitle>Bulletin Board</BulletinTitle>
            {announcements.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#718096",
                  padding: "20px",
                }}>
                <p>No announcements at this time.</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <BulletinItem key={announcement.id}>
                  <BulletinItemTitle>{announcement.title}</BulletinItemTitle>
                  <BulletinItemBody>{announcement.body}</BulletinItemBody>
                  <BulletinItemDate>
                    {new Date(announcement.date_created).toLocaleDateString()}
                  </BulletinItemDate>
                </BulletinItem>
              ))
            )}
          </BulletinContainer>
        </div>
      </DashboardContainer>

      {/* Payment Modal */}
      {showPaymentModal && (
        <ModalOverlay onClick={() => setShowPaymentModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <CloseButton onClick={() => setShowPaymentModal(false)}>
                &times;
              </CloseButton>
              <ModalTitle>Select Your Payment Tier</ModalTitle>
              <ModalSubtitle>
                Choose the payment tier that works best for your financial
                situation
              </ModalSubtitle>
            </ModalHeader>

            <div style={{ flex: 1, overflowY: "auto", marginBottom: "32px" }}>
              {loadingSlidingScale ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#718096",
                  }}>
                  <p>Loading payment options...</p>
                </div>
              ) : slidingScaleOptions.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#718096",
                  }}>
                  <p>No payment options available. Please try again later.</p>
                </div>
              ) : (
                slidingScaleOptions.map((option) => (
                  <TierCard
                    key={option.id}
                    selected={selectedOption?.id === option.id}
                    onClick={() => handleTierSelect(option)}>
                    <TierHeader>
                      <TierName>{option.tier_name}</TierName>
                      <TierPriceRange>
                        ${option.price_min} - ${option.price_max}
                      </TierPriceRange>
                    </TierHeader>
                    <TierDescription>{option.description}</TierDescription>
                    <SliderContainer>
                      <SliderLabel>
                        <SliderValue>
                          $
                          {selectedOption?.id === option.id
                            ? selectedAmount
                            : Math.round(
                                (option.price_min + option.price_max) / 2,
                              )}
                        </SliderValue>
                        <SliderRange>
                          ${option.price_min} - ${option.price_max}
                        </SliderRange>
                      </SliderLabel>
                      <Slider
                        type="range"
                        min={option.price_min}
                        max={option.price_max}
                        step={1}
                        value={
                          selectedOption?.id === option.id
                            ? selectedAmount
                            : Math.round(
                                (option.price_min + option.price_max) / 2,
                              )
                        }
                        onChange={(e) => {
                          const newAmount = parseInt(e.target.value);
                          if (selectedOption?.id === option.id) {
                            handleAmountChange(newAmount);
                          } else {
                            // If this tier is not selected, select it and set the amount
                            setSelectedOption(option);
                            setSelectedAmount(newAmount);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (selectedOption?.id !== option.id) {
                            handleTierSelect(option);
                          }
                        }}
                      />
                    </SliderContainer>
                  </TierCard>
                ))
              )}

              {paymentError && <ErrorMessage>{paymentError}</ErrorMessage>}
            </div>

            <ModalActions>
              <ModalButton onClick={() => setShowPaymentModal(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                primary
                disabled={!isPaymentValid()}
                loading={paymentLoading}
                onClick={handlePaymentContinue}>
                {paymentLoading ? (
                  <>
                    <LoadingSpinner />
                    Processing...
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModalOverlay onClick={() => setShowSuccessModal(false)}>
          <SuccessModalContent onClick={(e) => e.stopPropagation()}>
            {successLoading ? (
              <>
                <LoadingSpinner />
                <SuccessTitle>Processing Payment...</SuccessTitle>
                <SuccessMessage>
                  Please wait while we verify your payment and update your
                  schedule.
                </SuccessMessage>
              </>
            ) : (
              <>
                <SuccessIcon>✅</SuccessIcon>
                <SuccessTitle>Class Booked!</SuccessTitle>
                <SuccessMessage>
                  Your class has been booked successfully! You can view it in
                  your upcoming classes.
                </SuccessMessage>
                <SuccessButton onClick={() => setShowSuccessModal(false)}>
                  Continue
                </SuccessButton>
              </>
            )}
          </SuccessModalContent>
        </SuccessModalOverlay>
      )}

      {/* Global Loading Overlay */}
      {refreshingData && (
        <LoadingOverlay>
          <LoadingContent>
            <LoadingSpinner />
            <div
              style={{ fontSize: "16px", color: "#4a5568", marginTop: "16px" }}>
              Updating your schedule...
            </div>
          </LoadingContent>
        </LoadingOverlay>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && classToCancel && (
        <ModalOverlay onClick={() => setShowCancelModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <CloseButton onClick={() => setShowCancelModal(false)}>
                &times;
              </CloseButton>
              <ModalTitle>Cancel Class Enrollment</ModalTitle>
              <ModalSubtitle>
                Are you sure you want to cancel your enrollment in &quot;
                {classToCancel.class_name}&quot;?
              </ModalSubtitle>
            </ModalHeader>

            <div style={{ flex: 1, marginBottom: "32px" }}>
              <div style={{ textAlign: "center", padding: "20px" }}>
                <p style={{ color: "#4a5568", marginBottom: "16px" }}>
                  This action cannot be undone. You will need to re-enroll if
                  you change your mind.
                </p>
                <div
                  style={{
                    background: "#f7fafc",
                    padding: "16px",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}>
                  <strong>Class Details:</strong>
                  <br />
                  {classToCancel.class_name}
                  <br />
                  {formatClassDate(classToCancel.start_time)} at{" "}
                  {formatClassTime(
                    classToCancel.start_time,
                    classToCancel.duration,
                  )}
                </div>
              </div>
            </div>

            <ModalActions>
              <ModalButton onClick={() => setShowCancelModal(false)}>
                Keep Enrollment
              </ModalButton>
              <ModalButton
                primary
                onClick={handleConfirmCancel}
                style={{ background: "#e53e3e" }}>
                Cancel Enrollment
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </>
  );
}
