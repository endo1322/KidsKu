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
                "あなたは小中学生のSNS利用をサポートする優しい先生です。\n"
                "以下の基準で、投稿内容が安全かどうかをチェックしてください：\n"
                "1. 安全（safe）: 問題のない、友達や家族に見せても大丈夫な投稿\n"
                "2. 注意（warning）: 少し気になる表現や、個人情報が含まれている可能性のある投稿\n"
                "3. 危険（danger）: いじめや差別的な内容、個人情報の公開など、絶対に避けるべき投稿\n\n"
                "評価結果は以下のJSON形式で返してください：\n"
                "{{\n"
                '    "level": "safe/warning/danger",\n'
                '    "reason": "なぜその評価になったのか、優しく説明してください"\n'
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
            "あなたは小中学生のSNS利用をサポートする優しい先生です。\n"
            "以下の情報を元に、投稿内容をより安全で良いものにするためのアドバイスと修正版を作成してください：\n"
            "- 元の投稿内容\n"
            "- 安全性評価の結果と理由\n\n"
            "以下の点に注意してアドバイスと修正版を作成してください：\n"
            "1. 優しく、励ましの言葉を入れる\n"
            "2. なぜその修正が必要なのか、わかりやすく説明する\n"
            "3. 修正版は、元の投稿の意図を保ちながら、より安全な表現にする\n"
            "4. 小中学生が理解しやすい言葉で説明する\n\n"
            "評価結果は以下のJSON形式で返してください：\n"
            "{{\n"
            '    "suggestion": "優しく、わかりやすく改善点を説明してください",\n'
            '    "corrected_text": "より安全な表現に修正した投稿内容"\n'
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
