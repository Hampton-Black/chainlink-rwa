export const ApiDataDisplay: React.FC<{ apiData: any }> = ({ apiData }) => (
  <div className="flex container w-full overflow-auto h-96 json-view rounded-lg p-4">
    <pre>
      <code>{JSON.stringify(apiData, null, 2)}</code>
    </pre>
  </div>
);
