import React from 'react';
import './Homepage.css';

interface HomepageProps {
  onLaunchPlayground: () => void;
  onLaunchAI: () => void;
}

export const Homepage: React.FC<HomepageProps> = ({ onLaunchPlayground, onLaunchAI }) => {
  return (
    <div className="homepage">
      {/* Top Navigation */}
      <nav className="homepage-nav">
        <div className="nav-container">
          <div className="nav-left">
            <div className="logo">
              <div className="logo-icon">⚡</div>
              <span>OpenCircuit</span>
            </div>
          </div>
          
          <div className="nav-center">
            <a href="#home" className="nav-link active">Home</a>
            <a href="#playground" className="nav-link" onClick={(e) => { e.preventDefault(); onLaunchPlayground(); }}>Playground</a>
            <a href="#ai" className="nav-link" onClick={(e) => { e.preventDefault(); onLaunchAI(); }}>AI</a>
          </div>
          
          <div className="nav-right">
            <button className="cta-button" onClick={onLaunchPlayground}>
              Launch Playground
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-container">
          <div className="hero-left">
            <h1 className="hero-title">
              Build. Connect. Understand Electricity.
            </h1>
            <p className="hero-subtitle">
              A free, interactive electrical playground that lets learners build real circuits and understand how electricity flows — without labs, tools, or prompts.
            </p>
            <div className="hero-actions">
              <button className="cta-button primary" onClick={onLaunchPlayground}>
                Launch Playground
              </button>
              <button className="cta-button secondary" onClick={onLaunchAI}>
                Ask AI Assistant
              </button>
            </div>
          </div>
          
          <div className="hero-right">
            <div className="product-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span></span><span></span><span></span>
                </div>
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="component-item">🔋 Battery</div>
                  <div className="component-item">💡 Bulb</div>
                  <div className="component-item">🔘 Switch</div>
                  <div className="component-item">🔴 LED</div>
                </div>
                <div className="preview-canvas">
                  <div className="circuit-element battery">🔋</div>
                  <div className="wire glowing"></div>
                  <div className="circuit-element bulb glowing">💡</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="value-props">
        <div className="container">
          <div className="value-grid">
            <div className="value-card">
              <h3>Learn by Building</h3>
              <p>Drag components and wire real circuits</p>
            </div>
            <div className="value-card">
              <h3>No Prompts. No Bots.</h3>
              <p>The interface explains itself through visuals</p>
            </div>
            <div className="value-card">
              <h3>Accessible Everywhere</h3>
              <p>Runs in any browser, even on low-end devices</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2>How It Works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-icon">1</div>
              <h3>Choose Components</h3>
              <p>Select from batteries, bulbs, switches, and more</p>
            </div>
            <div className="step">
              <div className="step-icon">2</div>
              <h3>Connect Circuits</h3>
              <p>Wire components together with simple clicks</p>
            </div>
            <div className="step">
              <div className="step-icon">3</div>
              <h3>See Electricity Come Alive</h3>
              <p>Watch bulbs glow and circuits respond in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="audience">
        <div className="container">
          <h2>Who It's For</h2>
          <div className="audience-grid">
            <div className="audience-card">
              <div className="audience-icon">🎓</div>
              <h3>Students</h3>
              <p>Learn electrical concepts through hands-on experimentation</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">👩‍🏫</div>
              <h3>Teachers</h3>
              <p>Demonstrate circuits without expensive lab equipment</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">📚</div>
              <h3>Self-learners</h3>
              <p>Explore electricity at your own pace, anywhere</p>
            </div>
            <div className="audience-card">
              <div className="audience-icon">🏫</div>
              <h3>Under-resourced Schools</h3>
              <p>Access quality electrical education without physical labs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology">
        <div className="container">
          <div className="tech-content">
            <h2>Powered by Generative UI (Tambo)</h2>
            <p>
              OpenCircuit uses AI to adapt the interface to what's happening in your circuit, 
              showing the right information at the right time — without asking questions.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="container">
          <h2>Start Building Circuits Today</h2>
          <button className="cta-button primary large" onClick={onLaunchPlayground}>
            Launch Playground
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-left">
              <span>OpenCircuit © 2026</span>
            </div>
            <div className="footer-right">
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
