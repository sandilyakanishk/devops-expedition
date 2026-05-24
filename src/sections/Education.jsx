import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { GraduationCap } from 'lucide-react';

const MARQUEE_TEXT = 'EDUCATION & MILESTONES \u00a0\u2022\u00a0 TREK FORWARD \u00a0\u2022\u00a0 CERTIFIED & SKILLED \u00a0\u2022\u00a0 ';

export default function Education({ active }) {
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
          <GraduationCap size={11} /> Checkpoint 02
        </div>

        <div className="cp-label">Knowledge Base</div>

        <h1 className="cp-mega-title">
          Education &amp;<br />Milestones
        </h1>

        <p className="cp-subtitle">The intellectual base camp of my career</p>

        <div className="cp-divider" />

        <div className="cp-body">
          <div className="cp-timeline-item">
            <span className="cp-timeline-date">Amity University, Lucknow</span>
            <h3>Bachelor of Computer Applications</h3>
            <p>Focused on CS fundamentals, programming, database architectures, and software engineering principles.</p>
          </div>

          <div className="cp-timeline-item">
            <span className="cp-timeline-date">St. Dominic Savio College, Lucknow</span>
            <h3>Intermediate &amp; High School</h3>
            <p>12th ISC: <strong style={{ color: 'var(--accent-gold)' }}>72%</strong> &nbsp;|&nbsp; 10th ICSE: <strong style={{ color: 'var(--accent-gold)' }}>61%</strong></p>
          </div>

          <div className="cp-timeline-item">
            <span className="cp-timeline-date">Professional Certifications</span>
            <h3>Technical Upskilling</h3>
            <p>
              DevOps Beginner to Advance — Udemy<br />
              The Complete Python Bootcamp — Udemy<br />
              NDG Linux Essentials — Cisco Networking Academy
            </p>
          </div>
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
