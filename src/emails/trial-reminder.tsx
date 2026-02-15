import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Row,
  Column,
  Hr,
} from '@react-email/components';
import * as React from 'react';
import { EmailHeader, EmailFooter, EmailButton, EmailCard } from './components';

interface TrialReminderEmailProps {
  firstName?: string;
  daysRemaining?: number;
  savingsGenerated?: string;
  recommendationsReceived?: number;
  optimizationsApplied?: number;
  upgradeUrl?: string;
  monthlyPrice?: string;
  yearlyPrice?: string;
  yearlyDiscount?: string;
}

export const TrialReminderEmail: React.FC<TrialReminderEmailProps> = ({
  firstName = 'there',
  daysRemaining = 3,
  savingsGenerated = '$342.00',
  recommendationsReceived = 12,
  optimizationsApplied = 4,
  upgradeUrl = 'https://modeloptix.com/dashboard/billing/upgrade',
  monthlyPrice = '$49',
  yearlyPrice = '$470',
  yearlyDiscount = '20%',
}) => {
  const urgencyLevel = daysRemaining <= 1 ? 'urgent' : 'reminder';
  const previewText = daysRemaining === 1
    ? 'Your ModelOptix trial ends tomorrow - do not lose your savings data!'
    : `Your ModelOptix trial ends in ${daysRemaining} days`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentStyle}>
            {urgencyLevel === 'urgent' ? (
              <Section style={urgentBannerStyle}>
                <Text style={urgentTextStyle}>⏰ Trial Ends Tomorrow</Text>
              </Section>
            ) : null}

            <Heading style={headingStyle}>
              {daysRemaining === 1
                ? 'Your trial ends tomorrow, ' + firstName
                : `${daysRemaining} days left in your trial, ${firstName}`
              }
            </Heading>

            <Text style={paragraphStyle}>
              You&apos;ve been making great progress with ModelOptix. Here&apos;s a summary
              of the value you&apos;ve received during your trial:
            </Text>

            <EmailCard highlight>
              <Text style={statsHeadingStyle}>Your Trial Summary</Text>
              <Row>
                <Column style={statColumnStyle}>
                  <Text style={statValueStyle}>{savingsGenerated}</Text>
                  <Text style={statLabelStyle}>Savings Identified</Text>
                </Column>
                <Column style={statColumnStyle}>
                  <Text style={statValueStyle}>{recommendationsReceived}</Text>
                  <Text style={statLabelStyle}>Recommendations</Text>
                </Column>
                <Column style={statColumnStyle}>
                  <Text style={statValueStyle}>{optimizationsApplied}</Text>
                  <Text style={statLabelStyle}>Applied</Text>
                </Column>
              </Row>
            </EmailCard>

            <Text style={paragraphStyle}>
              {urgencyLevel === 'urgent'
                ? 'To keep access to your dashboard, recommendations, and savings tracking, upgrade now:'
                : 'Continue optimizing your AI costs with a paid plan:'
              }
            </Text>

            <EmailCard>
              <Text style={pricingHeadingStyle}>Simple, Transparent Pricing</Text>

              <Row style={pricingRowStyle}>
                <Column style={pricingColumnStyle}>
                  <Text style={planNameStyle}>Monthly</Text>
                  <Text style={planPriceStyle}>{monthlyPrice}<span style={planPeriodStyle}>/month</span></Text>
                  <Text style={planDetailStyle}>Billed monthly</Text>
                </Column>
                <Column style={pricingDividerStyle} />
                <Column style={pricingColumnStyle}>
                  <Text style={planBadgeStyle}>BEST VALUE</Text>
                  <Text style={planNameStyle}>Yearly</Text>
                  <Text style={planPriceStyle}>{yearlyPrice}<span style={planPeriodStyle}>/year</span></Text>
                  <Text style={planDetailStyle}>Save {yearlyDiscount}</Text>
                </Column>
              </Row>
            </EmailCard>

            <Section style={ctaContainerStyle}>
              <EmailButton href={upgradeUrl} variant="accent">
                Upgrade Now
              </EmailButton>
            </Section>

            <Text style={benefitsHeadingStyle}>What You&apos;ll Keep:</Text>
            <Text style={benefitItemStyle}>✓ All your historical savings data</Text>
            <Text style={benefitItemStyle}>✓ Unlimited model recommendations</Text>
            <Text style={benefitItemStyle}>✓ Real-time cost monitoring</Text>
            <Text style={benefitItemStyle}>✓ Priority email support</Text>

            <Hr style={dividerStyle} />

            <Text style={questionStyle}>
              Questions about plans? Reply to this email - we&apos;re happy to help.
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

const urgentBannerStyle: React.CSSProperties = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '12px 16px',
  marginBottom: '24px',
};

const urgentTextStyle: React.CSSProperties = {
  color: '#92400e',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0',
  textAlign: 'center' as const,
};

const headingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const paragraphStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
};

const statsHeadingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '14px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const statColumnStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 8px',
};

const statValueStyle: React.CSSProperties = {
  color: '#0D9488',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};

const statLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0',
};

const pricingHeadingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const pricingRowStyle: React.CSSProperties = {
  display: 'flex',
};

const pricingColumnStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  flex: '1',
  padding: '0 16px',
};

const pricingDividerStyle: React.CSSProperties = {
  width: '1px',
  backgroundColor: '#e2e8f0',
};

const planBadgeStyle: React.CSSProperties = {
  backgroundColor: '#0D9488',
  color: '#ffffff',
  fontSize: '10px',
  fontWeight: '600',
  padding: '4px 8px',
  borderRadius: '4px',
  display: 'inline-block',
  margin: '0 0 8px 0',
};

const planNameStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const planPriceStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
};

const planPeriodStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '400',
  color: '#64748b',
};

const planDetailStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  margin: '4px 0 0 0',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const benefitsHeadingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '15px',
  fontWeight: '600',
  margin: '0 0 12px 0',
};

const benefitItemStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const questionStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '0',
};

export default TrialReminderEmail;
