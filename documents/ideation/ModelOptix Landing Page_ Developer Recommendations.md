# ModelOptix Landing Page: Developer Recommendations

**Objective:** Implement the following changes to increase waitlist conversions, improve user trust, and align the page with brand guidelines.

---

## P0: Critical Fixes (Blocking Issues)

These issues severely impact user trust and conversion. They must be fixed before driving any traffic to the page.

| ID | Issue | Location | Action Required |
|----|-------|----------|-----------------|
| **P0-1** | Broken Nav Links | Main Navigation | **Fix routes:** `/pricing` should not 404. `/about` should not redirect to login. Both should point to simple, public pages (even if they are just placeholders for now). |
| **P0-2** | Dead Signup Link | Main Navigation | **Redirect CTA:** The "Get Started" button (which links to `/signup`) should trigger the waitlist email capture form/modal, not a blank page. |
| **P0-3** | Buried Waitlist Form | Hero Section | **Add Email Capture:** Add an inline email input field and a "Join Waitlist" button directly in the hero section, below the main sub-headline. This should be the primary call-to-action above the fold. |

---

## P1: High-Impact Changes (Conversion & Brand)

These changes directly address the main conversion path and brand voice.

| ID | Issue | Location | Action Required |
|----|-------|----------|-----------------|
| **P1-1** | Inconsistent Voice | Entire Page | **Standardize to "I":** The brand voice is solopreneur-led. Perform a find-and-replace for "We" and "ModelOptix is" and change to "I" and "I am". For example, "*We* recommend..." becomes "*I* recommend..." and "Why developers trust ModelOptix" becomes "Why developers trust me". |
| **P1-2** | Leaky Calculator CTA | Calculator Results | **Integrate Email Capture:** After a user interacts with the calculator, the "Get Personalized Recommendations" button should trigger an email capture. Change the button text to something like "Email Me My Results" and have it reveal an email input field. |
| **P1-3** | Missing Risk Reversal | Trust / Features Section | **Add "Sanity Check" Feature:** Add a section or bullet point that explains the sanity check feature. **Suggested Copy:** *"Test any recommendation with your own prompts before switching. I provide the proof, you make the call."* |
| **P1-4** | Misleading Nav CTA | Main Navigation | **Rename Button:** Change the "Get Started" button in the main navigation to "Join Waitlist" to accurately reflect the page's goal. |

---

## P2: Medium-Impact Polish (Trust & Clarity)

These are smaller tweaks that improve credibility and user experience.

| ID | Issue | Location | Action Required |
|----|-------|----------|-----------------|
| **P2-1** | No Social Proof | Waitlist CTA sections | **Add Dynamic Counter (or placeholder):** Change "Join the waitlist" to "Join 500+ developers on the waitlist". This can be a static number to start and updated later. |
| **P2-2** | Abstract Alerting | "Continuous Monitoring" section | **Visualize the Alert:** Add a small visual element or a blockquote that shows what an alert looks like. **Example:** `<blockquote>⚠️ **ModelOptix Alert:** We've detected that `claude-3.5-sonnet` now offers a 12% performance improvement for your 'Sentiment Analysis' use case at a 20% lower cost.</blockquote>` |
| **P2-3** | Footer Conversion | Footer | **Add Final CTA:** Add a final email capture form in the footer section for users who scroll to the bottom. |
| **P2-4** | Weak Hero CTA | Hero Section | **Strengthen Verb:** Change the secondary hero CTA from "See How Much You Could Save" to the more active "Calculate Your Savings". |

---

## Implementation Summary

1.  **Fix broken links** in the navigation bar (`pricing`, `about`, `Get Started`).
2.  **Add an email form** to the main hero section.
3.  **Change all copy** from "We" to "I".
4.  **Connect the calculator results** to an email capture.
5.  **Add copy** explaining the "Sanity Check" feature.
6.  **Implement the P2 polish items** as time permits.
