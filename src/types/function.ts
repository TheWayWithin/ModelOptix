// Function types for ModelOptix
// Functions represent AI-powered features within a product
// Note: Functions don't have model references - Use Cases do

export interface Function {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunctionWithUseCaseCount extends Function {
  use_case_count: number;
}

export interface CreateFunctionInput {
  name: string;
  description?: string;
}

export interface UpdateFunctionInput {
  name?: string;
  description?: string;
}
