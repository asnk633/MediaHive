import { Task } from '@/features/tasks/types/task';
import { DriveFile } from '@/types/file';
import { apiClient } from '@/lib/apiClient';
import { NextRequest, NextResponse } from 'next/server';

export interface DemoDataResult {
  success: boolean;
  message: string;
  data?: {
    eventsCreated: number;
    tasksCreated: number;
    mediaCreated: number;
  };
}

export const DemoDataService = {
  /**
   * Generate demo data for the workspace
   * @param userId The user ID initiating the demo data creation
   * @param institution_id The institution ID for tenant isolation
   * @returns Promise with creation results
   */
  generateDemoData: async (userId: string, institution_id: string): Promise<DemoDataResult> => {
    try {
      const response = await apiClient('/api/demo-data', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          institution_id
        })
      });

      return response;
    } catch (error) {
      console.error('Error generating demo data:', error);
      return {
        success: false,
        message: `Failed to generate demo data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  },

  /**
   * Delete all demo data for the current user's institution
   * @param institution_id The institution ID for tenant isolation
   * @returns Promise with deletion results
   */
  deleteDemoData: async (institution_id: string): Promise<DemoDataResult> => {
    try {
      const response = await apiClient('/api/demo-data', {
        method: 'DELETE',
        body: JSON.stringify({
          institution_id
        })
      });

      return response;
    } catch (error) {
      console.error('Error deleting demo data:', error);
      return {
        success: false,
        message: `Failed to delete demo data: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
};
