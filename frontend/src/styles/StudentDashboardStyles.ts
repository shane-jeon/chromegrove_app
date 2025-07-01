import styled from "styled-components";

// Main Layout
export const DashboardContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  padding: 32px 32px 32px 32px;
  max-width: 1400px;
  margin: 0 auto;
  min-height: 100vh;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: 24px;
    padding: 20px 8px;
  }
`;

export const ScheduleContainer = styled.div`
  flex: 1.6;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 700px;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    flex: unset;
    width: 100%;
    min-height: 500px;
  }
`;

export const RightSideContainer = styled.div`
  flex: 1;
  min-width: 320px;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: flex-start;
  box-sizing: border-box;

  @media (max-width: 1024px) {
    flex: unset;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    align-items: stretch;
  }
`;

export const TabContainer = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

export const TabHeader = styled.div`
  display: flex;
  background: #f1f3f4;
  border-bottom: 1px solid #e2e8f0;
`;

export const TabButton = styled.button<{ active: boolean }>`
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

export const TabContent = styled.div`
  padding: 24px;
  /* height: 400px; */
  /* overflow-y: auto; */

  /* Custom scrollbar styling */
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;

    &:hover {
      background: #a0aec0;
    }
  }

  /* Responsive height adjustments */
  @media (max-width: 768px) {
    /* height: 350px; */
  }

  @media (max-width: 480px) {
    /* height: 300px; */
  }
`;

export const EmptyState = styled.div`
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

export const ModalOverlay = styled.div`
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

export const ModalContent = styled.div`
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

export const ModalHeader = styled.div`
  text-align: center;
  margin-bottom: 24px;
  flex-shrink: 0;
  position: relative;
`;

export const CloseButton = styled.button`
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

export const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 8px 0;
`;

export const ModalSubtitle = styled.p`
  font-size: 16px;
  color: #718096;
  margin: 0;
  line-height: 1.5;
`;

export const TierCard = styled.div<{ selected: boolean }>`
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

export const TierHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

export const TierName = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
`;

export const TierPriceRange = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #805ad5;
`;

export const TierDescription = styled.p`
  font-size: 14px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 16px 0;
`;

export const SliderContainer = styled.div`
  margin-top: 16px;
`;

export const SliderLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

export const SliderValue = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
`;

export const SliderRange = styled.div`
  font-size: 14px;
  color: #718096;
`;

export const Slider = styled.input`
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

export const ErrorMessage = styled.div`
  background: #fed7d7;
  color: #c53030;
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  font-size: 14px;
  border: 1px solid #feb2b2;
`;

export const ModalActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  flex-shrink: 0;
`;

export const ModalButton = styled.button<{
  primary?: boolean;
  loading?: boolean;
}>`
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

export const SuccessModalOverlay = styled(ModalOverlay)``;

export const SuccessModalContent = styled(ModalContent)`
  text-align: center;
  max-width: 500px;
`;

export const SuccessIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

export const SuccessTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
  margin: 0 0 12px 0;
`;

export const SuccessMessage = styled.p`
  font-size: 16px;
  color: #4a5568;
  line-height: 1.5;
  margin: 0 0 24px 0;
`;

export const SuccessButton = styled.button`
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

export const LoadingOverlay = styled.div`
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

export const LoadingContent = styled.div`
  background: white;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
`;
