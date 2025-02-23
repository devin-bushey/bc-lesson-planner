import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan, updateLessonPlan } from '../services/lessonPlanService';
import Editor from './Editor/Editor';
import styles from './LessonPlanDisplay.module.css';

const UnsavedChangesModal: React.FC<{
    isOpen: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onCancel, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div 
            className={styles.modalOverlay} 
            onClick={onCancel}
        >
            <div 
                className={styles.modal} 
                onClick={e => e.stopPropagation()}
            >
                <p>You have unsaved changes. Are you sure you want to leave?</p>
                <div className={styles.modalButtons}>
                    <button 
                        className={`${styles.button} ${styles.primaryButton}`}
                        onClick={onCancel}
                        autoFocus
                    >
                        Stay
                    </button>
                    <button 
                        className={styles.button}
                        onClick={onConfirm}
                    >
                        Leave
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonPlanDisplay: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasEditorChanges, setHasEditorChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);

    // Store the navigation action to perform after confirmation
    const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

    const handleNavigation = (path: string) => {
        if (hasEditorChanges) {
            setShowUnsavedModal(true);
            setPendingNavigation(path);
        } else {
            navigate(path);
        }
    };

    const handleConfirmNavigation = () => {
        setShowUnsavedModal(false);
        if (pendingNavigation) {
            navigate(pendingNavigation);
        }
    };

    const handleCancelNavigation = () => {
        setShowUnsavedModal(false);
        setPendingNavigation(null);
    };

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
            setHasEditorChanges(content !== lessonPlan.content);
        }
    };

    const handleSave = async () => {
        if (!lessonPlan || !id) return;
        
        setIsSaving(true);
        try {
            const updatedPlan = await updateLessonPlan(parseInt(id), {
                ...lessonPlan,
                content: lessonPlan.content
            });
            setLessonPlan(updatedPlan);
            setHasEditorChanges(false);
        } catch (err) {
            setError('Failed to save changes. Please try again.');
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
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
                    onClick={() => handleNavigation('/plans')}
                >
                    Back to Plans
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <UnsavedChangesModal 
                isOpen={showUnsavedModal}
                onCancel={handleCancelNavigation}
                onConfirm={handleConfirmNavigation}
            />
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <button 
                        className={styles.backButton}
                        onClick={() => handleNavigation('/plans')}
                    >
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                            <path d="M15 10H5M5 10L10 15M5 10L10 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Back to Plans
                    </button>
                    <h1>{lessonPlan.subject}</h1>
                    <span className={styles.grade}>{lessonPlan.grade_level}</span>
                </div>
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
                    disabled={!hasEditorChanges || isSaving}
                >
                    {isSaving ? 'Saving...' : hasEditorChanges ? 'Save Changes' : 'Saved'}
                </button>
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