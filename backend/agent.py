import marimo

__generated_with = "0.13.15"
app = marimo.App(width="medium")


@app.cell
def _():
    from mirascope import llm, prompt_template
    from typing import Literal
    from pydantic import BaseModel
    import os 
    from dotenv import load_dotenv
    return (load_dotenv,)


@app.cell
def _(load_dotenv):
    load_dotenv()
    return


@app.cell
def _(api_key):
    api_key
    return


@app.cell
def _():
    return


if __name__ == "__main__":
    app.run()
