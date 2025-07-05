import React, { useEffect, useState } from "react";
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

const Info = styled.div`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin-bottom: 16px;
`;

const Button = styled.button<{ $danger?: boolean }>`
  background: ${({ $danger }) => ($danger ? "#e53e3e" : "#805ad5")};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#c53030" : "#6b46c1")};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
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

const MembershipDetails = styled.div`
  background: #f7fafc;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  border-left: 4px solid #805ad5;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;

  &:last-child {
    margin-bottom: 0;
  }

  strong {
    color: #2d3748;
  }

  span {
    color: #4a5568;
  }
`;

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
  z-index: 3000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  max-width: 400px;
  width: 90vw;
  max-height: 90vh;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
  text-align: center;
  overflow-y: auto;
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
`;

interface MembershipStatus {
  has_membership: boolean;
  membership_type?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  is_cancelled?: boolean;
  message?: string;
}

interface MembershipOption {
  id: number;
  tier_name: string;
  price_min: number;
  price_max: number;
  description: string;
  category: string;
  stripe_price_id?: string;
}

const MembershipBox: React.FC = () => {
  const { user } = useUser();
  const [status, setStatus] = useState<MembershipStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [cancelDetails, setCancelDetails] = useState<Record<
    string,
    string
  > | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseUrl, setPurchaseUrl] = useState<string | null>(null);
  const [availableOptions, setAvailableOptions] = useState<MembershipOption[]>(
    [],
  );
  const [selectedOption, setSelectedOption] = useState<MembershipOption | null>(
    null,
  );
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  useEffect(() => {
    if (user) fetchStatus();
    // Check for Stripe session success in URL
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("membership") === "success") {
        fetchStatus();
      }
    }
    // eslint-disable-next-line
  }, [user]);

  async function fetchStatus() {
    if (!user?.id) {
      setError("User not available");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // console.log(
      //   "[MembershipBox] Fetching membership status for user:",
      //   user.id,
      // );
      const res = await fetch("http://localhost:5000/api/membership/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_user_id: user.id }),
      });

      // console.log("[MembershipBox] Response status:", res.status);

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Backend server is not responding. Please make sure the server is running.",
        );
      }

      const data = await res.json();
      // console.log("[MembershipBox] Response data:", data);

      if (data.success) {
        setStatus(data.membership);
      } else {
        setError(data.error || "Failed to fetch membership status");
      }
    } catch (err) {
      // console.error("[MembershipBox] Fetch error:", err);
      if (err instanceof Error && err.message.includes("Backend server")) {
        setError(err.message);
      } else {
        setError("Failed to fetch membership status. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!user?.id) {
      setError("User not available");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // console.log(
      //   "[MembershipBox] Starting membership purchase for user:",
      //   user.id,
      // );
      const optRes = await fetch(
        "http://localhost:5000/api/membership/options",
      );
      const optData = await optRes.json();
      // console.log("[MembershipBox] Membership options (raw):", optData);
      if (optData.options) {
        // Remove unused forEach loop
      }
      if (!optData.success || !optData.options?.length)
        throw new Error("No membership options available");
      setAvailableOptions(optData.options);
      setShowPurchaseModal(true);
      setSelectedOption(null);
    } catch (err: unknown) {
      // console.error("[MembershipBox] Purchase error:", err);
      if (err instanceof Error)
        setError(err.message || "Failed to start membership purchase");
      else setError("Failed to start membership purchase");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPurchase() {
    if (!user?.id || !selectedOption) return;
    setPurchaseLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/membership/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_user_id: user.id,
          option_id: selectedOption.id,
        }),
      });
      const data = await res.json();
      // console.log("[MembershipBox] Create membership response:", data);
      if (data.success && data.url) {
        setPurchaseUrl(data.url);
        setShowPurchaseModal(false);
        window.location.href = data.url; // Immediate redirect to Stripe
        return;
      } else {
        throw new Error(data.error || "Failed to start membership purchase");
      }
    } catch (err: unknown) {
      // console.error("[MembershipBox] Confirm purchase error:", err);
      if (err instanceof Error)
        setError(err.message || "Failed to start membership purchase");
      else setError("Failed to start membership purchase");
    } finally {
      setPurchaseLoading(false);
    }
  }

  async function handleCancel() {
    if (!user?.id) {
      setError("User not available");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      // console.log("[MembershipBox] Cancelling membership for user:", user.id);
      const res = await fetch("http://localhost:5000/api/membership/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clerk_user_id: user.id }),
      });

      const data = await res.json();
      // console.log("[MembershipBox] Cancel membership response:", data);

      if (data.success) {
        setCancelDetails(data.details);
        setShowCancelModal(false);
        setShowCancelledModal(true);
        fetchStatus();
      } else {
        throw new Error(data.error || "Failed to cancel membership");
      }
    } catch (err: unknown) {
      // console.error("[MembershipBox] Cancel error:", err);
      if (err instanceof Error)
        setError(err.message || "Failed to cancel membership");
      else setError("Failed to cancel membership");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <Title>Membership</Title>
      {loading && <LoadingMsg>Loading membership status...</LoadingMsg>}
      {error && <ErrorMsg>{error}</ErrorMsg>}
      {status && status.has_membership ? (
        <>
          <MembershipDetails>
            <DetailRow>
              <strong>Start Date:</strong>
              <span>
                {status.start_date
                  ? new Date(status.start_date).toLocaleDateString()
                  : "-"}
              </span>
            </DetailRow>
            <DetailRow>
              <strong>Expiration Date:</strong>
              <span>
                {status.end_date
                  ? new Date(status.end_date).toLocaleDateString()
                  : "-"}
              </span>
            </DetailRow>
            <DetailRow>
              <strong>Type:</strong>
              <span>{status.membership_type || "-"}</span>
            </DetailRow>
            <DetailRow>
              <strong>Status:</strong>
              <span
                style={{
                  color: status.is_cancelled
                    ? "#e53e3e"
                    : status.is_active
                    ? "#38a169"
                    : "#e53e3e",
                  fontWeight: "600",
                }}>
                {status.is_cancelled
                  ? "Cancelled"
                  : status.is_active
                  ? "Active"
                  : "Expired"}
              </span>
            </DetailRow>
          </MembershipDetails>
          {status.is_cancelled ? (
            <>
              <Info
                style={{
                  background: "#fff5f5",
                  border: "1px solid #fed7d7",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#c53030",
                }}>
                Your membership has been cancelled. You will keep access until
                the day before your next renewal date.
              </Info>
              <Button
                disabled
                style={{ background: "#a0aec0", cursor: "not-allowed" }}>
                Membership Cancelled
              </Button>
              {status.is_active && (
                <Button
                  onClick={handlePurchase}
                  disabled={loading}
                  style={{ marginTop: 12 }}>
                  Renew Membership
                </Button>
              )}
            </>
          ) : status.is_active ? (
            <Button
              $danger
              onClick={() => setShowCancelModal(true)}
              disabled={loading}>
              Cancel Membership
            </Button>
          ) : (
            <>
              <Info
                style={{
                  background: "#fff5f5",
                  border: "1px solid #fed7d7",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#c53030",
                }}>
                Your membership has expired. You can still book classes, but
                you&apos;ll need to pay the drop-in rate for classes after your
                expiration date.
              </Info>
              <Button onClick={handlePurchase} disabled={loading}>
                Renew Membership
              </Button>
            </>
          )}
        </>
      ) : (
        <>
          <Info>
            Interested in purchasing a membership? Get unlimited access to all
            classes with our sliding scale pricing.
          </Info>
          <Button onClick={handlePurchase} disabled={loading}>
            Purchase Membership
          </Button>
        </>
      )}

      {/* Cancel Membership Modal */}
      {showCancelModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Cancel Membership?</ModalTitle>
            <ModalBody>
              Are you sure you want to cancel your membership?
              <br />
              <span style={{ color: "#e53e3e" }}>
                You will keep access until the day before your next renewal.
              </span>
            </ModalBody>
            <ModalActions>
              <Button onClick={() => setShowCancelModal(false)}>
                Keep Membership
              </Button>
              <Button $danger onClick={handleCancel}>
                Confirm Cancel
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Cancelled Confirmation Modal */}
      {showCancelledModal && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Membership Cancelled</ModalTitle>
            <ModalBody>
              Your membership will remain active until the day before your next
              renewal.
              <br />
              <strong>End Date:</strong>{" "}
              {cancelDetails?.membership_end_date
                ? new Date(
                    cancelDetails.membership_end_date,
                  ).toLocaleDateString()
                : "-"}
            </ModalBody>
            <Button onClick={() => setShowCancelledModal(false)}>OK</Button>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Purchase Modal: Select Membership Tier */}
      {showPurchaseModal && !purchaseUrl && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Select Membership Tier</ModalTitle>
            <ModalBody>
              {availableOptions.length === 0 ? (
                <div>No membership options available.</div>
              ) : (
                <>
                  {availableOptions.map((option: MembershipOption) => (
                    <div
                      key={option.id}
                      style={{
                        border:
                          selectedOption?.id === option.id
                            ? "2px solid #805ad5"
                            : "1px solid #e2e8f0",
                        borderRadius: 8,
                        padding: 16,
                        marginBottom: 12,
                        cursor: "pointer",
                        background:
                          selectedOption?.id === option.id ? "#f7fafc" : "#fff",
                        transition: "border 0.2s, background 0.2s",
                      }}
                      onClick={() => setSelectedOption(option)}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>
                        {option.tier_name}
                      </div>
                      <div
                        style={{
                          color: "#4a5568",
                          fontSize: 14,
                          margin: "4px 0",
                        }}>
                        {option.description}
                      </div>
                      <div
                        style={{
                          color: "#805ad5",
                          fontWeight: 600,
                          fontSize: 15,
                        }}>
                        ${option.price_min}
                        {option.price_min !== option.price_max
                          ? ` - $${option.price_max}`
                          : ""}{" "}
                        / month
                      </div>
                    </div>
                  ))}
                </>
              )}
            </ModalBody>
            <ModalActions>
              <Button
                onClick={() => setShowPurchaseModal(false)}
                disabled={purchaseLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPurchase}
                disabled={!selectedOption || purchaseLoading}>
                {purchaseLoading ? "Processing..." : "Continue"}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Purchase Modal (redirect to Stripe) */}
      {showPurchaseModal && purchaseUrl && (
        <ModalOverlay>
          <ModalContent>
            <ModalTitle>Purchase Membership</ModalTitle>
            <ModalBody>
              You will be redirected to Stripe to complete your membership
              purchase.
            </ModalBody>
            <Button
              onClick={() => {
                window.location.href = purchaseUrl;
              }}>
              Continue to Payment
            </Button>
            <Button onClick={() => setShowPurchaseModal(false)}>Cancel</Button>
          </ModalContent>
        </ModalOverlay>
      )}
    </Box>
  );
};

export default MembershipBox;
