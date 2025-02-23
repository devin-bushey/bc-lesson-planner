const API_BASE_URL = 'http://localhost:5000';

export interface LessonPlan {
    id: number;
    title: string;
    grade_level: string;
    subject: string;
    content: any;
    metadata: any;
    created_at: string;
    updated_at: string;
}

export const createApiClient = (getToken: () => Promise<string>) => {
    const getAuthHeaders = async () => {
        try {
            const token = await getToken();
            console.debug('Got token for API request');
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            };
        } catch (error) {
            console.error('Error getting auth headers:', error);
            throw error;
        }
    };

    return {
        getAllLessonPlans: async (): Promise<LessonPlan[]> => {
            try {
                const headers = await getAuthHeaders();
                console.debug('Making request to /lesson-plans');
                const response = await fetch(`${API_BASE_URL}/lesson-plans`, {
                    headers
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Failed to fetch lesson plans:', errorData);
                    throw new Error(errorData.message || 'Failed to fetch lesson plans');
                }

                return response.json();
            } catch (error) {
                console.error('Error in getAllLessonPlans:', error);
                throw error;
            }
        },

        getLessonPlan: async (id: number): Promise<LessonPlan> => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_BASE_URL}/lesson-plan/${id}`, {
                    headers
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to fetch lesson plan');
                }

                return response.json();
            } catch (error) {
                console.error('Error in getLessonPlan:', error);
                throw error;
            }
        },

        generateLessonPlan: async (grade: string, subject: string): Promise<LessonPlan> => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_BASE_URL}/generate-plan`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ grade, subject }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to generate lesson plan');
                }

                return response.json();
            } catch (error) {
                console.error('Error in generateLessonPlan:', error);
                throw error;
            }
        },

        updateLessonPlan: async (id: number, plan: Partial<LessonPlan>): Promise<LessonPlan> => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_BASE_URL}/lesson-plan/${id}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        ...plan,
                        metadata: {
                            ...plan.metadata,
                            lastUpdated: new Date().toISOString()
                        }
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to update lesson plan');
                }

                return response.json();
            } catch (error) {
                console.error('Error in updateLessonPlan:', error);
                throw error;
            }
        }
    };
}; 