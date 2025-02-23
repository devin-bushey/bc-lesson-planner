import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan, updateLessonPlan } from '../services/lessonPlanService';
import Editor from './Editor/Editor';
import styles from './LessonPlanDisplay.module.css';
import statusStyles from './subcomponents/StatusIndicator.module.css';

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
    const [initialContent, setInitialContent] = useState<string>('');
    const [currentContent, setCurrentContent] = useState<string>('');
    const [hasEditorChanges, setHasEditorChanges] = useState(false);
    const [isContentSaving, setIsContentSaving] = useState(false);
    const [isMetadataSaving, setIsMetadataSaving] = useState(false);
    const [showUnsavedModal, setShowUnsavedModal] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');

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
                const content = data.content || '';
                setLessonPlan(data);
                setInitialContent(content);
                setCurrentContent(content);
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

    // Track content changes
    useEffect(() => {
        if (!loading) {
            setHasEditorChanges(currentContent !== initialContent);
        }
    }, [currentContent, initialContent, loading]);

    const handleContentChange = (content: string) => {
        if (lessonPlan) {
            setLessonPlan({
                ...lessonPlan,
                content: content
            });
            setCurrentContent(content);
        }
    };

    const handleSave = async () => {
        if (!lessonPlan || !id || !hasEditorChanges) return;
        
        setIsContentSaving(true);
        try {
            const updatedPlan = await updateLessonPlan(parseInt(id), {
                ...lessonPlan,
                content: currentContent
            });
            setLessonPlan(updatedPlan);
            setInitialContent(currentContent);
            setHasEditorChanges(false);
        } catch (err) {
            setError('Failed to save changes. Please try again.');
            console.error('Save error:', err);
        } finally {
            setIsContentSaving(false);
        }
    };

    const handleTitleEdit = () => {
        if (!lessonPlan) return;
        setTitleInput(lessonPlan.title || `${lessonPlan.subject} Lesson`);
        setIsEditingTitle(true);
    };

    const handleTitleSave = async (newTitle: string) => {
        if (!lessonPlan || !id) return;
        
        setIsMetadataSaving(true);
        try {
            const updatedPlan = await updateLessonPlan(parseInt(id), {
                ...lessonPlan,
                title: newTitle
            });
            setLessonPlan(updatedPlan);
            setIsEditingTitle(false);
        } catch (err) {
            setError('Failed to save title. Please try again.');
            console.error('Save error:', err);
        } finally {
            setIsMetadataSaving(false);
        }
    };

    const handleTitleBlur = () => {
        handleTitleSave(titleInput);
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (!lessonPlan || !id) return;
        
        setIsMetadataSaving(true);
        try {
            const updatedPlan = await updateLessonPlan(parseInt(id), {
                ...lessonPlan,
                metadata: {
                    ...lessonPlan.metadata,
                    status: e.target.value
                }
            });
            setLessonPlan(updatedPlan);
        } catch (err) {
            setError('Failed to update status. Please try again.');
            console.error('Save error:', err);
        } finally {
            setIsMetadataSaving(false);
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
                    {isEditingTitle ? (
                        <div className={styles.titleEdit}>
                            <input
                                type="text"
                                value={titleInput}
                                onChange={(e) => setTitleInput(e.target.value)}
                                onBlur={handleTitleBlur}
                                className={`${styles.titleInput} ${isMetadataSaving ? styles.saving : ''}`}
                                placeholder="Enter lesson title..."
                                autoFocus
                                disabled={isMetadataSaving}
                            />
                            {isMetadataSaving && (
                                <div className={styles.loadingSpinner}>
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 1.5V4.5M8 11.5V14.5M3 8H0M16 8H13M13.7 13.7L11.5 11.5M13.7 2.3L11.5 4.5M2.3 13.7L4.5 11.5M2.3 2.3L4.5 4.5" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className={styles.titleDisplay}>
                            <h1 onClick={handleTitleEdit} className={styles.editableTitle}>
                                {lessonPlan?.title || `${lessonPlan?.subject} Lesson`}
                            </h1>
                        </div>
                    )}
                    <div className={styles.subtitle}>
                        <span>{lessonPlan?.subject}</span>
                        <span>•</span>
                        <span>Grade {lessonPlan?.grade_level}</span>
                    </div>
                </div>
                <div className={styles.metadata}>
                    <div className={styles.date}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M6 4V2" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M10 4V2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        Created: {new Date(lessonPlan.created_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div>
                    <div className={styles.date}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                            <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        Last Updated: {new Date(lessonPlan.updated_at).toLocaleString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                    </div>
                    <div className={statusStyles.status}>
                        <select
                            value={lessonPlan.metadata?.status || 'Draft'}
                            onChange={handleStatusChange}
                            className={`${statusStyles.statusSelect} ${
                                lessonPlan.metadata?.status === 'Scheduled' ? statusStyles.scheduled :
                                lessonPlan.metadata?.status === 'Completed' ? statusStyles.completed : ''
                            }`}
                            disabled={isMetadataSaving}
                        >
                            <option value="Draft">Draft</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </div>
                </div>
                <button 
                    className={`${styles.saveButton} ${hasEditorChanges ? styles.hasChanges : ''}`}
                    onClick={handleSave}
                    disabled={!hasEditorChanges || isContentSaving || loading}
                >
                    {isContentSaving ? 'Saving...' : hasEditorChanges ? 'Save Changes' : 'Saved'}
                </button>
            </div>

            <div className={styles.editorContainer}>
                <div className={styles.editorContent}>
                    <Editor 
                        content={lessonPlan.content}
                        onUpdate={handleContentChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default LessonPlanDisplay;