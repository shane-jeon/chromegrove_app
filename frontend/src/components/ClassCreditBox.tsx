import React, { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { useUser } from "@clerk/nextjs";

const Box = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid #e2e8f0;
`;

const CreditDisplay = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #38a169;
  text-align: center;
`;

const CreditCount = styled.div`
  font-size: 32px;
  font-weight: 700;
  color: #38a169;
  margin-bottom: 8px;
`;

const CreditLabel = styled.div`
  font-size: 14px;
  color: #4a5568;
  font-weight: 600;
`;

const Info = styled.div`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const ErrorMsg = styled.div`
  color: #c53030;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 1.4;
`;

const LoadingMsg = styled.div`
  color: #718096;
  text-align: center;
  padding: 12px;
  font-size: 14px;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
`;

const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 12px;
`;

const ModalBody = styled.div`
  font-size: 15px;
  color: #4a5568;
  margin-bottom: 20px;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
`;

const Button = styled.button<{ $danger?: boolean; $secondary?: boolean }>`
  background: ${({ $danger, $secondary }) =>
    $danger ? "#e53e3e" : $secondary ? "#805ad5" : "#38a169"};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex: 1;
  min-width: 120px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $danger, $secondary }) =>
      $danger ? "#c53030" : $secondary ? "#6b46c1" : "#2f855a"};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

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

interface ClassCreditBoxProps {
  onCreditUsed?: () => void;
  selectedClass?: ClassItem | null;
  onShowCreditModal?: (show: boolean) => void;
  onSkipCredit?: (classItem: ClassItem) => void;
  refreshTrigger?: number;
  onShowBookingSuccess?: (
    paymentType: "credit" | "membership" | "staff" | "drop-in",
    remainingCredits?: number,
  ) => void;
}

const ClassCreditBox: React.FC<ClassCreditBoxProps> = ({
  onCreditUsed,
  selectedClass,
  onShowCreditModal,
  onSkipCredit,
  refreshTrigger,
  onShowBookingSuccess,
}) => {
  const { user } = useUser();
  const [creditCount, setCreditCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Update modal state when selectedClass changes
  useEffect(() => {
    if (selectedClass && creditCount > 0) {
      setShowCreditModal(true);
      if (onShowCreditModal) {
        onShowCreditModal(true);
      }
    }
  }, [selectedClass, creditCount, onShowCreditModal]);

  // Handle modal close
  const handleCloseModal = () => {
    setShowCreditModal(false);
    if (onShowCreditModal) {
      onShowCreditModal(false);
    }
  };

  const handleSkipCredit = () => {
    if (selectedClass && onSkipCredit) {
      handleCloseModal();
      onSkipCredit(selectedClass);
    }
  };

  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setError("User not available");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Comment out debug logs
      // console.log("[ClassCreditBox] Fetching credits for user:", user.id);
      const res = await fetch(
        `http://localhost:5000/api/credits/student?clerk_user_id=${user.id}`,
      );

      const data = await res.json();
      // Comment out debug logs
      // console.log("[ClassCreditBox] Credits response:", data);

      if (data.success) {
        setCreditCount(data.credit_count || 0);
      } else {
        setError(data.error || "Failed to fetch credits");
      }
    } catch (err) {
      // Comment out debug logs
      // console.error("[ClassCreditBox] Fetch error:", err);
      setError("Failed to fetch credits. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user, fetchCredits]);

  // Refresh credits when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && user) {
      fetchCredits();
    }
  }, [refreshTrigger, user, fetchCredits]);

  const handleUseCredit = async () => {
    if (!selectedClass || !user?.id) {
      return;
    }

    setCreditLoading(true);

    try {
      // Comment out debug logs
      // console.log(
      //   "[ClassCreditBox] Using credit for class:",
      //   selectedClass.instance_id,
      // );

      // Use the new credit-based booking endpoint
      const response = await fetch(
        "http://localhost:5000/api/studio-classes/book-with-credit",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clerk_user_id: user.id,
            instance_id: selectedClass.instance_id,
          }),
        },
      );

      const data = await response.json();
      // Comment out debug logs
      // console.log("[ClassCreditBox] Credit booking response:", data);

      if (data.success) {
        // Show success modal
        setShowCreditModal(false);
        if (onShowCreditModal) {
          onShowCreditModal(false);
        }
        // Refresh credits
        await fetchCredits();
        // Notify parent component
        if (onCreditUsed) {
          onCreditUsed();
        }
        // Show success modal using parent function
        if (onShowBookingSuccess) {
          onShowBookingSuccess("credit", creditCount - 1);
        } else {
          // Fallback to local success modal
          setShowSuccessModal(true);
        }
      } else {
        setError(data.error || "Failed to book class with credit");
      }
    } catch (error) {
      // Comment out debug logs
      // console.error("[ClassCreditBox] Error using credit:", error);
      setError("Failed to use credit. Please try again.");
    } finally {
      setCreditLoading(false);
    }
  };

  // Don't render if no credits
  if (creditCount === 0 && !loading) {
    return null;
  }

  return (
    <Box>
      <Title>Class Credits</Title>
      {loading && <LoadingMsg>Loading credits...</LoadingMsg>}
      {error && <ErrorMsg>{error}</ErrorMsg>}

      <CreditDisplay>
        <CreditCount>{creditCount}</CreditCount>
        <CreditLabel>
          Available Credit{creditCount !== 1 ? "s" : ""}
        </CreditLabel>
      </CreditDisplay>

      <Info>
        Use your class credit{creditCount !== 1 ? "s" : ""} to book classes
        without payment. Credits are issued when you cancel drop-in bookings.
      </Info>

      {/* Credit Confirmation Modal */}
      {showCreditModal && selectedClass && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Use Class Credit?</ModalTitle>
            <ModalBody>
              Are you sure you want to use 1 class credit to book{" "}
              <strong>{selectedClass.class_name}</strong>?
              <br />
              <br />
              <span style={{ color: "#38a169", fontWeight: "600" }}>
                You will have {creditCount - 1} credit
                {creditCount - 1 !== 1 ? "s" : ""} remaining.
              </span>
              <br />
              <br />
              <div
                style={{
                  fontSize: "14px",
                  color: "#718096",
                  marginTop: "12px",
                }}>
                <strong>Options:</strong>
                <br />• <strong>Use Credit:</strong> Book this class for free
                using your credit
                <br />• <strong>Pay Drop-in:</strong> Pay the sliding scale rate
                and save your credit for later
              </div>
            </ModalBody>
            <ModalActions>
              <Button
                onClick={handleCloseModal}
                disabled={creditLoading}
                $danger>
                Cancel
              </Button>
              <Button
                onClick={handleSkipCredit}
                disabled={creditLoading}
                $secondary>
                Pay Drop-in Instead
              </Button>
              <Button onClick={handleUseCredit} disabled={creditLoading}>
                {creditLoading ? "Booking..." : "Use Credit"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Class Booked!</ModalTitle>
            <ModalBody>
              Your class has been booked successfully using your credit!
            </ModalBody>
            <ModalActions>
              <Button onClick={() => setShowSuccessModal(false)}>Close</Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Box>
  );
};

export default ClassCreditBox;
