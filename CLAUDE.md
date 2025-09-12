# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReqFlow is an AI-driven project management platform similar to JIRA, designed to solve the problems of "vibe coding" (unstructured coding practices). The platform integrates AI capabilities to help with requirement clarification, technical selection, architectural design, and requirement decomposition.

## Current Status

This is a **specification and planning phase** repository. The actual codebase has not been implemented yet. The repository currently contains:

- `README.md` - Basic project description and pain points addressed
- `spec/01-需求明确.md` - Detailed requirements specification (in Chinese)

**Important**: All specification and design documents should be placed in the `spec/` directory to keep the project root clean and organized.

## Key Project Concepts

### Core Problem Being Solved
- Unstructured "vibe coding" that lacks planning
- Gap between AI-generated designs and actual implementation
- Chaotic requirement management leading to technical debt
- Poor team collaboration in AI-assisted development

### Planned Architecture (from spec)
- **Epic/Story/Task** three-tier decomposition system
- **Dual-layer interface contracts** (Epic-level service contracts, Story-level API specs)
- **AI-driven requirement breakdown** using models like Qwen
- **Forced layered development**: Database/Backend API/Frontend UI separation
- **Parallel development support** through interface contracts

### Core Features (Planned)
1. **User Authentication** - Login system (test account: 15173737427/12345678)
2. **System Homepage** - Main dashboard (TODO)
3. **Project Creation** - One-sentence project description → AI naming → requirement clarification
4. **Requirement Clarification** - Multi-turn AI dialogue to clarify user needs
5. **Technology Selection** - AI-assisted tech stack selection with opinionated defaults
6. **Architecture Design** - System architecture planning (content TBD)
7. **Requirement Decomposition** - Break down requirements into Epic/Story/Task hierarchy

### Technical Principles (from spec)
- Frontend-backend separation
- Swagger UI for API documentation
- UI component libraries (Element Plus, Ant Design)
- Cloud database preference (Supabase)

## Development Guidelines

### When implementing this project:
1. **Follow the spec-driven approach** - All features should map to the detailed specifications
2. **Implement AI integration points** - The system heavily relies on AI models (particularly Qwen) for requirement processing
3. **Maintain the three-tier decomposition** - Epic/Story/Task hierarchy is core to the platform
4. **Ensure interface contract compliance** - Both Epic-level and Story-level contracts must be enforced
5. **Support parallel development workflows** - The architecture should enable independent development of different components

### Code Style and Encoding Guidelines
- **IMPORTANT**: Do NOT use any emojis or special Unicode characters in code, comments, or documentation
- This is critical to avoid encoding issues in Windows environments (GBK codec errors)
- Use plain ASCII text only for all generated content
- Use descriptive text instead of emojis (e.g., "Database Task" instead of "🗄️ Database Task")

### Key Files to Reference
- `spec/01-需求明确.md` - Complete requirement specification (Chinese)
- Additional spec files may be added as the project evolves

## Notes
- This is currently a Chinese-language project with specifications in Chinese
- The project is in early planning phase with no code implementation yet
- Future development should closely follow the detailed specifications in the `spec/` directory