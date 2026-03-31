import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Write",
  description: "Create and edit slide decks.",
};

export default function WriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
