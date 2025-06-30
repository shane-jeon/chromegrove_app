import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const SpinnerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #e2e8f0;
  border-top: 4px solid #805ad5;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const LoadingText = styled.p`
  font-size: 16px;
  color: #4a5568;
  margin: 0;
  font-weight: 500;
`;

interface LoadingSpinnerProps {
  text?: string;
  size?: "small" | "medium" | "large";
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Loading...",
  size = "medium",
}) => {
  const getSpinnerSize = () => {
    switch (size) {
      case "small":
        return "24px";
      case "large":
        return "56px";
      default:
        return "40px";
    }
  };

  const getBorderWidth = () => {
    switch (size) {
      case "small":
        return "3px";
      case "large":
        return "5px";
      default:
        return "4px";
    }
  };

  return (
    <SpinnerContainer>
      <Spinner
        style={{
          width: getSpinnerSize(),
          height: getSpinnerSize(),
          borderWidth: getBorderWidth(),
          borderTopWidth: getBorderWidth(),
        }}
      />
      {text && <LoadingText>{text}</LoadingText>}
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
