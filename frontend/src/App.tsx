import React, { useState } from 'react';
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';

import './App.css'

const App: React.FC = () => {
    const [lessonPlan, setLessonPlan] = useState<any>(null);
    const [hasEditorChanges, setHasEditorChanges] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handlePlanGenerated = (plan: any) => {
        setLessonPlan(plan);
        setHasEditorChanges(false);
        setIsGenerating(false);
    };

    const handleContentChange = (content: string) => {
        console.log(content.length);
        setHasEditorChanges(true);
    };

    const handleGenerateStart = () => {
        setIsGenerating(true);
    };

    return (
        <div>
            <h1>Lesson Planner</h1>
            <LessonPlanForm 
                onPlanGenerated={handlePlanGenerated}
                hasEditorChanges={hasEditorChanges}
                onGenerateStart={handleGenerateStart}
            />
            <LessonPlanDisplay
                lessonPlan={lessonPlan}
                onContentChange={handleContentChange}
                isLoading={isGenerating}
            />
        </div>
    );
};

export default App;