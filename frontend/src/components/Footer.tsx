import React from "react";
import styled from "styled-components";

const FooterContainer = styled.footer`
  width: 100%;
  background: #f7f6fa;
  border-top: 1px solid #e2e8f0;
  padding: 24px 0;
  text-align: center;
  font-size: 1rem;
  color: #444;
  margin-top: 40px;
`;

const SupportLink = styled.a`
  color: #805ad5;
  text-decoration: underline;
  font-weight: 500;
  margin-left: 4px;
  &:hover {
    color: #6b46c1;
  }
`;

const Footer: React.FC = () => (
  <FooterContainer>
    Having technical issues?{" "}
    <SupportLink
      href="mailto:shanexjeonx@gmail.com"
      target="_blank"
      rel="noopener noreferrer">
      Contact support
    </SupportLink>
    .
  </FooterContainer>
);

export default Footer;
