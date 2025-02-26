import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Editor from './Editor/Editor';
import styles from './LessonPlanForm.module.css'; // Reusing existing styles for now

const ReportCardFeedback: React.FC = () => {
    const api = useApi();
    const [originalFeedback, setOriginalFeedback] = useState('');
    const [refinedFeedback, setRefinedFeedback] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!originalFeedback.trim()) {
            setError('Please enter feedback to refine');
            return;
        }
        
        setIsRefining(true);
        setError(null);

        try {
            const refined = await api.refineReportCardFeedback(originalFeedback);
            setRefinedFeedback(refined);
        } catch (err) {
            setError('Failed to refine feedback. Please try again.');
            console.error('Refinement error:', err);
        } finally {
            setIsRefining(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setOriginalFeedback(e.target.value);
    };

    const handleEditorUpdate = (content: string) => {
        setRefinedFeedback(content);
    };

    return (
        <div className={styles.container}>
            {isRefining && (
                <div className={styles.overlay}>
                    <div className={styles.appleContainer}>
                        <div className={styles.apple}>
                            <div className={styles.leaf} />
                        </div>
                    </div>
                    <p>Refining your feedback...</p>
                </div>
            )}

            <div className={styles.formContainer}>
                <h1>Report Card Feedback Refinement</h1>
                <p className={styles.description}>
                    Paste your existing report card feedback below and our AI will help refine it to be more effective and personalized.
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="feedback">Original Feedback:</label>
                        <textarea
                            id="feedback"
                            name="feedback"
                            value={originalFeedback}
                            onChange={handleInputChange}
                            placeholder="Paste your existing report card feedback here..."
                            rows={10}
                            className={styles.textarea}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={styles.button}
                        disabled={isRefining || !originalFeedback.trim()}
                    >
                        Refine Feedback
                    </button>
                </form>

                {refinedFeedback && (
                    <div className={styles.resultContainer}>
                        <h2>Refined Feedback</h2>
                        <p>You can edit the refined feedback below:</p>
                        <div className={styles.editorContainer}>
                            <Editor 
                                content={refinedFeedback} 
                                onUpdate={handleEditorUpdate} 
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportCardFeedback; 