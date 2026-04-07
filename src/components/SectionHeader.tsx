export function SectionHeader(props: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {props.eyebrow ? (
        <div className="text-xs font-semibold tracking-[0.18em] uppercase text-[color:var(--muted)]">
          {props.eyebrow}
        </div>
      ) : null}
      <h2 className="text-[28px] font-semibold tracking-tight">
        {props.title}
      </h2>
      {props.description ? (
        <p className="max-w-2xl text-[15px] leading-7 text-[color:var(--muted)]">
          {props.description}
        </p>
      ) : null}
    </div>
  );
}

