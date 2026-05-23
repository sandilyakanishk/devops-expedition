import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Cpu, Cloud, Terminal, Users, Shield } from 'lucide-react';

export default function Skills({ active }) {
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
      <div className="section-card skills-card wide-card">
        <div className="card-header">
          <div className="icon-badge">
            <Cpu className="glow-icon" size={24} />
          </div>
          <span className="checkpoint-num">Checkpoint 5</span>
        </div>
        
        <h1 className="explorer-title">Technical Arsenal</h1>
        <h2 className="explorer-subtitle">Equipped with tools for cloud orchestration and continuous delivery</h2>
        
        <div className="card-divider" />
        
        <div className="skills-container" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          <div className="skill-category">
            <div className="cat-title">
              <Cpu className="cat-icon" size={16} /> DevOps & Cloud
            </div>
            <div className="skill-list">
              <div className="skill-badge"><span className="skill-name">Kubernetes</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Docker</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">AWS</span><span className="skill-lvl">Intermediate</span></div>
              <div className="skill-badge"><span className="skill-name">Jenkins / GH Actions</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Ansible</span><span className="skill-lvl">Intermediate</span></div>
              <div className="skill-badge"><span className="skill-name">Prometheus / Grafana</span><span className="skill-lvl">Advanced</span></div>
            </div>
          </div>

          <div className="skill-category">
            <div className="cat-title">
              <Cloud className="cat-icon" size={16} /> Infrastructure & GitOps
            </div>
            <div className="skill-list">
              <div className="skill-badge"><span className="skill-name">Terraform (IaC)</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">CloudFormation</span><span className="skill-lvl">Intermediate</span></div>
              <div className="skill-badge"><span className="skill-name">GitOps (ArgoCD)</span><span className="skill-lvl">Intermediate</span></div>
              <div className="skill-badge"><span className="skill-name">CI/CD Design</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Telemetry (OTel)</span><span className="skill-lvl">Intermediate</span></div>
            </div>
          </div>

          <div className="skill-category">
            <div className="cat-title">
              <Terminal className="cat-icon" size={16} /> Scripting & Linux
            </div>
            <div className="skill-list">
              <div className="skill-badge"><span className="skill-name">Python Automation</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Bash & Shell Scripting</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Linux Command Line</span><span className="skill-lvl">Expert</span></div>
              <div className="skill-badge"><span className="skill-name">YAML / Configs</span><span className="skill-lvl">Expert</span></div>
            </div>
          </div>

          <div className="skill-category">
            <div className="cat-title">
              <Users className="cat-icon" size={16} /> Collaboration & Soft Skills
            </div>
            <div className="skill-list">
              <div className="skill-badge"><span className="skill-name">Agile Collaboration</span><span className="skill-lvl">Expert</span></div>
              <div className="skill-badge"><span className="skill-name">Team Building & Mgmt</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Client Communication</span><span className="skill-lvl">Advanced</span></div>
              <div className="skill-badge"><span className="skill-name">Technical Docs</span><span className="skill-lvl">Expert</span></div>
            </div>
          </div>
        </div>
 
        <div className="card-footer">
          <span className="pulse-text">Almost there! Hike up to the ultimate mountain summit...</span>
        </div>
      </div>
    </div>
  );
}
