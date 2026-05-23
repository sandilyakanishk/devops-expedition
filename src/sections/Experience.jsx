import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Building2 } from 'lucide-react';

const MARQUEE_TEXT = 'WORK EXPERIENCE \u00a0\u2022\u00a0 DEVOPS JOURNEY \u00a0\u2022\u00a0 CORBUS \u00a0\u2022\u00a0 AGILE & CLOUD \u00a0\u2022\u00a0 ';

export default function Experience({ active }) {
  const containerRef = useRef();

  useEffect(() => {
    if (!containerRef.current) return;
    if (active) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, x: -60 },
        { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out' }
      );
    } else {
      gsap.to(containerRef.current,
        { opacity: 0, x: -40, duration: 0.4, ease: 'power3.in' }
      );
    }
  }, [active]);

  if (!active) return null;

  return (
    <div ref={containerRef} className="checkpoint-overlay">
      <div className="section-card">

        <div className="cp-checkpoint-badge">
          <Building2 size={11} /> Checkpoint 04
        </div>

        <div className="cp-label">What I Did</div>

        <h1 className="cp-mega-title">
          Work<br />Experience
        </h1>

        <p className="cp-subtitle">Navigating the professional corporate landscape</p>

        <div className="cp-divider" />

        <div className="cp-body">
          <div style={{ marginBottom: 6 }}>
            <div className="cp-section-heading">Graduate Trainee, DevOps</div>
            <p style={{ fontSize: '0.78rem', color: 'rgba(255,183,3,0.8)', letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif", marginBottom: 10 }}>
              CORBUS &nbsp;|&nbsp; JAN 2025 – JULY 2025
            </p>
          </div>

          <ul className="cp-exp-list">
            <li>Built & maintained automated CI/CD pipelines using Jenkins and GitHub Actions, streamlining engineering workflows.</li>
            <li>Provisioned scalable, secure cloud infrastructure on AWS using Terraform and CloudFormation IaC.</li>
            <li>Containerized deployments by writing Dockerfiles and managing Kubernetes environments.</li>
            <li>Setup telemetry and active monitoring with Prometheus and Grafana for metrics visualization and alerting.</li>
            <li>Participated in daily Agile stand-ups, sprint planning, and enterprise cloud architecture reviews.</li>
          </ul>
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
