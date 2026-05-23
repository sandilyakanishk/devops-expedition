import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trophy, Mail, Github, Linkedin } from 'lucide-react';

// WhatsApp SVG icon (lucide doesn't include it)
function WhatsAppIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
            <a href="https://www.linkedin.com/in/sandilyakanishk/" target="_blank" rel="noreferrer" className="cp-social-btn" title="LinkedIn">
              <Linkedin size={18} />
            </a>
            <a
              href="https://wa.me/917071043805?text=Hi%20Kanishk!%20I%20visited%20your%20portfolio%20and%20would%20love%20to%20connect."
              target="_blank"
              rel="noreferrer"
              className="cp-social-btn"
              title="WhatsApp"
              style={{ color: '#25d366' }}
            >
              <WhatsAppIcon size={18} />
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
