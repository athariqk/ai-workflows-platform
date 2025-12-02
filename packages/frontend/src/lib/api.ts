import type {
  Agent,
  AgentCreate,
  AgentUpdate,
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  APIError,
} from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_KEY = import.meta.env.VITE_API_KEY || '';

class APIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(baseURL: string, apiKey: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    url.searchParams.set('api_key', this.apiKey);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error: APIError = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || error.message || 'API request failed');
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Agent endpoints
  async getAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/v1/agents');
  }

  async getAgent(id: string): Promise<Agent> {
    return this.request<Agent>(`/v1/agents/${id}`);
  }

  async createAgent(data: AgentCreate): Promise<Agent> {
    return this.request<Agent>('/v1/agents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAgent(id: string, data: AgentUpdate): Promise<Agent> {
    return this.request<Agent>(`/v1/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAgent(id: string): Promise<void> {
    return this.request(`/v1/agents/${id}`, {
      method: 'DELETE',
    });
  }

  // Workflow endpoints
  async getWorkflows(): Promise<Workflow[]> {
    return this.request<Workflow[]>('/v1/workflows');
  }

  async getWorkflow(id: string): Promise<Workflow> {
    return this.request<Workflow>(`/v1/workflows/${id}`);
  }

  async createWorkflow(data: WorkflowCreate): Promise<Workflow> {
    return this.request<Workflow>('/v1/workflows', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateWorkflow(id: string, data: WorkflowUpdate): Promise<Workflow> {
    return this.request<Workflow>(`/v1/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteWorkflow(id: string): Promise<void> {
    return this.request(`/v1/workflows/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new APIClient(API_BASE_URL, API_KEY);
