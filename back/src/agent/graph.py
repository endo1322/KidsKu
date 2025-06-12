"""LangGraph single-node graph template.

Returns a predefined response. Replace logic and configuration as needed.
"""
from __future__ import annotations

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
    suggestion: str = Field(
        ...,
        description="投稿内容を改善するための具体的な提案"
    )
    corrected_text: str = Field(
        ...,
        description="安全性を考慮して修正した投稿内容"
    )

class State(BaseModel):
    """Input state for the agent.

    Defines the initial structure of incoming data.
    See: https://langchain-ai.github.io/langgraph/concepts/low_level/#state
    """

    user_request: str = Field(..., description="ユーザーからのSNS投稿内容")
    level: SafetyLevel = Field(default=SafetyLevel.SAFE, description="投稿内容の安全性レベル（safe: 安全, warning: 注意, danger: 危険）")
    reason: str = Field(default="", description="安全性評価の理由")
    response: SafetyCheckResult = Field(default_factory=lambda: SafetyCheckResult(
        suggestion="",
        corrected_text=""
    ), description="AIからの訂正文の出力結果")


class SafetyAssessment(BaseModel):  # noqa: D101
    level: SafetyLevel
    reason: str

def analyze_post_safety(state: State, llm: ChatOpenAI) -> Dict[str, Any]:
    """Analyze the safety level of the SNS post.
    
    Returns the safety level (safe/warning/danger) and the reason for the assessment.
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
                '    "reason": "判定理由の詳細な説明"\n'
                "}}",
            ),
            (
                "human",
                "投稿内容: {user_request}",
            ),
        ]
    )
    model = llm.with_structured_output(SafetyAssessment)
    chain = prompt | model
    result: SafetyAssessment = chain.invoke({"user_request": state.user_request})
    
    return {
        "user_request": state.user_request,
        "level": result.level,
        "reason": result.reason
    }


class CorrectionResult(BaseModel):  # noqa: D101
    suggestion: str
    corrected_text: str

def generate_corrected_text(state: State, llm: ChatOpenAI) -> Dict[str, Any]:
    """Generate a corrected version of the SNS post based on the safety assessment.
    
    Returns suggestions for improvement and a corrected version of the text.
    """
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "あなたはSNS投稿の改善提案を行う専門家です。\n"
            "以下の情報を元に、投稿内容を改善する提案と修正版を作成してください：\n"
            "- 元の投稿内容\n"
            "- 安全性評価の結果と理由\n\n"
            "評価結果は以下のJSON形式で返してください：\n"
            "{{\n"
            '    "suggestion": "改善提案の詳細な説明",\n'
            '    "corrected_text": "安全性を考慮して修正した投稿内容"\n'
            "}}"
        ),
        (
            "human",
            "投稿内容: {user_request}\n"
            "安全性評価: {level}\n"
            "評価理由: {reason}"
        ),
    ])
    
    model = llm.with_structured_output(CorrectionResult)
    chain = prompt | model
    result: CorrectionResult = chain.invoke({
        "user_request": state.user_request,
        "level": state.level,
        "reason": state.reason
    })
    
    return {
        "response": SafetyCheckResult(
            suggestion=result.suggestion,
            corrected_text=result.corrected_text
        )
    }

load_dotenv()

llm = ChatOpenAI(model="gpt-4o", temperature=0.0)

# Define the graph
graph = (
    StateGraph(State)
    .add_node("analyze_post_safety", lambda state: analyze_post_safety(state, llm))
    .add_node("generate_corrected_text", lambda state: generate_corrected_text(state, llm))
    .add_edge("__start__", "analyze_post_safety")
    .add_conditional_edges("analyze_post_safety",
                           lambda state: state.level == 'safe',
                           {True: END, False: "generate_corrected_text"})
    .add_edge("generate_corrected_text", END)
    .compile(name="MoveBits")
)
