export default function SettingsStub({ title }: { title: string }) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-16 text-center">
      <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-500">Coming soon.</p>
    </div>
  );
}
