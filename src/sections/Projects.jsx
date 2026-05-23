import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Briefcase, ExternalLink, Sparkles, Workflow, Cloud, Bot, Film } from 'lucide-react';

export default function Projects({ active }) {
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
      <div className="section-card projects-card wide-card">
        <div className="card-header">
          <div className="icon-badge">
            <Briefcase className="glow-icon" size={24} />
          </div>
          <span className="checkpoint-num">Checkpoint 3</span>
        </div>
        
        <h1 className="explorer-title">Featured Works</h1>
        <h2 className="explorer-subtitle">Crossing the river of code into cloud-native & creative realities</h2>
        
        <div className="card-divider" />
        
        <div className="projects-grid" style={{ maxHeight: '350px', overflowY: 'auto', paddingRight: '8px' }}>
          <div className="project-item">
            <div className="project-meta">
              <Workflow className="project-icon" size={20} />
              <h3>CI/CD Pipeline Automation</h3>
            </div>
            <p>Built end-to-end automation pipelines integrating Jenkins, GitHub, Docker, and Kubernetes. Enabled automated builds, test cycles, and rolling deployments with safe rollback mechanics.</p>
            <div className="project-tags">
              <span>Jenkins</span>
              <span>Docker</span>
              <span>Kubernetes</span>
              <span>GitHub Actions</span>
            </div>
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="project-link">
              Codebase <ExternalLink size={14} />
            </a>
          </div>

          <div className="project-item">
            <div className="project-meta">
              <Cloud className="project-icon" size={20} />
              <h3>Cloud Infrastructure</h3>
            </div>
            <p>Designed scalable, secure AWS infrastructure using Terraform. Managed multi-environment architecture with tight IAM policies and automated telemetry using Grafana & CloudWatch.</p>
            <div className="project-tags">
              <span>AWS</span>
              <span>Terraform</span>
              <span>CloudWatch</span>
              <span>Grafana</span>
            </div>
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="project-link">
              Codebase <ExternalLink size={14} />
            </a>
          </div>

          <div className="project-item">
            <div className="project-meta">
              <Sparkles className="project-icon" size={20} />
              <h3>AI Image Generator</h3>
            </div>
            <p>Developed an AI Image Generator using OpenAI API for high-quality text-to-image synthesis. Integrated via a Flask backend with a responsive, intuitive interface.</p>
            <div className="project-tags">
              <span>Flask</span>
              <span>OpenAI API</span>
              <span>JavaScript</span>
              <span>CSS3</span>
            </div>
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="project-link">
              Codebase <ExternalLink size={14} />
            </a>
          </div>

          <div className="project-item">
            <div className="project-meta">
              <Bot className="project-icon" size={20} />
              <h3>Gen AI Projects</h3>
            </div>
            <p>Built LLM workflows, conversational chatbots, and advanced retrieval augmented generation (RAG) structures using prompt engineering patterns and model configurations.</p>
            <div className="project-tags">
              <span>LLM</span>
              <span>Prompt Eng.</span>
              <span>Generative AI</span>
              <span>Python</span>
            </div>
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="project-link">
              Details <ExternalLink size={14} />
            </a>
          </div>

          <div className="project-item">
            <div className="project-meta">
              <Film className="project-icon" size={20} />
              <h3>Creative Works</h3>
            </div>
            <p>High-end video editing and digital assets. Orchestrating storyboarding, color grading, motion graphics, audio sync, and fast-paced cinematic cuts for tech/creative media.</p>
            <div className="project-tags">
              <span>Video Editing</span>
              <span>Motion Design</span>
              <span>Premiere Pro</span>
              <span>After Effects</span>
            </div>
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="project-link">
              Portfolio <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="card-footer">
          <span className="pulse-text">Cross the bridge and head toward the mountain village...</span>
        </div>
      </div>
    </div>
  );
}
