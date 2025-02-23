import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import styles from './LessonPlanForm.module.css';

const LessonPlanForm: React.FC = () => {
    const navigate = useNavigate();
    const api = useApi();
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
            const plan = await api.generateLessonPlan(formData.grade, formData.subject);
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
            <h1 className={styles.title}>Generate Lesson Plan</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label htmlFor="grade" className={styles.label}>Grade Level</label>
                    <input
                        type="text"
                        id="grade"
                        name="grade"
                        value={formData.grade}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter grade level (e.g., K, 1, 2)"
                        required
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="subject" className={styles.label}>Subject</label>
                    <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className={styles.input}
                        placeholder="Enter subject (e.g., Math, Science)"
                        required
                    />
                </div>
                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={isGenerating}
                >
                    {isGenerating ? 'Generating...' : 'Generate Plan'}
                </button>
            </form>
        </div>
    );
};

export default LessonPlanForm;