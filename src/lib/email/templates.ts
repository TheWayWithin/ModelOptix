/**
 * Email Templates for ModelOptix
 *
 * All templates follow a consistent design:
 * - Trust Blue (#1A2B4C) for headers
 * - Gray text for body
 * - Clean, minimal design
 * - Mobile-friendly
 */

// Base styles for all emails
const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
  background-color: #ffffff;
`;

const headerStyles = `
  color: #1A2B4C;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
`;

const paragraphStyles = `
  color: #4B5563;
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 16px;
`;

const buttonStyles = `
  display: inline-block;
  background-color: #0D9488;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  margin: 16px 0;
`;

const footerStyles = `
  border-top: 1px solid #E5E7EB;
  margin-top: 32px;
  padding-top: 24px;
  color: #9CA3AF;
  font-size: 12px;
`;

const highlightBoxStyles = `
  background-color: #F3F4F6;
  border-radius: 8px;
  padding: 20px;
  margin: 24px 0;
`;

// Footer for all emails
const emailFooter = `
  <div style="${footerStyles}">
    <p style="margin: 0 0 8px 0;">ModelOptix · Independent truth in AI</p>
    <p style="margin: 0; color: #6B7280;">
      <a href="https://modeloptix.com/settings" style="color: #6B7280;">Manage notification preferences</a>
    </p>
  </div>
`;

/**
 * Welcome email for new users
 */
export function welcomeEmail(params: {
  name?: string;
  tier: string;
  isTrialing: boolean;
  trialDays?: number;
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Welcome to ModelOptix!';
  const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1);

  return {
    subject: 'Welcome to ModelOptix - Let\'s optimize your AI spend',
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          You're in. Welcome to ModelOptix, the independent AI model advisor that helps you stop overpaying for AI.
        </p>

        ${params.isTrialing ? `
          <div style="${highlightBoxStyles}">
            <p style="margin: 0; color: #1A2B4C; font-weight: 500;">
              Your ${tierName} trial is active
            </p>
            <p style="margin: 8px 0 0 0; color: #4B5563; font-size: 14px;">
              You have ${params.trialDays || 7} days to explore all features. No charge until the trial ends.
            </p>
          </div>
        ` : ''}

        <p style="${paragraphStyles}">
          <strong>Here's what you can do now:</strong>
        </p>

        <ol style="${paragraphStyles}">
          <li style="margin-bottom: 12px;">Add your first AI product to your portfolio</li>
          <li style="margin-bottom: 12px;">Run a Sanity Check to compare models side-by-side</li>
          <li style="margin-bottom: 12px;">Check your Opportunities for instant savings</li>
        </ol>

        <a href="https://modeloptix.com/dashboard" style="${buttonStyles}">
          Go to Dashboard
        </a>

        <p style="${paragraphStyles}">
          Questions? Just reply to this email — we read everything.
        </p>

        <p style="color: #6B7280; font-size: 14px;">
          — The ModelOptix Team
        </p>

        ${emailFooter}
      </div>
    `,
  };
}

/**
 * New opportunity alert email
 */
