import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from enum import Enum

import exa_py
from dotenv import load_dotenv
from mirascope import llm, prompt_template
from pydantic import BaseModel, Field

load_dotenv()

# Data models for structured research
class SearchIntent(str, Enum):
    INITIAL_EXPLORATION = "initial_exploration"
    DEEP_DIVE = "deep_dive"
    FACT_CHECKING = "fact_checking"
    RELATED_TOPICS = "related_topics"
    SYNTHESIS = "synthesis"

class SearchResult(BaseModel):
    title: str
    url: str
    content: str
    relevance_score: float = Field(default=1.0, ge=0.0, le=1.0)
    search_intent: SearchIntent
    timestamp: datetime = Field(default_factory=datetime.now)

class ResearchContext(BaseModel):
    """Maintains the state of the research process"""
    query: str
    search_history: List[SearchResult] = Field(default_factory=list)
    key_findings: List[str] = Field(default_factory=list)
    unanswered_questions: List[str] = Field(default_factory=list)
    search_iterations: int = 0
    total_cost: float = 0.0
    total_tokens: int = 0

@dataclass
class SearchPlan:
    """Represents a planned search with intent and query"""
    intent: SearchIntent
    query: str
    reasoning: str

# Enhanced search function with better error handling and result processing
def get_search_results(query: str, num_results: int = 10, use_autoprompt: bool = True) -> List[SearchResult]:
    """
    Enhanced search function that returns structured results with metadata.
    """
    try:
        exa = exa_py.Exa(api_key=os.getenv("EXA_API_KEY"))
        results = exa.search_and_contents(
            query=query,
            num_results=num_results,
            use_autoprompt=use_autoprompt,
            text=True,
            highlights=True  # Get highlighted snippets
        )
        
        structured_results = []
        for i, result in enumerate(results.results):
            # Calculate basic relevance score based on position
            relevance = 1.0 - (i * 0.1)
            
            structured_results.append(SearchResult(
                title=result.title,
                url=result.url,
                content=result.text[:2000],  # Limit content length
                relevance_score=max(0.1, relevance),
                search_intent=SearchIntent.INITIAL_EXPLORATION  # Will be updated by the agent
            ))
            
        return structured_results
    except Exception as e:
        print(f"Error in search: {e}")
        return []

# Agent for planning searches based on research context
@llm.call(provider='google', model='gemini-2.0-flash', response_model=List[SearchPlan])
@prompt_template("""
        SYSTEM:
        You are a research planning agent. Your task is to analyze the current research context 
        and plan the next searches strategically.
        
        Current date: {current_date}
        
        Research Context:
        - Original Query: {original_query}
        - Search Iterations Completed: {iterations}
        - Key Findings So Far: {key_findings}
        - Unanswered Questions: {unanswered_questions}
        
        Previous Search Results Summary:
        {search_history_summary}
        
        Based on this context, plan up to 3 strategic searches that will:
        1. Fill knowledge gaps
        2. Verify important claims
        3. Explore related aspects
        4. Synthesize findings
        
        For each search, specify:
        - The search intent (initial_exploration, deep_dive, fact_checking, related_topics, synthesis)
        - The optimized search query
        - Your reasoning for this search
        
        Focus on searches that will meaningfully advance the research.
        """)
def plan_searches(research_context: ResearchContext):
    history_summary = "\n".join([
        f"- [{r.search_intent}] {r.title}: {r.content[:200]}..."
        for r in research_context.search_history[-5:]  # Last 5 results
    ])
    
    return {
        "computed_fields": {
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "original_query": research_context.query,
            "iterations": research_context.search_iterations,
            "key_findings": "\n".join(research_context.key_findings) if research_context.key_findings else "None yet",
            "unanswered_questions": "\n".join(research_context.unanswered_questions) if research_context.unanswered_questions else "None identified",
            "search_history_summary": history_summary
        }
    }

# Enhanced search agent with research context awareness
@llm.call(provider='google', model='gemini-2.0-flash', tools=[get_search_results])
@prompt_template("""
        SYSTEM:
        You are an expert web researcher with access to research context and history.
        Current date: {current_date}
        
        Research Context:
        - Original Query: {original_query}
        - Current Search Intent: {search_intent}
        - Search Iteration: {iteration}
        - Key Findings So Far: {key_findings}
        
        Your current search task:
        Query: {search_query}
        Reasoning: {search_reasoning}
        
        Execute this search and analyze the results in the context of the overall research.
        Identify new key findings and any remaining questions.
        
        Think step by step about:
        1. How these results relate to previous findings
        2. What new insights they provide
        3. What questions remain unanswered
        
        Provide a synthesis of the search results.
        """)
