# 💎 FinPersona — AI-Powered Financial Persona Engine

> **India's smartest AI financial advisor** — powered by a 3-layer persona segmentation engine, a 6-agent LangGraph "War Room," and a Self-Querying RAG system that gives hyper-personalized financial advice.

---

## 🧠 What This Does

FinPersona takes **your financial data** (structured forms, PDFs like CAMS/Form 16, or plain English chat) and:

1. **Extracts** structured financial signals using LLM-based parsing.
2. **Tags** you with 1–3 financial personas (e.g., `DEBT_STRESSED`, `YOUNG_INVESTOR`).
3. **Deploys 6 AI agents** that collaborate to build a complete financial strategy.
4. **Recommends** specific, actionable financial moves ranked by priority.

A single user can belong to **multiple personas simultaneously**, and recommendations are aggregated across all of them.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     DATA INGESTION LAYER                    │
│                                                             │
│   📋 Structured Form    📄 PDF Upload    💬 Chat Query      │
│         │                    │                │              │
│         ▼                    ▼                ▼              │
│    Direct Save        PDF Parser +      LLM Extractor       │
│                      LLM Extractor     (Gemini Flash)       │
│         │                    │                │              │
│         └────────────────────┴────────────────┘              │
│                          │                                   │
│                    ┌─────▼─────┐                             │
│                    │ Gold      │  ◄── Merged, metadata-      │
│                    │ Profile   │      tagged, multi-source   │
│                    └─────┬─────┘                             │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                  3-LAYER PERSONA ENGINE                      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Layer 1      │  │ Layer 2      │  │ Layer 3      │      │
│  │ Rule-Based   │  │ K-Means      │  │ LLM Persona  │      │
│  │ (8 rules)    │  │ Clustering   │  │ Tagger       │      │
│  │ weight: 0.85 │  │ weight: 0.70 │  │ weight: 1.0  │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         └─────────────────┼─────────────────┘               │
│                    ┌──────▼──────┐                           │
│                    │ Aggregator  │  ◄── Dedup + Weighted     │
│                    │ (Multi-     │      Confidence Merge     │
│                    │  Persona)   │                           │
│                    └──────┬──────┘                           │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│              6-AGENT LANGGRAPH WAR ROOM                     │
│                                                             │
│  🔬 Data Surgeon ──► ⚖️ Tax Wizard ──► 📡 Portfolio X-Ray  │
│                                              │              │
│  🎖️ Exec Narrator ◄── 🔥 FIRE Planner ◄── 🛡️ Risk Shield │
│                                                             │
│  Each agent writes to a shared "Blackboard" (AgentState)    │
│  and can see the user's assigned personas for context.       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎭 The 8 Financial Personas

| Persona | Trigger | Example |
|---|---|---|
| 🚀 **Young Investor** | Age < 30, income > 0, no dependents | Fresh grad with first salary |
| 😰 **Debt Stressed** | EMI/Income > 40% | Multiple running loans |
| 💎 **Wealth Builder** | Assets > 0, Income > ₹10L | Growing portfolio actively |
| 🏖️ **Retirement Planner** | Goal = retirement | Planning for FIRE or late retirement |
| ⚠️ **Under-Insured** | No insurance + dependents | Family without term/health cover |
| 💸 **Cash-Flow Tight** | Expenses > 80% of income | Living paycheck to paycheck |
| 🏦 **Conservative Saver** | Assets > 0, no debt, low expenses | Heavy FD, low equity exposure |
| 🔥 **Aggressive Investor** | Assets > 2× income, age < 40 | High equity, direct stocks |

**A user can match 3+ personas simultaneously.** For example: `YOUNG_INVESTOR` + `DEBT_STRESSED` + `UNDERINSURED`.

---

## ⚔️ The 6 War Room Agents

| Agent | Role | What It Does |
|---|---|---|
| 🔬 **Data Surgeon** | Data Quality | Validates the profile, flags missing fields, assigns a Data Quality Score |
| ⚖️ **Tax Wizard** | Tax Optimization | Old vs New regime comparison, 80C/80D gap analysis, HRA/NPS suggestions |
| 📡 **Portfolio X-Ray** | Investment Analysis | Asset allocation review, rebalancing plan, goal-corpus gap analysis |
| 🛡️ **Risk Shield** | Debt & Insurance | EMI stress test, Human Life Value calculation, insurance gap detection |
| 🔥 **FIRE Planner** | Retirement Roadmap | Freedom Number calculation, month-by-month SIP roadmap |
| 🎖️ **Exec Narrator** | Strategy Synthesis | Combines all 5 reports into a "Gold Strategy" with Top 3 Priorities |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI (Python) |
| **Data Models** | Pydantic v2 |
| **Database** | SQLite (dev) / PostgreSQL (prod) |
| **Vector Store** | ChromaDB |
| **ML Clustering** | scikit-learn (K-Means) |
| **LLM** | Google Gemini 1.5 Flash |
| **Agent Framework** | LangGraph |
| **PDF Parsing** | pdfplumber |
| **Frontend** | Vanilla HTML/CSS/JS (Dark UI) |

