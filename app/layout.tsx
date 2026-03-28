export const metadata = {
  title: "StyleAttack",
  description: "Style-based adversarial testing platform for LLM safety evaluation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
