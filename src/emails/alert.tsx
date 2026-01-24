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
} from '@react-email/components';
import * as React from 'react';
import { EmailHeader, EmailFooter, EmailButton, EmailCard } from './components';

interface AlertEmailProps {
  firstName?: string;
  alertType?: 'optimization' | 'cost_spike' | 'new_model';
  modelName?: string;
  currentModel?: string;
  potentialSavings?: string;
  savingsPercent?: string;
  opportunityUrl?: string;
  details?: string;
}

export const AlertEmail: React.FC<AlertEmailProps> = ({
  firstName = 'there',
  alertType = 'optimization',
  modelName = 'GPT-4o Mini',
  currentModel = 'GPT-4o',
  potentialSavings = '$127.50',
  savingsPercent = '23%',
  opportunityUrl = 'https://modeloptix.com/dashboard/opportunities',
  details = 'Based on your usage patterns over the last 7 days, this model could handle your tasks with equivalent quality at a lower cost.',
}) => {
  const getAlertConfig = () => {
    switch (alertType) {
      case 'cost_spike':
        return {
          emoji: '⚠️',
          title: 'Cost Alert Detected',
          previewText: `Cost alert: Unusual spending detected on ${currentModel}`,
        };
      case 'new_model':
        return {
          emoji: '✨',
          title: 'New Model Recommendation',
          previewText: `New opportunity: ${modelName} could save you ${potentialSavings}/month`,
        };
      default:
        return {
          emoji: '💡',
          title: 'Optimization Opportunity Found',
          previewText: `Save ${potentialSavings}/month by switching to ${modelName}`,
        };
    }
  };

  const config = getAlertConfig();

  return (
    <Html>
      <Head />
      <Preview>{config.previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentStyle}>
            <Text style={emojiStyle}>{config.emoji}</Text>

            <Heading style={headingStyle}>
              {config.title}
            </Heading>

            <Text style={paragraphStyle}>
              Hi {firstName}, we&apos;ve identified a new opportunity for you.
            </Text>

            <EmailCard highlight>
              <Row>
                <Column style={savingsColumnStyle}>
                  <Text style={savingsLabelStyle}>Potential Monthly Savings</Text>
                  <Text style={savingsAmountStyle}>{potentialSavings}</Text>
                  <Text style={savingsPercentStyle}>({savingsPercent} reduction)</Text>
                </Column>
              </Row>
            </EmailCard>

            <EmailCard>
              <Text style={detailLabelStyle}>Recommendation</Text>
              <Text style={detailValueStyle}>
                Switch from <strong>{currentModel}</strong> to <strong>{modelName}</strong>
              </Text>

              <Text style={detailLabelStyle}>Why This Works</Text>
              <Text style={detailValueStyle}>{details}</Text>
            </EmailCard>

            <Section style={ctaContainerStyle}>
              <EmailButton href={opportunityUrl} variant="accent">
                View Full Analysis
              </EmailButton>
            </Section>

            <Text style={disclaimerStyle}>
              This recommendation is based on your actual usage data and independent
              benchmarking. ModelOptix has no partnership with any model provider -
              our only goal is your optimization.
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

const emojiStyle: React.CSSProperties = {
  fontSize: '48px',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

const headingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '24px',
  fontWeight: '700',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const paragraphStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px 0',
  textAlign: 'center' as const,
};

const savingsColumnStyle: React.CSSProperties = {
  textAlign: 'center' as const,
};

const savingsLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const savingsAmountStyle: React.CSSProperties = {
  color: '#0D9488',
  fontSize: '36px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '1.2',
};

const savingsPercentStyle: React.CSSProperties = {
  color: '#0D9488',
  fontSize: '16px',
  fontWeight: '500',
  margin: '4px 0 0 0',
};

const detailLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
};

const detailValueStyle: React.CSSProperties = {
  color: '#1e293b',
  fontSize: '15px',
  lineHeight: '1.5',
  margin: '0 0 16px 0',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const disclaimerStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '1.6',
  margin: '24px 0 0 0',
  textAlign: 'center' as const,
  fontStyle: 'italic',
};

export default AlertEmail;
