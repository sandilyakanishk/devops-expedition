import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Compass, User, Award } from 'lucide-react';

export default function Intro({ active }) {
  const containerRef = useRef();

  useEffect(() => {
    if (active) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 50, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
      );
    } else {
      gsap.to(containerRef.current,
        { opacity: 0, y: -30, scale: 0.95, duration: 0.4, ease: 'power3.in' }
      );
    }
  }, [active]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="checkpoint-overlay">
      <div className="section-card intro-card">
        <div className="card-header">
          <div className="icon-badge">
            <Compass className="glow-icon animate-spin-slow" size={24} />
          </div>
          <span className="checkpoint-num">Checkpoint 1</span>
        </div>
        
        <h1 className="explorer-title">Kanishk Sandilya</h1>
        <h2 className="explorer-subtitle">Graduate DevOps Engineer & Cloud Practitioner</h2>
        
        <div className="card-divider" />
        
        <div className="card-body">
          <div className="info-row">
            <User className="info-icon" size={18} />
            <p>
              <strong>Welcome to my adventure portfolio!</strong> I am an innovative Fresher DevOps Engineer with a strong foundation in cloud-native technologies, CI/CD pipelines, infrastructure-as-code, and advanced monitoring solutions.
            </p>
          </div>
          
          <div className="info-row mt-4">
            <Award className="info-icon" size={18} />
            <div className="career-goal">
              <h3>Professional Summary</h3>
              <p>Implemented serverless architectures that reduce deployment times and improve system reliability. I am passionate about driving digital transformation and fostering a culture of continuous improvement in fast-paced DevOps environments.</p>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <span className="pulse-text">Press W to continue up the forest trail...</span>
        </div>
      </div>
    </div>
  );
}
