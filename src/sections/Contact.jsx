import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trophy, Mail, Github, Linkedin } from 'lucide-react';

const MARQUEE_TEXT = 'SUMMIT CONQUERED \u00a0\u2022\u00a0 LET\'S CONNECT \u00a0\u2022\u00a0 OPEN TO WORK \u00a0\u2022\u00a0 THANK YOU FOR TREKKING \u00a0\u2022\u00a0 ';

export default function Contact({ active }) {
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

        <div className="cp-checkpoint-badge" style={{ borderColor: 'rgba(251,191,36,0.7)', background: 'rgba(251,191,36,0.15)' }}>
          <Trophy size={11} /> Summit — Checkpoint 06
        </div>

        <div className="cp-label" style={{ color: '#fbbf24' }}>Let's Connect</div>

        <h1 className="cp-mega-title" style={{ color: '#fbbf24' }}>
          Summit<br />Conquered!
        </h1>

        <p className="cp-subtitle">You reached the peak — now let's start a new expedition</p>

        <div className="cp-divider" />

        <div className="cp-body">
          <p style={{ marginBottom: 16, color: 'rgba(255,255,255,0.75)' }}>
            Congratulations on completing the trek! You've climbed through DevOps experiences, cloud infrastructure,
            and creative works. Let's connect and build something amazing together.
          </p>

          <p style={{ fontSize: '0.78rem', color: 'rgba(255,183,3,0.7)', letterSpacing: 2, fontFamily: "'Bebas Neue', sans-serif", marginBottom: 14 }}>
            📍 Lucknow, Uttar Pradesh, India &nbsp;|&nbsp; 📞 +91 7071043805
          </p>

          <a href="mailto:sandilyakanishk@gmail.com" className="cp-contact-link">
            <Mail size={16} />
            sandilyakanishk@gmail.com
          </a>

          <div className="cp-social-grid">
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="cp-social-btn" title="GitHub">
              <Github size={18} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="cp-social-btn" title="LinkedIn">
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <div className="cp-footer">
          <div className="cp-footer-track" style={{ color: 'rgba(251,191,36,0.6)' }}>
            <span>{MARQUEE_TEXT}</span>
            <span>{MARQUEE_TEXT}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
