import { LoginButton } from './LoginButton';
import styles from './Login.module.css';

const Login = () => {
    return (
        <div className={styles.container}>
            <div className={styles.decoration1} aria-hidden="true" />
            <div className={styles.decoration2} aria-hidden="true" />
            
            <div className={styles.content}>

                <h1 className={styles.title}>BC Lesson Planner</h1>
                <p className={styles.subtitle}>
                    Create professional lesson plans aligned with BC's curriculum in minutes
                </p>

                <div className={styles.loginButtonContainer}>
                    <LoginButton />
                </div>

                <div className={styles.featuresSimple}>
                    <div className={styles.featureSimple}>
                        <span className={styles.emoji}>⚡</span>
                        <p>AI-powered creation</p>
                    </div>
                    <div className={styles.featureSimple}>
                        <span className={styles.emoji}>📘</span>
                        <p>BC curriculum aligned</p>
                    </div>
                </div>

                <div className={styles.experimentalNotice}>
                    <h3>⚠️ Experimental Application</h3>
                    <p>
                        This application is currently in experimental phase. Please do not rely on saving 
                        important data as it may be lost due to updates or system changes. 
                        Always export and backup your lesson plans.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login; 