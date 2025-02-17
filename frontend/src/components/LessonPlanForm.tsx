import React, { useState } from 'react';
import { generateLessonPlan } from '../services/lessonPlannerService';
import styles from './LessonPlanForm.module.css';

const LessonPlanForm: React.FC<{ onPlanGenerated: (plan: any) => void }> = ({ onPlanGenerated }) => {
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        try {
            const response = await generateLessonPlan(gradeLevel, subject);
            onPlanGenerated(response);
        } catch (error) {
            console.error('Error generating lesson plan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="gradeLevel">Grade Level:</label>
                <input
                    className={styles.input}
                    type="text"
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subject">Subject:</label>
                <input
                    className={styles.input}
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isLoading}
                />
            </div>
            <button className={styles.button} type="submit" disabled={isLoading}>
                {isLoading ? <span className={styles.loading} /> : 'Generate Lesson Plan'}
            </button>
        </form>
    );
};

export default LessonPlanForm;