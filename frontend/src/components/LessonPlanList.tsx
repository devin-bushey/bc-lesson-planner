import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonPlan } from '../services/lessonPlanService';
import { useApi } from '../hooks/useApi';
import styles from './LessonPlanList.module.css';
import statusStyles from './subcomponents/StatusIndicator.module.css';

type SortOption = 'updated' | 'created' | 'subject' | 'grade';
type SortDirection = 'asc' | 'desc';

const formatDateTime = (isoDate: string) => {
    const d = new Date(isoDate);
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
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
                comparison = new Date(a.updated_at).getTime() - 
                           new Date(b.updated_at).getTime();
                break;
            case 'created':
                comparison = new Date(a.created_at).getTime() - 
                           new Date(b.created_at).getTime();
                break;
            case 'subject':
                comparison = a.subject.localeCompare(b.subject);
                break;
            case 'grade':
                comparison = compareGrades(a.grade_level, b.grade_level);
                break;
        }
        return direction === 'desc' ? -comparison : comparison;
    });
};

const LessonPlanList: React.FC = () => {
    const navigate = useNavigate();
    const api = useApi();
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
                const plans = await api.getAllLessonPlans();
                const sortedPlans = sortPlans(plans, sortBy, sortDirection);
                setLessonPlans(sortedPlans);
                setFilteredPlans(sortedPlans);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch lesson plans - try to sign out and sign back in');
                setLoading(false);
            }
        };

        fetchLessonPlans();
    }, [api]);

    useEffect(() => {
        const filtered = lessonPlans.filter(plan => 
            plan.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                        placeholder="Search by title, subject, or grade..."
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
                                    transform={sortDirection === 'asc' ? 'rotate(180 8 8)' : ''}
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
                                    aria-label={`View ${plan.subject} lesson plan for ${plan.grade_level}`}
                                >
                                    <div className={styles.cardHeader}>
                                        <div className={styles.titleGroup}>
                                            <h2>{plan.title || `${plan.subject} Lesson`}</h2>
                                            <div className={styles.subtitle}>
                                                <span>{plan.subject}</span>
                                                <span> • </span>
                                                <span>Grade {plan.grade_level}</span>
                                            </div>
                                        </div>
                                        <div
                                            className={`${statusStyles.statusDisplay} ${
                                                status === 'Scheduled' ? statusStyles.scheduled :
                                                status === 'Completed' ? statusStyles.completed : ''
                                            }`}
                                        >
                                            <span className={statusStyles.statusDot} />
                                            <span className={statusStyles.statusText}>
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
                                            <span>Created {formatDateTime(plan.created_at)}</span>
                                        </div>
                                        <div className={styles.date}>
                                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                                                <path d="M8 4V8L10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                <path d="M8 14C11.3137 14 14 11.3137 14 8C14 4.68629 11.3137 2 8 2C4.68629 2 2 4.68629 2 8C2 11.3137 4.68629 14 8 14Z" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                            <span>Updated {formatDateTime(plan.updated_at)}</span>
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