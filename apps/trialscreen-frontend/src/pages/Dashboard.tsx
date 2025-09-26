import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../utils/trpc'; // Corrected path assumed
import { Plus, X, Clipboard, ArrowRight } from 'lucide-react';

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
      // Clear form state upon success
      setTitle('');
      setDescription('');
      setInclusionCriteria('');
      setExclusionCriteria('');
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
    // Dark modal backdrop
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50 transition-opacity duration-300">
      <div className="relative bg-gray-800 rounded-xl shadow-2xl p-8 w-full max-w-2xl border border-indigo-700">
        <div className="flex justify-between items-center pb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Clipboard className="w-6 h-6 mr-3 text-indigo-400" />
            Create New Clinical Trial
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="space-y-4">
            {/* Input fields now use the dark theme styling */}
            
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300">Trial Title</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                required
              ></textarea>
            </div>
            
            {/* Criteria Textareas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="inclusion" className="block text-sm font-medium text-gray-300">Inclusion Criteria (one per line)</label>
                    <textarea
                      id="inclusion"
                      value={inclusionCriteria}
                      onChange={(e) => setInclusionCriteria(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                    ></textarea>
                </div>
                <div>
                    <label htmlFor="exclusion" className="block text-sm font-medium text-gray-300">Exclusion Criteria (one per line)</label>
                    <textarea
                      id="exclusion"
                      value={exclusionCriteria}
                      onChange={(e) => setExclusionCriteria(e.target.value)}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                    ></textarea>
                </div>
            </div>
            
            <div className="flex justify-end gap-x-4 pt-4">
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-sm font-medium text-gray-300 rounded-lg border border-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150"
              >
                Cancel
              </button>
              {/* Primary Create Button (Clinical Green) */}
              <button
                type="submit"
                disabled={createTrialMutation.isPending}
                className="px-6 py-2 text-sm font-bold text-gray-900 bg-green-400 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition duration-150"
              >
                {createTrialMutation.isPending ? 'Creating...' : 'Create Trial'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Assuming trpc.trialRouter.findAll provides the correct trial data structure
  const { data: trials, isLoading, isError, refetch } = trpc.trialRouter.findAll.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-xl text-indigo-400">Loading clinical trials...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-xl text-red-500">
          An error occurred while fetching trials. Please check your connection.
        </div>
      </div>
    );
  }

  const handleCreateSuccess = () => {
    refetch(); // Refetch trials after a successful creation
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-6rem)]">
      <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
        <h1 className="text-4xl font-extrabold text-white">Your Clinical Trials</h1>
        
        {/* Create New Trial Button (Clinical Green) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2 text-md font-bold text-gray-900 bg-green-400 rounded-lg hover:bg-green-500 transition duration-150 flex items-center shadow-lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create New Trial
        </button>
      </div>

      {(!trials || trials.length === 0) ? (
        <div className="p-12 bg-gray-800 rounded-xl border border-indigo-700 text-center space-y-4">
          <Clipboard className="w-12 h-12 mx-auto text-indigo-400" />
          <div className="text-xl text-gray-300">
            No trials found. Click 'Create New Trial' to get started.
          </div>
        </div>
      ) : (
        // Styled Table
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-3">
                  <span className="sr-only">View</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {trials.map((trial) => (
                <tr key={trial.id} className="hover:bg-gray-700 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-400">
                    <Link to={`/trials/${trial.id}`} className="hover:underline">
                      {trial.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 truncate max-w-xs">
                    {trial.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {new Date(trial.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link to={`/trials/${trial.id}`} className="text-indigo-400 hover:text-indigo-300">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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