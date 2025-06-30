# Deep Research Agent

A sophisticated web research agent that conducts strategic, multi-iteration searches to provide comprehensive research reports.

## Architecture

The agent follows a three-phase approach:

### 1. Planning Phase (`plan_searches`)
- Analyzes current research context and search history
- Generates strategic search plans based on knowledge gaps
- Plans up to 3 searches per iteration with specific intents:
  - `initial_exploration`: Broad topic discovery
  - `deep_dive`: Detailed investigation of specific aspects
  - `fact_checking`: Verification of claims and information
  - `related_topics`: Exploration of connected subjects
  - `synthesis`: Combining information from multiple sources

### 2. Execution Phase (`execute_search`)
- Executes planned searches using the Exa API
- Analyzes results in context of overall research
- Extracts key findings and identifies remaining questions
- Maintains relevance scoring and search intent tracking

### 3. Synthesis Phase (`synthesize_research`)
- Creates comprehensive final report
- Provides executive summary and main findings
- Addresses original question with evidence
- Identifies limitations and areas for further research
- Includes citations from all sources

## Core Components

### Data Models
- **`SearchResult`**: Structured search result with metadata
- **`ResearchContext`**: Maintains research state and history
- **`SearchPlan`**: Planned search with intent and reasoning
- **`SearchIntent`**: Enum defining search purposes

### Key Functions
- **`get_search_results()`**: Enhanced search with Exa API integration
- **`run_deep_research_agent()`**: Main orchestration function
- **Agent functions**: LLM-powered planning, execution, and synthesis

## How It Works

1. **Initialization**: Creates `ResearchContext` with the user's question
2. **Iterative Research**: 
   - Plans strategic searches based on current knowledge
   - Executes searches and analyzes results
   - Updates context with findings and new questions
   - Continues until sufficient information is gathered (max 5 iterations)
3. **Final Synthesis**: Generates comprehensive report from all findings

## Features

- **Context-Aware Planning**: Each search iteration considers previous findings
- **Strategic Search Intents**: Different search types for comprehensive coverage
- **Relevance Scoring**: Results ranked by position and relevance
- **Error Handling**: Robust error management for search failures
- **Trace Logging**: Full observability with Lilypad tracing
- **Configurable Limits**: Adjustable iteration limits and result counts

## Dependencies

- **Exa API**: Primary search engine
- **Mirascope**: LLM interaction framework
- **Lilypad**: Tracing and observability
- **Google Gemini**: LLM provider for planning and synthesis
- **Pydantic**: Data validation and modeling

## Usage

```python
from src.agent import run_deep_research_agent

result = run_deep_research_agent(
    "Your research question here",
    max_iterations=5
)

print(result['final_report'])
```

The agent returns a dictionary containing:
- `final_report`: Comprehensive research report
- `research_context`: Complete research history and findings
- `iterations`: Number of search iterations performed