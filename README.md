# Reflexion - Cognitive Health Companion

## Project Overview
Reflexion is a comprehensive cognitive health monitoring application designed specifically for seniors and their caregivers. The app provides daily cognitive assessments, early dementia detection, and emergency response capabilities.

## Documentation Structure

This project follows a structured documentation approach with interconnected files that provide a complete view of the project:

```
docs/
├── architecture.md      # System architecture and technical design
├── planning.md         # Project planning, timeline, and milestones
├── task.md            # Current tasks and sprint management
├── frs.md             # Functional Requirements Specification
├── deployment.md      # Deployment and infrastructure guide
├── testing.md         # Testing strategy and procedures
└── maintenance.md     # Ongoing maintenance and support
```

## Quick Start

1. **For Developers**: Start with [Architecture](docs/architecture.md) → [FRS](docs/frs.md) → [Tasks](docs/task.md)
2. **For Project Managers**: Start with [Planning](docs/planning.md) → [Tasks](docs/task.md) → [Architecture](docs/architecture.md)
3. **For QA/Testing**: Start with [FRS](docs/frs.md) → [Testing](docs/testing.md) → [Tasks](docs/task.md)
4. **For DevOps**: Start with [Architecture](docs/architecture.md) → [Deployment](docs/deployment.md)

## Current Project Status

- **Phase**: MVP Development
- **Version**: 0.1.0
- **Risk Level**: Medium (High-risk detection features in development)
- **Next Milestone**: Emergency Response System Completion

## Key Features

- 🧠 **Cognitive Assessment**: Memory, speech, and facial expression analysis
- 📊 **Risk Scoring**: AI-powered dementia risk assessment (0-100 scale)
- 🚨 **Emergency Response**: Automated caregiver alerts for high-risk scores
- 📱 **Senior-Friendly UI**: Large fonts, high contrast, simplified navigation
- 👥 **Caregiver Dashboard**: Real-time monitoring and alert management
- 🎮 **Cognitive Exercises**: Memory games, puzzles, and brain training

## Technology Stack

- **Frontend**: Next.js 13, React 18, TypeScript
- **UI Framework**: Tailwind CSS, shadcn/ui
- **AI/ML**: TensorFlow.js, Face Detection API
- **Database**: Dexie (IndexedDB), Supabase (planned)
- **Charts**: Recharts
- **PWA**: Next.js PWA capabilities

## Getting Started

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Documentation Navigation

Each documentation file is interconnected and references related components:

- **Cross-references**: Each document links to related sections in other files
- **Dependencies**: Clear mapping of component dependencies
- **Traceability**: Requirements trace through architecture to implementation
- **Maintenance**: Regular update cycles ensure documentation stays current

For detailed information, see the [Planning Document](docs/planning.md) for project timeline and [Architecture Document](docs/architecture.md) for technical details.