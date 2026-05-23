import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { BookOpen, GraduationCap, Map } from 'lucide-react';

export default function Education({ active }) {
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
      <div className="section-card education-card">
        <div className="card-header">
          <div className="icon-badge">
            <GraduationCap className="glow-icon" size={24} />
          </div>
          <span className="checkpoint-num">Checkpoint 2</span>
        </div>
        
        <h1 className="explorer-title">Education & Milestones</h1>
        <h2 className="explorer-subtitle">The intellectual base camp of my career</h2>
        
        <div className="card-divider" />
        
        <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          <div className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-date">Amity University, Lucknow</span>
              <h3>Bachelor of Computer Applications</h3>
              <p className="university-name">Graduated in Uttar Pradesh, India</p>
              <p className="timeline-desc">Focused on computer science fundamentals, programming, database architectures, and software engineering principles.</p>
            </div>
          </div>
          
          <div className="timeline-item mt-3">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-date">St. Dominic Savio College, Lucknow</span>
              <h3>Intermediate & High School</h3>
              <p className="university-name">Lucknow, Uttar Pradesh</p>
              <p className="timeline-desc">
                • 12th Standard ISC: <strong>72%</strong><br />
                • 10th Standard ICSE: <strong>61%</strong>
              </p>
            </div>
          </div>

          <div className="timeline-item mt-3">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-date">Professional Certifications</span>
              <h3>Technical Upskilling</h3>
              <p className="university-name">Verified Competency</p>
              <p className="timeline-desc" style={{ fontSize: '0.85rem' }}>
                • <strong>DevOps Beginner to Advance</strong> — Udemy<br />
                • <strong>The Complete Python Bootcamp</strong> — Udemy<br />
                • <strong>NDG Linux Essentials</strong> — Cisco Networking Academy
              </p>
            </div>
          </div>
        </div>

        <div className="card-footer">
          <span className="pulse-text">Trek forward toward the river crossing bridge...</span>
        </div>
      </div>
    </div>
  );
}
