"use client"

import {
  AvailableDatesField,
  DescriptionField,
  EventNameField,
  InviteEmailsField,
  TimeRangeField,
  TimezoneField,
} from "@/components/home/fields"
import { SubmitButton } from "@/components/home/submit-button"
import { useCreateMeetingForm } from "@/components/home/use-create-meeting-form"

export default function Home() {
  const { form, submitError } = useCreateMeetingForm()

  return (
    <main className="w-full max-w-4xl mx-auto py-10 px-4">
      <h1 className="mb-8 text-center font-mono text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
        Find the perfect time for your meeting
      </h1>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          form.handleSubmit()
        }}
      >
        <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-mono flex flex-col gap-6 md:flex-row md:gap-12">
          <div className="space-y-4 md:flex-3">
            <EventNameField form={form} />
            <DescriptionField form={form} />
            <TimeRangeField form={form} />
            <TimezoneField form={form} />
            <InviteEmailsField form={form} />
            <SubmitButton form={form} submitError={submitError} />
          </div>

          <div className="md:flex-2">
            <AvailableDatesField form={form} />
          </div>
        </div>
      </form>
    </main>
  )
}