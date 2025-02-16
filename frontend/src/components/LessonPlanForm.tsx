import React, { useState } from 'react';
import { generateLessonPlan } from '../services/lessonPlannerService';

const LessonPlanForm: React.FC<{ onPlanGenerated: (plan: any) => void }> = ({ onPlanGenerated }) => {
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            const response = await generateLessonPlan(gradeLevel, subject);
            onPlanGenerated(response);
        } catch (error) {
            console.error('Error generating lesson plan:', error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label htmlFor="gradeLevel">Grade Level:</label>
                <input
                    type="text"
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                />
            </div>
            <div>
                <label htmlFor="subject">Subject:</label>
                <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                />
            </div>
            <button type="submit">Generate Lesson Plan</button>
        </form>
    );
};

export default LessonPlanForm;