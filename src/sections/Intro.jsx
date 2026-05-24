import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Compass } from 'lucide-react';

const MARQUEE_TEXT = 'TREK THROUGH MY JOURNEY \u00a0\u2022\u00a0 DEVOPS & CLOUD \u00a0\u2022\u00a0 PRESS W TO EXPLORE \u00a0\u2022\u00a0 ';

export default function Intro({ active }) {
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

        {/* Checkpoint badge */}
        <div className="cp-checkpoint-badge">
          <Compass size={11} /> Checkpoint 01
        </div>

        {/* Label — like "ABOUT ME" */}
        <div className="cp-label">Who I Am</div>

        {/* Mega title — large spaced letters */}
        <h1 className="cp-mega-title">
          Kanishk<br />Sandilya
        </h1>

        {/* Subtitle */}
        <p className="cp-subtitle">Graduate DevOps Engineer &amp; Cloud Practitioner</p>

        {/* Gold divider line */}
        <div className="cp-divider" />

        {/* Body */}
        <div className="cp-body">
          <p>
            Welcome to my <strong style={{ color: 'var(--accent-gold)' }}>adventure portfolio!</strong> I am an
            innovative Fresher DevOps Engineer with a strong foundation in cloud-native technologies,
            CI/CD pipelines, infrastructure-as-code, and advanced monitoring solutions.
          </p>

          <div className="cp-section-heading" style={{ marginTop: '16px' }}>
            Professional Summary
          </div>
          <p>
            Implemented serverless architectures that reduce deployment times and improve system reliability.
            Passionate about driving digital transformation and fostering a culture of continuous improvement
            in fast-paced DevOps environments.
          </p>
        </div>

        {/* Scrolling marquee footer */}
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
