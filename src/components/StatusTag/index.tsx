interface StatusTagProps {
  status: number | boolean;
  className?: string;
}

export default ({ status, className }: StatusTagProps) => {
  const enabled = Boolean(status);

  return (
    <div className={`flex items-center justify-center ${className || ''}`}>
      {enabled ? (
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-green-50 hover:bg-green-100 transition-colors relative">
          <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <span className="absolute w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75" />
        </div>
      ) : (
        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-red-50 hover:bg-red-100 transition-colors relative">
          <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          <span className="absolute w-2.5 h-2.5 bg-red-500 rounded-full animate-ping opacity-75" />
        </div>
      )}
    </div>
  );
};
