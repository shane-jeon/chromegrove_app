import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import ClassScheduleList from "../../components/ClassScheduleList";
import MembershipBox from "../../components/MembershipBox";
import ClassCreditBox from "../../components/ClassCreditBox";
import BulletinBoard, {
  type AnnouncementItem,
} from "../../components/BulletinBoard";
import LoadingSpinner from "../../components/LoadingSpinner";
import Schedule from "../../components/Schedule";
import {
  DashboardContainer,
  ScheduleContainer,
  RightSideContainer,
  TabContainer,
  TabHeader,
  TabButton,
  TabContent,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  CloseButton,
  ModalTitle,
  ModalSubtitle,
  ErrorMessage,
  ModalActions,
  ModalButton,
  SuccessModalOverlay,
  SuccessModalContent,
  SuccessIcon,
  SuccessTitle,
  SuccessMessage,
  SuccessButton,
  LoadingOverlay,
  LoadingContent,
} from "../../styles/StudentDashboardStyles";
import EmptyState from "../../components/EmptyState";
import TierCard from "../../components/TierCard";
// import SuccessModal from "../../components/SuccessModal";

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

interface SlidingScaleOption {
  id: number;
  tier_name: string;
  price_min: number;
  price_max: number;
  description: string;
  category: string;
  stripe_price_id?: string;
}

// Type for selected option that can be either a ClassItem or SlidingScaleOption
type SelectedOptionType = ClassItem | SlidingScaleOption;

// Type guards
function isSlidingScaleOption(
  option: SelectedOptionType | null | undefined,
): option is SlidingScaleOption {
  return !!option && "tier_name" in option && "price_min" in option;
}

interface User {
  id: number;
  clerk_user_id: string;
  email: string;
  role: string;
  type: string;
  name: string;
}

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

// console.log("🟢 student.tsx loaded");

