export function ModulePlaceholder({ name }: { name: string }) {
  return (
    <div className="p-md sm:p-lg">
      <h1 className="text-headline-md">{name}</h1>
    </div>
  );
}
