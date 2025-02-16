import React from 'react';

interface LessonPlan {
    date: string;
    grade_level: string;
    subject: string;
    content: string;
    metadata: {
        generated_at: string;
        curriculum_version: string;
        previous_plans_referenced: number;
    };
}

interface LessonPlanDisplayProps {
    lessonPlan: LessonPlan | null;
}

const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ lessonPlan }) => {

    if (!lessonPlan) {
        return <div>No lesson plan generated yet.</div>;
    }

    return (
        <div>
            <h2>Lesson Plan for Grade {lessonPlan.grade_level} - {lessonPlan.subject}</h2>
            <p><strong>Date:</strong> {lessonPlan.date}</p>
            <p><strong>Generated At:</strong> {lessonPlan.metadata.generated_at}</p>
            <p><strong>Curriculum Version:</strong> {lessonPlan.metadata.curriculum_version}</p>
            <p><strong>Previous Plans Referenced:</strong> {lessonPlan.metadata.previous_plans_referenced}</p>
            <h3>Content:</h3>
            <pre>{lessonPlan.content}</pre>
        </div>
    );
};

export default LessonPlanDisplay;