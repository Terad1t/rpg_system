export default function LoadingScreen({ label = 'Carregando...' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#040815] px-6 text-white" role="status">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyan-300" />
        <p className="text-sm uppercase tracking-[0.35em] text-slate-300">{label}</p>
      </div>
    </div>
  )
}
