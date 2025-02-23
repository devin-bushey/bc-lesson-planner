import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateLessonPlan } from '../services/lessonPlanService';
import styles from './LessonPlanForm.module.css';

const LessonPlanForm: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        grade: '',
        subject: '',
    });
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsGenerating(true);
        setError(null);

        try {
            const plan = await generateLessonPlan(formData.grade, formData.subject);
            if (plan && plan.id) {
                navigate(`/lesson/${plan.id}`);
            } else {
                throw new Error('Invalid plan data received');
            }
        } catch (err) {
            setError('Failed to generate lesson plan. Please try again.');
            console.error('Generation error:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div className={styles.container}>
            {isGenerating && (
                <div className={styles.overlay}>
                    <div className={styles.appleContainer}>
                        <div className={styles.apple}>
                            <div className={styles.leaf} />
                            <div className={styles.spots} />
                            <div className={styles.worm}>
                                <div className={styles.wormHead}>
                                    <div className={styles.smile} />
                                    <div className={styles.cheeks} />
                                </div>
                            </div>
                        </div>
                        <div className={styles.generatingText}>
                            Generating your lesson plan...
                        </div>
                    </div>
                </div>
            )}
            <h1 className={styles.title}>Create New Lesson Plan</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="grade">Grade Level:</label>
                    <select
                        id="grade"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        required
                        className={styles.select}
                        disabled={isGenerating}
                    >
                        <option value="">Select Grade</option>
                        <option value="K">Kindergarten</option>
                        {[1, 2, 3, 4, 5, 6, 7].map(grade => (
                            <option key={grade} value={grade}>Grade {grade}</option>
                        ))}
                    </select>
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="subject">Subject:</label>
                    <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className={styles.select}
                        disabled={isGenerating}
                    >
                        <option value="">Select Subject</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Science">Science</option>
                        <option value="English Language Arts">English Language Arts</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="Arts Education">Arts Education</option>
                        <option value="Physical and Health Education">Physical and Health Education</option>
                    </select>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button
                    type="submit"
                    className={styles.button}
                    disabled={isGenerating || !formData.grade || !formData.subject}
                >
                    {isGenerating ? 'Generating...' : 'Generate Lesson Plan'}
                </button>
            </form>
        </div>
    );
};

export default LessonPlanForm;