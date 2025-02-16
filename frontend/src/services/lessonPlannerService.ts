import axios from 'axios';

const API_URL = 'http://localhost:5000'; // Adjust the URL as needed

export const generateLessonPlan = async (grade: string, subject: string) => {
    try {
        const response = await axios.post(`${API_URL}/generate-plan`, { grade, subject });
        return response.data;
    } catch (error) {
        console.error('Error generating lesson plan:', error);
        throw error;
    }
};