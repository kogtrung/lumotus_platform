export default function DeckGridSkeleton() {
  return (
    <div className="rounded-2xl border border-[#3D3348] bg-[#252030]/80 backdrop-blur-sm p-4">
      <div className="mb-3 h-28 rounded-lg bg-[#2D2538] animate-pulse" />
      <div className="h-4 w-2/3 rounded bg-[#2D2538] animate-pulse mb-2" />
      <div className="h-3 w-full rounded bg-[#2D2538] animate-pulse" />
    </div>
  )
}
