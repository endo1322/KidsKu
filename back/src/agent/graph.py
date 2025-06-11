"""LangGraph single-node graph template.

Returns a predefined response. Replace logic and configuration as needed.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, TypedDict

from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import Field


@dataclass
class State:
    """Input state for the agent.

    Defines the initial structure of incoming data.
    See: https://langchain-ai.github.io/langgraph/concepts/low_level/#state
    """

    user_request: str = Field(..., description="ユーザーからのリクエスト")
    response: str = Field(default="", description="AIからのレスポンス")


def call_model(state: State, llm: ChatOpenAI) -> Dict[str, Any]:
    """Process input and returns output.

    Can use runtime configuration to alter behavior.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "あなたはユーザーインタビュー用の多様なペルソナを作成する専門家です。",
            ),
            (
                "human",
                "ユーザーリクエスト: {user_request}\n\n",
            ),
        ]
    )
    model = llm
    output_parser = StrOutputParser()
    chain = prompt | model | output_parser
    result = chain.invoke({"user_request": state.user_request})
    return {
        "user_request": state.user_request,
        "response": result
    }

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# Define the graph
graph = (
    StateGraph(State)
    .add_node("call_model", lambda state: call_model(state, llm))
    .add_edge("__start__", "call_model")
    .add_edge("call_model", END)
    .compile(name="New Graph")
)
