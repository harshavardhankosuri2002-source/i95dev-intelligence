const BASE_URL = '/api';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Executive Overview
  getExecutiveKPIs: (filters?: { region?: string; industry?: string; account_manager?: string }) => {
    const params = new URLSearchParams();
    if (filters?.region) params.append('region', filters.region);
    if (filters?.industry) params.append('industry', filters.industry);
    if (filters?.account_manager) params.append('account_manager', filters.account_manager);
    const qs = params.toString();
    return fetchApi<any>(`/analytics/executive${qs ? `?${qs}` : ''}`);
  },

  // Customers
  getCustomers: (params?: { search?: string; segment?: string; industry?: string; region?: string; account_manager?: string; limit?: number; offset?: number }) => {
    const sp = new URLSearchParams();
    if (params?.search) sp.append('search', params.search);
    if (params?.segment) sp.append('segment', params.segment);
    if (params?.industry) sp.append('industry', params.industry);
    if (params?.region) sp.append('region', params.region);
    if (params?.account_manager) sp.append('account_manager', params.account_manager);
    if (params?.limit) sp.append('limit', params.limit.toString());
    if (params?.offset) sp.append('offset', params.offset.toString());
    const qs = sp.toString();
    return fetchApi<any>(`/customers${qs ? `?${qs}` : ''}`);
  },
  getCustomerDetails: (customerId: string) => fetchApi<any>(`/customers/${customerId}`),

  // Segmentation
  getSegmentation: () => fetchApi<any>('/segmentation'),
  recluster: (k: number) => fetchApi<any>('/segmentation/recluster', {
    method: 'POST',
    body: JSON.stringify({ k }),
  }),

  // Recommendations
  getSegmentRecommendations: () => fetchApi<any>('/recommendations/segments'),
  getCustomerRecommendation: (customerId: string) => fetchApi<any>(`/recommendations/customer/${customerId}`),

  // Automation
  getRules: () => fetchApi<any>('/automation/rules'),
  toggleRule: (ruleId: string) => fetchApi<any>(`/automation/rules/${ruleId}/toggle`, { method: 'POST' }),
  updateRule: (ruleId: string, data: any) => fetchApi<any>(`/automation/rules/${ruleId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  evaluateTriggers: (ruleId?: string) => fetchApi<any>(`/automation/evaluate${ruleId ? `?rule_id=${ruleId}` : ''}`, { method: 'POST' }),
  getTasks: (status?: string) => fetchApi<any>(`/automation/tasks${status ? `?status=${status}` : ''}`),
  updateTaskAction: (taskId: string, action: string, editedMessage?: string) => fetchApi<any>(`/automation/tasks/${taskId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action, edited_message: editedMessage }),
  }),
  dispatchApprovedTasks: () => fetchApi<any>('/automation/tasks/dispatch', { method: 'POST' }),
  getAuditLogs: () => fetchApi<any>('/automation/audit'),

  // Messages
  getCampaignMessages: (params?: { customer_id?: string; channel?: string; simulated_status?: string; limit?: number }) => {
    const sp = new URLSearchParams();
    if (params?.customer_id) sp.append('customer_id', params.customer_id);
    if (params?.channel) sp.append('channel', params.channel);
    if (params?.simulated_status) sp.append('simulated_status', params.simulated_status);
    if (params?.limit) sp.append('limit', params.limit.toString());
    const qs = sp.toString();
    return fetchApi<any>(`/messages${qs ? `?${qs}` : ''}`);
  },
  previewMessage: (customerId: string, triggerName: string, channel: string) => fetchApi<any>('/messages/preview', {
    method: 'POST',
    body: JSON.stringify({ customer_id: customerId, trigger_name: triggerName, channel }),
  }),
  simulateResponse: (messageId: string, sentiment: string) => fetchApi<any>('/messages/simulate-response', {
    method: 'POST',
    body: JSON.stringify({ message_id: messageId, sentiment }),
  }),
  simulateBatch: (batchSize: number = 15) => fetchApi<any>('/messages/simulate-batch', {
    method: 'POST',
    body: JSON.stringify({ batch_size: batchSize }),
  }),

  // Campaign Analytics
  getCampaignAnalytics: () => fetchApi<any>('/analytics/campaigns'),

  // AI Analyst
  chatAnalyst: (query: string) => fetchApi<any>('/ai-analyst/chat', {
    method: 'POST',
    body: JSON.stringify({ query }),
  }),
  getAnalystSuggestions: () => fetchApi<string[]>('/ai-analyst/suggestions'),

  // Business Impact
  getImpactEvaluation: () => fetchApi<any>('/impact/evaluation'),

  // Data Management
  getDatasets: () => fetchApi<any>('/data/datasets'),
  getDataDictionary: () => fetchApi<any>('/data/dictionary'),
  regenerateData: (seed: number = 42, count: number = 1000) => fetchApi<any>('/data/regenerate', {
    method: 'POST',
    body: JSON.stringify({ seed, count }),
  }),
  validateData: () => fetchApi<any>('/data/validate'),
};
