import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useUser } from "@clerk/nextjs";
import ClassScheduleList from "../../components/ClassScheduleList";
import Schedule from "../../components/Schedule";

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

// Main Layout
const DashboardContainer = styled.div`
  display: flex;
  gap: 32px;
  padding: 32px;
  max-width: 1400px;
  margin: 0 auto;

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 16px;
  }
`;

// Left Side - Class Schedule (70%)
const ScheduleContainer = styled.div`
  flex: 0 0 70%;
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

// Right Side - Bulletin Board (30%)
const BulletinContainer = styled.div`
  flex: 0 0 30%;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  height: fit-content;
  max-height: 80vh;
  overflow-y: auto;

  @media (max-width: 768px) {
    flex: 1;
    max-height: none;
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

// Class Card
const ClassCard = styled.div<{ isPast: boolean }>`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  opacity: ${({ isPast }) => (isPast ? 0.6 : 1)};

  &:hover {
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transform: ${({ isPast }) => (isPast ? "none" : "translateY(-2px)")};
  }
`;

const ClassCardContent = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
  }
`;

const DateTimeSection = styled.div`
  flex: 0 0 140px;
  text-align: center;

  @media (max-width: 768px) {
    flex: none;
    text-align: left;
  }
`;

const DateText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #805ad5;
  margin-bottom: 4px;
`;

const TimeText = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
`;

const ClassInfoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ClassName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
`;

const InstructorName = styled.div`
  font-size: 14px;
  color: #805ad5;
  font-weight: 600;
`;

const ClassDescription = styled.div`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
`;

const ClassDetails = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 8px;
`;

const DetailItem = styled.div`
  font-size: 12px;
  color: #718096;

  strong {
    color: #4a5568;
  }
`;

const ActionSection = styled.div`
  flex: 0 0 120px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;

  @media (max-width: 768px) {
    flex: none;
    align-items: stretch;
  }
`;

const BookButton = styled.button<{ disabled?: boolean }>`
  background: ${({ disabled }) => (disabled ? "#cbd5e0" : "#805ad5")};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: ${({ disabled }) => (disabled ? "#cbd5e0" : "#6b46c1")};
    transform: ${({ disabled }) => (disabled ? "none" : "translateY(-1px)")};
  }
`;

const CancelButton = styled.button`
  background: #e53e3e;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;

  &:hover {
    background: #c53030;
    transform: translateY(-1px);
  }
`;

const EnrolledBadge = styled.div`
  background: #48bb78;
  color: white;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
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
  color: #4a5568;
  margin: 0;
`;

// Tabbed Modal Container - UNUSED
/*
const ModalTabContainer = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 32px;
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ModalTabHeader = styled.div`
  display: flex;
  background: #f1f3f4;
  border-bottom: 1px solid #e2e8f0;
`;

const ModalTabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 16px 20px;
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

const ModalTabContent = styled.div`
  padding: 24px;
  flex: 1;
  overflow-y: auto;
`;
*/

// Sliding Scale Components
const TierCard = styled.div<{ selected: boolean }>`
  background: ${({ selected }) => (selected ? "#f7fafc" : "white")};
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  border: 2px solid ${({ selected }) => (selected ? "#805ad5" : "#e2e8f0")};
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: #805ad5;
    background: #f7fafc;
  }

  &:last-child {
    margin-bottom: 0;
  }

  ${({ selected }) =>
    selected &&
    `
    box-shadow: 0 4px 12px rgba(128, 90, 213, 0.2);
  `}
`;

const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TierName = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
`;

const TierPriceRange = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #805ad5;
`;

const TierDescription = styled.div`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.6;
  margin-bottom: 20px;
`;

const SliderContainer = styled.div`
  margin-bottom: 16px;
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
  color: #805ad5;
`;

const SliderRange = styled.div`
  font-size: 12px;
  color: #718096;
`;

const Slider = styled.input`
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #e2e8f0;
  outline: none;
  -webkit-appearance: none;
  appearance: none;

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

  &:hover::-webkit-slider-thumb {
    background: #6b46c1;
  }

  &:hover::-moz-range-thumb {
    background: #6b46c1;
  }
`;

const ErrorMessage = styled.div`
  color: #e53e3e;
  font-size: 14px;
  margin-top: 8px;
  text-align: center;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
`;

const ModalButton = styled.button<{
  primary?: boolean;
  disabled?: boolean;
  loading?: boolean;
}>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: ${({ disabled, loading }) =>
    disabled || loading ? "not-allowed" : "pointer"};
  transition: all 0.2s ease;
  min-width: 120px;
  position: relative;

  ${({ primary, disabled, loading }) =>
    primary
      ? `
    background: ${disabled || loading ? "#cbd5e0" : "#805ad5"};
    color: white;
    &:hover {
      background: ${disabled || loading ? "#cbd5e0" : "#6b46c1"};
      transform: ${disabled || loading ? "none" : "translateY(-1px)"};
    }
  `
      : `
    background: transparent;
    color: #4a5568;
    border: 1px solid #e2e8f0;
    &:hover {
      background: #f7fafc;
      border-color: #cbd5e0;
    }
  `}
`;

// Bulletin Board
const BulletinTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 20px 0;
`;

const BulletinItem = styled.div`
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const BulletinItemTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

const BulletinItemBody = styled.div`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 8px;
`;

const BulletinItemDate = styled.div`
  font-size: 12px;
  color: #a0aec0;
`;

// Empty State
const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #718096;
  background: #f7fafc;
  border-radius: 12px;
  border: 2px dashed #e2e8f0;

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

// Success Modal Components
const SuccessModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
`;

const SuccessModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;

const SuccessIcon = styled.div`
  width: 80px;
  height: 80px;
  background: #48bb78;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 40px;
  color: white;
`;

const SuccessTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 16px 0;
`;

const SuccessMessage = styled.p`
  font-size: 16px;
  color: #4a5568;
  margin: 0 0 32px 0;
  line-height: 1.5;
`;

const SuccessButton = styled.button`
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 120px;

  &:hover {
    background: #38a169;
    transform: translateY(-1px);
  }
`;

// Loading Spinner Component
const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #805ad5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
`;

const LoadingContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const LoadingText = styled.div`
  font-size: 16px;
  color: #4a5568;
  margin-top: 16px;
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

  const handleBookClassClick = (c: ClassItem) => {
    if (!currentUser) {
      alert("Please sign in to book a class.");
      return;
    }

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

        {/* Right Side - Bulletin Board */}
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
                <SuccessTitle>Payment Successful!</SuccessTitle>
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
            <LoadingText>Updating your schedule...</LoadingText>
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
