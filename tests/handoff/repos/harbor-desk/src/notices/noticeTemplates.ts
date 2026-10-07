export const templates = {
  sailing_cancelled: {
    subject: 'Your sailing has been cancelled',
    body: 'Your sailing {{route}} at {{departsAt}} has been cancelled. An agent will contact you about a new sailing.',
  },
  booking_moved: {
    subject: 'Your booking has been moved',
    body: 'Your booking {{reference}} is now on the sailing at {{departsAt}}.',
  },
} as const
export type TemplateName = keyof typeof templates
