import { LoginButton } from './LoginButton';
import styles from './Login.module.css';

const Login = () => {
    return (
        <div className={styles.container}>
            <div className={styles.decoration1} aria-hidden="true" />
            <div className={styles.decoration2} aria-hidden="true" />
            
            <div className={styles.content}>
                <h1 className={styles.title}>Welcome to BC Lesson Planner</h1>
                <p className={styles.subtitle}>
                    Your all-in-one platform for creating, managing, and organizing lesson plans tailored to BC's curriculum.
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8V16M8 12H16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className={styles.featureText}>
                            <h3 className={styles.featureTitle}>Quick Creation</h3>
                            <p className={styles.featureDescription}>Generate comprehensive lesson plans in minutes with our AI-powered system.</p>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className={styles.featureText}>
                            <h3 className={styles.featureTitle}>BC Curriculum Aligned</h3>
                            <p className={styles.featureDescription}>All plans are aligned with BC's curriculum standards and learning outcomes.</p>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M17 8L12 13L7 8M12 13V21M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className={styles.featureText}>
                            <h3 className={styles.featureTitle}>Easy Export</h3>
                            <p className={styles.featureDescription}>Download and share your lesson plans in multiple formats.</p>
                        </div>
                    </div>

                    <div className={styles.feature}>
                        <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7M15 3L19 7M15 3V7H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <div className={styles.featureText}>
                            <h3 className={styles.featureTitle}>Organized Library</h3>
                            <p className={styles.featureDescription}>Keep all your lesson plans organized and easily accessible.</p>
                        </div>
                    </div>
                </div>

                <LoginButton />
            </div>
        </div>
    );
};

export default Login; 