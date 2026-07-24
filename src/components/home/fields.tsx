"use client"

import dynamic from "next/dynamic"
import { useState } from "react"

import { timeOptions } from "@/lib/constants/time"
import { MAX_INVITE_EMAILS } from "@/lib/schemas/create-meeting"
import { TimezoneSelect } from "@/components/timezone-select"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { CreateMeetingForm } from "@/components/home/use-create-meeting-form"

const Calendar = dynamic(
  () => import("@/components/ui/calendar").then((mod) => mod.Calendar),
  { ssr: false }
)

export function EventNameField({ form }: { form: CreateMeetingForm }) {
  return (
    <form.Field name="eventName">
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>Event Name</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              type="text"
              placeholder="Meeting"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
              aria-invalid={isInvalid}
              autoComplete="off"
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}

export function DescriptionField({ form }: { form: CreateMeetingForm }) {
  return (
    <form.Field name="description">
      {(field) => (
        <Field>
          <FieldLabel htmlFor={field.name}>Description</FieldLabel>
          <Textarea
            id={field.name}
            name={field.name}
            value={field.state.value}
            onBlur={field.handleBlur}
            onChange={(event) => field.handleChange(event.target.value)}
            rows={4}
            placeholder="Add notes, agenda, or context"
          />
          <FieldDescription className="text-xs text-slate-400">
            Optional details for guests.
          </FieldDescription>
        </Field>
      )}
    </form.Field>
  )
}

export function TimeRangeField({ form }: { form: CreateMeetingForm }) {
  return (
    <Field>
      <FieldLabel htmlFor="show-times-from">
        Show Times
      </FieldLabel>
      <div className="flex flex-col gap-2 md:flex-row md:gap-4">
        <form.Field name="fromTime">
          {(field) => (
            <Select
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
            >
              <SelectTrigger className="w-[180px]" id="show-times-from">
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </form.Field>
        <form.Field name="toTime">
          {(field) => (
            <Select
              name={field.name}
              value={field.state.value}
              onValueChange={field.handleChange}
            >
              <SelectTrigger className="w-[180px]" id="show-times-to">
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </form.Field>
      </div>
    </Field>
  )
}

export function TimezoneField({ form }: { form: CreateMeetingForm }) {
  return (
    <form.Field name="timezone">
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>Timezone</FieldLabel>
            <TimezoneSelect
              id={field.name}
              className="w-full md:w-[320px]"
              value={field.state.value}
              onValueChange={field.handleChange}
            />
            <FieldDescription className="text-xs text-slate-400">
              Select the timezone in which you&apos;ve entered the &apos;Show
              Time&apos; in.
            </FieldDescription>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}

export function AvailableDatesField({ form }: { form: CreateMeetingForm }) {
  return (
    <form.Field name="availableDates">
      {(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel className="text-sm text-slate-500">
              Available Dates
            </FieldLabel>
            <FieldDescription className="text-xs text-slate-400">
              Select one or more dates when this time range should be available.
            </FieldDescription>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <Calendar
                mode="multiple"
                selected={field.state.value}
                onSelect={(dates) => {
                  field.handleChange(dates ?? [])
                  field.handleBlur()
                }}
                className="mx-auto w-3/4 md:w-full"
              />
            </div>
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}

export function InviteEmailsField({ form }: { form: CreateMeetingForm }) {
  const [draft, setDraft] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)

  return (
    <form.Field name="inviteEmails">
      {(field) => {
        const emails = field.state.value
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid

        const addEmail = () => {
          const value = draft.trim().toLowerCase()
          if (!value) return

          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailPattern.test(value)) {
            setLocalError("Enter a valid email.")
            return
          }
          if (emails.includes(value)) {
            setLocalError("That email is already added.")
            return
          }
          if (emails.length >= MAX_INVITE_EMAILS) {
            setLocalError(`You can invite up to ${MAX_INVITE_EMAILS} people.`)
            return
          }

          field.handleChange([...emails, value])
          setDraft("")
          setLocalError(null)
        }

        const removeEmail = (email: string) => {
          field.handleChange(emails.filter((e) => e !== email))
        }

        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor="invite-emails">
              Invite people (optional)
            </FieldLabel>
            <FieldDescription className="text-xs text-slate-400">
              Add up to {MAX_INVITE_EMAILS} email addresses. Each person gets
              a personal link to add their availability once the event is
              created.
            </FieldDescription>

            {emails.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-1">
                {emails.map((email) => (
                  <li
                    key={email}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(email)}
                      aria-label={`Remove ${email}`}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2 mt-1">
              <Input
                id="invite-emails"
                type="email"
                placeholder="name@example.com"
                value={draft}
                onChange={(event) => {
                  setDraft(event.target.value)
                  setLocalError(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault()
                    addEmail()
                  }
                }}
                onBlur={() => {
                  field.handleBlur()
                  if (draft.trim()) addEmail()
                }}
                disabled={emails.length >= MAX_INVITE_EMAILS}
                autoComplete="off"
              />
            </div>

            {localError && (
              <p className="text-xs text-destructive">{localError}</p>
            )}
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        )
      }}
    </form.Field>
  )
}