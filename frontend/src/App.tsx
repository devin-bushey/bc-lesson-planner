import React, { useState } from 'react';
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';

import './App.css'

const App: React.FC = () => {
    const [lessonPlan, setLessonPlan] = useState<any>(null);
    const [hasEditorChanges, setHasEditorChanges] = useState(false);

    const handlePlanGenerated = (plan: any) => {
        setLessonPlan(plan);
        setHasEditorChanges(false);
    };

    const handleContentChange = (content: string) => {
        console.log(content.length);
        setHasEditorChanges(true);
    };

    return (
        <div>
            <h1>Lesson Planner</h1>
            <LessonPlanForm 
                onPlanGenerated={handlePlanGenerated}
                hasEditorChanges={hasEditorChanges}
            />
            <LessonPlanDisplay
                lessonPlan={lessonPlan}
                onContentChange={handleContentChange}
            />
        </div>
    );
};

export default App;