import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonPlan, getAllLessonPlans } from '../services/lessonPlanService';
import styles from './LessonPlanList.module.css';

interface StatusColors {
    dot: string;
    text: string;
    background: string;
}

type SortOption = 'updated' | 'created' | 'subject' | 'grade';
type SortDirection = 'asc' | 'desc';

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

const capitalizeTitle = (title: string): string => {
    // Words that should not be capitalized (unless they're the first word)
    const minorWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with']);

    return title
        .toLowerCase()
        .split(' ')
        .map((word, index) => {
            // Always capitalize the first word or if it's not a minor word
            if (index === 0 || !minorWords.has(word)) {
                return word.charAt(0).toUpperCase() + word.slice(1);
            }
            return word;
        })
        .join(' ');
};

const formatDateTime = (date: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
};

const compareGrades = (a: string, b: string): number => {
    if (a === 'K') return -1;
    if (b === 'K') return 1;
    return parseInt(a) - parseInt(b);
};

const sortPlans = (plans: LessonPlan[], sortBy: SortOption, direction: SortDirection): LessonPlan[] => {
    return [...plans].sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
            case 'updated':
                comparison = new Date(b.metadata?.lastUpdated || b.date).getTime() - 
                           new Date(a.metadata?.lastUpdated || a.date).getTime();
                break;
            case 'created':
                comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                break;
            case 'subject':
                comparison = a.subject.localeCompare(b.subject);
                break;
            case 'grade':
                comparison = compareGrades(a.grade_level, b.grade_level);
                break;
        }
        return direction === 'desc' ? comparison : -comparison;
    });
};

const LessonPlanList: React.FC = () => {
    const navigate = useNavigate();
    const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
    const [filteredPlans, setFilteredPlans] = useState<LessonPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('updated');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        const fetchLessonPlans = async () => {
            try {
                const plans = await getAllLessonPlans();
                const sortedPlans = sortPlans(plans, sortBy, sortDirection);
                setLessonPlans(sortedPlans);
                setFilteredPlans(sortedPlans);
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
        const sorted = sortPlans(filtered, sortBy, sortDirection);
        setFilteredPlans(sorted);
    }, [searchTerm, lessonPlans, sortBy, sortDirection]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    };

    const handleSort = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSortBy(e.target.value as SortOption);
    };

    const toggleSortDirection = () => {
        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    };

    const getSortLabel = (option: SortOption): string => {
        switch (option) {
            case 'updated':
                return 'Last Updated';
            case 'created':
                return 'Created Date';
            case 'subject':
                return 'Subject';
            case 'grade':
                return 'Grade Level';
        }
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
                    <div className={styles.sortControls}>
                        <select
                            value={sortBy}
                            onChange={handleSort}
                            className={styles.sortSelect}
                            aria-label="Sort lesson plans"
                        >
                            <option value="updated">{getSortLabel('updated')}</option>
                            <option value="created">{getSortLabel('created')}</option>
                            <option value="subject">{getSortLabel('subject')}</option>
                            <option value="grade">{getSortLabel('grade')}</option>
                        </select>
                        <button
                            onClick={toggleSortDirection}
                            className={styles.sortDirectionButton}
                            aria-label={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
                        >
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                <path 
                                    d="M8 3v10M4 9l4 4 4-4" 
                                    stroke="currentColor" 
                                    strokeWidth="1.5" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                    transform={sortDirection === 'desc' ? 'rotate(180 8 8)' : ''}
                                />
                            </svg>
                        </button>
                    </div>
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
                            const normalizedSubject = capitalizeTitle(plan.subject);
                            
                            return (
                                <div 
                                    key={plan.id} 
                                    className={styles.card}
                                    onClick={() => navigate(`/lesson/${plan.id}`)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            navigate(`/lesson/${plan.id}`);
                                        }
                                    }}
                                    aria-label={`View ${normalizedSubject} lesson plan for ${plan.grade_level}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.titleGroup}>
                                            <h2>{normalizedSubject}</h2>
                                            <span className={styles.subtitle}>Grade {plan.grade_level}</span>
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
                                    <div className={styles.dates}>
                                        <div className={styles.date}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M12 2H4C2.89543 2 2 2.89543 2 4V12C2 13.1046 2.89543 14 4 14H12C13.1046 14 14 13.1046 14 12V4C14 2.89543 13.1046 2 12 2Z" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M2 6H14" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M6 4V2" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M10 4V2" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                            <span>Created {formatDateTime(plan.date)}</span>
                                        </div>
                                        <div className={styles.date}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                            <span>Updated {formatDateTime(plan.metadata?.lastUpdated || plan.date)}</span>
                                        </div>
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