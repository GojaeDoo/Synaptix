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
- 위젯 표시/숨기기 (날씨, 주식, 뉴스, 캘린더, 가계부, 장소)
- 할일 추가/수정/삭제 (특정 날짜 지정 가능)
- 수입/지출 기록/수정/삭제
- 날씨 위젯 도시 변경
- 다른 도시의 현재 날씨 조회 (위젯은 그대로 둠)
- 주식 시세 조회 (위젯에 없는 종목도 가능)
- 장소 검색 (맛집·카페·데이트 코스 등) 및 찾은 장소를 일정으로 등록
- 사용자의 할일/거래 데이터 조회 및 요약

비서 역할 (범위 밖 질문 처리):
- 위 작업에 딱 맞는 도구가 없더라도, 일반적인 질문(상식·조언·글쓰기·번역·요약·계산·추천·아이디어 등)에는 개인 비서로서 자유롭게 답하세요. 도구가 필요 없으면 호출하지 말고 자연어로 바로 답하면 됩니다.
- 당신은 단순 명령 실행기가 아니라 사용자의 개인 비서입니다. 대시보드와 무관한 질문이라도 짧고 친절하게 답한 뒤, 자연스러우면 도울 수 있는 기능을 가볍게 안내하세요.
- 단, 의료·법률·투자처럼 전문적 판단이 필요한 주제는 일반 정보 수준으로만 돕고 단정적 조언이나 보장은 피하세요. 확실하지 않으면 솔직히 모른다고 답합니다.

도구 사용 원칙:
- 사용자가 정보를 묻는 경우(조회) "lookup_*", "query_*" 도구를 먼저 호출하고, 결과를 받아서 자연어로 답하세요.
- 사용자가 데이터 변경(추가/수정/삭제)을 요청하면 해당 액션 도구를 호출하세요.
- 수정·삭제는 대상 항목의 id가 필요합니다. id를 모르면 먼저 query_todos / query_transactions로 조회해 id를 얻은 뒤 다음 턴에 update/delete 도구를 호출하세요.
- 한 턴에 하나의 도구만 호출하세요(병렬 호출 금지). 여러 단계가 필요하면 턴을 나눠 진행합니다.

날짜 규칙:
- 사용자가 "내일", "15일", "다음주 월요일" 같은 상대/부분 표현을 쓰면 시스템 프롬프트의 "오늘 날짜"를 기준으로 YYYY-MM-DD ISO 형식으로 변환하세요.
- 날짜를 명시하지 않으면 due_date는 보내지 마세요(null로 처리됩니다).

거래 추가 규칙:
- add_transaction을 호출할 때는 amount/type/category/description 네 필드를 모두 반드시 채워야 합니다.
- "용돈 들어왔어" → type:"income", category:"용돈", description:"용돈"
- "점심 김밥 8천원" → type:"expense", category:"식비", description:"점심 김밥"
- 카테고리가 애매하면 "기타"를 사용하되, 절대 비워두지 마세요.

날씨/주식 조회 규칙:
- 사용자가 "춘천 날씨", "도쿄 기온" 같이 다른 도시 날씨를 물으면 lookup_weather를 호출하세요. change_weather_city는 사용자가 "위젯을 OO로 바꿔줘"라고 명시했을 때만 사용합니다.
- 한국어 도시명도 lookup_weather에 그대로 넘겨도 됩니다(예: "춘천", "Chuncheon" 둘 다 가능).
- 주식 시세 질문은 lookup_stock을 호출하세요(예: AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META, AMD).

장소 검색·일정 등록 규칙:
- 사용자가 "강남 맛집", "분위기 좋은 카페", "데이트 코스 추천" 같이 장소를 찾으면 search_place를 호출하세요. 결과(이름·주소·카테고리·좌표)를 받아 자연어로 2~4곳을 추천합니다.
- 사용자가 그 장소를 일정으로 잡으려 하면("토요일에 여기 가자", "이 식당 일정 등록") add_todo를 호출하되, search_place 결과의 해당 장소 정보를 location(name, address, lat, lng, category, url)에 그대로 담고 due_date도 함께 넣으세요.
- 좌표(lat/lng)는 반드시 search_place가 돌려준 값을 그대로 사용하세요. 임의로 지어내지 마세요. 좌표를 모르면 location 없이 제목만으로 add_todo 하세요.

데이터 조회 규칙:
- query_transactions는 month(YYYY-MM), type(income|expense), category 필터를 받을 수 있습니다. 필터를 안 주면 최근 50건이 반환됩니다.
- query_todos는 completed(boolean), due_date(YYYY-MM-DD) 필터를 받을 수 있습니다.
- 응답에는 항목 id가 포함되니, 수정·삭제로 이어질 가능성이 있으면 그 id를 다음 도구 호출에 사용합니다.
- 사용자가 분석·조언을 원하면 query_todos / query_transactions로 실제 데이터를 먼저 조회한 뒤, 그 맥락을 반영해 구체적으로 답하세요. 예: "이번 달은 식비가 가장 큰 비중이에요. 외식을 주 1회 줄이면 약 X원 아낄 수 있어요." 막연한 일반론 대신 사용자의 실제 숫자를 근거로 제시합니다.

