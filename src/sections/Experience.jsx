import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Network, Home, Building2 } from 'lucide-react';

export default function Experience({ active }) {
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
      <div className="section-card experience-card">
        <div className="card-header">
          <div className="icon-badge">
            <Building2 className="glow-icon" size={24} />
          </div>
          <span className="checkpoint-num">Checkpoint 4</span>
        </div>
        
        <h1 className="explorer-title">Work Experience</h1>
        <h2 className="explorer-subtitle">Navigating the professional corporate landscape</h2>
        
        <div className="card-divider" />
        
        <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          <div className="experience-item">
            <div className="exp-header">
              <h3>Graduate Trainee, DevOps Team</h3>
              <span className="exp-duration">Jan 2025 – July 2025</span>
            </div>
            <p className="company-info">Corbus | Manager: Anas Ahmed (+91 91697 03373)</p>
            <ul className="exp-details">
              <li>Collaborated to build & maintain automated CI/CD pipelines using Jenkins and GitHub Actions, streamlining engineering workflows.</li>
              <li>Assisted in provisioning scalable, secure cloud infrastructure on AWS using Terraform and CloudFormation IaC.</li>
              <li>Contributed to containerization efforts by writing Dockerfiles and managing deployments in a Kubernetes environment.</li>
              <li>Setup telemetry and active monitoring with Prometheus and Grafana for metrics visualization and alerting configs.</li>
              <li>Participated in daily Agile stand-ups, sprint planning, and reviews, learning enterprise cloud architectures.</li>
            </ul>
          </div>
        </div>

        <div className="card-footer">
          <span className="pulse-text">Climb up the snowy slope ahead...</span>
        </div>
      </div>
    </div>
  );
}
