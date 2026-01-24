import {
  Section,
  Row,
  Column,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailHeaderProps {
  previewText?: string;
}

export const EmailHeader: React.FC<EmailHeaderProps> = ({ previewText }) => {
  return (
    <Section style={headerStyle}>
      <Row>
        <Column>
          <Text style={logoStyle}>ModelOptix</Text>
        </Column>
      </Row>
      {previewText && (
        <Text style={previewStyle}>{previewText}</Text>
      )}
    </Section>
  );
};

const headerStyle: React.CSSProperties = {
  backgroundColor: '#1A2B4C',
  padding: '24px 32px',
  borderRadius: '8px 8px 0 0',
};

const logoStyle: React.CSSProperties = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '700',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0',
  letterSpacing: '-0.5px',
};

const previewStyle: React.CSSProperties = {
  display: 'none',
  maxWidth: '0',
  maxHeight: '0',
  overflow: 'hidden',
  opacity: '0',
};

export default EmailHeader;
