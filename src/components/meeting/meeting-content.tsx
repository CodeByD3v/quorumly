"use client"

import { useCallback, useMemo, useState } from "react"

import {
  AvailabilityGrid,
  type SelectedSlots,
} from "@/components/meeting/availability-grid"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Meeting = {
  id: string
  slug: string
  eventName: string
  description: string | null
  timezone: string
  showFromHour: number
  showToHour: number
}

type MeetingDate = {
  id: string
  date: string
}

type ResponseRow = {
  id: string
  name: string
  timeSlots: string[]
}

type InviteInfo = {
  token: string
  email: string
}

type MeetingContentProps = {
  meeting: Meeting
  dates: MeetingDate[]
  initialResponses: ResponseRow[]
  invite?: InviteInfo | null
}

export function MeetingContent({
  meeting,
  dates,
  initialResponses,
  invite,
}: MeetingContentProps) {
  const [isAdding, setIsAdding] = useState(Boolean(invite))
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlots>(new Set())
  const [name, setName] = useState("")
  const [responses, setResponses] = useState<ResponseRow[]>(initialResponses)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<"success" | "error" | null>(null)
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)

  const toggleSlot = useCallback((key: string) => {
    setSelectedSlots((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  const clearSlots = useCallback(() => {
    setSelectedSlots(new Set())
  }, [])

  const peopleBySlot = useMemo(() => {
    const map: Record<string, string[]> = {}
    for (const r of responses) {
      for (const slot of r.timeSlots) {
        if (!map[slot]) map[slot] = []
        map[slot].push(r.name)
      }
    }
    return map
  }, [responses])

  const handleSave = async () => {
    if (!name.trim() || selectedSlots.size === 0) return
    setSaving(true)
    setSaveMsg(null)

    try {
      const endpoint = invite
        ? `/api/meetings/${meeting.id}/responses/invitee`
        : `/api/meetings/${meeting.id}/responses`

      const body = invite
        ? {
            token: invite.token,
            name: name.trim(),
            timeSlots: Array.from(selectedSlots),
          }
        : {
            name: name.trim(),
            timeSlots: Array.from(selectedSlots),
          }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const result = await response.json()

      if (result.success) {
        setSaveMsg("success")
        setResponses((prev) => {
          const idx = prev.findIndex((r) => r.name === name.trim())
          const entry = {
            id: "",
            name: name.trim(),
            timeSlots: Array.from(selectedSlots),
          }
          if (idx >= 0) {
            const next = [...prev]
            next[idx] = entry
            return next
          }
          return [...prev, entry]
        })
        setSelectedSlots(new Set())
        setIsAdding(false)
      } else {
        setSaveMsg("error")
      }
    } catch {
      setSaveMsg("error")
    } finally {
      setSaving(false)
    }
  }

  const handleStartAdding = () => {
    setIsAdding(true)
    setSaveMsg(null)
  }

  return (
    <main className="w-full min-h-dvh flex items-center justify-center py-6 px-4">
      <div className="w-full max-w-5xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 font-mono -mt-2">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-800">
            {meeting.eventName}
          </h1>
          <div className="min-w-[280px] h-[52px] flex items-end justify-end">
            {!isAdding ? (
              <Button onClick={handleStartAdding} className="h-9">
                + Add Availability
              </Button>
            ) : (
              <div className="flex items-end gap-3 w-full max-w-[280px]">
                <div className="flex-1 min-w-0">
                  <label
                    htmlFor="name-input"
                    className="block text-xs font-medium text-slate-500 mb-1"
                  >
                    Your Name
                  </label>
                  <Input
                    id="name-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    autoComplete="off"
                    className="h-9"
                  />
                </div>
                <Button
                  disabled={!name.trim() || selectedSlots.size === 0 || saving}
                  onClick={handleSave}
                  className="h-9"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {invite && (
          <p className="text-xs text-slate-400 mb-4">
            You&apos;re responding to an invite sent to{" "}
            <span className="font-medium text-slate-600">{invite.email}</span>.
          </p>
        )}

        {saveMsg && (
          <p
            className={cn(
              "text-xs mb-4",
              saveMsg === "success" ? "text-green-600" : "text-red-500"
            )}
          >
            {saveMsg === "success"
              ? "Availability saved!"
              : "Failed to save. Try again."}
          </p>
        )}

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-[2] min-w-0">
            <AvailabilityGrid
              dates={dates}
              fromHour={meeting.showFromHour}
              toHour={meeting.showToHour}
              selectedSlots={selectedSlots}
              onToggle={toggleSlot}
              onClear={clearSlots}
              onHover={setHoveredKey}
              peopleBySlot={isAdding ? {} : peopleBySlot}
              readOnly={!isAdding}
            />
          </div>

          <div className="flex-[1] min-w-0">
            <h2 className="text-xs font-semibold text-slate-700 mb-3">
              People
            </h2>

            {responses.length === 0 ? (
              <p className="text-xs text-slate-400">
                No responses yet. Be the first!
              </p>
            ) : (
              <ul className="space-y-2">
                {responses.map((r) => {
                  const isHighlighted =
                    hoveredKey !== null &&
                    peopleBySlot[hoveredKey]?.includes(r.name)
                  return (
                    <li
                      key={`${r.name}-${r.id}`}
                      className={cn(
                        "text-sm transition-colors",
                        isHighlighted
                          ? "font-bold text-green-600"
                          : "text-slate-600"
                      )}
                    >
                      {r.name}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
      </div>
    </main>
  )
}