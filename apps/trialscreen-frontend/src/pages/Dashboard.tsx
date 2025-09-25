import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../utils/trpc';

// Define a TypeScript interface for the modal's props
interface CreateTrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Modal component for creating a new trial
const CreateTrialModal = ({ isOpen, onClose, onSuccess }: CreateTrialModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');

  const createTrialMutation = trpc.trialRouter.create.useMutation({
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createTrialMutation.mutate({
      title,
      description,
      inclusion_criteria: inclusionCriteria.split('\n').filter(Boolean),
      exclusion_criteria: exclusionCriteria.split('\n').filter(Boolean),
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create New Clinical Trial</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">Trial Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="inclusion" className="block text-sm font-medium text-gray-700">Inclusion Criteria (one per line)</label>
              <textarea
                id="inclusion"
                value={inclusionCriteria}
                onChange={(e) => setInclusionCriteria(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div>
              <label htmlFor="exclusion" className="block text-sm font-medium text-gray-700">Exclusion Criteria (one per line)</label>
              <textarea
                id="exclusion"
                value={exclusionCriteria}
                onChange={(e) => setExclusionCriteria(e.target.value)}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="flex justify-end gap-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: trials, isLoading, isError, refetch } = trpc.trialRouter.findAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading trials...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          An error occurred while fetching trials.
        </div>
      </div>
    );
  }

  const handleCreateSuccess = () => {
    refetch(); // Refetch trials after a successful creation
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Your Clinical Trials</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Trial
        </button>
      </div>

      {(!trials || trials.length === 0) ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-gray-600">No trials found. Create one to get started.</div>
        </div>
      ) : (
        <table className="min-w-full bg-white rounded-lg shadow-md overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {trials.map((trial) => (
              <tr key={trial.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  <Link to={`/trials/${trial.id}`}>
                    {trial.title}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {trial.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(trial.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <CreateTrialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

export default Dashboard;