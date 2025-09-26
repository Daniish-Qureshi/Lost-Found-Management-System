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
          <div className="flex gap-4">
            <Link className="text-sm text-muted-foreground hover:text-primary" href="/contact">
              Contact
            </Link>
            
            <a
              className="text-sm text-muted-foreground hover:text-primary"
              href="mailto:danishwork29@gmail.com"
              aria-label="Email danishwork29@gmail.com"
            >
              Email
            </a>
            <Link
              className="text-sm text-muted-foreground hover:text-primary"
              href="https://github.com/Daniish-Qureshi"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </Link>
            <Link
              className="text-sm text-muted-foreground hover:text-primary"
              href="https://www.linkedin.com/in/danishqureshi786/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Linkedin
            </Link>
            <Link
              className="text-sm text-muted-foreground hover:text-primary"
              href="https://www.instagram.com/daniish_qureshi/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Lost&Found. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
