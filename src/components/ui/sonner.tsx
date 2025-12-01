"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-right"
      expand={true}
      richColors={false}
      closeButton={false}
      toastOptions={{
        className: "toast-enhanced",
        style: {
          background: "linear-gradient(0deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.03)), linear-gradient(246.02deg, rgba(19, 245, 132, 0) 91.9%, rgba(19, 245, 132, 0.2) 114.38%), linear-gradient(59.16deg, rgba(19, 245, 132, 0) 71.78%, rgba(19, 245, 132, 0.2) 124.92%)",
          backdropFilter: "blur(20px) saturate(1.2)",
          border: "1px solid rgba(19, 245, 132, 0.2)",
          borderRadius: "16px",
          color: "white",
          boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3), 0 0 20px rgba(19, 245, 132, 0.1)",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
