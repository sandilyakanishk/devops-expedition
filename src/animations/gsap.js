import gsap from 'gsap';

// Cinematic opening sequence that moves the camera around the Base Camp
export const playCinematicOpening = (camera, targetLookAt, onComplete) => {
  if (!camera) return;

  // Temporarily disable standard follow logic
  camera.position.set(0, 8, 12);
  
  const tl = gsap.timeline({
    onComplete: () => {
      if (onComplete) onComplete();
    }
  });

  // Pan camera down and closer to the player character
  tl.to(camera.position, {
    x: 0,
    y: 4.8,
    z: 8.5,
    duration: 3.5,
    ease: 'power2.inOut'
  });

  return tl;
};

// Text fade-in utility
export const animateTextIn = (element, delay = 0) => {
  return gsap.fromTo(element,
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.8, delay, ease: 'power2.out' }
  );
};
