import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Briefcase, ExternalLink, Workflow, Cloud, Bot, Film, Sparkles } from 'lucide-react';

const MARQUEE_TEXT = 'FEATURED WORKS \u00a0\u2022\u00a0 CODE & CLOUD \u00a0\u2022\u00a0 CREATIVE REALITIES \u00a0\u2022\u00a0 BUILD & DEPLOY \u00a0\u2022\u00a0 ';

const projects = [
  {
    icon: Workflow,
    title: 'CI/CD Pipeline Automation',
    desc: 'End-to-end automation integrating Jenkins, GitHub, Docker, and Kubernetes. Automated builds, test cycles, rolling deployments, and safe rollback mechanics.',
    tags: ['Jenkins', 'Docker', 'Kubernetes', 'GitHub Actions'],
  },
  {
    icon: Cloud,
    title: 'Cloud Infrastructure',
    desc: 'Scalable, secure AWS infrastructure using Terraform. Multi-environment architecture with tight IAM policies and telemetry via Grafana & CloudWatch.',
    tags: ['AWS', 'Terraform', 'CloudWatch', 'Grafana'],
  },
  {
    icon: Sparkles,
    title: 'AI Image Generator',
    desc: 'OpenAI API powered text-to-image synthesis via a Flask backend with a responsive, intuitive interface.',
    tags: ['Flask', 'OpenAI API', 'JavaScript', 'CSS3'],
  },
  {
    icon: Bot,
    title: 'Gen AI Projects',
    desc: 'LLM workflows, conversational chatbots, and advanced RAG structures using prompt engineering and model configurations.',
    tags: ['LLM', 'Prompt Eng.', 'Generative AI', 'Python'],
  },
  {
    icon: Film,
    title: 'Creative Works',
    desc: 'High-end video editing: storyboarding, color grading, motion graphics, audio sync, and fast cinematic cuts.',
    tags: ['Video Editing', 'Motion Design', 'Premiere Pro', 'After Effects'],
  },
];

export default function Projects({ active }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    if (active) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, x: -60, display: 'block' },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }
      );
    } else {
      gsap.to(containerRef.current,
        { opacity: 0, x: -40, duration: 0.4, ease: 'power3.in',
          onComplete: () => { if (containerRef.current) containerRef.current.style.display = 'none'; } }
      );
    }
  }, [active]);

  return (
    <div ref={containerRef} className="checkpoint-overlay" style={{ display: active ? 'block' : 'none' }}>
      <div className="section-card">

        <div className="cp-checkpoint-badge">
          <Briefcase size={11} /> Checkpoint 03
        </div>

        <div className="cp-label">What I Built</div>

        <h1 className="cp-mega-title">
          Featured<br />Works
        </h1>

        <p className="cp-subtitle">Crossing the river of code into cloud-native realities</p>

        <div className="cp-divider" />

        <div className="cp-body">
          {projects.map((p, i) => {
            const Icon = p.icon;
            return (
              <div className="cp-project-item" key={i}>
                <h3><Icon size={13} style={{ display: 'inline', marginRight: 7, verticalAlign: 'middle', color: 'var(--accent-gold)' }} />{p.title}</h3>
                <p>{p.desc}</p>
                <div className="cp-project-tags">
                  {p.tags.map(t => <span key={t} className="cp-tag">{t}</span>)}
                </div>
                <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="cp-link">
                  View Codebase <ExternalLink size={11} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="cp-footer">
          <div className="cp-footer-track">
            <span>{MARQUEE_TEXT}</span>
            <span>{MARQUEE_TEXT}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
