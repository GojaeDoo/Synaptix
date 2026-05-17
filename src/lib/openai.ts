export type ChatRole = 'system' | 'user' | 'assistant' | 'tool'

export interface ChatToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface ChatMessageBody {
  role: ChatRole
  content?: string | null
  tool_call_id?: string
  tool_calls?: ChatToolCall[]
}

export interface ChatTool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export interface ChatChoice {
  message: {
    role: 'assistant'
    content: string | null
    tool_calls?: ChatToolCall[]
  }
}

export interface ChatCompletionResponse {
  choices: ChatChoice[]
  error?: { message: string }
}

export async function chatCompletion(opts: {
  messages: ChatMessageBody[]
  tools?: ChatTool[]
}): Promise<ChatChoice> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
  })
  const data = (await res.json()) as ChatCompletionResponse
  if (!res.ok || !data.choices?.[0]) {
    throw new Error(data.error?.message ?? `Chat API error ${res.status}`)
  }
  return data.choices[0]
}

const SYSTEM_PROMPT_BASE = `당신은 Synaptix의 AI 어시스턴트입니다.
사용자가 대시보드 위젯을 제어하고 데이터를 관리할 수 있도록 도와드립니다.

가능한 작업:
- 위젯 표시/숨기기 (날씨, 주식, 뉴스, 캘린더, 가계부)
- 할일 추가 (특정 날짜 지정 가능)
- 수입/지출 기록
- 날씨 도시 변경
- 현재 데이터 요약 제공

날짜 규칙:
- 사용자가 "내일", "15일", "다음주 월요일" 같은 상대/부분 표현을 쓰면 시스템 프롬프트의 "오늘 날짜"를 기준으로 YYYY-MM-DD ISO 형식으로 변환해 due_date에 넣으세요.
- 날짜를 명시하지 않으면 due_date는 보내지 마세요(null로 처리됩니다).

거래 추가 규칙:
- add_transaction을 호출할 때는 amount/type/category/description 네 필드를 모두 반드시 채워야 합니다.
- "용돈 들어왔어" → type:"income", category:"용돈", description:"용돈"
- "점심 김밥 8천원" → type:"expense", category:"식비", description:"점심 김밥"
- 카테고리가 애매하면 "기타"를 사용하되, 절대 비워두지 마세요.

복수 작업 처리:
- 사용자가 한 메시지에서 여러 거래를 말해도 한 번에 하나의 tool만 호출하세요.
- 예: "커피 8000원, 장보기 12000원" → 우선 커피 1건만 add_transaction으로 추가하고, 응답에서 "이어서 장보기도 추가할게요"라고 안내한 뒤 다음 턴에 처리.
- 절대 두 개 이상의 tool을 동시에 호출하지 마세요.

항상 친절하고 간결하게 한국어로 응답하세요.`

export function buildSystemPrompt(): string {
  const today = new Date().toISOString().slice(0, 10)
  return `${SYSTEM_PROMPT_BASE}\n\n오늘 날짜: ${today}`
}

// 하위 호환용 — 새 코드는 buildSystemPrompt() 사용 권장
export const SYSTEM_PROMPT = SYSTEM_PROMPT_BASE

export const CHAT_TOOLS: ChatTool[] = [
  {
    type: 'function',
    function: {
      name: 'set_widget_visibility',
      description: '대시보드 위젯을 표시하거나 숨깁니다. 사용자가 "숨겨"라고 하면 visible=false, "보여줘"라고 하면 visible=true로 설정합니다.',
      parameters: {
        type: 'object',
        properties: {
          widget: {
            type: 'string',
            enum: ['weather', 'stocks', 'news', 'calendar', 'budget'],
            description: '대상 위젯',
          },
          visible: {
            type: 'boolean',
            description: 'true면 표시, false면 숨김',
          },
        },
        required: ['widget', 'visible'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_todo',
      description: '할일 목록에 새 항목을 추가합니다. 사용자가 특정 날짜를 언급하면 due_date에 ISO 날짜(YYYY-MM-DD) 형식으로 넣으세요.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: '할일 제목' },
          due_date: {
            type: 'string',
            description: 'YYYY-MM-DD 형식의 마감일. 사용자가 날짜를 언급한 경우에만 포함. (예: "15일에" → 이번 달 15일)',
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: '우선순위 (기본값: medium)',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_transaction',
      description: '가계부에 수입 또는 지출을 추가합니다. 4개 필드(amount, type, category, description)를 모두 반드시 채워야 합니다.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: '금액 (숫자만, 원 단위). 예: 400000' },
          type: { type: 'string', enum: ['income', 'expense'], description: '수입은 "income", 지출은 "expense"' },
          category: {
            type: 'string',
            description: '카테고리. 지출은 보통 "식비"|"교통"|"쇼핑"|"문화/여가"|"통신"|"기타", 수입은 "용돈"|"급여"|"기타". 사용자 발화에서 유추해 채우고, 모르면 "기타"로 설정.',
          },
          description: {
            type: 'string',
            description: '한 줄 설명. 사용자 발화에서 핵심 단어를 따와 작성. 예: "용돈", "점심 김밥", "넷플릭스 구독". 비워두면 안 됨.',
          },
        },
        required: ['amount', 'type', 'category', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'change_weather_city',
      description: '날씨 위젯의 도시를 변경합니다',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '영문 도시명 (예: Seoul, Tokyo, London)' },
        },
        required: ['city'],
      },
    },
  },
]