export default function StudentDashboard() {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  const [allClasses, setAllClasses] = useState<ClassItem[]>([]);
  const [enrolledClasses, setEnrolledClasses] = useState<ClassItem[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("studio");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [slidingScaleOptions, setSlidingScaleOptions] = useState<
    SlidingScaleOption[]
  >([]);
  const [loadingSlidingScale, setLoadingSlidingScale] = useState(false);
  const [selectedOption, setSelectedOption] =
    useState<SelectedOptionType | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [selectedClassForPayment, setSelectedClassForPayment] =
    useState<ClassItem | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalTriggeredByBooking, setPaymentModalTriggeredByBooking] =
    useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [successModalContent, setSuccessModalContent] = useState<{
    title: string;
    message: string;
    subMessage?: string;
  } | null>(null);
  const [refreshingData, setRefreshingData] = useState(false);
  const [classToCancel, setClassToCancel] = useState<ClassItem | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedClassForCredit, setSelectedClassForCredit] =
    useState<ClassItem | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditRefreshTrigger, setCreditRefreshTrigger] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showBookingSuccessModal = (
    paymentType: "credit" | "membership" | "staff" | "drop-in",
    remainingCredits?: number,
  ) => {
    let content;

    switch (paymentType) {
      case "credit":
        content = {
          title: "You're booked for this class",
          message: "1 class credit was used for this booking.",
          subMessage:
            remainingCredits !== undefined
              ? `You now have ${remainingCredits} credit${
                  remainingCredits !== 1 ? "s" : ""
                } remaining.`
              : undefined,
        };
        break;
      case "membership":
        content = {
          title: "Booking confirmed",
          message: "This class has been booked using your active membership.",
          subMessage:
            "Cancel at least 6 hours before class to avoid a $15 fee.",
        };
        break;
      case "staff":
        content = {
          title: "Booking confirmed",
          message: "This class has been booked using your staff membership.",
          subMessage:
            "Attendance will be logged differently for staff bookings.",
        };
        break;
      case "drop-in":
        content = {
          title: "You're booked for this class",
          message: "Thank you for your payment. You are now registered.",
          subMessage: "A confirmation email has been sent.",
        };
        break;
      default:
        content = {
          title: "Class Booked!",
          message:
            "Your class has been booked successfully! You can view it in your upcoming classes.",
        };
    }

    setSuccessModalContent(content);
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      setSuccessLoading(false);
    }, 2000);
  };

  const showCancellationSuccessModal = (
    paymentType: "credit" | "membership" | "staff" | "drop-in",
    remainingCredits?: number,
  ) => {
    let content;

    switch (paymentType) {
      case "credit":
        content = {
          title: "Cancel Processing...",
          message: "Your class credit has been restored.",
          subMessage:
            remainingCredits !== undefined
              ? `You now have ${remainingCredits} credit${
                  remainingCredits !== 1 ? "s" : ""
                } available.`
              : "You can use this credit for future bookings.",
        };
        break;
      case "membership":
        content = {
          title: "Cancel Processing...",
          message: "You've successfully canceled your class.",
          subMessage:
            "This class has been removed from your schedule. Please cancel at least 6 hours in advance to avoid a fee.",
        };
        break;
      case "staff":
        content = {
          title: "Cancel Processing...",
          message: "You've successfully canceled your class.",
          subMessage: "This class has been removed from your schedule.",
        };
        break;
      case "drop-in":
        content = {
          title: "Cancel Processing...",
          message:
            "You've successfully canceled your class. A class credit has been added to your account.",
          subMessage: "You can use this credit for future bookings.",
        };
        break;
      default:
        content = {
          title: "Cancel Processing...",
          message: "You've successfully canceled your class.",
          subMessage: "This class has been removed from your schedule.",
        };
    }

    setSuccessModalContent(content);
    setShowSuccessModal(true);

    // For all cancellations, show loading state briefly to simulate processing
    setSuccessLoading(true);
    setTimeout(() => {
      setSuccessLoading(false);
    }, 1500);

    setTimeout(() => {
      setShowSuccessModal(false);
      setSuccessLoading(false);
    }, 2000);
  };

  console.log("🟢 student.tsx loaded");

  useEffect(() => {
    console.log("🏗️ Component mount effect running");
    setMounted(true);
  }, []);

  // Reset payment modal state when user changes
  useEffect(() => {
    console.log("👤 User change effect running, user:", user?.id);
    if (user) {
      console.log("👤 User changed, resetting payment modal state");
      setShowPaymentModal(false);
      setPaymentModalTriggeredByBooking(false);
      setSelectedOption(null);
      setSelectedClassForPayment(null);
      setSelectedAmount(0);
      setPaymentError(null);
    }
  }, [user]);

  // Reset payment modal if it's shown without being triggered by booking
  useEffect(() => {
    console.log("🔍 Payment modal validation effect running");
    if (showPaymentModal && !paymentModalTriggeredByBooking) {
      console.log("🚨 Payment modal shown without booking trigger - resetting");
      setShowPaymentModal(false);
      setSelectedOption(null);
      setSelectedClassForPayment(null);
      setSelectedAmount(0);
      setPaymentError(null);
    }
  }, [showPaymentModal, paymentModalTriggeredByBooking]);

  // Handle URL parameters for payment success
  useEffect(() => {
    console.log("🔗 URL parameter check effect running");
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");
    const membershipStatus = urlParams.get("membership");

    console.log("🔍 URL params check:", {
      paymentStatus,
      sessionId,
      membershipStatus,
    });

    if (paymentStatus === "success" && sessionId) {
      console.log("🚨 URL parameters detected during cancellation flow!");
      console.log("🚨 This suggests a redirect from a payment flow");
      console.log("🚨 Current URL:", window.location.href);
      console.log("URL parameters stack trace");
      console.trace();

      // Check if we're in a cancellation flow
      if (showCancelModal) {
        console.log("❌ Not showing payment success modal during cancellation");
        console.log("❌ Not showing payment success modal:", {
          paymentStatus,
          sessionId,
          alreadyProcessed: "true",
          showCancelModal,
        });
        // Clear URL parameters to prevent them from persisting
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        console.log("🧹 Cleared URL parameters to prevent persistence");
        return;
      }

      // Check if we've already processed this session
      const processedSessions = JSON.parse(
        localStorage.getItem("processedPaymentSessions") || "[]",
      );
      if (processedSessions.includes(sessionId)) {
        console.log("❌ Payment session already processed, not showing modal");
        // Clear URL parameters
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
        return;
      }

      console.log("✅ Showing payment success modal");
      setShowSuccessModal(true);

      // Mark session as processed
      processedSessions.push(sessionId);
      localStorage.setItem(
        "processedPaymentSessions",
        JSON.stringify(processedSessions),
      );

      // Clear URL parameters after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      console.log("🧹 Cleared URL parameters after processing");
    } else if (membershipStatus === "success" && sessionId) {
      console.log("✅ Showing membership success modal");
      setShowSuccessModal(true);

      // Mark session as processed
      const processedSessions = JSON.parse(
        localStorage.getItem("processedPaymentSessions") || "[]",
      );
      processedSessions.push(sessionId);
      localStorage.setItem(
        "processedPaymentSessions",
        JSON.stringify(processedSessions),
      );

      // Clear URL parameters after processing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, [showCancelModal]); // Add showCancelModal as dependency

  const refreshEnrolledClasses = async () => {
    console.log("🔄 refreshEnrolledClasses called, user:", user?.id);
    if (!user) {
      console.log("❌ No user, skipping refresh");
      return;
    }

    setRefreshingData(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/students/enrolled-classes?clerk_user_id=${user.id}`,
      );
      const data = await response.json();
      if (data.success) {
        setEnrolledClasses(data.classes || []);
        setErrorMessage(null);
        console.log(
          "✅ Enrolled classes refreshed:",
          data.classes?.length || 0,
          "classes",
        );
      } else {
        setEnrolledClasses([]);
        setErrorMessage(
          data.error ||
            "No classes found for your account. Please contact support if this is unexpected.",
        );
        console.error("❌ Failed to refresh enrolled classes:", data.error);
      }
    } catch (error) {
      setEnrolledClasses([]);
      setErrorMessage(
        "Failed to load your classes. Please check your connection or contact support.",
      );
      console.error("❌ Error refreshing enrolled classes:", error);
    } finally {
      setRefreshingData(false);
    }
  };

  // Manual refresh function
  const handleManualRefresh = async () => {
    console.log("🔄 handleManualRefresh called");
    setRefreshingData(true);
    try {
      // Refresh all classes
      const allClassesResponse = await fetch(
        "http://localhost:5000/api/studio-classes/list",
      );
      const allClassesData = await allClassesResponse.json();
      setAllClasses(allClassesData.classes || []);

      // Refresh enrolled classes
      await refreshEnrolledClasses();

      console.log("✅ All data refreshed successfully");
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setRefreshingData(false);
    }
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
                  setEnrolledClasses([]);
                  setErrorMessage(
                    enrolledData.error ||
                      "No classes found for your account. Please contact support if this is unexpected.",
                  );
                  console.error(
                    "❌ Failed to fetch enrolled classes:",
                    enrolledData.error,
                  );
                }
              })
              .catch((error) => {
                setEnrolledClasses([]);
                setErrorMessage(
                  "Failed to load your classes. Please check your connection or contact support.",
                );
                console.error("❌ Error fetching enrolled classes:", error);
              });

            // Note: Credit fetching is now handled by ClassCreditBox component
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
          <Schedule
            classes={enhancedStudioClasses}
            role="student"
            onBookClass={handleBookClassClick}
            onCancelClass={handleCancelClass}
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
    console.log("handleBookClassClick called", c);
    if (!currentUser) {
      alert("Please sign in to book a class.");
      return;
    }

    // Log the user and intended booking
    console.log("[Booking] Current user object:", currentUser);
    console.log("[Booking] Attempting to book class:", c);

    // Check membership eligibility first
    try {
      const eligibilityPayload = {
        clerk_user_id: currentUser.clerk_user_id,
        instance_id: c.instance_id,
      };
      console.log(
        "[Booking] Sending eligibility check payload:",
        eligibilityPayload,
      );
      const eligibilityResponse = await fetch(
        "http://localhost:5000/api/studio-classes/check-eligibility",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(eligibilityPayload),
        },
      );

      const eligibilityData = await eligibilityResponse.json();
      console.log("[Booking] Eligibility response:", eligibilityData);

      if (eligibilityData.success) {
        const bookingEligibility = eligibilityData.booking_eligibility;
        console.log("[Booking] Booking eligibility:", bookingEligibility);

        if (
          bookingEligibility.can_book_free &&
          !bookingEligibility.requires_payment
        ) {
          // Student has active membership - book directly
          console.log(
            "[Booking] Student has active membership, booking directly",
          );
          const bookingResponse = await fetch(
            "http://localhost:5000/api/studio-classes/book",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                clerk_user_id: currentUser.clerk_user_id,
                instance_id: c.instance_id,
                payment_type: "membership",
              }),
            },
          );

          const bookingData = await bookingResponse.json();
          console.log("[Booking] Membership booking response:", bookingData);

          if (bookingData.success) {
            showBookingSuccessModal("membership");
            await handleManualRefresh();
            return; // Exit early - booking successful
          } else {
            alert(
              "Failed to book class: " + (bookingData.error || "Unknown error"),
            );
            return; // Exit early - booking failed
          }
        }
      } else {
        console.log(
          "[Booking] Eligibility check failed:",
          eligibilityData.error,
        );
      }
    } catch (error) {
      console.error("[Booking] Error checking eligibility:", error);
    }

    // If we get here, either no membership or outside membership window
    // Check if student has available credits
    try {
      const creditResponse = await fetch(
        `http://localhost:5000/api/credits/student?clerk_user_id=${currentUser.clerk_user_id}`,
      );
      const creditData = await creditResponse.json();

      if (creditData.success && creditData.credit_count > 0) {
        // Student has credits - show credit booking modal
        console.log("[Booking] Student has credits, showing credit modal");
        setSelectedClassForCredit(c);
        setShowCreditModal(true);
        return;
      }
    } catch (error) {
      console.error("[Booking] Error checking credits:", error);
    }

    // No membership and no credits - show drop-in payment modal
    console.log(
      "[Booking] No membership or credits, showing drop-in payment modal",
    );
    setSelectedClassForPayment(c);
    setPaymentModalTriggeredByBooking(true);
    setShowPaymentModal(true);
  };

  const handlePaymentContinue = async () => {
    console.log("💰 [handlePaymentContinue] 🔍 Called");
    console.log("💰 [handlePaymentContinue] 📋 Current state:");
    console.log("💰 [handlePaymentContinue] 📋   - currentUser:", currentUser);
    console.log(
      "💰 [handlePaymentContinue] 📋   - selectedOption:",
      selectedOption,
    );
    console.log(
      "💰 [handlePaymentContinue] 📋   - selectedAmount:",
      selectedAmount,
    );

    if (!currentUser || !selectedOption) {
      console.log(
        "💰 [handlePaymentContinue] ❌ Missing currentUser or selectedOption",
      );
      return;
    }

    // Validate selection
    if (!selectedOption) {
      console.log("💰 [handlePaymentContinue] ❌ No selectedOption");
      setPaymentError("Please select a payment tier");
      return;
    }

    if (selectedAmount <= 0) {
      console.log(
        "💰 [handlePaymentContinue] ❌ Invalid selectedAmount:",
        selectedAmount,
      );
      setPaymentError("Please select a valid payment amount");
      return;
    }

    console.log(
      "💰 [handlePaymentContinue] ✅ Validation passed, starting payment process",
    );
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      // Use type guards to safely access properties
      const optionId = isSlidingScaleOption(selectedOption)
        ? selectedOption.id
        : null;
      const className = selectedClassForPayment?.class_name || "";
      const instanceId = selectedClassForPayment?.instance_id || "";

      const requestBody = {
        student_id: currentUser.id,
        option_id: optionId,
        class_name: className,
        instance_id: instanceId,
        custom_amount: selectedAmount,
      };

      console.log(
        "💰 [handlePaymentContinue] 📤 Sending request to /create-checkout-session",
      );
      console.log("💰 [handlePaymentContinue] 📤 Request body:", requestBody);

      const response = await fetch(
        "http://localhost:5000/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      console.log("💰 [handlePaymentContinue] 📥 Response received");
      const data = await response.json();
      console.log("💰 [handlePaymentContinue] 📥 Response data:", data);
      // Log Stripe session creation for drop-in
      if (data.success && data.url) {
        console.log("Stripe session created with drop-in rate:", data);
        console.log(
          "Class ID:",
          selectedClassForPayment?.instance_id,
          "User ID:",
          currentUser.id,
        );
        console.log("Redirecting to Stripe checkout...");
        window.location.href = data.url;
      } else {
        console.log(
          "💰 [handlePaymentContinue] ❌ Failed to create checkout session",
        );
        console.log("💰 [handlePaymentContinue] ❌ Error:", data.error);
        setPaymentError(
          "Failed to create checkout session: " +
            (data.error || "Unknown error"),
        );
      }
    } catch (error) {
      console.error(
        "💰 [handlePaymentContinue] ❌ Error creating checkout session:",
        error,
      );
      setPaymentError("Failed to create checkout session. Please try again.");
    } finally {
      console.log("💰 [handlePaymentContinue] 🏁 Payment process completed");
      setPaymentLoading(false);
    }
    console.log("💰 [handlePaymentContinue] 🏁 Function end");
  };

  const handleTierSelect = (option: SlidingScaleOption) => {
    setSelectedOption(option);
    // Only reset amount if switching to a new tier
    if (
      !selectedOption ||
      (isSlidingScaleOption(selectedOption) && selectedOption.id !== option.id)
    ) {
      const middlePrice = Math.round((option.price_min + option.price_max) / 2);
      setSelectedAmount(middlePrice);
    }
    setPaymentError(null);
  };

  const isPaymentValid = () => {
    return selectedOption && selectedAmount > 0;
  };

  const handleCancelClass = async (c: ClassItem) => {
    console.log("handleCancelClass called", c);
    if (!user) {
      alert("Please log in to cancel classes.");
      return;
    }

    console.log("🚫 Cancelling class:", c.class_name, c.instance_id);

    // Ensure payment modal is closed when cancelling
    setShowPaymentModal(false);
    setPaymentModalTriggeredByBooking(false);
    setSelectedOption(null);
    setSelectedClassForPayment(null);
    setSelectedAmount(0);
    setPaymentError(null);

    // Show cancel confirmation modal
    setClassToCancel(c);
    setShowCancelModal(true);
    console.log("handleCancelClass end");
  };

  const handleConfirmCancel = async () => {
    console.log("handleConfirmCancel called");
    if (!classToCancel || !user) {
      setShowCancelModal(false);
      setClassToCancel(null);
      return;
    }

    console.log("✅ Confirming cancellation for:", classToCancel.class_name);
    console.log("🔍 Current URL before cancellation:", window.location.href);

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
      console.log("📊 Cancellation response:", data);

      if (data.success) {
        console.log("✅ Cancellation successful");
        console.log(
          "🔍 URL after cancellation response:",
          window.location.href,
        );

        // Show success message briefly
        setSuccessLoading(true);
        setShowCancelModal(false);
        setClassToCancel(null);

        // Ensure payment modal is still closed
        setShowPaymentModal(false);
        setPaymentModalTriggeredByBooking(false);
        setSelectedOption(null);
        setSelectedClassForPayment(null);
        setSelectedAmount(0);
        setPaymentError(null);

        // Refresh all class data to update capacity
        await handleManualRefresh();

        // Get remaining credits if this was a credit booking
        let remainingCredits: number | undefined;
        if (classToCancel.payment_type === "credit") {
          try {
            const creditResponse = await fetch(
              `http://localhost:5000/api/credits/student?clerk_user_id=${user.id}`,
            );
            const creditData = await creditResponse.json();
            if (creditData.success) {
              remainingCredits = creditData.credit_count;
            }
          } catch (error) {
            console.error("Error fetching credits:", error);
          }
        }

        // If this was a drop-in class, refresh credits
        if (classToCancel.payment_type === "drop-in") {
          console.log("🔄 Refreshing credits after drop-in cancellation");
          setCreditRefreshTrigger((prev) => prev + 1);
        }

        // Show appropriate cancellation success modal
        const paymentType =
          (classToCancel.payment_type as
            | "credit"
            | "membership"
            | "staff"
            | "drop-in") ||
          (data.payment_type as
            | "credit"
            | "membership"
            | "staff"
            | "drop-in") ||
          "drop-in";
        showCancellationSuccessModal(paymentType, remainingCredits);
      } else {
        console.error("❌ Cancellation failed:", data.error);
        alert(`Error cancelling class: ${data.error}`);
        setShowCancelModal(false);
        setClassToCancel(null);
      }
    } catch (error) {
      console.error("❌ Error cancelling class:", error);
      alert("Failed to cancel class. Please try again.");
      setShowCancelModal(false);
      setClassToCancel(null);
    }
    console.log("handleConfirmCancel end");
  };

  // Cleanup effect to reset payment modal state
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      console.log("🧹 Component unmounting - resetting payment modal state");
      setShowPaymentModal(false);
      setPaymentModalTriggeredByBooking(false);
      setSelectedOption(null);
      setSelectedClassForPayment(null);
      setSelectedAmount(0);
      setPaymentError(null);
    };
  }, []);

  // Add setShowPaymentModalDebugStack
  const setShowPaymentModalDebugStack = (val: boolean) => {
    setShowPaymentModal(val);
    if (val) {
      console.log("setShowPaymentModal(true) called");
      console.trace("setShowPaymentModal(true) stack trace");
    } else {
      console.log("setShowPaymentModal(false) called");
    }
  };

  // Check for Stripe payment success in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get("payment");
    const sessionId = urlParams.get("session_id");
    if (paymentStatus === "success" && sessionId) {
      console.log("Returned from Stripe. Payment status:", paymentStatus);
      console.log(
        "Attempting to confirm booking for:",
        currentUser?.clerk_user_id,
        selectedClassForPayment?.instance_id,
      );

      // Show drop-in success modal
      showBookingSuccessModal("drop-in");

      // Refresh data to show updated enrollment
      handleManualRefresh();

      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, selectedClassForPayment]);

  const handleSkipCredit = async (classItem: ClassItem) => {
    console.log(
      "[handleSkipCredit] Student chose to skip credit and pay drop-in for:",
      classItem,
    );

    // Proceed with drop-in payment flow
    setSelectedClassForPayment(classItem);
    setPaymentModalTriggeredByBooking(true);
    setShowPaymentModal(true);
  };

  if (!mounted || !isLoaded) {
    return (
      <div className="mt-10 flex justify-center">
        <LoadingSpinner text="Loading dashboard..." size="medium" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mt-10 flex justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-xl font-semibold">Please Sign In</h2>
          <p>You need to be signed in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardContainer>
        {/* Error Message Display */}
        {errorMessage && (
          <div
            style={{
              background: "#fed7d7",
              color: "#c53030",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "1px solid #feb2b2",
              fontWeight: 600,
              textAlign: "center",
            }}>
            {errorMessage}
          </div>
        )}
        {/* Left Side - Class Schedule */}
        <ScheduleContainer>
          {mounted ? (
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
              <LoadingSpinner text="Loading..." size="medium" />
            </div>
          )}
        </ScheduleContainer>

        {/* Right Side - Membership + Bulletin Board */}
        <RightSideContainer>
          <MembershipBox />
          <ClassCreditBox
            onCreditUsed={handleManualRefresh}
            selectedClass={showCreditModal ? selectedClassForCredit : null}
            onShowCreditModal={(show) => {
              setShowCreditModal(show);
              if (!show) {
                setSelectedClassForCredit(null);
              }
            }}
            onSkipCredit={handleSkipCredit}
            refreshTrigger={creditRefreshTrigger}
            onShowBookingSuccess={showBookingSuccessModal}
          />
          <BulletinBoard announcements={announcements} />
        </RightSideContainer>
      </DashboardContainer>

      {/* Payment Modal */}
      {showPaymentModal &&
        paymentModalTriggeredByBooking &&
        !showCancelModal &&
        ((() => {
          console.trace("Rendering Payment Modal");
          console.log(document.querySelectorAll(".modal-overlay"));
        })(),
        (
          <ModalOverlay
            className="modal-overlay"
            onClick={() => {
              setShowPaymentModalDebugStack(false);
              setPaymentModalTriggeredByBooking(false);
            }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <CloseButton
                  onClick={() => {
                    setShowPaymentModalDebugStack(false);
                    setPaymentModalTriggeredByBooking(false);
                  }}>
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
                    <LoadingSpinner
                      text="Loading payment options..."
                      size="small"
                    />
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
                      selected={
                        isSlidingScaleOption(selectedOption)
                          ? selectedOption.id === option.id
                          : false
                      }
                      tierName={option.tier_name}
                      priceMin={option.price_min}
                      priceMax={option.price_max}
                      description={option.description}
                      value={
                        isSlidingScaleOption(selectedOption) &&
                        selectedOption.id === option.id
                          ? selectedAmount
                          : Math.round(
                              (option.price_min + option.price_max) / 2,
                            )
                      }
                      onSelect={() => handleTierSelect(option)}
                      onChange={(newAmount) => {
                        if (
                          isSlidingScaleOption(selectedOption) &&
                          selectedOption.id === option.id
                        ) {
                          setSelectedAmount(newAmount);
                        } else {
                          handleTierSelect(option);
                          setSelectedAmount(newAmount);
                        }
                      }}
                    />
                  ))
                )}

                {paymentError && <ErrorMessage>{paymentError}</ErrorMessage>}
              </div>

              <ModalActions>
                <ModalButton
                  onClick={() => {
                    setShowPaymentModalDebugStack(false);
                    setPaymentModalTriggeredByBooking(false);
                  }}>
                  Cancel
                </ModalButton>
                <ModalButton
                  primary={true}
                  disabled={!isPaymentValid()}
                  loading={paymentLoading}
                  onClick={handlePaymentContinue}>
                  {paymentLoading ? (
                    <>
                      <LoadingSpinner size="small" />
                      Processing...
                    </>
                  ) : (
                    "Continue to Payment"
                  )}
                </ModalButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        ))}

      {/* Success Modal */}
      {showSuccessModal && (
        <SuccessModalOverlay onClick={() => setShowSuccessModal(false)}>
          <SuccessModalContent onClick={(e) => e.stopPropagation()}>
            {successLoading ? (
              <>
                <LoadingSpinner size="small" />
                <SuccessTitle>
                  We&apos;re updating your schedule...
                </SuccessTitle>
                <SuccessMessage>
                  Please wait while we process your cancellation and update your
                  schedule.
                </SuccessMessage>
              </>
            ) : (
              <>
                <SuccessIcon>✅</SuccessIcon>
                <SuccessTitle>
                  {successModalContent?.title || "Success!"}
                </SuccessTitle>
                <SuccessMessage>
                  {successModalContent?.message ||
                    "Operation completed successfully!"}
                </SuccessMessage>
                {successModalContent?.subMessage && (
                  <SuccessMessage
                    style={{ fontSize: "14px", color: "#718096" }}>
                    {successModalContent.subMessage}
                  </SuccessMessage>
                )}
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
            <LoadingSpinner size="medium" />
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
                {classToCancel.payment_type === "drop-in" && (
                  <div
                    style={{
                      background: "#f0fff4",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #9ae6b4",
                      marginBottom: "16px",
                      color: "#22543d",
                    }}>
                    <strong>Studio Policy:</strong> You will receive a class
                    credit as a refund for this drop-in booking cancellation.
                  </div>
                )}
                {classToCancel.payment_type === "credit" && (
                  <div
                    style={{
                      background: "#f0fff4",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #9ae6b4",
                      marginBottom: "16px",
                      color: "#22543d",
                    }}>
                    <strong>Credit Policy:</strong> Your class credit will be
                    restored and can be used for future bookings.
                  </div>
                )}
                {classToCancel.payment_type === "membership" && (
                  <div
                    style={{
                      background: "#fff5f5",
                      padding: "16px",
                      borderRadius: "8px",
                      border: "1px solid #fed7d7",
                      marginBottom: "16px",
                      color: "#c53030",
                    }}>
                    <strong>Membership Policy:</strong> Please cancel at least 6
                    hours in advance to avoid a $15 fee.
                  </div>
                )}
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
                primary={true}
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
