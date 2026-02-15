import {
  Section,
  Text,
  Link,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface EmailFooterProps {
  includeUnsubscribe?: boolean;
}

export const EmailFooter: React.FC<EmailFooterProps> = ({ includeUnsubscribe = true }) => {
  return (
    <Section style={footerStyle}>
      <Hr style={dividerStyle} />
      <Text style={footerTextStyle}>
        ModelOptix - Your Independent AI Model Advisor
      </Text>
      <Text style={footerLinksStyle}>
        <Link href="https://modeloptix.com" style={linkStyle}>Website</Link>
        {' | '}
        <Link href="https://modeloptix.com/dashboard" style={linkStyle}>Dashboard</Link>
        {' | '}
        <Link href="https://modeloptix.com/support" style={linkStyle}>Support</Link>
      </Text>
      {includeUnsubscribe && (
        <Text style={unsubscribeStyle}>
          <Link href="{{unsubscribe_url}}" style={unsubscribeLinkStyle}>
            Unsubscribe from these emails
          </Link>
        </Text>
      )}
      <Text style={copyrightStyle}>
        © {new Date().getFullYear()} ModelOptix. All rights reserved.
      </Text>
    </Section>
  );
};

const footerStyle: React.CSSProperties = {
  padding: '24px 32px',
  backgroundColor: '#f8fafc',
  borderRadius: '0 0 8px 8px',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  borderWidth: '1px',
  margin: '0 0 24px 0',
};

const footerTextStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '14px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const footerLinksStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const linkStyle: React.CSSProperties = {
  color: '#1A2B4C',
  textDecoration: 'none',
};

const unsubscribeStyle: React.CSSProperties = {
  margin: '0 0 12px 0',
  textAlign: 'center' as const,
};

const unsubscribeLinkStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textDecoration: 'underline',
};

const copyrightStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  margin: '0',
  textAlign: 'center' as const,
};

export default EmailFooter;
