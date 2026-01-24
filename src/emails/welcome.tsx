import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { EmailHeader, EmailFooter, EmailButton, EmailCard } from './components';

interface WelcomeEmailProps {
  firstName?: string;
  dashboardUrl?: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  firstName = 'there',
  dashboardUrl = 'https://modeloptix.com/dashboard',
}) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to ModelOptix - Your independent AI model advisor is ready</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentStyle}>
            <Heading style={headingStyle}>
              Welcome to ModelOptix, {firstName}!
            </Heading>

            <Text style={paragraphStyle}>
              We&apos;re excited to have you on board. ModelOptix is your independent advisor
              for navigating the AI model landscape - helping you find the right models
              at the right price, without the bias.
            </Text>

            <EmailCard highlight>
              <Text style={cardTitleStyle}>What You Can Do Now:</Text>
              <Text style={listItemStyle}>📊 <strong>Monitor Costs</strong> - Track your AI spending across providers</Text>
              <Text style={listItemStyle}>🔍 <strong>Compare Models</strong> - Get unbiased comparisons based on your actual usage</Text>
              <Text style={listItemStyle}>💡 <strong>Get Recommendations</strong> - Receive personalized optimization opportunities</Text>
              <Text style={listItemStyle}>📈 <strong>Track Savings</strong> - See exactly how much you&apos;re saving</Text>
            </EmailCard>

            <Section style={ctaContainerStyle}>
              <EmailButton href={dashboardUrl} variant="accent">
                Explore Your Dashboard
              </EmailButton>
            </Section>

            <Text style={paragraphStyle}>
              Have questions? Reply to this email - we&apos;re here to help you get the
              most out of ModelOptix.
            </Text>

            <Text style={signatureStyle}>
              Best,<br />
              The ModelOptix Team
            </Text>
          </Section>

          <EmailFooter />
        </Container>
      </Body>
    </Html>
  );
};

const bodyStyle: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  padding: '40px 20px',
};

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

const contentStyle: React.CSSProperties = {
  padding: '32px',
};

const headingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 20px 0',
  lineHeight: '1.3',
};

const paragraphStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const cardTitleStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const listItemStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0 0 8px 0',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const signatureStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
};

export default WelcomeEmail;
