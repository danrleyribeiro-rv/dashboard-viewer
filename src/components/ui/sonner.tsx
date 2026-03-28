import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-right"
      duration={2000}
      toastOptions={{
        style: {
          background: "var(--popover, #fff)",
          color: "var(--popover-foreground, #000)",
          border: "1px solid var(--border, #e5e7eb)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
