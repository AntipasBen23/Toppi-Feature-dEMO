import React from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={[
        "rounded-xl2 border border-border bg-panel shadow-panel",
        "backdrop-blur-[2px]",
        className,
      ].join(" ")}
    >
      {children}
    </section>
  );
}
