type LogoBoxProps = {
  src?: string | null;
  label: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeClasses = {
  sm: {
    box: "h-10 w-10",
    image: "max-h-8 max-w-8",
    text: "text-xs"
  },
  md: {
    box: "h-12 w-12",
    image: "max-h-10 max-w-10",
    text: "text-sm"
  },
  lg: {
    box: "h-16 w-16",
    image: "max-h-12 max-w-12",
    text: "text-lg"
  },
  xl: {
    box: "h-36 w-36 sm:h-44 sm:w-44",
    image: "max-h-28 max-w-28 sm:max-h-36 sm:max-w-36",
    text: "text-3xl sm:text-4xl"
  }
};

export function LogoBox({ src, label, alt = "", size = "md" }: LogoBoxProps) {
  const classes = sizeClasses[size];

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 ${classes.box}`}
    >
      {src ? (
        <img src={src} alt={alt} className={`object-contain ${classes.image}`} />
      ) : (
        <span className={`font-bold uppercase text-slate-400 ${classes.text}`}>
          {label.trim().slice(0, 2) || "--"}
        </span>
      )}
    </div>
  );
}
