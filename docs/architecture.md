# System Architecture

**Document Version**: 1.0  
**Last Updated**: January 2025  
**Related Documents**: [FRS](frs.md) | [Planning](planning.md) | [Deployment](deployment.md)

## Overview

Reflexion follows a modern web application architecture optimized for senior users and healthcare scenarios. The system prioritizes accessibility, reliability, and real-time emergency response capabilities.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Senior User   │    │   Caregiver     │    │  Healthcare     │
│   Interface     │    │   Dashboard     │    │   Provider      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │     Next.js Frontend      │
                    │   (React 18 + TypeScript) │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │    Client-Side Services   │
                    │  • AI Processing (TF.js)  │
                    │  • Local Storage (Dexie)  │
                    │  • PWA Capabilities       │
                    └─────────────┬─────────────┘
                                 │
                    ┌─────────────▼─────────────┐
                    │   Future: Backend APIs    │
                    │  • Supabase Database     │
                    │  • Edge Functions        │
                    │  • Real-time Sync        │
                    └───────────────────────────┘
```

## Component Architecture

### 1. Frontend Layer (Current Implementation)

**Technology**: Next.js 13 App Router, React 18, TypeScript  
**Related**: [FRS Section 2.1](frs.md#21-user-interface-requirements)

```typescript
app/
├── page.tsx                 # Main dashboard (risk scoring)
├── daily-checkin/          # Assessment workflow
├── dashboard/              # Progress tracking
├── caregiver/              # Caregiver monitoring
├── emergency-alert/        # Crisis response
├── exercises/              # Cognitive training
└── components/
    ├── ai/                 # AI processing components
    ├── tasks/              # Assessment tasks
    └── ui/                 # Reusable UI components
```

**Key Design Decisions**:
- **App Router**: Enables better performance and SEO
- **Client Components**: Required for AI processing and real-time features
- **Component Modularity**: Each assessment type is isolated for maintainability

### 2. AI Processing Layer

**Technology**: TensorFlow.js, MediaPipe Face Detection  
**Related**: [FRS Section 3.2](frs.md#32-ai-assessment-requirements)

```typescript
components/ai/
├── FaceDetection.tsx       # Facial expression analysis
├── SpeechAnalysis.tsx      # Voice pattern recognition
└── lib/ai-utils.ts         # AI processing utilities
```

**Processing Pipeline**:
1. **Data Capture**: Camera/microphone access via Web APIs
2. **Real-time Analysis**: TensorFlow.js models process data locally
3. **Risk Calculation**: Weighted scoring algorithm (see [FRS 3.2.3](frs.md#323-risk-scoring))
4. **Emergency Detection**: Threshold-based alert triggering

### 3. Data Layer

**Current**: Dexie (IndexedDB wrapper)  
**Planned**: Supabase PostgreSQL  
**Related**: [Planning Section 4.2](planning.md#42-database-migration)

```typescript
lib/
├── db.ts                   # Database schema and operations
└── ai-utils.ts            # Data processing utilities
```

**Data Models**:
- `CheckInSession`: Assessment results and timestamps
- `UserProfile`: User preferences and baseline data
- `EmergencyContacts`: Caregiver and healthcare provider info

### 4. Emergency Response System

**Related**: [FRS Section 4.1](frs.md#41-emergency-response-requirements)

```typescript
app/
├── emergency-alert/        # Emergency interface
└── caregiver/             # Caregiver dashboard
```

**Alert Flow**:
1. **Risk Detection**: Score ≥ 70 triggers high-risk state
2. **Immediate UI**: Red theme, emergency messaging
3. **Contact Notification**: Automated alerts to caregivers
4. **Healthcare Integration**: Provider notification system

## Technology Stack Decisions

### Frontend Framework: Next.js 13
**Rationale**: 
- Server-side rendering for better performance
- App Router for modern React patterns
- Built-in PWA support for offline capabilities
- Excellent TypeScript integration

**Trade-offs**: 
- Learning curve for App Router
- Client-side AI processing limitations

### AI Processing: TensorFlow.js
**Rationale**:
- Client-side processing preserves privacy
- Real-time analysis capabilities
- No server infrastructure required
- Offline functionality

**Trade-offs**:
- Limited model complexity
- Device performance dependency
- Battery usage considerations

### UI Framework: Tailwind CSS + shadcn/ui
**Rationale**:
- Rapid development with utility classes
- Consistent design system
- Accessibility features built-in
- Senior-friendly customization

**Related**: [FRS Section 2.2](frs.md#22-accessibility-requirements)

## Integration Points

### 1. Assessment Workflow Integration
**Components**: `daily-checkin/` → `components/tasks/` → `components/ai/`  
**Data Flow**: User interaction → AI processing → Risk calculation → Storage

### 2. Emergency Response Integration
**Components**: `page.tsx` → `emergency-alert/` → `caregiver/`  
**Trigger**: Risk score ≥ 70 → UI state change → Alert generation

### 3. Progress Tracking Integration
**Components**: `dashboard/` → `lib/db.ts` → Chart components  
**Data Flow**: Historical data → Trend analysis → Visualization

## Security Considerations

### Data Privacy
- **Local Processing**: AI analysis happens on-device
- **Minimal Data Collection**: Only essential health metrics stored
- **Encryption**: Planned for Supabase migration

### Emergency Access
- **Caregiver Authentication**: Secure access to patient data
- **Healthcare Provider Integration**: HIPAA-compliant data sharing
- **Emergency Override**: Crisis access protocols

## Performance Requirements

### Senior User Experience
**Related**: [FRS Section 2.3](frs.md#23-performance-requirements)

- **Load Time**: < 3 seconds initial load
- **Assessment Response**: < 1 second for interactions
- **AI Processing**: < 5 seconds for analysis
- **Offline Capability**: Core features work without internet

### Scalability Considerations
- **Client-side Processing**: Reduces server load
- **Progressive Enhancement**: Features degrade gracefully
- **Caching Strategy**: Aggressive caching for static assets

## Future Architecture Evolution

### Phase 2: Backend Integration
**Timeline**: [Planning Section 3.2](planning.md#32-backend-development)

1. **Supabase Migration**: Real-time data sync
2. **Edge Functions**: Server-side AI processing
3. **Healthcare APIs**: Provider system integration
4. **Advanced Analytics**: Population health insights

### Phase 3: Advanced Features
**Timeline**: [Planning Section 3.3](planning.md#33-advanced-features)

1. **Wearable Integration**: Continuous monitoring
2. **Telemedicine**: Video consultation features
3. **Family Network**: Multi-caregiver coordination
4. **Predictive Analytics**: Early intervention triggers

## Maintenance and Updates

### Code Organization
- **Modular Components**: Easy to update and test
- **Type Safety**: TypeScript prevents runtime errors
- **Documentation**: Inline comments and README files

### Deployment Strategy
**Related**: [Deployment Guide](deployment.md)

- **Static Export**: Current Next.js static deployment
- **Progressive Enhancement**: Features added incrementally
- **Rollback Capability**: Version control and deployment history

## Dependencies and Risks

### Critical Dependencies
1. **TensorFlow.js**: AI processing capability
2. **Next.js**: Application framework
3. **Browser APIs**: Camera, microphone, storage

### Risk Mitigation
- **Fallback Mechanisms**: Graceful degradation for AI failures
- **Cross-browser Testing**: Ensure compatibility
- **Performance Monitoring**: Track real-world usage

**Next Steps**: See [Task Management](task.md) for current implementation priorities and [Planning](planning.md) for timeline details.