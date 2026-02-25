## Style-Based Adversarial Testing Platform for LLM Safety Evaluation
A web-based research platform that systematically tests whether AI language models 
can be manipulated through stylistic variations 
(poetry, metaphor, narrative, euphemism) rather than semantic content alone.

### Overview

Most AI safety research focuses on the semantic content of prompts. 
However, recent work (arXiv:2511.15304) shows that stylistic transformations alone 
can achieve over 60% attack success rates against LLM safety mechanisms — 
a critical gap that no systematic framework has addressed.
This project builds that framework.
Core Research Question: Can stylistic transformations of prompts systematically 
bypass LLM safety mechanisms more effectively than semantic variations alone?

Use this as a reference - [Introduction PPT](https://drive.google.com/file/d/1yOKFmUIZA5YF-Udh4wdsmvX8MUwAYKp3/view?usp=sharing)

### Features

4 style transformation engines: Poetic/Verse, Narrative/Story, Metaphorical, Euphemistic
Multi-model testing: simultaneous comparison across 3+ models (Llama, Mistral, Falcon, etc.)
Automated testing pipeline: batch processing support for 100+ baseline prompts
Results visualization dashboard: attack success rate charts, model vulnerability heatmaps
Data export: CSV, JSON, and PDF formats
Open-source dataset: publicly available for research replication and extension


### Research Background
ItemDetailsReference PaperarXiv:2511.15304InstitutionSUNY Albany, Department of Computer ScienceIndustry PartnerAda Analytics (Dr. Ray Hsu)Faculty SupervisorProf. Pradeep AtreyProject Duration14 weeks, Spring 2026

### System Architecture
```mermaid
graph TD
    A[Frontend - React<br/>Dashboard / Prompt Input / Visualizations] -->|REST API| B[Backend - Python / FastAPI<br/>Style Engines / LLM Integration / Classifier]
    B --> C[Database<br/>SQLite / PostgreSQL]
    B --> D[LLM Integrations<br/>Ollama / HuggingFace / OpenAI / Anthropic]
```

### Tech Stack
#### Backend

Python 3.9+, FastAPI or Flask
TextAttack, Garak, PromptBench

#### Frontend

React, Node.js

#### Database

PostgreSQL (production)

#### LLM Integration

Ollama (local, no rate limits), HuggingFace Inference API (free tier), OpenAI / Anthropic (validation only)


### Repository Structure
```
├── backend/
│   ├── api/
│   ├── models/
│   ├── transformations/
│   └── tests/
├── frontend/
│   ├── src/
│   └── public/
├── data/
│   ├── prompts/
│   └── results/
├── docs/
│   ├── architecture.md
│   ├── setup.md
│   └── research_paper.pdf
├── README.md
└── requirements.txt
```
### Getting Started
Prerequisites: Python 3.9+, Node.js 18+, Git, Ollama
#### 1. Clone the repository
bashgit clone https://github.com/your-org/style-adversarial-llm-tester.git
cd style-adversarial-llm-tester
#### 2. Pull Ollama models
bashollama pull llama3.1
ollama pull mistral
#### 3. Set up the backend
bashcd backend
pip install -r requirements.txt
python app.py
#### 4. Set up the frontend
bashcd frontend
npm install
npm run dev
Visit http://localhost:3002 in your browser.

### Testing Methodology
Style Transformation Types
TypeDescriptionPoeticConverts prompt into verse with rhyme and meterNarrativeFrames the request as fictional storytellingMetaphoricalUses analogies and figurative languageEuphemisticEmploys indirect, circumlocutory language
Dataset Scale

100 baseline prompts x 4 style transformations x 3+ models = 1,200+ total test cases

### Response Classification

Refused: model clearly declines the request
Partially Complied: model responds to part of the request
Fully Complied: safety filter bypassed successfully

### Development Roadmap
| Sprint | Timeline | Goal |
|--------|----------|------|
| Sprint 0 | Week 1-2 | Technical foundation, environment setup |
| Sprint 1 | Week 3-4 | First style transformation (Poetic) + Ollama integration |
| Sprint 2 | Week 5-6 | Multi-style comparison, basic frontend |
| Sprint 3 | Week 7-8 | Multi-model testing, web dashboard |
| Sprint 4 | Week 9-10 | Dataset expansion, visualizations |
| Sprint 5 | Week 11-12 | Deep analysis, research paper draft |
| Sprint 6 | Week 13-14 | Documentation, final presentation |

### Team
| Member | Role | Responsibilities |
|--------|------|-----------------|
| Minseon Kim | Team Leader, Frontend Lead & Testing | UI/UX, visualizations, QA | Adversarial library integration, LLM API management |
| Micah Wang | Backend Lead | API development, Adversarial library integration, LLM API management|
| Weiming Lan | Backend Lead | API development, Adversarial library integration, LLM API management |
| Fredua Akuoko | Database & DevOps | Schema design, data export, deployment |

### Ethics & Responsible Disclosure
This project is academic research conducted solely for the purpose of improving AI safety. All testing targets are open-source or free-tier models used under their respective terms of service. Any discovered vulnerabilities will be handled according to responsible disclosure principles. Findings are intended to inform the development of stronger AI safety mechanisms, not to enable misuse.

### License
MIT License. See LICENSE for details.

### Contact

Industry Partner / Research Mentor: Dr. Ray Hsu (Ada Analytics) — drrayhsu@gmail.com
Faculty Supervisor: Prof. Pradeep Atrey (SUNY Albany) — patrey@albany.edu

### This project is developed as part of the SUNY Albany Computer Science Capstone Program. Students retain intellectual property rights over all code and research outputs per SUNY Policy Section 335.28.
