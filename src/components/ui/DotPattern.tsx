// 위젯 카드 내부 도트 그리드 오버레이.
// 카드 루트 div 안 첫 번째 자식으로 배치하면 된다.
// absolute inset-0 이므로 부모가 relative + overflow-hidden 이어야 함.
export function DotPattern({ opacity = 0.045 }: { opacity?: number }) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 pointer-events-none rounded-[inherit]"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,1) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
        opacity,
      }}
    />
  )
}
