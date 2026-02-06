# OpenCircuit

An interactive circuit simulation application built with React, TypeScript, and AI-powered UI generation. OpenCircuit revolutionizes electrical engineering education by using **Tambo AI** to dynamically generate contextual interfaces that respond to real-time circuit behavior.

## Key Innovation: AI-Driven Adaptive UI

Unlike traditional circuit simulators with static interfaces, OpenCircuit uses **Tambo AI** to make intelligent UI decisions based on circuit state:

- **Zero Hardcoded UI Logic**: All interface decisions flow through Tambo's AI engine
- **Context-Aware Components**: UI emerges from electrical behavior, not user requests
- **Educational Intelligence**: AI determines which instruments are most valuable for learning at each moment
- **Safety-First Design**: Tambo automatically prioritizes critical alerts for dangerous conditions

### How Tambo AI Powers OpenCircuit

1. **Real-Time Circuit Analysis**: Circuit simulator generates semantic data (current flow, voltage levels, safety conditions)
2. **Natural Language Context**: TamboContextProvider converts electrical state into rich natural language descriptions
3. **Dynamic Component Generation**: AI selects and positions relevant instruments (meters, visualizers, alerts)
4. **Progressive Complexity**: Interface sophistication automatically matches circuit complexity


This creates an **intelligent learning environment** where the interface teaches students by revealing electrical phenomena at exactly the right moment.

## Features

- Interactive circuit design canvas using Konva
- Real-time circuit simulation
- AI-powered adaptive UI via Tambo AI
- Visual circuit analysis tools (current meters, voltage meters)
- Safety alerts and power flow visualization
- Component library (battery, bulb, LED, resistor, switch, capacitor)

## Tech Stack

- React 18
- TypeScript
- Vite
- Konva & React-Konva (canvas rendering)
- **Tambo AI** (AI-powered UI generation and decision engine)
- Zod (schema validation for AI-generated components)
- Groq AI

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

