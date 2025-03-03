import React, { useState } from 'react';
import { useApi } from '../hooks/useApi';
import Editor from './Editor/Editor';
import styles from './LessonPlanForm.module.css'; // Reusing existing styles for now

// Define types for feedback options
interface FeedbackOptions {
    gradeLevel: string;
    tone: string;
    responseLength: string;
    focusAreas: string[];
    customInstructions?: string;
}

const ReportCardFeedback: React.FC = () => {
    const api = useApi();
    const [originalFeedback, setOriginalFeedback] = useState('');
    const [refinedFeedback, setRefinedFeedback] = useState('');
    const [isRefining, setIsRefining] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false);
    const [useCustomInstructions, setUseCustomInstructions] = useState(false);
    
    // Default feedback options
    const [feedbackOptions, setFeedbackOptions] = useState<FeedbackOptions>({
        gradeLevel: 'general',
        tone: 'professional',
        responseLength: 'medium',
        focusAreas: ['strengths', 'improvements', 'growth'],
        customInstructions: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!originalFeedback.trim()) {
            setError('Please enter feedback to refine');
            return;
        }
        
        setIsRefining(true);
        setError(null);

        try {
            // If not using custom instructions, remove them from the options
            const optionsToSend = {...feedbackOptions};
            if (!useCustomInstructions || !optionsToSend.customInstructions?.trim()) {
                delete optionsToSend.customInstructions;
            }
            
            const refined = await api.refineReportCardFeedback(originalFeedback, optionsToSend);
            setRefinedFeedback(refined);
        } catch (err) {
            setError('Failed to refine feedback. Please try again. Or try to sign out and sing back in');
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

    const handleOptionChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        if (name === 'focusAreas') {
            // Handle checkbox changes for focus areas
            const checkbox = e.target as HTMLInputElement;
            const area = checkbox.value;
            
            setFeedbackOptions(prev => {
                const newFocusAreas = checkbox.checked 
                    ? [...prev.focusAreas, area]
                    : prev.focusAreas.filter(item => item !== area);
                
                return {
                    ...prev,
                    focusAreas: newFocusAreas
                };
            });
        } else if (name === 'customInstructions') {
            // Handle custom instructions textarea
            setFeedbackOptions(prev => ({
                ...prev,
                customInstructions: value
            }));
        } else {
            // Handle select changes
            setFeedbackOptions(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const toggleOptions = () => {
        setShowOptions(!showOptions);
    };

    const toggleCustomInstructions = () => {
        setUseCustomInstructions(!useCustomInstructions);
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
                    <p className={styles.generatingText}>Refining your feedback...</p>
                </div>
            )}

            <div className={`${styles.formContainer} ${styles.responsiveContainer}`}>
                <h1 className={styles.responsiveHeading}>Report Card Feedback Refinement</h1>
                <p className={styles.description}>
                    Paste your existing report card feedback below and our AI will help refine it to be more effective and personalized.
                </p>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.optionsToggle}>
                    <button 
                        type="button" 
                        onClick={toggleOptions}
                        className={`${styles.button} ${styles.secondaryButton} ${styles.responsiveButton}`}
                    >
                        {showOptions ? 'Hide Options' : 'Customize Options'}
                    </button>
                </div>

                {showOptions && (
                    <div className={`${styles.optionsPanel} ${styles.responsivePanel}`}>
                        <h3>Customize Feedback Options</h3>
                        
                        <div className={styles.customInstructionsToggle}>
                            <label className={styles.checkboxLabel}>
                                <input 
                                    type="checkbox" 
                                    checked={useCustomInstructions}
                                    onChange={toggleCustomInstructions}
                                />
                                Use Custom Instructions
                            </label>
                        </div>
                        
                        {useCustomInstructions ? (
                            <div className={styles.formGroup}>
                                <label htmlFor="customInstructions">Custom Instructions:</label>
                                <textarea
                                    id="customInstructions"
                                    name="customInstructions"
                                    value={feedbackOptions.customInstructions || ''}
                                    onChange={handleOptionChange}
                                    placeholder="Enter your custom instructions for refining the feedback..."
                                    rows={5}
                                    className={styles.textarea}
                                />
                                <p className={styles.helpText}>
                                    Provide specific instructions on how you want the feedback to be refined. 
                                    For example: "Make the feedback more specific to math skills" or "Focus on providing actionable next steps for the student."
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className={styles.optionsGrid}>
                                    <div className={styles.optionGroup}>
                                        <label htmlFor="gradeLevel">Grade Level:</label>
                                        <select 
                                            id="gradeLevel" 
                                            name="gradeLevel" 
                                            value={feedbackOptions.gradeLevel}
                                            onChange={handleOptionChange}
                                            className={styles.select}
                                        >
                                            <option value="general">General</option>
                                            <option value="kindergarten">Kindergarten</option>
                                            <option value="elementary">Elementary (Grades 1-5)</option>
                                            <option value="middle">Middle School (Grades 6-8)</option>
                                            <option value="high">High School (Grades 9-12)</option>
                                        </select>
                                    </div>

                                    <div className={styles.optionGroup}>
                                        <label htmlFor="tone">Tone:</label>
                                        <select 
                                            id="tone" 
                                            name="tone" 
                                            value={feedbackOptions.tone}
                                            onChange={handleOptionChange}
                                            className={styles.select}
                                        >
                                            <option value="professional">Professional</option>
                                            <option value="supportive">Supportive</option>
                                            <option value="encouraging">Encouraging</option>
                                            <option value="direct">Direct</option>
                                            <option value="student-friendly">Student-Friendly</option>
                                            <option value="parent-friendly">Parent-Friendly</option>
                                        </select>
                                    </div>

                                    <div className={styles.optionGroup}>
                                        <label htmlFor="responseLength">Response Length:</label>
                                        <select 
                                            id="responseLength" 
                                            name="responseLength" 
                                            value={feedbackOptions.responseLength}
                                            onChange={handleOptionChange}
                                            className={styles.select}
                                        >
                                            <option value="short">Short (1-2 sentences)</option>
                                            <option value="medium">Medium (3-5 sentences)</option>
                                            <option value="long">Long (6+ sentences)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className={styles.optionGroup}>
                                    <label>Focus Areas:</label>
                                    <div className={`${styles.checkboxGroup} ${styles.responsiveCheckboxGroup}`}>
                                        <label className={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                name="focusAreas" 
                                                value="strengths" 
                                                checked={feedbackOptions.focusAreas.includes('strengths')}
                                                onChange={handleOptionChange}
                                            />
                                            Strengths
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                name="focusAreas" 
                                                value="improvements" 
                                                checked={feedbackOptions.focusAreas.includes('improvements')}
                                                onChange={handleOptionChange}
                                            />
                                            Areas for Improvement
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                name="focusAreas" 
                                                value="growth" 
                                                checked={feedbackOptions.focusAreas.includes('growth')}
                                                onChange={handleOptionChange}
                                            />
                                            Growth Mindset
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                name="focusAreas" 
                                                value="specific" 
                                                checked={feedbackOptions.focusAreas.includes('specific')}
                                                onChange={handleOptionChange}
                                            />
                                            Specific Examples
                                        </label>
                                        <label className={styles.checkboxLabel}>
                                            <input 
                                                type="checkbox" 
                                                name="focusAreas" 
                                                value="next-steps" 
                                                checked={feedbackOptions.focusAreas.includes('next-steps')}
                                                onChange={handleOptionChange}
                                            />
                                            Next Steps
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.responsiveForm}>
                    <div className={styles.formGroup}>
                        <label htmlFor="feedback" className={styles.responsiveLabel}>Original Feedback:</label>
                        <textarea
                            id="feedback"
                            name="feedback"
                            value={originalFeedback}
                            onChange={handleInputChange}
                            placeholder="Paste your existing report card feedback here..."
                            rows={8}
                            className={`${styles.textarea} ${styles.responsiveTextarea}`}
                            required
                        />
                    </div>

                    <button 
                        type="submit" 
                        className={`${styles.primaryButton} ${styles.responsiveButton}`}
                        disabled={isRefining}
                    >
                        {isRefining ? 'Refining...' : 'Refine Feedback'}
                    </button>
                </form>

                {refinedFeedback && (
                    <div className={`${styles.resultContainer} ${styles.responsiveResultContainer}`}>
                        <h3>Refined Feedback</h3>
                        <Editor 
                            content={refinedFeedback} 
                            onUpdate={handleEditorUpdate}
                            isDisabled={false}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportCardFeedback; 