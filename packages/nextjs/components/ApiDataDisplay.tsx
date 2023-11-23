export const ApiDataDisplay: React.FC<{ apiData: any }> = ({ apiData }) => (
  <div className="mockup-code">
    <pre>
      <code>{JSON.stringify(apiData, null, 2)}</code>
    </pre>
  </div>
);
