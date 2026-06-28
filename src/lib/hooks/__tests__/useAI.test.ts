import { renderHook, act } from '@testing-library/react';
import { useAI } from '../useAI';
import { apiClient } from '@/lib/apiClient';
import { API_BASE } from '@/lib/api-utils';

jest.mock('@/lib/apiClient', () => ({
  apiClient: jest.fn(),
}));

describe('useAI Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAI());
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle successful generateContent call', async () => {
    const mockResponse = { text: 'Generated text summary' };
    (apiClient as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAI());

    let content;
    await act(async () => {
      content = await result.current.generateContent('prompt');
    });

    expect(apiClient).toHaveBeenCalledWith(`${API_BASE}/ai/generate`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ prompt: 'prompt', systemInstruction: undefined }),
    }));
    expect(content).toBe('Generated text summary');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle failed generateContent call', async () => {
    (apiClient as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useAI());

    let content;
    await act(async () => {
      content = await result.current.generateContent('prompt');
    });

    expect(content).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('API Error');
  });

  it('should handle successful prioritizeTasks call', async () => {
    const mockResponse = { prioritizedTasks: [{ taskId: '1', reason: 'High urgency' }] };
    (apiClient as jest.Mock).mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useAI());

    let prioritized;
    await act(async () => {
      prioritized = await result.current.prioritizeTasks([{ id: '1' }]);
    });

    expect(apiClient).toHaveBeenCalledWith(`${API_BASE}/ai/prioritize`, expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ tasks: [{ id: '1' }] }),
    }));
    expect(prioritized).toEqual([{ taskId: '1', reason: 'High urgency' }]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
  });
});
