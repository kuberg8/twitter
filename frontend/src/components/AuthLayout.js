import React from 'react';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <main className="auth-layout">
      <section className="auth-story">
        <a className="brand" href="/">
          <span className="brand-icon">
            <ForumRoundedIcon />
          </span>{' '}
          twitter<span className="brand-dot">.</span>
        </a>
        <div className="auth-story-content">
          <span className="eyebrow">МЕСТО ДЛЯ ОБЩЕНИЯ</span>
          <h1>
            Большие идеи.
            <br />
            Живые разговоры.
          </h1>
          <p>
            Делитесь мыслями, задавайте вопросы
            <br />и оставайтесь на связи.
          </p>
          <div className="conversation-art" aria-hidden="true">
            <div className="art-bubble">
              Всё начинается с «привет» <span>✦</span>
            </div>
            <div className="art-bubble reply">Привет! Давай обсудим.</div>
            <div className="art-dots">● ● ●</div>
          </div>
        </div>
        <span className="story-footer">Ваши мысли заслуживают разговора.</span>
      </section>
      <section className="auth-form-panel">
        <div className="auth-form">
          <span className="eyebrow">РАДЫ ВАС ВИДЕТЬ</span>
          <h2>{title}</h2>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
        <span className="auth-footer">
          Ближе друг к другу. Одно сообщение за раз.
        </span>
      </section>
    </main>
  );
}
