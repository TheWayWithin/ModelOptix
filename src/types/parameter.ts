/**
 * Parameter Support Types
 *
 * Types for API parameter compatibility matrix.
 *
 * @see architecture.md Section 11 - Parameter Translation Layer
 */

/**
 * Value types for parameters.
 */
export type ParameterValueType = 'integer' | 'float' | 'boolean' | 'string' | 'array';

/**
 * All value types in display order.
 */
export const PARAMETER_VALUE_TYPES: ParameterValueType[] = [
  'integer',
  'float',
  'boolean',
  'string',
  'array',
];

/**
 * Common API parameters that most models support.
 */
export const COMMON_PARAMETERS = [
  {
    name: 'temperature',
    valueType: 'float' as ParameterValueType,
    minValue: 0,
    maxValue: 2,
    defaultValue: 1,
    description: 'Controls randomness in output. Higher = more creative, lower = more focused.',
  },
  {
    name: 'top_p',
    valueType: 'float' as ParameterValueType,
    minValue: 0,
    maxValue: 1,
    defaultValue: 1,
    description: 'Nucleus sampling threshold. Controls diversity of token selection.',
  },
  {
    name: 'max_tokens',
    valueType: 'integer' as ParameterValueType,
    minValue: 1,
    maxValue: 128000,
    defaultValue: 4096,
    description: 'Maximum number of tokens to generate in the response.',
  },
  {
    name: 'frequency_penalty',
    valueType: 'float' as ParameterValueType,
    minValue: -2,
    maxValue: 2,
    defaultValue: 0,
    description: 'Penalizes frequent tokens to reduce repetition.',
  },
  {
    name: 'presence_penalty',
    valueType: 'float' as ParameterValueType,
    minValue: -2,
    maxValue: 2,
    defaultValue: 0,
    description: 'Penalizes tokens that have appeared to encourage new topics.',
  },
  {
    name: 'stop',
    valueType: 'array' as ParameterValueType,
    minValue: null,
    maxValue: null,
    defaultValue: null,
    description: 'Sequences where the model will stop generating further tokens.',
  },
  {
    name: 'response_format',
    valueType: 'boolean' as ParameterValueType,
    minValue: null,
    maxValue: null,
    defaultValue: null,
    description: 'Whether JSON mode is supported for structured output.',
  },
  {
    name: 'tools',
    valueType: 'boolean' as ParameterValueType,
    minValue: null,
    maxValue: null,
    defaultValue: null,
    description: 'Whether function/tool calling is supported.',
  },
  {
    name: 'vision',
    valueType: 'boolean' as ParameterValueType,
    minValue: null,
    maxValue: null,
    defaultValue: null,
    description: 'Whether the model accepts image inputs.',
  },
  {
    name: 'seed',
    valueType: 'integer' as ParameterValueType,
    minValue: 0,
    maxValue: null,
    defaultValue: null,
    description: 'Random seed for reproducible outputs (if supported).',
  },
];

/**
 * Database record for parameter support.
 */
export interface ParameterSupportRecord {
  id: string;
  model_id: string;
  parameter_name: string;
  is_supported: boolean;
  min_value: number | null;
  max_value: number | null;
  default_value: number | null;
  value_type: ParameterValueType;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Parameter support with model info for admin view.
 */
export interface ParameterSupportWithModel extends ParameterSupportRecord {
  model_name: string;
  provider_name: string;
}

/**
 * Input for creating a parameter support entry.
 */
export interface CreateParameterInput {
  model_id: string;
  parameter_name: string;
  is_supported?: boolean;
  min_value?: number | null;
  max_value?: number | null;
  default_value?: number | null;
  value_type: ParameterValueType;
  notes?: string | null;
}

/**
 * Input for updating a parameter support entry.
 */
export interface UpdateParameterInput {
  id: string;
  is_supported?: boolean;
  min_value?: number | null;
  max_value?: number | null;
  default_value?: number | null;
  value_type?: ParameterValueType;
  notes?: string | null;
}

/**
 * Bulk parameter input for adding common parameters to a model.
 */
export interface BulkParameterInput {
  model_id: string;
  parameters: Omit<CreateParameterInput, 'model_id'>[];
}

/**
 * Response for parameter list API.
 */
export interface ParameterListResponse {
  parameters: ParameterSupportRecord[];
  model: {
    id: string;
    name: string;
    providerName: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Admin list item for models with parameter counts.
 */
export interface ModelParameterSummary {
  id: string;
  name: string;
  providerName: string;
  providerTrustTier: string;
  parameterCount: number;
  isAvailable: boolean;
}

/**
 * Response for model parameter summary list.
 */
export interface ModelParameterSummaryResponse {
  models: ModelParameterSummary[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Helper function to get value type label.
 */
export function getValueTypeLabel(valueType: ParameterValueType): string {
  const labels: Record<ParameterValueType, string> = {
    integer: 'Integer',
    float: 'Float',
    boolean: 'Boolean',
    string: 'String',
    array: 'Array',
  };
  return labels[valueType];
}

/**
 * Helper function to format parameter value range.
 */
export function formatValueRange(
  minValue: number | null,
  maxValue: number | null,
  valueType: ParameterValueType
): string {
  if (valueType === 'boolean') return 'true/false';
  if (valueType === 'string' || valueType === 'array') return 'N/A';

  if (minValue === null && maxValue === null) return 'No limits';
  if (minValue === null) return `≤ ${maxValue}`;
  if (maxValue === null) return `≥ ${minValue}`;
  return `${minValue} - ${maxValue}`;
}

/**
 * Helper function to format default value.
 */
export function formatDefaultValue(
  defaultValue: number | null,
  valueType: ParameterValueType
): string {
  if (defaultValue === null) return 'None';
  if (valueType === 'boolean') return defaultValue ? 'true' : 'false';
  return defaultValue.toString();
}