---

## 📂 Project Structure

```
genai-starter/
├── app/
│   ├── main.py                      # FastAPI entry point
│   ├── config.py                    # Env vars, paths, settings
│   ├── models/
│   │   ├── user.py                  # UserProfile + StructuredInput schemas
│   │   ├── persona.py               # 8 Persona enums + PersonaMatch
│   │   └── recommendation.py        # Recommendation schema
│   ├── api/
│   │   ├── structured.py            # POST /ingest/structured
│   │   ├── documents.py             # POST /ingest/document
│   │   ├── chat.py                  # POST /ingest/chat
│   │   ├── personas.py              # GET  /personas/{user_id}
│   │   └── agents.py                # GET  /analyze/war-room/{user_id}
│   ├── ingestion/
│   │   ├── pdf_parser.py            # pdfplumber text extraction
│   │   └── llm_extractor.py         # Gemini-based structured extraction
│   ├── persona_engine/
│   │   ├── rule_based.py            # Layer 1: 8 hard-coded financial rules
│   │   ├── clustering.py            # Layer 2: K-Means on feature vectors
│   │   ├── llm_tagger.py            # Layer 3: Gemini persona assignment
│   │   └── aggregator.py            # Merge + deduplicate + weight
│   ├── recommendations/
│   │   └── engine.py                # 32 curated recs across 8 personas
│   ├── agents/
│   │   └── war_room.py              # LangGraph 6-agent workflow
│   └── db/
│       ├── database.py              # SQLAlchemy models + engine
│       └── crud.py                  # DB read/write helpers
├── frontend/
│   └── index.html                   # Premium dark-theme single-page UI
├── data/                            # SQLite DB + ML models (auto-created)
├── tests/
│   ├── test_rule_based.py           # Unit tests for rule engine
│   ├── test_clustering.py           # Tests for K-Means layer
│   └── test_pipeline.py             # Integration tests (full flow)
├── requirements.txt
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
cd genai-starter
pip install -r requirements.txt
```

### 2. Set Up Environment
```bash
cp .env.example .env
# Edit .env and add your Gemini API key:
# GEMINI_API_KEY=your-key-here
```

### 3. Run the Server
```bash
uvicorn app.main:app --reload --port 8000
```

### 4. Open the UI
Navigate to **http://localhost:8000** in your browser.

### 5. Test the Flow
1. Fill in the **Structured Form** (age, income, assets, etc.)
2. Click **Submit & Analyse** → see persona badges + recommendations
3. Switch to **⚔️ Agent War Room** tab → click **Deploy 6 Agents**
4. Watch the live agent console as they build your financial strategy

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ingest/structured` | Submit structured financial data |
| `POST` | `/ingest/document` | Upload PDF (CAMS, Form 16, Bank Statement) |
| `POST` | `/ingest/chat` | Send free-text financial query |
| `GET` | `/personas/{user_id}` | Run 3-layer persona engine + get recommendations |
| `GET` | `/profile/{user_id}` | View current merged user profile |
| `GET` | `/analyze/war-room/{user_id}` | Deploy 6-agent LangGraph analysis |

---

## 🗺️ Roadmap

### Phase 2 — RAG Knowledge Base
- [ ] **Financial Knowledge Ingestion Pipeline** — Crawl financial blogs (Cleartax, ValueResearch), parse PDFs (tax circulars, SEBI guidelines), and ingest into ChromaDB with LLM-based metadata tagging
- [ ] **Self-Querying Retriever** — Replace hardcoded recommendations with LangChain Self-Querying RAG that filters advice by persona, income bracket, and tax regime
- [ ] **DuckDuckGo Live Search** — Give War Room agents access to real-time web search for today's FD rates, market news, and budget updates

### Phase 3 — Advanced Features
- [ ] **FIRE Path Planner** — Month-by-month SIP roadmap with asset allocation shifts
- [ ] **Money Health Score** — 5-minute onboarding → score across 6 dimensions (emergency, insurance, investments, debt, tax, retirement)
- [ ] **Life Event Advisor** — AI advisor triggered by bonus, marriage, new baby — customized to your portfolio and tax bracket
- [ ] **Tax Wizard** — Upload Form 16, get Old vs New regime comparison with every missing deduction identified
- [ ] **Couple's Money Planner** — Joint financial planning across both incomes (HRA claims, NPS matching, SIP splits)
- [ ] **MF Portfolio X-Ray** — Upload CAMS statement → full portfolio reconstruction, true XIRR, overlap analysis, expense ratio drag

### Phase 4 — Production
- [ ] PostgreSQL migration
- [ ] Authentication (JWT)
- [ ] Rate limiting
- [ ] Async agent execution with WebSocket streaming
- [ ] Mobile-responsive PWA

---

## 🧪 Running Tests
```bash
pytest tests/ -v
```

---

## 📄 License

MIT

---

Built with ❤️ using FastAPI, LangGraph, and Gemini.
