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

interface Opportunity {
  currentModel: string;
  recommendedModel: string;
  savings: string;
  reason: string;
}

interface ModelUpdate {
  model: string;
  change: string;
  impact: 'positive' | 'neutral' | 'negative';
}

interface WeeklyDigestEmailProps {
  firstName?: string;
  weekEnding?: string;
  totalPotentialSavings?: string;
  topOpportunities?: Opportunity[];
  modelUpdates?: ModelUpdate[];
  currentSpend?: string;
  dashboardUrl?: string;
  upgradeUrl?: string;
  isFreeTier?: boolean;
}

export const WeeklyDigestEmail: React.FC<WeeklyDigestEmailProps> = ({
  firstName = 'there',
  weekEnding = 'January 19, 2026',
  totalPotentialSavings = '$487.00',
  topOpportunities = [
    {
      currentModel: 'GPT-4o',
      recommendedModel: 'Claude 3.5 Sonnet',
      savings: '$156.00',
      reason: 'Similar quality, 18% lower cost for your use case',
    },
    {
      currentModel: 'GPT-4o',
      recommendedModel: 'GPT-4o Mini',
      savings: '$203.00',
      reason: 'Adequate for 67% of your summarization tasks',
    },
    {
      currentModel: 'Claude 3 Opus',
      recommendedModel: 'Claude 3.5 Sonnet',
      savings: '$128.00',
      reason: 'Better price-performance for code generation',
    },
  ],
  modelUpdates = [
    {
      model: 'GPT-4o Mini',
      change: 'Price reduced 15%',
      impact: 'positive' as const,
    },
    {
      model: 'Claude 3.5 Haiku',
      change: 'Now available for production',
      impact: 'positive' as const,
    },
  ],
  currentSpend = '$2,340',
  dashboardUrl = 'https://modeloptix.com/dashboard',
  upgradeUrl = 'https://modeloptix.com/dashboard/billing/upgrade',
  isFreeTier = true,
}) => {
  const getImpactEmoji = (impact: 'positive' | 'neutral' | 'negative') => {
    switch (impact) {
      case 'positive': return '🟢';
      case 'negative': return '🔴';
      default: return '🟡';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>Your weekly AI cost digest - {totalPotentialSavings} in potential savings identified</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <EmailHeader />

          <Section style={contentStyle}>
            <Text style={dateStyle}>Week ending {weekEnding}</Text>

            <Heading style={headingStyle}>
              Your Weekly AI Cost Digest
            </Heading>

            <Text style={paragraphStyle}>
              Hi {firstName}, here&apos;s your independent analysis of AI model
              opportunities and market updates for this week.
            </Text>

            {/* Key Metrics */}
            <EmailCard highlight>
              <Row>
                <Column style={metricColumnStyle}>
                  <Text style={metricValueStyle}>{totalPotentialSavings}</Text>
                  <Text style={metricLabelStyle}>Potential Savings</Text>
                </Column>
                <Column style={metricColumnStyle}>
                  <Text style={metricValueStyle}>{currentSpend}</Text>
                  <Text style={metricLabelStyle}>Current Monthly Spend</Text>
                </Column>
              </Row>
            </EmailCard>

            {/* Top Opportunities */}
            <Text style={sectionHeadingStyle}>💡 Top Optimization Opportunities</Text>

            {topOpportunities.map((opp, index) => (
              <EmailCard key={index}>
                <Row>
                  <Column style={opportunityMainStyle}>
                    <Text style={opportunityModelsStyle}>
                      {opp.currentModel} → <strong>{opp.recommendedModel}</strong>
                    </Text>
                    <Text style={opportunityReasonStyle}>{opp.reason}</Text>
                  </Column>
                  <Column style={opportunitySavingsStyle}>
                    <Text style={savingsValueStyle}>{opp.savings}</Text>
                    <Text style={savingsPeriodStyle}>/month</Text>
                  </Column>
                </Row>
              </EmailCard>
            ))}

            {isFreeTier && (
              <Section style={upgradePromptStyle}>
                <Text style={upgradeTextStyle}>
                  🔒 <strong>Free tier limit:</strong> View full analysis and apply
                  optimizations with a paid plan.
                </Text>
                <EmailButton href={upgradeUrl} variant="secondary">
                  Unlock Full Access
                </EmailButton>
              </Section>
            )}

            <Hr style={dividerStyle} />

            {/* Model Updates */}
            <Text style={sectionHeadingStyle}>📰 Model Market Updates</Text>

            {modelUpdates.map((update, index) => (
              <Text key={index} style={updateItemStyle}>
                {getImpactEmoji(update.impact)} <strong>{update.model}</strong>: {update.change}
              </Text>
            ))}

            <Section style={ctaContainerStyle}>
              <EmailButton href={dashboardUrl} variant="primary">
                View Full Dashboard
              </EmailButton>
            </Section>

            <Hr style={dividerStyle} />

            <Text style={footerNoteStyle}>
              This digest is compiled from independent market analysis. ModelOptix
              has no partnerships with AI providers - recommendations are based
              solely on your usage patterns and objective benchmarks.
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

const dateStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const headingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '26px',
  fontWeight: '700',
  margin: '0 0 16px 0',
};

const paragraphStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const metricColumnStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 16px',
};

const metricValueStyle: React.CSSProperties = {
  color: '#0D9488',
  fontSize: '32px',
  fontWeight: '700',
  margin: '0 0 4px 0',
};

const metricLabelStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
};

const sectionHeadingStyle: React.CSSProperties = {
  color: '#1A2B4C',
  fontSize: '18px',
  fontWeight: '600',
  margin: '24px 0 16px 0',
};

const opportunityMainStyle: React.CSSProperties = {
  flex: '1',
};

const opportunityModelsStyle: React.CSSProperties = {
  color: '#1e293b',
  fontSize: '15px',
  margin: '0 0 4px 0',
};

const opportunityReasonStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '13px',
  margin: '0',
};

const opportunitySavingsStyle: React.CSSProperties = {
  textAlign: 'right' as const,
  minWidth: '80px',
};

const savingsValueStyle: React.CSSProperties = {
  color: '#0D9488',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
};

const savingsPeriodStyle: React.CSSProperties = {
  color: '#64748b',
  fontSize: '11px',
  margin: '0',
};

const upgradePromptStyle: React.CSSProperties = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '20px',
  margin: '16px 0',
  textAlign: 'center' as const,
  border: '1px dashed #cbd5e1',
};

const upgradeTextStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const dividerStyle: React.CSSProperties = {
  borderColor: '#e2e8f0',
  margin: '24px 0',
};

const updateItemStyle: React.CSSProperties = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 12px 0',
  paddingLeft: '4px',
};

const ctaContainerStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  margin: '32px 0 24px 0',
};

const footerNoteStyle: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
  fontStyle: 'italic',
  margin: '0',
};

export default WeeklyDigestEmail;
