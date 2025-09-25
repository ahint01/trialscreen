import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import axios from 'axios';
import { EligibilityReport } from '../../../trialscreen-backend/src/eligibility/eligibility.service';

// Interface for the initial file upload response
interface EligibilityCheckResponse {
  jobId: string;
}

// Interface for the eligibility status check response
interface EligibilityStatusResponse {
  status: 'processing' | 'completed' | 'failed' | 'not_found';
  report?: EligibilityReport;
}

const TrialPage = () => {
  const { trialId } = useParams<{ trialId: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const [inclusionCriteria, setInclusionCriteria] = useState('');
  const [exclusionCriteria, setExclusionCriteria] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<
    'processing' | 'completed' | 'failed' | 'not_found' | null
  >(null);
  const [eligibilityReport, setEligibilityReport] = useState<
    EligibilityReport | undefined
  >(undefined);
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Use the trpc.trialRouter.findOne hook to fetch the trial data
  const {
    data: trial,
    isLoading,
    isError,
    refetch: refetchTrial,
  } = trpc.trialRouter.findOne.useQuery(
    { id: trialId! },
    {
      enabled: !!trialId,
    },
  );

  // This useEffect will run whenever the 'trial' data changes
  useEffect(() => {
    if (trial) {
      setInclusionCriteria(trial.inclusion_criteria.join('\n'));
      setExclusionCriteria(trial.exclusion_criteria.join('\n'));
    }
  }, [trial]);

  // Use the trpc.trialRouter.update hook to handle updates
  const updateTrialMutation = trpc.trialRouter.update.useMutation({
    onSuccess: () => {
      refetchTrial();
      setIsEditing(false);
      setMessage('Trial updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    },
    onError: (e) => {
      console.error('Update error:', e);
      setMessage('Failed to update trial.');
    },
  });

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateTrialMutation.mutate({
      id: trialId!,
      title: trial?.title,
      description: trial?.description,
      inclusion_criteria: inclusionCriteria.split('\n').filter(Boolean),
      exclusion_criteria: exclusionCriteria.split('\n').filter(Boolean),
    });
  };

  const handleFileChange = (file: File) => {
    setFile(file);
    setMessage(`File selected: ${file.name}`);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file || !trial) {
      setMessage('Please select a document and make sure trial data is loaded.');
      return;
    }

    setIsUploading(true);
    try {
      setMessage('Uploading document...');
      const fileBuffer = await file.arrayBuffer();
      const base64String = btoa(
        String.fromCharCode(...new Uint8Array(fileBuffer)),
      );

      const payload = {
        fileBuffer: base64String,
        fileName: file.name,
        inclusionCriteria: trial.inclusion_criteria,
        exclusionCriteria: trial.exclusion_criteria,
      };

      // Type the POST response to resolve the 'unknown' error
      const response = await axios.post<EligibilityCheckResponse>(
        'http://localhost:3000/eligibility/check',
        payload,
      );
      setJobId(response.data.jobId);
      setJobStatus('processing');
      setMessage('Document sent for analysis. Please wait for the report.');
    } catch (err) {
      console.error('Error uploading file:', err);
      setMessage('Failed to upload document or start analysis.');
    } finally {
      setIsUploading(false);
    }
  };

  // Poll for job status
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (jobId && jobStatus === 'processing') {
      intervalId = setInterval(async () => {
        try {
          // Explicitly type the GET response
          const response = await axios.get<EligibilityStatusResponse>(
            `http://localhost:3000/eligibility/status/${jobId}`,
          );
          const { status, report } = response.data;
          setJobStatus(status);
          if (status !== 'processing') {
            setEligibilityReport(report);
            clearInterval(intervalId);
            setMessage(`Analysis complete. Status: ${status}`);
          }
        } catch (err) {
          console.error('Error polling job status:', err);
          clearInterval(intervalId);
          setJobStatus('failed');
          setMessage('Failed to get analysis report.');
        }
      }, 3000); // Poll every 3 seconds
    }
    return () => clearInterval(intervalId);
  }, [jobId, jobStatus]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Loading trial details...</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">
          Error loading trial. Please ensure you are logged in.
        </div>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">Trial not found.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{trial.title}</h1>
        <span className="ml-4 text-sm text-gray-500">
          Created: {new Date(trial.created_at).toLocaleDateString()}
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Trial Details</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {isEditing ? 'Cancel Edit' : 'Edit Criteria'}
          </button>
        </div>
        <p className="text-gray-600 mb-4">{trial.description}</p>

        {isEditing ? (
          <form onSubmit={handleUpdate}>
            <div className="mb-4">
              <label
                htmlFor="inclusion-edit"
                className="block text-sm font-medium text-gray-700"
              >
                Inclusion Criteria (one per line)
              </label>
              <textarea
                id="inclusion-edit"
                value={inclusionCriteria}
                onChange={(e) => setInclusionCriteria(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="mb-4">
              <label
                htmlFor="exclusion-edit"
                className="block text-sm font-medium text-gray-700"
              >
                Exclusion Criteria (one per line)
              </label>
              <textarea
                id="exclusion-edit"
                value={exclusionCriteria}
                onChange={(e) => setExclusionCriteria(e.target.value)}
                rows={5}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={updateTrialMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                {updateTrialMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Inclusion Criteria
              </h3>
              <ul className="list-disc list-inside text-gray-600">
                {trial.inclusion_criteria.length > 0 ? (
                  trial.inclusion_criteria.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No inclusion criteria specified.</li>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Exclusion Criteria
              </h3>
              <ul className="list-disc list-inside text-gray-600">
                {trial.exclusion_criteria.length > 0 ? (
                  trial.exclusion_criteria.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))
                ) : (
                  <li>No exclusion criteria specified.</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">
          Document Analysis
        </h2>
        <div
          className={`flex items-center justify-center border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
            dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <p className="text-gray-500">
              Drag and drop a document here, or{' '}
              <label className="text-indigo-600 cursor-pointer">
                browse
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files) handleFileChange(e.target.files[0]);
                  }}
                  className="hidden"
                />
              </label>
            </p>
          </div>
        </div>

        {file && (
          <div className="flex items-center justify-between p-3 border rounded-md mb-4 bg-gray-50">
            <span className="text-sm text-gray-700 truncate">{file.name}</span>
            <button
              onClick={() => {
                setFile(null);
                setMessage('');
              }}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        )}

        <button
          onClick={handleFileUpload}
          disabled={!file || isUploading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isUploading ? 'Analyzing...' : 'Analyze Document'}
        </button>

        {message && (
          <p className="mt-4 text-center text-sm font-medium text-gray-600">
            {message}
          </p>
        )}

        {jobStatus === 'processing' && (
          <div className="mt-4 text-center text-sm text-indigo-600 animate-pulse">
            Analysis in progress...
          </div>
        )}

        {eligibilityReport && (
          <div className="mt-4 p-4 rounded-md border">
            <h3 className="font-semibold mb-2">Analysis Report</h3>
            <p
              className={`font-bold ${
                eligibilityReport.status === 'ELIGIBLE'
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}
            >
              Status: {eligibilityReport.status}
            </p>
            {eligibilityReport.details && (
              <ul className="list-disc list-inside text-gray-600 mt-2">
                {eligibilityReport.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrialPage;
