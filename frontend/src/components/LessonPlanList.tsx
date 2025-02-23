import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonPlan, getAllLessonPlans } from '../services/lessonPlanService';
import styles from './LessonPlanList.module.css';

interface StatusColors {
    dot: string;
    text: string;
    background: string;
}

const getStatusStyles = (status: string): StatusColors => {
    const defaultStatus = {
        dot: 'var(--color-primary)',
        text: 'var(--color-primary)',
        background: 'var(--color-primary-light)'
    };

    switch (status.toLowerCase()) {
        case 'completed':
            return {
                dot: 'var(--color-success)',
                text: 'var(--color-success)',
                background: 'var(--color-success-light)'
            };
        case 'in progress':
            return {
                dot: 'var(--color-warning)',
                text: 'var(--color-warning)',
                background: 'var(--color-warning-light)'
            };
        case 'draft':
            return {
                dot: 'var(--color-text-secondary)',
                text: 'var(--color-text-secondary)',
                background: 'var(--color-primary-light)'
            };
        default:
            return defaultStatus;
    }
};

const LessonPlanList: React.FC = () => {
    const navigate = useNavigate();
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<LessonPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchLessonPlans = async () => {
            try {
                const plans = await getAllLessonPlans();
                setLessonPlans(plans);
                setFilteredPlans(plans);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch lesson plans');
                setLoading(false);
            }
        };

        fetchLessonPlans();
    }, []);

    useEffect(() => {
        const filtered = lessonPlans.filter(plan => 
            plan.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            plan.grade_level.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredPlans(filtered);
    }, [searchTerm, lessonPlans]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    if (loading) {
        return <div className={styles.loading}>Loading lesson plans...</div>;
    }

    if (error) {
        return (
            <div className={styles.error}>
                <span>❌ {error}</span>
                <button 
                    className={styles.viewButton}
                    onClick={() => window.location.reload()}
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Lesson Plans</h1>
                <div className={styles.filters}>
                    <input
                        type="text"
                        placeholder="Search by subject or grade..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className={styles.searchInput}
                        aria-label="Search lesson plans"
                    />
                </div>
            </div>

            <div className={styles.gridContainer}>
                {filteredPlans.length === 0 ? (
                    <div className={styles.noResults}>
                        <span>No lesson plans found</span>
                        {searchTerm && (
                            <button 
                                className={styles.viewButton}
                                onClick={() => setSearchTerm('')}
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <div className={styles.grid} role="list">
                        {filteredPlans.map((plan) => {
                            const status = plan.metadata?.status || 'In Progress';
                            const statusStyles = getStatusStyles(status);
                            
                            return (
                                <div 
                                    key={plan.id} 
                                    className={styles.card}
                                    role="listitem"
                                >
                                    <div className={styles.cardHeader}>
                                        <h2>{plan.subject}</h2>
                                        <span className={styles.grade}>{plan.grade_level}</span>
                                    </div>
                                    <div className={styles.cardContent}>
                                        <div className={styles.date}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M6 4V2" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M10 4V2" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                            <span>Created: {new Date(plan.date).toLocaleDateString()}</span>
                                        </div>
                                        <div 
                                            className={styles.status}
                                            style={{ backgroundColor: statusStyles.background }}
                                        >
                                            <span 
                                                className={styles.statusDot}
                                                style={{ backgroundColor: statusStyles.dot }}
                                            />
                                            <span 
                                                className={styles.statusText}
                                                style={{ color: statusStyles.text }}
                                            >
                                                {status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className={styles.cardFooter}>
                                        <button 
                                            className={styles.viewButton}
                                            onClick={() => navigate(`/lesson/${plan.id}`)}
                                            aria-label={`View ${plan.subject} lesson plan`}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M1 8H15M15 8L8 1M15 8L8 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                            View Plan
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LessonPlanList; 