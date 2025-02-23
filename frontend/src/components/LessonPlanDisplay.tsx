import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LessonPlan } from '../services/lessonPlanService';
import { useApi } from '../hooks/useApi';
import styles from './LessonPlanDisplay.module.css';

interface UnsavedChangesModalProps {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({ isOpen, onConfirm, onCancel }) => {
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <h2>Unsaved Changes</h2>
                <p>You have unsaved changes. Are you sure you want to leave?</p>
                <div className={styles.modalButtons}>
                    <button onClick={onCancel}>Stay</button>
                    <button onClick={onConfirm}>Leave</button>
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
    const [hasEditorChanges, setHasEditorChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
            if (!id) return;
            
            try {
                const data = await api.getLessonPlan(parseInt(id));
                setLessonPlan(data);
                setTitleInput(data.title || `${data.subject} Lesson`);
            } catch (err) {
                setError('Failed to load lesson plan');
            } finally {
                setLoading(false);
            }
        };

        fetchLessonPlan();
    }, [id, api]);

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
            const updatedPlan = await api.updateLessonPlan(parseInt(id), {
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

    const handleTitleEdit = () => {
        if (!lessonPlan) return;
        setTitleInput(lessonPlan.title || `${lessonPlan.subject} Lesson`);
        setIsEditingTitle(true);
    };

    const handleTitleSave = async (newTitle: string) => {
        if (!lessonPlan || !id) return;
        
        setIsSaving(true);
        try {
            const updatedPlan = await api.updateLessonPlan(parseInt(id), {
                ...lessonPlan,
                title: newTitle
            });
            setLessonPlan(updatedPlan);
            setIsEditingTitle(false);
        } catch (err) {
            setError('Failed to save title. Please try again.');
            console.error('Save error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleTitleBlur = () => {
        handleTitleSave(titleInput);
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
                        <input
                            type="text"
                            value={titleInput}
                            onChange={(e) => setTitleInput(e.target.value)}
                            onBlur={handleTitleBlur}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleTitleSave(titleInput);
                                }
                            }}
                            className={styles.titleInput}
                            autoFocus
                        />
                    ) : (
                        <h1 
                            className={styles.title}
                            onClick={handleTitleEdit}
                        >
                            {lessonPlan.title || `${lessonPlan.subject} Lesson`}
                        </h1>
                    )}
                </div>
                <div className={styles.headerRight}>
                    <button
                        className={`${styles.saveButton} ${hasEditorChanges ? styles.hasChanges : ''}`}
                        onClick={handleSave}
                        disabled={!hasEditorChanges || isSaving}
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
            <div className={styles.metadata}>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Grade:</span>
                    <span>{lessonPlan.grade_level}</span>
                </div>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Subject:</span>
                    <span>{lessonPlan.subject}</span>
                </div>
                <div className={styles.metadataItem}>
                    <span className={styles.label}>Created:</span>
                    <span>{new Date(lessonPlan.date).toLocaleDateString()}</span>
                </div>
            </div>
            <div className={styles.content}>
                <textarea
                    value={lessonPlan.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className={styles.editor}
                    placeholder="Enter lesson plan content..."
                />
            </div>
        </div>
    );
};

export default LessonPlanDisplay;