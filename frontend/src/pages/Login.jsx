import { useEffect, useRef } from 'react';
import './Login.css';

const Login = () => {
  const canvasRef = useRef(null);

  // Animated floating particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.1,
    }));

    let animId;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 168, 76, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogin = () => {
    window.location.href = `${process.env.REACT_APP_API_URL}/api/auth/google`;
  };

  return (
    <div className="lx-page">
      {/* Animated particle canvas */}
      <canvas ref={canvasRef} className="lx-canvas" />

      {/* Background layers */}
      <div className="lx-bg-grid" />
      <div className="lx-bg-glow lx-glow-1" />
      <div className="lx-bg-glow lx-glow-2" />
      <div className="lx-bg-glow lx-glow-3" />

      {/* Floating book decorations */}
      <div className="lx-deco lx-deco-1">📖</div>
      <div className="lx-deco lx-deco-2">✦</div>
      <div className="lx-deco lx-deco-3">📚</div>
      <div className="lx-deco lx-deco-4">✦</div>
      <div className="lx-deco lx-deco-5">🖋️</div>

      {/* Main card */}
      <div className="lx-card">

        {/* Top ornament */}
        <div className="lx-ornament">
          <span className="lx-ornament-line" />
          <span className="lx-ornament-diamond">◆</span>
          <span className="lx-ornament-line" />
        </div>

        {/* Logo */}
        <div className="lx-logo-wrap">
          <div className="lx-logo-icon">N</div>
          <h1 className="lx-logo-text">Novelix</h1>
        </div>

        {/* Tagline */}
        <p className="lx-tagline">Your world of stories awaits</p>

        {/* Features list */}
        <div className="lx-features">
          <div className="lx-feature">
            <span className="lx-feature-icon">📖</span>
            <span>Thousands of free books</span>
          </div>
          <div className="lx-feature">
            <span className="lx-feature-icon">🔖</span>
            <span>Track your reading journey</span>
          </div>
          <div className="lx-feature">
            <span className="lx-feature-icon">🔥</span>
            <span>Build your reading streak</span>
          </div>
        </div>

        {/* Divider */}
        <div className="lx-divider">
          <span className="lx-divider-line" />
          <span className="lx-divider-text">Begin your journey</span>
          <span className="lx-divider-line" />
        </div>

        {/* Google login button */}
        <button className="lx-login-btn" onClick={handleLogin}>
          <svg className="lx-google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>Continue with Google</span>
          <span className="lx-btn-arrow">→</span>
        </button>

        <p className="lx-privacy">
          By signing in you agree to our terms.<br />
          We never post without your permission.
        </p>

        {/* Bottom ornament */}
        <div className="lx-ornament lx-ornament-bottom">
          <span className="lx-ornament-line" />
          <span className="lx-ornament-diamond">◆</span>
          <span className="lx-ornament-line" />
        </div>

      </div>

      {/* Bottom quote */}
      <div className="lx-quote">
        <span className="lx-quote-mark">"</span>
        A reader lives a thousand lives before he dies.
        <span className="lx-quote-mark">"</span>
        <span className="lx-quote-author">— George R.R. Martin</span>
      </div>

    </div>
  );
};

export default Login;