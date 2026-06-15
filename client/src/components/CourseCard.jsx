import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import './CourseCard.css';

const CourseCard = ({ course }) => {
  const navigate = useNavigate();
  let statusText = '';
  if (course.status === 'passed') statusText = 'Terminé';
  if (course.status === 'failed') statusText = 'Échoué';
  if (course.status === 'in-progress') statusText = 'En cours';

  return (
    <div className="course-card">
      <div className="course-image-wrapper">
        <img src={course.coverImage} alt={course.title} className="course-image" />
      </div>
      
      <div className="course-body">
        <div className="course-header">
          <h3 className="course-title">{course.title}</h3>
          <span className={`status-badge status-${course.status}`}>{statusText}</span>
        </div>
        
        <p className="course-description">{course.description}</p>
        
        <div className="course-stats">
          <span>{course.completedLessons} / {course.totalLessons} leçons</span>
          {course.failedAttempts > 0 && (
            <span className="text-danger">{course.failedAttempts} échec(s)</span>
          )}
        </div>

        <ProgressBar progress={course.progress} status={course.status} />
        
        <button 
          className="card-btn"
          onClick={() => navigate(`/student/courses/${course.id}`)}
        >
          Continuer
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
