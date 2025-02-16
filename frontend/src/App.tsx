import { useState } from 'react'
import LessonPlanForm from './components/LessonPlanForm';
import LessonPlanDisplay from './components/LessonPlanDisplay';

import './App.css'

const App = () => {
  const [lessonPlan, setLessonPlan] = useState<any>(null);

  const handlePlanGenerated = (plan: any) => {
      console.log('Plan generated:', plan);
      setLessonPlan(plan);
  };

  return (
      <div>
          <h1>Lesson Planner</h1>
          <LessonPlanForm onPlanGenerated={handlePlanGenerated} />
          {lessonPlan && <LessonPlanDisplay lessonPlan={lessonPlan} />}
      </div>
  );
};

export default App;