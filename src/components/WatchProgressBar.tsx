interface Props {
  position: number;
  duration: number;
}

export const WatchProgressBar = ({ position, duration }: Props) => {
  if (!duration || duration <= 0 || position <= 30) return null;
  const pct = Math.min((position / duration) * 100, 100);

  return (
    <div className="absolute bottom-0 inset-x-0 h-1 3xl:h-1.5 bg-muted/50 rounded-b-lg 3xl:rounded-b-xl overflow-hidden z-10">
      <div
        className="h-full bg-primary rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
};
