import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold">Lost&Found🔎</p>
            <p className="text-sm text-muted-foreground">Helping students reunite with their belongings.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* <Link href="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link> */}
            <a href="mailto:danishwork29@gmail.com" aria-label="Email" className="text-muted-foreground hover:text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 8.5v7a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 8.5l8.5 5L20 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="https://github.com/Daniish-Qureshi" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.75 1.18 1.75 1.18 1.02 1.75 2.68 1.25 3.33.96.1-.75.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .96-.31 3.14 1.18a10.88 10.88 0 012.86-.38c.97 0 1.95.13 2.86.38 2.18-1.49 3.14-1.18 3.14-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.4-5.25 5.68.41.35.78 1.04.78 2.1 0 1.52-.01 2.75-.01 3.12 0 .31.21.67.8.56A10.52 10.52 0 0023.5 12C23.5 5.73 18.27.5 12 .5z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/danishqureshi786/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M4.98 3.5a2.5 2.5 0 11.02 0zM3 8.98h4v12H3zM8.98 8.98h3.8v1.64h.05c.53-.99 1.82-2.03 3.75-2.03 4.01 0 4.75 2.64 4.75 6.07v6.32h-4v-5.6c0-1.34-.03-3.06-1.86-3.06-1.86 0-2.15 1.45-2.15 2.95v5.71h-4V8.98z"/></svg>
            </a>
            <a href="https://www.instagram.com/daniish_qureshi/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted-foreground hover:text-primary">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 6.5A4.5 4.5 0 1016.5 13 4.5 4.5 0 0012 8.5zM18.5 6a1 1 0 11-1 1 1 1 0 011-1z"/></svg>
            </a>
            {/* <a href="https://leetcode.com/" target="_blank" rel="noopener noreferrer" aria-label="LeetCode" className="text-muted-foreground hover:text-primary">
              <span className="text-sm">LeetCode</span>
            </a> */}

            {/* <a href="https://www.hackerrank.com/" target="_blank" rel="noopener noreferrer" aria-label="HackerRank" className="text-muted-foreground hover:text-primary">
              <span className="text-sm">HackerRank</span>
            </a> */}
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lost&Found. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
