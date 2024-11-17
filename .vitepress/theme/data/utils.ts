export function formatDate(raw: string) {
    const date = new Date(raw)
    date.setUTCHours(12)
    return {
      time: +date,
      string: date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }