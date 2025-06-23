from mirascope import llm, prompt_template
from typing import Literal
from pydantic import BaseModel, Field
import os 
from dotenv import load_dotenv
from datetime import datetime
from brave import Brave
import requests
import markdownify

load_dotenv()
 
def web_search(query: str) -> str:
    """
    Searches the web and returns the summaries of top results.
    
    Args:
        query: The search query to be executed.
        
    Returns:
        A string containing the summaries of the top results.
    """
    try:
        brave = Brave(api_key=os.getenv("BRAVE_API_KEY"))
        results = brave.search(q=query, count=10, raw=True)
        web_results = results.get("web", {}).get("results", [])
        
        summaries = []
        for result in web_results:
            if 'profile' not in result:
                continue
            url = result['url']
            header = f"{result['profile']['name']} - {result['profile']['long_name']}"
            title = result['title']
            snippet = result['description']
            summaries.append(f"{header}\n{title}\n{snippet}\n{url}")
        return "\n\n".join(summaries)
    except Exception as e:
        return f"Error searching the web: {e}"   
    
def extract_content(url: str) -> str:
    """
    Fetches the content of a given URL and returns it as a markdown page.
    
    Args:
        url: The URL to fetch the content from.
        
    Returns:
        A string containing the content of the URL as a markdown page.
    """
    response = requests.get(url)
    content = response.text
    markdown = markdownify.markdownify(content)
    return markdown

@llm.call(provider='google', model='gemini-2.0-flash', tools=[web_search, extract_content])
@prompt_template(        """
        SYSTEM:
        You are an expert web searcher. Your task is to answer the user's question using the provided tools.
        Use the current date provided to search the web for the most up to date information.
        The current date is {current_date}.

        You have access to the following tools:
        - `web_search(query: str)`: Searches the web and returns summaries of top results.
        - `extract_content(url: str)`: Parse the content of a webpage of a given URL and returns it as a markdown page.

        When calling the `web_search` tool, the `body` is simply the summary of the search
        result with the URL. You MUST then call the `extract_content` tool to get the actual content
        of the webpage. It is up to you to determine which search results to parse.
        
        You may call one tool per turn, for up to 10 turns before giving your final answer.
        
        In each turn you should give your thinking process and the final answer when you have gathered all of the information you need.

        Once you have gathered all of the information you need, generate a writeup that
        strikes the right balance between brevity and completeness based on the context of the user's query.

        MESSAGES: {history}
        USER: {question}
        """
        )
def search(question: str, history: list = None):
        return {"computed_fields": {"current_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "history": history or []}}
    
def run_agent_with_tools(question: str, max_iterations: int = 10):
    """
    Run the agent with iterative tool calling until completion.
    
    Args:
        question: The user's question
        max_iterations: Maximum number of tool calling iterations to prevent infinite loops
        
    Returns:
        Dict containing the final response and execution details
    """
    conversation_history = []
    total_cost = 0
    total_tokens = 0
    iteration = 0
    
    print(f"🤖 Starting agent for question: {question}")
    print("=" * 60)
    
    while iteration < max_iterations:
        iteration += 1
        print(f"\n📍 Iteration {iteration}")
        
        # Make the LLM call with conversation history
        result = search(question, history=conversation_history)
        
        # making sure you dont go broke
        total_cost += result.cost
        total_tokens += result.input_tokens + result.output_tokens
        
        # made the LLM a thinkoor
        print(f"💭 LLM Response: {result.content}")
        
        # Add user message to history (this is the agents state)
        if iteration == 1 and result.user_message_param:
            conversation_history.append(result.user_message_param)
        
        # Add assistant message to history
        conversation_history.append(result.message_param)
        
        # Check if tools were called
        if result.tools:
            print(f"🔧 Tools called: {len(result.tools)}")
            tools_and_outputs = []
            
            for i, tool in enumerate(result.tools):
                print(f"   Tool {i+1}: {tool._name()}({tool.args})")
                
                # Execute the tool
                try:
                    output = tool.call()
                    tools_and_outputs.append((tool, output))
                    print(f"   ✅ Tool output length: {len(str(output))} characters")
                except Exception as e:
                    print(f"   ❌ Tool error: {e}")
                    tools_and_outputs.append((tool, f"Error: {e}"))
            
            # Add tool results to conversation history
            if tools_and_outputs:
                conversation_history.extend(
                    result.tool_message_params(tools_and_outputs)
                )
            
            # Continue the loop to make another LLM call with the tool results
            continue
        else:
            # No tools called - agent is done
            print("✅ No tools called - Agent completed!")
            break
    
    if iteration >= max_iterations:
        print(f"⚠️  Reached maximum iterations ({max_iterations})")
    
    print("\n" + "=" * 60)
    print(f"📊 Final Stats:")
    print(f"   Iterations: {iteration}")
    print(f"   Total Cost: ${total_cost:.6f}")
    print(f"   Total Tokens: {total_tokens}")
    print(f"   Conversation History Length: {len(conversation_history)}")
    
    return {
        'final_response': result.content,
        'iterations': iteration,
        'total_cost': total_cost,
        'total_tokens': total_tokens,
        'completed': iteration < max_iterations
    }

