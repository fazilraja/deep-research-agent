import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from src.agent import run_deep_research_agent, ResearchContext

app = FastAPI(title="Search Agent API", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.js development server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str
    max_iterations: int = 10

class SearchResponse(BaseModel):
    final_report: str
    research_context: ResearchContext
    iterations: int

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """Regular search endpoint that returns the final result."""
    result = run_deep_research_agent(request.query, request.max_iterations)
    return SearchResponse(**result)

@app.get("/api/search/stream")
async def search_stream(query: str, max_iterations: int = 10):
    """SSE endpoint for streaming search progress."""

    async def generate():
        try:
            yield f"data: {json.dumps({'status': 'starting', 'message': f'Starting search for: {query}'})}\n\n"

            # Run the agent in a thread to avoid blocking
            import queue
            import threading

            result_queue = queue.Queue()
            progress_queue = queue.Queue()

            def run_agent():
                try:
                    result = run_deep_research_agent(query, max_iterations)
                    result_queue.put(result)
                except Exception as e:
                    result_queue.put({"error": str(e)})

            thread = threading.Thread(target=run_agent)
            thread.start()

            # Send periodic progress updates
            iteration = 0
            while thread.is_alive():
                await asyncio.sleep(1)
                iteration += 1
                yield f"data: {json.dumps({'status': 'processing', 'message': f'Processing... (iteration {iteration})'})}\n\n"

            thread.join()

            # Get the final result
            result = result_queue.get()

            if "error" in result:
                yield f"data: {json.dumps({'status': 'error', 'message': result['error']})}\n\n"
            else:
                yield f"data: {json.dumps({'status': 'completed', 'result': result})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
