import type { LabResult } from '../../../../../../api/lab/LabTypes';

export const extractResultsFromResponse = (responseData: any): LabResult[] => {
  if (!responseData) return [];
  
  // Handle response structure: { success, message, data: { results, item } }
  if (responseData.data && Array.isArray(responseData.data.results)) {
    return responseData.data.results;
  }
  
  // Fallback for backward compatibility
  if (Array.isArray(responseData)) return responseData;
  if (Array.isArray(responseData?.results)) return responseData.results;
  
  return [];
};

export const formatResultValue = (result: LabResult): string => {
  const value = result.value || (result.numeric_value?.toString() ?? '');
  if (result.unit) {
    return `${value} ${result.unit}`;
  }
  return value;
};

export const getResultDisplayText = (result: LabResult): string => {
  const value = formatResultValue(result);
  if (result.interpretation) {
    return `${value} - ${result.interpretation}`;
  }
  return value;
};