function createIcon(renderPaths) {
  return function Icon({ className = 'w-5 h-5', title, ...props }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden={title ? undefined : true}
        role={title ? 'img' : 'presentation'}
        {...props}
      >
        {title ? <title>{title}</title> : null}
        {renderPaths()}
      </svg>
    )
  }
}

export const IconMenu = createIcon(() => (
  <>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </>
))

export const IconX = createIcon(() => (
  <>
    <path d="M6 6l12 12" />
    <path d="M18 6L6 18" />
  </>
))

export const IconUser = createIcon(() => (
  <>
    <path d="M20 21a8 8 0 0 0-16 0" />
    <path d="M12 11a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
  </>
))

export const IconUsers = createIcon(() => (
  <>
    <path d="M17 21a6 6 0 0 0-12 0" />
    <path d="M11 11a3.5 3.5 0 1 0-3.5-3.5A3.5 3.5 0 0 0 11 11Z" />
    <path d="M20 21a5 5 0 0 0-6-4.9" />
    <path d="M16.5 11a3 3 0 1 0-2.4-4.8" />
  </>
))

export const IconBackpack = createIcon(() => (
  <>
    <path d="M8 7a4 4 0 0 1 8 0" />
    <path d="M7 21h10a2 2 0 0 0 2-2V11a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v8a2 2 0 0 0 2 2Z" />
    <path d="M9 13h6" />
    <path d="M9 17h6" />
  </>
))

export const IconChat = createIcon(() => (
  <>
    <path d="M21 12a8 8 0 0 1-8 8H7l-4 3V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
    <path d="M8 12h8" />
    <path d="M8 16h5" />
  </>
))

export const IconSword = createIcon(() => (
  <>
    <path d="M14 4l6 6" />
    <path d="M20 10l-7 7" />
    <path d="M9 21l4-4" />
    <path d="M7 17l-2 2" />
    <path d="M10 14l-4-4" />
    <path d="M6 10l4 4" />
  </>
))

export const IconBolt = createIcon(() => (
  <>
    <path d="M13 2L3 14h7l-1 8 12-14h-7l-1-6Z" />
  </>
))

export const IconGem = createIcon(() => (
  <>
    <path d="M7 3h10l4 6-9 12L3 9l4-6Z" />
    <path d="M3 9h18" />
    <path d="M7 3l5 18" />
    <path d="M17 3l-5 18" />
  </>
))

export const IconChart = createIcon(() => (
  <>
    <path d="M4 20V10" />
    <path d="M10 20V4" />
    <path d="M16 20v-8" />
    <path d="M22 20H2" />
  </>
))

export const IconTag = createIcon(() => (
  <>
    <path d="M20 13l-7 7-10-10V3h7l10 10Z" />
    <path d="M7.5 7.5h.01" />
  </>
))

export const IconMap = createIcon(() => (
  <>
    <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3Z" />
    <path d="M9 3v15" />
    <path d="M15 6v15" />
  </>
))
