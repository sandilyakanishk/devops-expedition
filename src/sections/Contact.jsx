import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Mail, Github, Linkedin, Instagram, Trophy, Send } from 'lucide-react';

export default function Contact({ active }) {
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
      <div className="section-card contact-card">
        <div className="card-header">
          <div className="icon-badge golden-badge">
            <Trophy className="glow-icon trophy-glow" size={24} />
          </div>
          <span className="checkpoint-num gold-text">Checkpoint 6 - Peak</span>
        </div>
        
        <h1 className="explorer-title summit-title">Summit Conquered!</h1>
        <h2 className="explorer-subtitle gold-text">"You reached the summit."</h2>
        
        <p className="summit-msg">
          Congratulations on completing the trek! You have climbed through my DevOps experiences, infrastructure deployments, and creative works. 
          Let's connect and start a new expedition together.
        </p>

        <div className="card-divider" />
        
        <div style={{ textAlign: 'center', marginBottom: '16px', fontSize: '0.9rem', color: '#9ca3af' }}>
          📍 Lucknow, Uttar Pradesh, India <br />
          📞 +91 7071043805
        </div>
        
        <div className="contact-links">
          <a href="mailto:sandilyakanishk@gmail.com" className="contact-btn email-btn">
            <Mail size={18} />
            <span>sandilyakanishk@gmail.com</span>
          </a>

          <div className="social-grid">
            <a href="https://github.com/sandilyakanishk" target="_blank" rel="noreferrer" className="social-icon-btn github">
              <Github size={20} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="social-icon-btn linkedin">
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        <div className="card-footer mt-4">
          <span className="congrats-text">Thank you for playing! Feel free to explore the peaks.</span>
        </div>
      </div>
    </div>
  );
}
