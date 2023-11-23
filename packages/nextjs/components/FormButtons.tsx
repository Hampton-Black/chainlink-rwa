export const FormButtons: React.FC<{ previousPage: () => void }> = ({ previousPage }) => (
  <div className="flex justify-between pt-4">
    <button type="button" onClick={previousPage} className="btn btn-sm btn-outline">
      Previous
    </button>
    <button type="submit" className="btn btn-sm btn-outline">
      Next
    </button>
  </div>
);
