import React, { useState } from 'react';
import './AIPage.css';

interface AIPageProps {
  onBack: () => void;
  onGoToPlayground: () => void;
}

const AIPage: React.FC<AIPageProps> = ({ onBack, onGoToPlayground }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<any>(null);

  const isElectricalQuestion = (query: string): boolean => {
    const electricalKeywords = [
      'voltage', 'current', 'resistance', 'ohm', 'circuit', 'led', 'capacitor', 
      'resistor', 'battery', 'power', 'electrical', 'electronics', 'ac', 'dc',
      'transistor', 'diode', 'inductor', 'switch', 'wire', 'ground', 'frequency'
    ];
    return electricalKeywords.some(keyword => query.toLowerCase().includes(keyword));
  };

  const generateExplanation = async (query: string) => {
    if (!isElectricalQuestion(query)) {
      return {
        type: 'refusal',
        message: "I focus on electrical and circuit-related topics. Try asking about voltage, current, or components."
      };
    }

    try {
      const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqApiKey) {
        throw new Error('Groq API key not found');
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content: 'You are an electrical engineering tutor. Explain electrical concepts clearly for beginners. Keep responses concise and educational.'
            },
            {
              role: 'user',
              content: `Explain this electrical concept: ${query}`
            }
          ],
          temperature: 0.3,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API response:', errorText);
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from Groq');
      }

      // Return structured response based on content
      const lines = content.split('\n').filter((line: string) => line.trim());
      const title = lines[0]?.replace(/\*\*/g, '').replace(/#+\s*/, '') || query;
      const explanation = lines.find((line: string) => !line.startsWith('**') && !line.startsWith('-') && line.length > 50) || content.substring(0, 200);
      const breakdown = lines.filter((line: string) => line.startsWith('-')).map((line: string) => line.replace(/^-\s*/, '').replace(/\*\*/g, '')).slice(0, 4);
      
      return {
        type: 'concept',
        title: title,
        explanation: explanation.replace(/\*\*/g, ''),
        breakdown: breakdown.length > 0 ? breakdown : [
          content.split('.')[0]?.replace(/\*\*/g, ''),
          content.split('.')[1]?.replace(/\*\*/g, ''),
          content.split('.')[2]?.replace(/\*\*/g, '')
        ].filter(Boolean)
      };

    } catch (error) {
      console.error('Groq API error:', error);
      
      // Fallback to basic explanations for common terms
      const fallbacks: Record<string, any> = {
        'current': {
          type: 'concept',
          title: 'Electric Current',
          explanation: 'Electric current is the flow of electric charge through a conductor, measured in amperes (A).',
          breakdown: [
            'Current flows from positive to negative terminal',
            'Measured in amperes (A) or milliamperes (mA)',
            'Higher current means more charge flowing per second',
            'Current is what actually does the work in circuits'
          ],
          formula: 'I = Q/t (Current = Charge/Time)',
          example: 'A 1A current means 1 coulomb of charge flows past a point every second'
        },
        'voltage': {
          type: 'concept',
          title: 'Voltage',
          explanation: 'Voltage is the electrical pressure that pushes current through a circuit.',
          breakdown: [
            'Measured in volts (V)',
            'Higher voltage can push more current',
            'Like water pressure in pipes',
            'Voltage difference creates current flow'
          ],
          formula: 'V = I × R (Ohm\'s Law)',
          example: 'A 9V battery provides 9 volts of electrical pressure'
        }
      };

      const key = Object.keys(fallbacks).find(k => query.toLowerCase().includes(k));
      return key ? fallbacks[key] : {
        type: 'error',
        message: 'Unable to generate explanation. Please try again or check your connection.'
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    try {
      const result = await generateExplanation(question);
      setExplanation(result);
    } catch (error) {
      setExplanation({
        type: 'error',
        message: 'Unable to generate explanation. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderExplanation = () => {
    if (!explanation) return null;

    switch (explanation.type) {
      case 'refusal':
        return (
          <div className="explanation-card refusal">
            <p>{explanation.message}</p>
          </div>
        );

      case 'concept':
        return (
          <div className="explanation-layout">
            <div className="concept-card">
              <h2>{explanation.title}</h2>
              <p className="main-explanation">{explanation.explanation}</p>
              
              {explanation.formula && (
                <div className="formula-block">
                  <h3>Formula</h3>
                  <div className="formula">{explanation.formula}</div>
                </div>
              )}
              
              {explanation.breakdown && (
                <div className="breakdown-panel">
                  <h3>Key Points</h3>
                  <ul>
                    {explanation.breakdown.map((point: string, index: number) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {explanation.example && (
                <div className="example-block">
                  <h3>Example</h3>
                  <p>{explanation.example}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'component':
        return (
          <div className="explanation-layout">
            <div className="component-card">
              <h2>{explanation.title}</h2>
              <p className="main-explanation">{explanation.explanation}</p>
              
              <div className="breakdown-panel">
                <h3>Why This Matters</h3>
                <ul>
                  {explanation.breakdown.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
              
              {explanation.formula && (
                <div className="formula-block">
                  <h3>Calculation</h3>
                  <div className="formula">{explanation.formula}</div>
                </div>
              )}
              
              {explanation.safety && (
                <div className="safety-note">
                  <h3>⚠️ Safety Note</h3>
                  <p>{explanation.safety}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="explanation-card general">
            <p>{explanation.explanation}</p>
          </div>
        );
    }
  };

  return (
    <div className="ai-page">
      <header className="ai-header">
        <div className="nav-left">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">OpenCircuit</span>
          </div>
        </div>
        
        <div className="nav-center">
          <a href="#home" className="nav-link" onClick={(e) => { e.preventDefault(); onBack(); }}>Home</a>
          <a href="#playground" className="nav-link" onClick={(e) => { e.preventDefault(); onGoToPlayground(); }}>Playground</a>
          <a href="#ai" className="nav-link active">AI</a>
        </div>
        
        <div className="nav-right">
        </div>
      </header>

      <main className="ai-main">
        <div className="question-section">
          <form onSubmit={handleSubmit} className="question-form">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask about electrical concepts... (e.g., What is Ohm's Law?)"
              disabled={isLoading}
              className="question-input"
            />
            <button type="submit" disabled={isLoading || !question.trim()}>
              {isLoading ? '...' : 'Ask'}
            </button>
          </form>
        </div>

        <div className="explanation-area">
          {renderExplanation()}
        </div>

        <aside className="quick-reference">
          <h3>Quick Reference</h3>
          <div className="reference-card">
            <h4>Key Formulas</h4>
            <div className="formula-list">
              <div>V = I × R (Ohm's Law)</div>
              <div>P = V × I (Power)</div>
              <div>Q = C × V (Capacitor)</div>
            </div>
          </div>
          
          <div className="reference-card">
            <h4>Common Questions</h4>
            <ul className="topic-list">
              <li onClick={() => setQuestion("What is Ohm's Law?")}>Ohm's Law</li>
              <li onClick={() => setQuestion("Why use resistor with LED?")}>LED Resistors</li>
              <li onClick={() => setQuestion("How does capacitor work?")}>Capacitors</li>
              <li onClick={() => setQuestion("AC vs DC difference?")}>AC vs DC</li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default AIPage;