export function opportunityAlertEmail(params: {
  name?: string;
  productName: string;
  useCaseName: string;
  currentModel: string;
  recommendedModel: string;
  monthlySavings: number;
  savingsPercentage: number;
  opportunityId: string;
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const savingsFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.monthlySavings);

  return {
    subject: `Save ${savingsFormatted}/month on ${params.productName}`,
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          We found a way to save you money on <strong>${params.productName}</strong>.
        </p>

        <div style="${highlightBoxStyles}">
          <p style="margin: 0 0 16px 0; color: #1A2B4C; font-weight: 500; font-size: 18px;">
            ${savingsFormatted}/month savings available
          </p>

          <table style="width: 100%; font-size: 14px; color: #4B5563;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Use Case</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 500;">
                ${params.useCaseName}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Current Model</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                ${params.currentModel}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Recommended</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right; color: #0D9488; font-weight: 500;">
                ${params.recommendedModel}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Savings</td>
              <td style="padding: 8px 0; text-align: right; color: #059669; font-weight: 500;">
                ${params.savingsPercentage.toFixed(0)}% less
              </td>
            </tr>
          </table>
        </div>

        <a href="https://modeloptix.com/opportunities/${params.opportunityId}" style="${buttonStyles}">
          View Opportunity
        </a>

        <p style="${paragraphStyles}">
          Not sure? Run a Sanity Check to see how the models compare on your actual use case.
        </p>

        ${emailFooter}
      </div>
    `,
  };
}

/**
 * Trial ending reminder email
 */
export function trialReminderEmail(params: {
  name?: string;
  tier: string;
  daysRemaining: number;
  totalSavingsFound: number;
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const tierName = params.tier.charAt(0).toUpperCase() + params.tier.slice(1);
  const savingsFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.totalSavingsFound);

  const urgency = params.daysRemaining <= 1
    ? 'Your trial ends tomorrow'
    : `Your trial ends in ${params.daysRemaining} days`;

  return {
    subject: `${urgency} - ${tierName} Plan`,
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          ${urgency}. Here's a quick summary of what you've discovered:
        </p>

        <div style="${highlightBoxStyles}">
          <p style="margin: 0; color: #059669; font-size: 24px; font-weight: 600;">
            ${savingsFormatted}
          </p>
          <p style="margin: 8px 0 0 0; color: #4B5563; font-size: 14px;">
            in potential monthly savings found
          </p>
        </div>

        <p style="${paragraphStyles}">
          <strong>What happens next?</strong>
        </p>

        <p style="${paragraphStyles}">
          If you do nothing, your subscription will automatically continue at ${tierName} pricing.
          You can cancel anytime from your settings.
        </p>

        <p style="${paragraphStyles}">
          If ModelOptix isn't right for you, no hard feelings. You can downgrade to Free
          before your trial ends and keep basic access.
        </p>

        <a href="https://modeloptix.com/dashboard/settings" style="${buttonStyles}">
          Manage Subscription
        </a>

        <p style="color: #6B7280; font-size: 14px;">
          — The ModelOptix Team
        </p>

        ${emailFooter}
      </div>
    `,
  };
}

/**
 * Weekly digest email
 */
