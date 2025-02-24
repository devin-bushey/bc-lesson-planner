import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan } from '../services/lessonPlanService';
import { useApi } from '../hooks/useApi';
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
    const api = useApi();
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
                const data = await api.getLessonPlan(Number(id));
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
    }, [id, api]);

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
            await api.updateLessonPlan(Number(id), {
                content: currentContent,
                metadata: {
                    ...lessonPlan.metadata,
                    lastSaved: new Date().toISOString()
                }
            });
            setLessonPlan({
                ...lessonPlan,
                content: currentContent
            });
            setInitialContent(currentContent);
            setHasEditorChanges(false);
            setShowUnsavedModal(false);
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
            const updatedPlan = await api.updateLessonPlan(Number(id), {
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
            const updatedPlan = await api.updateLessonPlan(Number(id), {
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
                                        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="32">
                                            <animateTransform
                                                attributeName="transform"
                                                type="rotate"
                                                from="0 8 8"
                                                to="360 8 8"
                                                dur="1s"
                                                repeatCount="indefinite"
                                            />
                                        </circle>
                                    </svg>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div 
                            className={styles.titleDisplay}
                            onClick={handleTitleEdit}
                        >
                            <h1>{lessonPlan.title || `${lessonPlan.subject} Lesson`}</h1>
                        </div>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <select
                        value={lessonPlan.metadata?.status || 'draft'}
                        onChange={handleStatusChange}
                        className={`${statusStyles.statusSelect} ${isMetadataSaving ? styles.saving : ''}`}
                        disabled={isMetadataSaving}
                    >
                        <option value="draft">Draft</option>
                        <option value="review">Review</option>
                        <option value="final">Final</option>
                    </select>
                    <button 
                        className={`${styles.saveButton} ${hasEditorChanges ? styles.hasChanges : ''}`}
                        onClick={handleSave}
                        disabled={!hasEditorChanges || isContentSaving}
                    >
                        {isContentSaving ? (
                            <>
                                <svg className={styles.loadingSpinner} width="16" height="16" viewBox="0 0 16 16" fill="none">
                                    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeDashoffset="32">
                                        <animateTransform
                                            attributeName="transform"
                                            type="rotate"
                                            from="0 8 8"
                                            to="360 8 8"
                                            dur="1s"
                                            repeatCount="indefinite"
                                        />
                                    </circle>
                                </svg>
                                Saving...
                            </>
                        ) : hasEditorChanges ? (
                            'Save Changes'
                        ) : (
                            'Saved'
                        )}
                    </button>
                </div>
            </div>
            <div className={styles.metadata}>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Subject:</span>
                    <span>{lessonPlan.subject}</span>
                </div>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Grade:</span>
                    <span className={styles.grade}>{lessonPlan.grade_level}</span>
                </div>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Created:</span>
                    <span className={styles.date}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 4V8L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {new Date(lessonPlan.metadata?.created || '').toLocaleDateString()}
                    </span>
                </div>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Last Updated:</span>
                    <span className={styles.date}>
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 4V8L10.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {new Date(lessonPlan.metadata?.lastSaved || '').toLocaleDateString()}
                    </span>
                </div>
            </div>
            <div className={styles.content}>
                <div className={styles.editorContainer}>
                    <Editor 
                        content={currentContent}
                        onUpdate={handleContentChange}
                    />
                </div>
            </div>
        </div>
    );
};

export default LessonPlanDisplay;