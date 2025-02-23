import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan } from '../services/lessonPlanService';
import Editor from './Editor/Editor';
import styles from './LessonPlanDisplay.module.css';

const LessonPlanDisplay: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasEditorChanges, setHasEditorChanges] = useState(false);

    useEffect(() => {
        const fetchLessonPlan = async () => {
            try {
                const response = await fetch(`http://localhost:5000/lesson-plan/${id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch lesson plan');
                }
                const data = await response.json();
                setLessonPlan(data);
            } catch (err) {
                setError('Failed to load lesson plan');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchLessonPlan();
        }
    }, [id]);

    const handleContentChange = (content: string) => {
        if (lessonPlan) {
            setLessonPlan({
                ...lessonPlan,
                content: content
            });
            setHasEditorChanges(true);
        }
    };

    const handleSave = async () => {
        // TODO: Implement save functionality
        setHasEditorChanges(false);
    };

    if (loading) {
        return <div className={styles.loading}>Loading lesson plan...</div>;
    }

    if (error || !lessonPlan) {
        return (
            <div className={styles.error}>
                <span>❌ {error || 'Lesson plan not found'}</span>
                <button 
                    className={styles.button}
                    onClick={() => navigate('/plans')}
                >
                    Back to Plans
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.backButton}
                        onClick={() => navigate('/plans')}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M15 10H5M5 10L10 15M5 10L10 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Back to Plans
                    </button>
                    <h1>{lessonPlan.subject}</h1>
                    <span className={styles.grade}>{lessonPlan.grade_level}</span>
                </div>
                <div className={styles.headerRight}>
                    <div className={styles.metadata}>
                        <div className={styles.date}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M6 4V2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M10 4V2" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            Created: {new Date(lessonPlan.date).toLocaleDateString()}
                        </div>
                        <div className={styles.status}>
                            <span className={styles.statusDot} />
                            <span className={styles.statusText}>
                                {lessonPlan.metadata?.status || 'In Progress'}
                            </span>
                        </div>
                    </div>
                    <button 
                        className={`${styles.saveButton} ${hasEditorChanges ? styles.hasChanges : ''}`}
                        onClick={handleSave}
                        disabled={!hasEditorChanges}
                    >
                        {hasEditorChanges ? 'Save Changes' : 'Saved'}
                    </button>
                </div>
            </div>

            <div className={styles.editorContainer}>
                <Editor 
                    content={lessonPlan.content}
                    onUpdate={handleContentChange}
                />
            </div>
        </div>
    );
};

export default LessonPlanDisplay;