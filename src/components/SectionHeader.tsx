export function SectionHeader(props: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="contentGrid flex flex-col gap-4">
      {props.eyebrow ? (
        <div className="sectionEyebrow">
          {props.eyebrow}
        </div>
      ) : null}
      <h2 className="max-w-3xl text-[30px] font-semibold tracking-tight sm:text-[36px]">
        {props.title}
      </h2>
      {props.description ? (
        <p className="max-w-2xl text-[15px] leading-8 text-[color:var(--muted)] sm:text-[16px]">
          {props.description}
        </p>
      ) : null}
    </div>
  );
}

