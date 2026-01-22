// Function types for ModelOptix
// Functions represent AI-powered features within a product

export interface Function {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  current_model_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface FunctionWithModel extends Function {
  model?: {
    id: string;
    name: string;
    provider: string;
  } | null;
}

export interface CreateFunctionInput {
  name: string;
  description?: string;
  current_model_id?: string;
}

export interface UpdateFunctionInput {
  name?: string;
  description?: string;
  current_model_id?: string | null;
}
