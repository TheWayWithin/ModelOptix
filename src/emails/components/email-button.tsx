import {
  Button,
} from '@react-email/components';
import * as React from 'react';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const EmailButton: React.FC<EmailButtonProps> = ({
  href,
  children,
  variant = 'primary'
}) => {
  const style = variant === 'primary'
    ? primaryButtonStyle
    : variant === 'accent'
    ? accentButtonStyle
    : secondaryButtonStyle;

  return (
    <Button href={href} style={style}>
      {children}
    </Button>
  );
};

const baseButtonStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '14px 28px',
  fontSize: '15px',
  fontWeight: '600',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  textDecoration: 'none',
  borderRadius: '8px',
  textAlign: 'center' as const,
};

const primaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: '#1A2B4C',
  color: '#ffffff',
};

const accentButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: '#0D9488',
  color: '#ffffff',
};

const secondaryButtonStyle: React.CSSProperties = {
  ...baseButtonStyle,
  backgroundColor: '#ffffff',
  color: '#1A2B4C',
  border: '2px solid #1A2B4C',
};

export default EmailButton;
