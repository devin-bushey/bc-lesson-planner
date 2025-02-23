const API_BASE_URL = 'http://localhost:5000';

export interface LessonPlan {
    id: number;
    date: string;
    grade_level: string;
    subject: string;
    content: any;
    metadata: any;
}

export const getAllLessonPlans = async (): Promise<LessonPlan[]> => {
    const response = await fetch(`${API_BASE_URL}/lesson-plans`);

    if (!response.ok) {
        throw new Error('Failed to fetch lesson plans');
    }

    return response.json();
};

export const generateLessonPlan = async (grade: string, subject: string): Promise<LessonPlan> => {
    const response = await fetch(`${API_BASE_URL}/generate-plan`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ grade, subject }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate lesson plan');
    }

    return response.json();
};

export const updateLessonPlan = async (id: number, plan: Partial<LessonPlan>): Promise<LessonPlan> => {
    const response = await fetch(`${API_BASE_URL}/lesson-plan/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ...plan,
            metadata: {
                ...plan.metadata,
                lastUpdated: new Date().toISOString()
            }
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to update lesson plan');
    }

    return response.json();
}; 