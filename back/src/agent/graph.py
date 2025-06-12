"""LangGraph single-node graph template.

Returns a predefined response. Replace logic and configuration as needed.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Any, Dict

from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from pydantic import BaseModel, Field


class SafetyLevel(str, Enum):
    """Safety level of the SNS post."""
    SAFE = "safe"
    WARNING = "warning"
    DANGER = "danger"

class SafetyCheckResult(BaseModel):
    """SNS投稿の安全性チェック結果を表すモデル。."""
    level: SafetyLevel = Field(
        ...,
        description="投稿内容の安全性レベル（safe: 安全, warning: 注意, danger: 危険）"
    )
    reason: str = Field(
        ...,
        description="安全性レベルを判定した理由の詳細な説明"
    )
    suggestion: str = Field(
        ...,
        description="投稿内容を改善するための具体的な提案"
    )
    corrected_text: str = Field(
        ...,
        description="安全性を考慮して修正した投稿内容"
    )

@dataclass
class State:
    """Input state for the agent.

    Defines the initial structure of incoming data.
    See: https://langchain-ai.github.io/langgraph/concepts/low_level/#state
    """

    user_request: str = Field(..., description="ユーザーからのSNS投稿内容")
    response: SafetyCheckResult = Field(default=None, description="AIからの安全性チェック結果")


def analyze_post_safety(state: State, llm: ChatOpenAI) -> Dict[str, Any]:
    """Process input and returns output.

    Can use runtime configuration to alter behavior.
    """
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "あなたはSNS投稿の安全性をチェックする専門家です。\n"
                "以下の基準に従って、投稿内容の安全性を評価してください：\n"
                "1. 安全（safe）: 問題のない一般的な投稿\n"
                "2. 注意（warning）: やや不適切な表現や内容が含まれる投稿\n"
                "3. 危険（danger）: 明らかに不適切、有害、または違法な内容を含む投稿\n\n"
                "評価結果は以下のJSON形式で返してください：\n"
                "{{\n"
                '    "level": "safe/warning/danger",\n'
                '    "reason": "判定理由の詳細な説明",\n'
                '    "suggestion": "改善提案",\n'
                '    "corrected_text": "安全性を考慮して修正した投稿内容"\n'
                "}}",
            ),
            (
                "human",
                "投稿内容: {user_request}",
            ),
        ]
    )
    model = llm.with_structured_output(SafetyCheckResult)
    chain = prompt | model
    result: SafetyCheckResult = chain.invoke({"user_request": state.user_request})
    
    return {
        "user_request": state.user_request,
        "response": result
    }

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# Define the graph
graph = (
    StateGraph(State)
    .add_node("analyze_post_safety", lambda state: analyze_post_safety(state, llm))
    .add_edge("__start__", "analyze_post_safety")
    .add_edge("analyze_post_safety", END)
    .compile(name="MoveBits")
)
