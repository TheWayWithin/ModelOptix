export interface SavingsRecord {
  id: string;
  user_id: string;
  opportunity_id: string | null;
  product_id: string | null;
  function_id: string | null;
  old_model: string;
  old_provider: string;
  new_model: string;
  new_provider: string;
  monthly_savings: number;
  savings_percentage: number | null;
  switched_at: string;
  created_at: string;
}

export interface SavingsRecordWithContext extends SavingsRecord {
  product_name?: string;
  function_name?: string;
}

export interface SavingsSummary {
  total_lifetime_savings: number;
  monthly_savings: number;
  savings_this_month: number;
  total_switches: number;
  switches_this_month: number;
  savings_by_product: Array<{
    product_id: string;
    product_name: string;
    total_savings: number;
    switch_count: number;
  }>;
}
