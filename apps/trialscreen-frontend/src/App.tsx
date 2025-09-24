import React, { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { QueryClient, QueryClientProvider, useMutation, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Define types for our data
interface JobStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  report?: EligibilityReport; // The final report, only present when status is 'completed'
}

interface EligibilityReport {
  status: 'ELIGIBLE' | 'INELIGIBLE' | 'ERROR';
  details?: string[];
}

interface ScreeningPayload {
  fileBuffer: string;
  fileName: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
}

// A new component that contains all the application logic
const ClinicalTrialScreener = () => {
  const [file, setFile] = useState<File | null>(null);
  const [inclusionCriteria, setInclusionCriteria] = useState<string[]>([]);
  const [exclusionCriteria, setExclusionCriteria] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const { mutate, isPending, isError: isMutationError, error: mutationError } = useMutation<
    { jobId: string }, // Assuming backend returns a jobId
    Error,
    ScreeningPayload
  >({
    mutationFn: async (payload: ScreeningPayload) => {
      const response = await fetch('http://localhost:3000/document-ingestion/eligibility-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Assuming the backend sends back a jobId in a structured response
      if (data && data.jobId) {
        setJobId(data.jobId);
      } else {
        // Handle case where backend doesn't provide a jobId immediately
        console.error('Backend did not return a jobId. Cannot poll for results.');
      }
    },
    onError: () => {
      setJobId(null);
    }
  });

  const { data: jobStatus, isFetching, isError: isQueryError, error: queryError } = useQuery<JobStatusResponse>({
    queryKey: ['jobStatus', jobId],
    queryFn: async () => {
      const response = await fetch(`http://localhost:3000/job-status/${jobId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    // The query will only run if we have a jobId
    enabled: !!jobId,
    // Poll every 3 seconds until the job is completed
    refetchInterval: (query) => {
      if (query.state.data?.status === 'completed' || query.state.data?.status === 'failed') {
        return false;
      }
      return 3000;
    },
  });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleCriteriaChange = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (event: ChangeEvent<HTMLTextAreaElement>) => {
    setter(event.target.value.split('\n').filter(line => line.trim() !== ''));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!file) {
      alert('Please select a file.');
      return;
    }
    // Reset state and start mutation
    setJobId(null);
    const fileReader = new FileReader();
    fileReader.readAsDataURL(file);
    fileReader.onloadend = () => {
      const base64String = fileReader.result?.toString().split(',')[1] || '';
      const payload: ScreeningPayload = {
        fileBuffer: base64String,
        fileName: file.name,
        inclusionCriteria,
        exclusionCriteria,
      };
      mutate(payload);
    };
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ELIGIBLE':
        return 'bg-green-100 text-green-800';
      case 'INELIGIBLE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine what to display based on the different states
  const showReport = jobStatus?.status === 'completed' && jobStatus?.report;
  // Corrected the type check for isPolling
  const isPolling = isFetching && !!jobId && jobStatus?.status !== 'completed';
  const hasError = isMutationError || isQueryError;
  const currentError = mutationError || queryError;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-4xl p-8 space-y-8 bg-white rounded-xl shadow-2xl transition-transform transform hover:scale-105 duration-300">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-900 leading-tight">
          Clinical Trial Screener
        </h1>
        <p className="text-center text-lg text-gray-600 mb-8">
          Upload a patient's PDF record and screen them against trial criteria.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:space-x-6 space-y-6 sm:space-y-0">
            <div className="flex-1">
              <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700">
                Patient PDF File
              </label>
              <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-8">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a2 2 0 00-2 2v20m30-10V10a2 2 0 00-2-2h-8m-4 10h.01M30 30H16a2 2 0 00-2 2v8m4-16h.01M28 20v8m-4-8v8m-4-8v8m4-8V20m-4 0v8m-4-8v8m4-8V20m-4 0v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PDF up to 10MB</p>
                </div>
              </div>
              {file && <p className="mt-2 text-sm text-gray-500 text-center">Selected: {file.name}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
              <label htmlFor="inclusion-criteria" className="block text-sm font-medium text-gray-700">
                Inclusion Criteria (one per line)
              </label>
              <div className="mt-1">
                <textarea
                  id="inclusion-criteria"
                  name="inclusion-criteria"
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                  value={inclusionCriteria.join('\n')}
                  onChange={handleCriteriaChange(setInclusionCriteria)}
                />
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
              <label htmlFor="exclusion-criteria" className="block text-sm font-medium text-gray-700">
                Exclusion Criteria (one per line)
              </label>
              <div className="mt-1">
                <textarea
                  id="exclusion-criteria"
                  name="exclusion-criteria"
                  rows={5}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3"
                  value={exclusionCriteria.join('\n')}
                  onChange={handleCriteriaChange(setExclusionCriteria)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className={`px-8 py-3 rounded-full text-white font-bold transition duration-300 transform ${
                isPending || isPolling ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 shadow-lg'
              }`}
              disabled={isPending || isPolling}
            >
              {isPending ? 'Uploading...' : isPolling ? 'Checking...' : 'Check Eligibility'}
            </button>
          </div>
        </form>

        {(isPending || isPolling || showReport || hasError) && (
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
              Eligibility Report
            </h2>
            {hasError && (
              <div className="text-center text-red-600 font-medium">
                <p>An error occurred: {currentError?.message || 'Unknown error'}</p>
                <p>Please check your backend server and try again.</p>
              </div>
            )}
            {isPending && (
              <div className="text-center text-indigo-600 font-medium">
                Processing patient record...
              </div>
            )}
            {isPolling && (
              <div className="text-center text-gray-600 font-medium">
                Polling for results...
              </div>
            )}
            {showReport && jobStatus?.report ? (
              <div className={`rounded-lg p-6 shadow-md transition-colors duration-300 ${getStatusClass(jobStatus.report.status)}`}>
                <p className="font-bold text-lg text-center mb-4">Status: {jobStatus.report.status}</p>
                <ul className="list-inside space-y-2">
                  {jobStatus.report.details && jobStatus.report.details.map((detail, index) => (
                    <li key={index} className="text-sm">
                      {detail.startsWith('✅') ? (
                        <span className="font-bold">✅ MATCH:</span>
                      ) : detail.startsWith('❌') ? (
                        <span className="font-bold">❌ EXCLUSION:</span>
                      ) : (
                        ''
                      )}
                      {detail.replace('✅ MATCH:', '').replace('❌ EXCLUSION:', '').trim()}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// Main App component that wraps the core logic with the QueryClientProvider
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ClinicalTrialScreener />
    </QueryClientProvider>
  );
};

export default App;