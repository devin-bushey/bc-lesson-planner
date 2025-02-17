import React from 'react';
import styles from './LessonPlanDisplay.module.css';

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
        return <div className={styles.container}>No lesson plan generated yet.</div>;
    }

    return (
        <div className={styles.container}>
            <h2 className={styles.header}>
                Lesson Plan for Grade {lessonPlan.grade_level} - {lessonPlan.subject}
            </h2>
            <div className={styles.metadata}>
                <div className={styles.metadataItem}>
                    <div className={styles.metadataLabel}>Date</div>
                    <div>{lessonPlan.date}</div>
                </div>
                <div className={styles.metadataItem}>
                    <div className={styles.metadataLabel}>Generated At</div>
                    <div>{lessonPlan.metadata.generated_at}</div>
                </div>
                <div className={styles.metadataItem}>
                    <div className={styles.metadataLabel}>Curriculum Version</div>
                    <div>{lessonPlan.metadata.curriculum_version}</div>
                </div>
                <div className={styles.metadataItem}>
                    <div className={styles.metadataLabel}>Previous Plans Referenced</div>
                    <div>{lessonPlan.metadata.previous_plans_referenced}</div>
                </div>
            </div>
            <h3 className={styles.header}>Content:</h3>
            <pre className={styles.content}>{lessonPlan.content}</pre>
        </div>
    );
};

export default LessonPlanDisplay;