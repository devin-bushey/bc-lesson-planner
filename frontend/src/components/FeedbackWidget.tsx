import React, { useState, useRef } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import emailjs from '@emailjs/browser';
import styles from './LessonPlanForm.module.css'; // Reusing existing styles

const FeedbackWidget: React.FC = () => {
    const { user } = useAuth0();
    const formRef = useRef<HTMLFormElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize email with user's email if available
    React.useEffect(() => {
        if (user?.email) {
            setEmail(user.email);
        }
    }, [user]);

    const toggleWidget = () => {
        setIsOpen(!isOpen);
        if (submitted) {
            resetForm();
        }
    };

    const resetForm = () => {
        setFeedbackText('');
        // Don't reset email if it came from the user profile
        if (!user?.email) {
            setEmail('');
        }
        setSubmitted(false);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!feedbackText.trim()) {
            setError('Please share your thoughts');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare template parameters for EmailJS
            const templateParams = {
                user_name: user?.name || 'Anonymous User',
                user_email: email || 'No email provided',
                feedback: feedbackText,
                user_id: user?.sub || 'Not authenticated'
            };

            // Get EmailJS configuration from environment variables
            const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
            const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
            const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

            // Send the email using EmailJS
            const result = await emailjs.send(
                serviceId,
                templateId,
                templateParams,
                publicKey
            );

            if (result.text === 'OK') {
                setSubmitted(true);
            } else {
                setError('Failed to submit feedback. Please try again.');
            }
        } catch (err) {
            console.error('Feedback submission error:', err);
            setError('Failed to submit feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.feedbackWidgetContainer}>
            <button 
                className={styles.feedbackButton}
                onClick={toggleWidget}
                aria-expanded={isOpen}
            >
                {isOpen ? 'Close' : 'Feedback'}
            </button>

            {isOpen && (
                <div className={styles.simpleFeedbackPanel}>
                    {!submitted ? (
                        <form ref={formRef} onSubmit={handleSubmit}>
                            <h3>Share Your Thoughts</h3>
                            
                            {error && <div className={styles.error}>{error}</div>}
                            
                            <div className={styles.formGroup}>
                                <textarea
                                    id="feedbackText"
                                    name="feedback"
                                    value={feedbackText}
                                    onChange={(e) => setFeedbackText(e.target.value)}
                                    placeholder="What's on your mind?"
                                    rows={3}
                                    className={styles.textarea}
                                    required
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <input
                                    id="feedbackEmail"
                                    name="user_email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Your email (optional)"
                                    className={styles.emailInput}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                className={styles.simpleSubmitButton}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Feedback'}
                            </button>
                        </form>
                    ) : (
                        <div className={styles.thankYouMessage}>
                            <h3>Thank You!</h3>
                            <p>We appreciate your feedback!</p>
                            <button 
                                onClick={resetForm}
                                className={styles.secondaryButton}
                            >
                                Close
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeedbackWidget; 