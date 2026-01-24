# ModelOptix Calculator v2: Developer Specification

**Objective:** Upgrade the landing page calculator from a static demo to a dynamic, credible tool that provides accurate, use-case-specific model recommendations based on January 2026 market data. This will increase user trust and waitlist conversions.

---

## 1. Frontend UI Changes

The following changes are required for the calculator's input fields.

### 1.1. Update "Primary Use Case" Options

Replace the single "Code Generation" option with a dropdown containing the following six categories:

```json
[
  "Code Generation / Programming",
  "Reasoning / Complex Analysis",
  "Text Generation / Content",
  "Data Processing / Analysis",
  "Chat / Conversational",
  "Agentic / Tool Use"
]
```

### 1.2. Update "Current Model" Options

Replace the single "GPT-4o" option with a dropdown containing a list of popular current models. This list should be sourced from the `model` column in the `pricing_data` table below.

**Initial List:**
```json
[
  "Claude Sonnet 4.5",
  "Claude Opus 4.5",
  "GPT-5.2",
  "GPT-5",
  "GPT-4.1",
  "GPT-4o-mini",
  "Gemini 3 Pro Preview",
  "Gemini 2.5 Pro",
  "DeepSeek V3.2"
]
```

### 1.3. Update "Optimization Priority" Options

Keep the existing options, but ensure they map to the new logic:

```json
[
  "Quality First",
  "Balanced",
  "Cost First"
]
```

---

## 2. Backend Logic Changes

The calculator's recommendation engine needs to be rebuilt to use the provided data matrices.

### 2.1. Data Sources

Two JSON objects will provide the necessary data for the logic. These should be stored and accessed by the backend.

**1. Pricing Data (`pricing_data`)**

This table contains the pricing and context window for each model.

```json
{
  "models": [
    {"model": "Claude Sonnet 4.5", "provider": "Anthropic", "input_pm": 3.00, "output_pm": 15.00, "context_k": 1000, "tier": "Premium"},
    {"model": "Claude Opus 4.5", "provider": "Anthropic", "input_pm": 5.00, "output_pm": 25.00, "context_k": 200, "tier": "Frontier"},
    {"model": "Claude Haiku 4.5", "provider": "Anthropic", "input_pm": 1.00, "output_pm": 5.00, "context_k": 200, "tier": "Fast"},
    {"model": "GPT-5.2", "provider": "OpenAI", "input_pm": 1.75, "output_pm": 14.00, "context_k": 400, "tier": "Frontier"},
    {"model": "GPT-5", "provider": "OpenAI", "input_pm": 1.25, "output_pm": 10.00, "context_k": 400, "tier": "Premium"},
    {"model": "GPT-5 Mini", "provider": "OpenAI", "input_pm": 0.25, "output_pm": 2.00, "context_k": 400, "tier": "Mid"},
    {"model": "GPT-4.1", "provider": "OpenAI", "input_pm": 2.00, "output_pm": 8.00, "context_k": 1050, "tier": "Premium"},
    {"model": "GPT-4o-mini", "provider": "OpenAI", "input_pm": 0.15, "output_pm": 0.60, "context_k": 128, "tier": "Budget"},
    {"model": "Gemini 3 Pro Preview", "provider": "Google", "input_pm": 2.00, "output_pm": 12.00, "context_k": 1050, "tier": "Frontier"},
    {"model": "Gemini 3 Flash Preview", "provider": "Google", "input_pm": 0.50, "output_pm": 3.00, "context_k": 1050, "tier": "Mid"},
    {"model": "Gemini 2.5 Pro", "provider": "Google", "input_pm": 1.25, "output_pm": 10.00, "context_k": 1050, "tier": "Premium"},
    {"model": "Gemini 2.5 Flash", "provider": "Google", "input_pm": 0.30, "output_pm": 2.50, "context_k": 1050, "tier": "Mid"},
    {"model": "Gemini 2.5 Flash Lite", "provider": "Google", "input_pm": 0.10, "output_pm": 0.40, "context_k": 1050, "tier": "Budget"},
    {"model": "DeepSeek V3.2", "provider": "DeepSeek", "input_pm": 0.25, "output_pm": 0.38, "context_k": 164, "tier": "Budget"},
    {"model": "MiniMax M2.1", "provider": "MiniMax", "input_pm": 0.27, "output_pm": 1.12, "context_k": 197, "tier": "Budget"}
  ]
}
```

