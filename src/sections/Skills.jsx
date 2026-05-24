import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Cpu } from 'lucide-react';

const MARQUEE_TEXT = 'TECHNICAL ARSENAL \u00a0\u2022\u00a0 DEVOPS & CLOUD \u00a0\u2022\u00a0 SCRIPTING & LINUX \u00a0\u2022\u00a0 GITOPS & IaC \u00a0\u2022\u00a0 ';

const skillGroups = [
  {
    title: 'DevOps & Cloud',
    skills: [
      { name: 'Kubernetes', level: 'advanced' },
      { name: 'Docker', level: 'advanced' },
      { name: 'AWS', level: '' },
      { name: 'Jenkins / GH Actions', level: 'advanced' },
      { name: 'Ansible', level: '' },
      { name: 'Prometheus / Grafana', level: 'advanced' },
    ],
  },
  {
    title: 'Infrastructure & GitOps',
    skills: [
      { name: 'Terraform (IaC)', level: 'advanced' },
      { name: 'CloudFormation', level: '' },
      { name: 'GitOps (ArgoCD)', level: '' },
      { name: 'CI/CD Design', level: 'advanced' },
      { name: 'Telemetry (OTel)', level: '' },
    ],
  },
  {
    title: 'Scripting & Linux',
    skills: [
      { name: 'Python Automation', level: 'advanced' },
      { name: 'Bash & Shell', level: 'advanced' },
      { name: 'Linux CLI', level: 'expert' },
      { name: 'YAML / Configs', level: 'expert' },
    ],
  },
  {
    title: 'Soft Skills',
    skills: [
      { name: 'Agile Collaboration', level: 'expert' },
      { name: 'Team Management', level: 'advanced' },
      { name: 'Client Communication', level: 'advanced' },
      { name: 'Technical Docs', level: 'expert' },
    ],
  },
];

export default function Skills({ active }) {
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
          <Cpu size={11} /> Checkpoint 05
        </div>

        <div className="cp-label">What I Know</div>

        <h1 className="cp-mega-title">
          Technical<br />Arsenal
        </h1>

        <p className="cp-subtitle">Equipped for cloud orchestration & continuous delivery</p>

        <div className="cp-divider" />

        <div className="cp-body">
          {skillGroups.map((grp) => (
            <div className="cp-skill-group" key={grp.title}>
              <div className="cp-skill-group-title">{grp.title}</div>
              <div className="cp-skill-badges">
                {grp.skills.map(s => (
                  <span key={s.name} className={`cp-skill-badge ${s.level}`}>{s.name}</span>
                ))}
              </div>
            </div>
          ))}
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
