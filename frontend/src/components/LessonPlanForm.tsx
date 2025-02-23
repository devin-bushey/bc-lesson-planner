import React, { useState } from 'react';
import { generateLessonPlan } from '../services/lessonPlannerService';
import styles from './LessonPlanForm.module.css';

interface LessonPlanFormProps {
    onPlanGenerated: (plan: any) => void;
    hasEditorChanges: boolean;
    onGenerateStart: () => void;
}

const GRADE_LEVELS = [
    { value: 'K', label: 'Kindergarten' },
    { value: '1', label: 'Grade 1' },
    { value: '2', label: 'Grade 2' },
    { value: '3', label: 'Grade 3' },
    { value: '4', label: 'Grade 4' },
    { value: '5', label: 'Grade 5' },
];

const SUBJECTS = [
    { value: 'ARTS EDUCATION', label: 'Arts Education' },
    { value: 'ENGLISH LANGUAGE ARTS', label: 'English Language Arts' },
    { value: 'MATHEMATICS', label: 'Mathematics' },
    { value: 'PHYSICAL AND HEALTH EDUCATION', label: 'Physical and Health Education' },
    { value: 'SCIENCE', label: 'Science' },
    { value: 'SOCIAL STUDIES', label: 'Social Studies' },
];

const LessonPlanForm: React.FC<LessonPlanFormProps> = ({ onPlanGenerated, hasEditorChanges, onGenerateStart }) => {
    const [gradeLevel, setGradeLevel] = useState('');
    const [subject, setSubject] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (hasEditorChanges) {
            const confirmGenerate = window.confirm(
                'You have unsaved changes in the editor. Generating a new lesson plan will replace the current content. Do you want to continue?'
            );
            if (!confirmGenerate) {
                return;
            }
        }

        setIsLoading(true);
        onGenerateStart();
        
        try {
            const response = await generateLessonPlan(gradeLevel, subject);
            onPlanGenerated(response);
            // Clear form after successful generation
            setGradeLevel('');
            setSubject('');
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
                <select
                    className={styles.select}
                    id="gradeLevel"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    required
                    disabled={isLoading}
                >
                    <option value="">Select a grade level</option>
                    {GRADE_LEVELS.map(grade => (
                        <option key={grade.value} value={grade.value}>
                            {grade.label}
                        </option>
                    ))}
                </select>
            </div>
            <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="subject">Subject:</label>
                <select
                    className={styles.select}
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={isLoading}
                >
                    <option value="">Select a subject</option>
                    {SUBJECTS.map(subj => (
                        <option key={subj.value} value={subj.value}>
                            {subj.label}
                        </option>
                    ))}
                </select>
            </div>
            <button className={styles.button} type="submit" disabled={isLoading}>
                {isLoading ? <span className={styles.loading} /> : 'Generate Lesson Plan'}
            </button>
        </form>
    );
};

export default LessonPlanForm;