export function weeklyDigestEmail(params: {
  name?: string;
  weekStartDate: string;
  weekEndDate: string;
  newOpportunities: number;
  totalSavingsAvailable: number;
  savingsRealized: number;
  sanityChecksRun: number;
  topOpportunity?: {
    productName: string;
    savings: number;
    opportunityId: string;
  };
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const savingsAvailable = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.totalSavingsAvailable);
  const savingsRealized = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(params.savingsRealized);

  return {
    subject: `Your Weekly AI Savings Report - ${params.weekEndDate}`,
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          Here's your weekly summary for ${params.weekStartDate} - ${params.weekEndDate}.
        </p>

        <div style="${highlightBoxStyles}">
          <table style="width: 100%; font-size: 14px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">New Opportunities</span>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 500; color: #1A2B4C;">
                ${params.newOpportunities}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">Available Savings</span>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 500; color: #059669;">
                ${savingsAvailable}/mo
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB;">
                <span style="color: #6B7280;">Savings Realized</span>
              </td>
              <td style="padding: 12px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 500; color: #1A2B4C;">
                ${savingsRealized}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0;">
                <span style="color: #6B7280;">Sanity Checks Run</span>
              </td>
              <td style="padding: 12px 0; text-align: right; font-weight: 500; color: #1A2B4C;">
                ${params.sanityChecksRun}
              </td>
            </tr>
          </table>
        </div>

        ${params.topOpportunity ? `
          <p style="${paragraphStyles}">
            <strong>Top opportunity this week:</strong>
          </p>
          <p style="${paragraphStyles}">
            Save ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(params.topOpportunity.savings)}/month
            on <strong>${params.topOpportunity.productName}</strong>.
            <a href="https://modeloptix.com/opportunities/${params.topOpportunity.opportunityId}" style="color: #0D9488;">
              View details →
            </a>
          </p>
        ` : ''}

        <a href="https://modeloptix.com/dashboard" style="${buttonStyles}">
          View Dashboard
        </a>

        ${emailFooter}
      </div>
    `,
  };
}

/**
 * Price change alert email
 */
export function priceChangeAlertEmail(params: {
  name?: string;
  modelName: string;
  providerName: string;
  oldPrice: { input: number; output: number };
  newPrice: { input: number; output: number };
  changePercentage: number;
  affectedProducts: string[];
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';
  const direction = params.changePercentage > 0 ? 'increased' : 'decreased';
  const emoji = params.changePercentage > 0 ? '📈' : '📉';

  return {
    subject: `${emoji} ${params.modelName} pricing ${direction} ${Math.abs(params.changePercentage).toFixed(0)}%`,
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          The pricing for <strong>${params.modelName}</strong> (${params.providerName}) has ${direction}.
        </p>

        <div style="${highlightBoxStyles}">
          <table style="width: 100%; font-size: 14px; color: #4B5563;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;"></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">Before</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">After</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB;">Input (per 1K tokens)</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right;">
                $${params.oldPrice.input.toFixed(4)}
              </td>
              <td style="padding: 8px 0; border-bottom: 1px solid #E5E7EB; text-align: right; font-weight: 500;">
                $${params.newPrice.input.toFixed(4)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">Output (per 1K tokens)</td>
              <td style="padding: 8px 0; text-align: right;">
                $${params.oldPrice.output.toFixed(4)}
              </td>
              <td style="padding: 8px 0; text-align: right; font-weight: 500;">
                $${params.newPrice.output.toFixed(4)}
              </td>
            </tr>
          </table>
        </div>

        ${params.affectedProducts.length > 0 ? `
          <p style="${paragraphStyles}">
            <strong>This affects your products:</strong>
          </p>
          <ul style="${paragraphStyles}">
            ${params.affectedProducts.map(p => `<li>${p}</li>`).join('')}
          </ul>
        ` : ''}

        <a href="https://modeloptix.com/opportunities" style="${buttonStyles}">
          Check for New Opportunities
        </a>

        ${emailFooter}
      </div>
    `,
  };
}

/**
 * Model deprecation alert email
 */
export function deprecationAlertEmail(params: {
  name?: string;
  modelName: string;
  providerName: string;
  deprecationDate: string;
  affectedProducts: string[];
  suggestedReplacement?: string;
}): { subject: string; html: string } {
  const greeting = params.name ? `Hi ${params.name},` : 'Hi there,';

  return {
    subject: `Action Required: ${params.modelName} is being deprecated`,
    html: `
      <div style="${baseStyles}">
        <h1 style="${headerStyles}">${greeting}</h1>

        <p style="${paragraphStyles}">
          <strong>${params.modelName}</strong> from ${params.providerName} will be deprecated on
          <strong>${params.deprecationDate}</strong>.
        </p>

        ${params.affectedProducts.length > 0 ? `
          <div style="${highlightBoxStyles}; border-left: 4px solid #EF4444;">
            <p style="margin: 0 0 12px 0; color: #1A2B4C; font-weight: 500;">
              Your affected products:
            </p>
            <ul style="margin: 0; padding-left: 20px; color: #4B5563;">
              ${params.affectedProducts.map(p => `<li style="margin-bottom: 4px;">${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}

        ${params.suggestedReplacement ? `
          <p style="${paragraphStyles}">
            <strong>Suggested replacement:</strong> ${params.suggestedReplacement}
          </p>
        ` : ''}

        <p style="${paragraphStyles}">
          We recommend updating your configuration before the deprecation date to avoid service interruptions.
        </p>

        <a href="https://modeloptix.com/opportunities" style="${buttonStyles}">
          Find Alternatives
        </a>

        ${emailFooter}
      </div>
    `,
  };
}
