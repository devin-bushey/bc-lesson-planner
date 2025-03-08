const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

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

export interface UserProfile {
    sub: string;
    email: string;
    name: string;
    picture: string;
}

export interface FeedbackOptions {
    gradeLevel: string;
    tone: string;
    responseLength: string;
    focusAreas: string[];
    customInstructions?: string;
}

export interface AppFeedback {
    rating: number;
    feedbackText: string;
    category: string;
    email?: string;
}

export const createApiClient = (getToken: () => Promise<string>, userProfile?: UserProfile) => {
    let isRedirecting = false;

    const getAuthHeaders = async () => {
        try {
            // If already redirecting, don't try to get a new token
            if (isRedirecting) {
                throw new Error('Authentication in progress');
            }

            const token = await getToken();
            console.debug('Got token for API request');
            
            // Log if user profile is missing
            if (!userProfile) {
                console.warn('User profile is missing when creating API headers');
            } else {
                console.debug('Including user profile in request headers');
            }
            
            return {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-User-Profile': userProfile ? JSON.stringify(userProfile) : '',
            };
        } catch (error) {
            console.error('Error getting auth headers:', error);
            isRedirecting = true;
            throw error;
        }
    };

    // Add error handling wrapper for API calls
    const handleApiCall = async <T>(apiCall: () => Promise<T>): Promise<T> => {
        try {
            return await apiCall();
        } catch (error) {
            if (error instanceof Error && error.message === 'connection already closed') {
                console.debug('Connection closed, authentication may be in progress');
                // Return a rejected promise that will be handled by the UI
                return Promise.reject(new Error('Authentication required'));
            }
            throw error;
        }
    };

    return {
        getAllLessonPlans: () => handleApiCall(async () => {
            const headers = await getAuthHeaders();
            const response = await fetch(`${API_BASE_URL}/lesson-plans`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch lesson plans');
            return response.json();
        }),

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
        },

        refineReportCardFeedback: async (feedback: string, options?: FeedbackOptions): Promise<string> => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_BASE_URL}/refine-feedback`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ 
                        feedback,
                        options
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to refine report card feedback');
                }

                return response.json();
            } catch (error) {
                console.error('Error in refineReportCardFeedback:', error);
                throw error;
            }
        },

        submitFeedback: async (feedback: AppFeedback): Promise<{ success: boolean, message: string }> => {
            try {
                const headers = await getAuthHeaders();
                const response = await fetch(`${API_BASE_URL}/submit-feedback`, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(feedback),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to submit feedback');
                }

                return response.json();
            } catch (error) {
                console.error('Error in submitFeedback:', error);
                throw error;
            }
        }
    };
}; 