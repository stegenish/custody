export function AppToolbar({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
      {children}
    </div>
  );
}

export function AppToolbarButton({
  children,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

export function AppToolbarSubmitButton({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <button
      type="submit"
      className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}
