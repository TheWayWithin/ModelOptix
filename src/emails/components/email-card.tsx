import {
  Section,
} from '@react-email/components';
import * as React from 'react';

interface EmailCardProps {
  children: React.ReactNode;
  highlight?: boolean;
}

export const EmailCard: React.FC<EmailCardProps> = ({ children, highlight = false }) => {
  return (
    <Section style={highlight ? highlightCardStyle : cardStyle}>
      {children}
    </Section>
  );
};

const cardStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  padding: '20px 24px',
  borderRadius: '8px',
  margin: '16px 0',
  border: '1px solid #e2e8f0',
};

const highlightCardStyle: React.CSSProperties = {
  ...cardStyle,
  backgroundColor: '#f0fdfa',
  borderColor: '#0D9488',
  borderLeftWidth: '4px',
};

export default EmailCard;