**2. Recommendation Matrix (`recommendation_matrix`)**

This matrix defines which model to recommend based on the user's selected `use_case` and `priority`.

```json
{
  "recommendations": {
    "Code Generation / Programming": {
      "Quality First": "Claude Sonnet 4.5",
      "Balanced": "Gemini 3 Flash Preview",
      "Cost First": "DeepSeek V3.2"
    },
    "Reasoning / Complex Analysis": {
      "Quality First": "Claude Opus 4.5",
      "Balanced": "Gemini 2.5 Pro",
      "Cost First": "DeepSeek V3.2"
    },
    "Text Generation / Content": {
      "Quality First": "Claude Sonnet 4.5",
      "Balanced": "GPT-5",
      "Cost First": "Gemini 2.5 Flash Lite"
    },
    "Data Processing / Analysis": {
      "Quality First": "Gemini 2.5 Pro",
      "Balanced": "Gemini 2.5 Flash",
      "Cost First": "Gemini 2.5 Flash Lite"
    },
    "Chat / Conversational": {
      "Quality First": "Claude Sonnet 4.5",
      "Balanced": "GPT-4.1 Mini",
      "Cost First": "GPT-4o-mini"
    },
    "Agentic / Tool Use": {
      "Quality First": "Claude Opus 4.5",
      "Balanced": "Gemini 3 Flash Preview",
      "Cost First": "MiniMax M2.1"
    }
  }
}
```

### 2.2. Core Calculation Logic

1.  **Get User Inputs:** `monthly_calls`, `use_case`, `current_model_name`, `priority`.
2.  **Find Recommended Model:** Use the `recommendation_matrix` to get the `recommended_model_name` based on `use_case` and `priority`.
    `recommended_model_name = recommendation_matrix[use_case][priority]`
3.  **Handle Same Model Case:** If `current_model_name == recommended_model_name`, display the message "You're already optimized!" and show $0 savings. Stop here.
4.  **Get Model Pricing:** Look up the pricing for both the `current_model_name` and `recommended_model_name` from the `pricing_data` table.
5.  **Calculate Costs:** Assume a 50/50 split between input and output tokens for simplicity.
    `current_cost = (monthly_calls / 1_000_000) * (current_model.input_pm * 0.5 + current_model.output_pm * 0.5)`
    `recommended_cost = (monthly_calls / 1_000_000) * (recommended_model.input_pm * 0.5 + recommended_model.output_pm * 0.5)`
6.  **Calculate Savings:**
    `monthly_savings = current_cost - recommended_cost`
7.  **Return Results:** Send the `recommended_model_name` and `monthly_savings` to the frontend for display.

### 2.3. Performance Metric (Placeholder)

The performance improvement percentage is currently fabricated. For v2, we will continue to use a placeholder but make it dependent on the `priority`.

-   **Quality First:** Return a random integer between 15% and 25%.
-   **Balanced:** Return a random integer between 8% and 12%.
-   **Cost First:** Return a random integer between 2% and 5%.

This will be replaced with real benchmark data in v3.

---

## 3. Implementation Notes

-   The frontend should dynamically populate the "Current Model" dropdown from the `pricing_data` source.
-   The backend API should accept the four user inputs and return the calculated recommendation and savings.
-   Ensure calculations handle floating-point arithmetic correctly.
-   The logic must explicitly handle the edge case where the user's current model is already the optimal choice for their selected priority.
