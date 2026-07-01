import { useRef, useState, useEffect } from "react"
import { Pen, Type, Upload, RotateCcw, Check } from "lucide-react"
import type { InvoiceSignature } from "@/types"

interface SignaturePadProps {
  label: string
  value?: InvoiceSignature
  onChange: (sig: InvoiceSignature) => void
}

type Mode = "draw" | "type" | "upload"

export function SignaturePad({ label, value, onChange }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mode, setMode] = useState<Mode>("draw")
  const [isDrawing, setIsDrawing] = useState(false)
  const [typedName, setTypedName] = useState("")
  const [hasSig, setHasSig] = useState(false)

  useEffect(() => {
    if (value?.data) setHasSig(true)
  }, [value])

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    const x = ("touches" in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ("touches" in e ? e.touches[0].clientY : e.clientY) - rect.top
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.strokeStyle = "#ffffff"
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasSig(true)
  }

  const endDraw = () => {
    setIsDrawing(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const data = canvas.toDataURL("image/png")
    onChange({ type: "draw", data, name: label, signed_at: new Date().toISOString() })
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSig(false)
  }

  const applyTyped = () => {
    const canvas = document.createElement("canvas")
    canvas.width = 400; canvas.height = 100
    const ctx = canvas.getContext("2d")!
    ctx.fillStyle = "transparent"
    ctx.clearRect(0, 0, 400, 100)
    ctx.font = "italic 42px Georgia, serif"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(typedName, 10, 70)
    const data = canvas.toDataURL("image/png")
    onChange({ type: "type", data, name: typedName, signed_at: new Date().toISOString() })
    setHasSig(true)
  }

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const data = ev.target?.result as string
      onChange({ type: "upload", data, name: label, signed_at: new Date().toISOString() })
      setHasSig(true)
    }
    reader.readAsDataURL(file)
  }

  const modes: { id: Mode; icon: typeof Pen; label: string }[] = [
    { id: "draw", icon: Pen, label: "Draw" },
    { id: "type", icon: Type, label: "Type" },
    { id: "upload", icon: Upload, label: "Upload" },
  ]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">{label}</p>
        {hasSig && (
          <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
            <Check className="w-3 h-3" /> Signed
          </span>
        )}
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] border border-white/[0.08] rounded-xl w-fit">
        {modes.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-semibold transition-all ${mode === m.id ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"}`}
          >
            <m.icon className="w-3 h-3" /> {m.label}
          </button>
        ))}
      </div>

      {mode === "draw" && (
        <div className="relative border border-white/[0.12] rounded-xl overflow-hidden bg-white/[0.02]">
          <canvas
            ref={canvasRef}
            width={400} height={120}
            className="w-full cursor-crosshair"
            onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
            onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
          />
          {!hasSig && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-xs text-zinc-600">Draw your signature here</p>
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex gap-1">
            <button type="button" onClick={clearCanvas} className="flex items-center gap-1 px-2 py-1 bg-white/[0.06] border border-white/10 rounded-lg text-xs text-zinc-400 hover:text-white">
              <RotateCcw className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>
      )}

      {mode === "type" && (
        <div className="space-y-2">
          <input
            type="text"
            value={typedName}
            onChange={e => setTypedName(e.target.value)}
            placeholder="Type your name..."
            className="w-full"
          />
          {typedName && (
            <div className="p-4 border border-white/[0.08] rounded-xl bg-white/[0.02] min-h-[60px] flex items-center">
              <span style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: "28px", color: "#fff" }}>
                {typedName}
              </span>
            </div>
          )}
          <button type="button" onClick={applyTyped} disabled={!typedName} className="btn-primary h-9 px-4 text-sm">
            Apply Signature
          </button>
        </div>
      )}

      {mode === "upload" && (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 rounded-xl p-6 cursor-pointer hover:border-white/20 transition-colors">
          <Upload className="w-6 h-6 text-zinc-500 mb-2" />
          <p className="text-xs text-zinc-400">Click to upload signature image</p>
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      )}

      {value?.data && hasSig && (
        <div className="p-2 border border-green-500/20 rounded-xl bg-green-500/[0.03]">
          <img src={value.data} alt="Signature preview" className="h-12 object-contain" />
          <p className="text-xs text-zinc-500 mt-1">
            Signed: {new Date(value.signed_at).toLocaleString("en-IN")}
          </p>
        </div>
      )}
    </div>
  )
}