def execute_search(search_plan: SearchPlan, research_context: ResearchContext):
    return {
        "computed_fields": {
            "current_date": datetime.now().strftime("%Y-%m-%d"),
            "original_query": research_context.query,
            "search_intent": search_plan.intent.value,
            "iteration": research_context.search_iterations,
            "key_findings": "\n".join(research_context.key_findings) if research_context.key_findings else "None yet",
            "search_query": search_plan.query,
            "search_reasoning": search_plan.reasoning
        }
    }

# Synthesis agent for creating final research report
@llm.call(provider='google', model='gemini-2.0-flash')
@prompt_template("""
        SYSTEM:
        You are a research synthesis expert. Create a comprehensive report based on the research conducted.
        
        Research Topic: {query}
        Total Searches Conducted: {total_searches}
        
        Key Findings:
        {key_findings}
        
        All Search Results:
        {all_results}
        
        Create a well-structured report that:
        1. Provides an executive summary
        2. Presents main findings with evidence
        3. Addresses the original question comprehensively
        4. Identifies any limitations or areas for further research
        5. Includes relevant citations from the sources
        
        Format the report with clear sections and maintain objectivity.
        """)
def synthesize_research(research_context: ResearchContext):
    all_results_text = "\n\n".join([
        f"[{r.search_intent.value}] Source: {r.title} ({r.url})\n{r.content[:500]}..."
        for r in research_context.search_history
    ])
    
    return {
        "computed_fields": {
            "query": research_context.query,
            "total_searches": research_context.search_iterations,
            "key_findings": "\n".join(research_context.key_findings),
            "all_results": all_results_text
        }
    }

def run_deep_research_agent(question: str, max_iterations: int = 5):
    """
    Run the enhanced deep research agent with strategic planning and synthesis.
    """
    # Initialize research context
    research_context = ResearchContext(query=question)
    
    print(f"🔬 Starting Deep Research: {question}")
    print("=" * 80)
    
    while research_context.search_iterations < max_iterations:
        research_context.search_iterations += 1
        print(f"\n📊 Research Iteration {research_context.search_iterations}")
        
        # Step 1: Plan searches based on current context
        try:
            print("research_context", research_context)
            search_plans = plan_searches(research_context)
            print(f"📋 Generated {len(search_plans.content)} search plans")
            
            # Execute each planned search
            for i, plan in enumerate(search_plans.content[:2]):  # Limit to 2 searches per iteration
                print(f"\n🔍 Executing search {i+1}: {plan.intent.value}")
                print(f"   Query: {plan.query}")
                print(f"   Reasoning: {plan.reasoning}")
                
                # Execute the search
                search_result = execute_search(plan, research_context)
                
                # Process search results
                if search_result.tools:
                    for tool in search_result.tools:
                        try:
                            results = tool.call()
                            # Add results to context
                            for r in results:
                                r.search_intent = plan.intent
                                research_context.search_history.append(r)
                            print(f"   ✅ Found {len(results)} results")
                        except Exception as e:
                            print(f"   ❌ Search error: {e}")
                
                # Extract key findings from the analysis
                if search_result.content:
                    # Parse key findings from the agent's analysis
                    analysis_lines = search_result.content.split('\n')
                    for line in analysis_lines:
                        if line.strip() and not line.startswith('🔍'):
                            if "finding" in line.lower() or "discovered" in line.lower():
                                research_context.key_findings.append(line.strip())
                
                # Update costs
                research_context.total_cost += search_result.cost
                research_context.total_tokens += search_result.input_tokens + search_result.output_tokens
                
        except Exception as e:
            print(f"❌ Planning error: {e}")
            break
        
        # Check if we have enough information
        if len(research_context.key_findings) >= 5 and research_context.search_iterations >= 3:
            print("\n✅ Sufficient information gathered. Moving to synthesis.")
            break
    
    # Step 2: Synthesize all findings into a final report
    print("\n📝 Synthesizing research findings...")
    final_report = synthesize_research(research_context)
    
    print("\n" + "=" * 80)
    print("📊 Research Complete!")
    print(f"   Total Iterations: {research_context.search_iterations}")
    print(f"   Total Searches: {len(research_context.search_history)}")
    print(f"   Key Findings: {len(research_context.key_findings)}")
    print(f"   Total Cost: ${research_context.total_cost:.6f}")
    print(f"   Total Tokens: {research_context.total_tokens}")
    
    return {
        'final_report': final_report.content,
        'research_context': research_context,
        'iterations': research_context.search_iterations,
        'total_cost': research_context.total_cost,
        'total_tokens': research_context.total_tokens
    }

if __name__ == "__main__":
    # Example usage
    result = run_deep_research_agent(
        "What is Paycom and what are their plans for the future using AI?",
        max_iterations=5
    )
    print("\n📄 FINAL REPORT:")
    print(result['final_report'])