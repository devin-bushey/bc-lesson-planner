import React from 'react';
import Editor from './Editor/Editor';
import styles from './LessonPlanDisplay.module.css';

interface LessonPlan {
    date: string;
    grade_level: string;
    subject: string;
    content: string;
    metadata: {
        generated_at: string;
        curriculum_version: string;
        previous_plans_referenced: number;
    };
}

interface LessonPlanDisplayProps {
    lessonPlan: LessonPlan | null;
    onContentChange: (content: string) => void;
    isLoading?: boolean;
}

const LessonPlanDisplay: React.FC<LessonPlanDisplayProps> = ({ lessonPlan, onContentChange, isLoading = false }) => {
    // const [editorContent, setEditorContent] = useState<string>('');

    // useEffect(() => {
    //     if (lessonPlan?.content) {
    //         setEditorContent(lessonPlan.content);
    //     }
    // }, [lessonPlan]);

    const handleEditorUpdate = (content: string) => {
        // setEditorContent(content);
        onContentChange(content);
    };

    if (!lessonPlan && !isLoading) {
        return <div className={styles.container}></div>;
    }

    return (
        <div className={styles.containerTextEditor}>
            {isLoading ? (
                <div className={styles.loadingOverlay}>
                    <div className={styles.loadingPencil}>
                        <div className={styles.paper}>
                            <div className={styles.lines}></div>
                            <div className={styles.writing}></div>
                            <div className={styles.writing}></div>
                            <div className={styles.writing}></div>
                            <div className={styles.writing}></div>
                        </div>
                        <div className={styles.pencil}></div>
                    </div>
                    <p>Writing your lesson plan...</p>
                </div>
            ) : (
                <>
                    <h2 className={styles.header}>
                        Lesson Plan for Grade {lessonPlan?.grade_level} - {lessonPlan?.subject}
                    </h2>
                    <div className={styles.metadata}>
                        <div className={styles.metadataItem}>
                            <div className={styles.metadataLabel}>Date</div>
                            <div>{lessonPlan?.date}</div>
                        </div>
                        <div className={styles.metadataItem}>
                            <div className={styles.metadataLabel}>Generated At</div>
                            <div>{lessonPlan?.metadata.generated_at}</div>
                        </div>
                        <div className={styles.metadataItem}>
                            <div className={styles.metadataLabel}>Previous Plans Referenced</div>
                            <div>{lessonPlan?.metadata.previous_plans_referenced}</div>
                        </div>
                    </div>
                    <h3 className={styles.header}>Content:</h3>
                    <Editor 
                        key={lessonPlan?.content}
                        content={lessonPlan?.content || ''}
                        onUpdate={handleEditorUpdate}
                        isDisabled={isLoading}
                    />
                </>
            )}
        </div>
    );
};

export default LessonPlanDisplay;