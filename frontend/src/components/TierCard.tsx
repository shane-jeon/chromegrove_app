import React from "react";
import {
  TierCard as StyledTierCard,
  TierHeader,
  TierName,
  TierPriceRange,
  TierDescription,
  SliderContainer,
  SliderLabel,
  SliderValue,
  SliderRange,
  Slider,
} from "../styles/StudentDashboardStyles";

interface TierCardProps {
  selected: boolean;
  tierName: string;
  priceMin: number;
  priceMax: number;
  description: string;
  value: number;
  onSelect: () => void;
  onChange: (value: number) => void;
}

const TierCard: React.FC<TierCardProps> = ({
  selected,
  tierName,
  priceMin,
  priceMax,
  description,
  value,
  onSelect,
  onChange,
}) => (
  <StyledTierCard selected={selected} onClick={onSelect}>
    <TierHeader>
      <TierName>{tierName}</TierName>
      <TierPriceRange>
        ${priceMin} - ${priceMax}
      </TierPriceRange>
    </TierHeader>
    <TierDescription>{description}</TierDescription>
    <SliderContainer>
      <SliderLabel>
        <SliderValue>${value}</SliderValue>
        <SliderRange>
          ${priceMin} - ${priceMax}
        </SliderRange>
      </SliderLabel>
      <Slider
        type="range"
        min={priceMin}
        max={priceMax}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SliderContainer>
  </StyledTierCard>
);

export default TierCard;