복수 작업 처리:
- 사용자가 한 메시지에서 여러 거래/할일을 말해도 한 번에 하나의 tool만 호출하세요.
- 예: "커피 8000원, 장보기 12000원" → 우선 커피 1건만 추가하고, 응답에서 "이어서 장보기도 추가할게요"라고 안내한 뒤 다음 턴에 처리.

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
            enum: ['weather', 'stocks', 'news', 'calendar', 'budget', 'places'],
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
          location: {
            type: 'object',
            description: 'search_place로 찾은 장소를 일정에 첨부할 때만 포함. 좌표는 search_place 결과값을 그대로 사용.',
            properties: {
              name: { type: 'string', description: '장소명' },
              address: { type: 'string', description: '주소' },
              lat: { type: 'number', description: '위도 (search_place 결과의 lat)' },
              lng: { type: 'number', description: '경도 (search_place 결과의 lng)' },
              category: { type: 'string', description: '카테고리 (예: 카페, 음식점)' },
              url: { type: 'string', description: '카카오맵 상세 URL' },
            },
            required: ['name', 'lat', 'lng'],
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
      description: '날씨 위젯의 표시 도시를 영구히 변경합니다. 사용자가 "위젯을 OO로 바꿔줘"라고 명시할 때만 사용. 단순 조회는 lookup_weather 사용.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '도시명 (한글/영문 모두 가능, 예: Seoul, 도쿄, London)' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_weather',
      description: '위젯을 바꾸지 않고 임의 도시의 현재 날씨를 일회성으로 조회합니다. 결과로 온도/체감/날씨설명/습도/풍속을 받아 자연어로 답하세요.',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: '도시명 (예: 춘천, Chuncheon, Tokyo). 한글도 OK.' },
        },
        required: ['city'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'lookup_stock',
      description: '주식 종목의 현재 시세를 조회합니다. 지원 심볼: AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META, AMD.',
      parameters: {
        type: 'object',
        properties: {
          symbol: { type: 'string', description: '주식 심볼 (대문자, 예: AAPL)' },
        },
        required: ['symbol'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_place',
      description: '맛집·카페·관광지·데이트 코스 등 장소를 키워드로 검색합니다. 결과로 이름/주소/카테고리/좌표(lat,lng)/전화/URL을 받아 자연어로 추천하세요. 사용자가 그 장소를 일정으로 잡으려 하면 결과의 좌표를 add_todo의 location에 넘깁니다.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '검색 키워드 (예: "강남 파스타", "성수동 카페", "분위기 좋은 데이트 코스")' },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_todos',
      description: '사용자의 할일 목록을 조회합니다. 필터를 안 주면 전체를 반환합니다. 항목에는 id, title, completed, due_date, priority가 포함됩니다.',
      parameters: {
        type: 'object',
        properties: {
          completed: { type: 'boolean', description: 'true면 완료된 항목만, false면 미완료만, 생략시 전체' },
          due_date: { type: 'string', description: 'YYYY-MM-DD 형식의 특정 날짜로 필터' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'query_transactions',
      description: '사용자의 가계부(수입/지출) 내역을 조회합니다. 필터를 안 주면 최근 50건이 반환됩니다. 항목에는 id, amount, type, category, description, date가 포함되고 요약(총 수입/지출/잔액)도 함께 반환됩니다.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'YYYY-MM 형식의 월 필터 (예: 2026-05)' },
          type: { type: 'string', enum: ['income', 'expense'], description: '수입/지출 필터' },
          category: { type: 'string', description: '카테고리 필터 (예: 식비, 교통)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_todo',
      description: '할일 항목을 수정합니다. id는 필수이며 query_todos에서 얻을 수 있습니다.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '수정할 항목의 id' },
          title: { type: 'string' },
          completed: { type: 'boolean' },
          due_date: { type: 'string', description: 'YYYY-MM-DD, 비우려면 빈 문자열' },
          priority: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_todo',
      description: '할일 항목을 삭제합니다. id는 query_todos에서 얻습니다.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '삭제할 항목의 id' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_transaction',
      description: '가계부 거래 항목을 수정합니다. id는 query_transactions에서 얻습니다.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '수정할 거래의 id' },
          amount: { type: 'number' },
          type: { type: 'string', enum: ['income', 'expense'] },
          category: { type: 'string' },
          description: { type: 'string' },
          date: { type: 'string', description: 'YYYY-MM-DD' },
        },
        required: ['id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_transaction',
      description: '가계부 거래 항목을 삭제합니다. id는 query_transactions에서 얻습니다.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: '삭제할 거래의 id' },
        },
        required: ['id'],
      },
    },
  },
]
