import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { trpc } from '../utils/trpc';
import axios from 'axios';
// Assuming the path to your EligibilityReport interface is correctly configured for the client side.
import { EligibilityReport } from '../../../trialscreen-backend/src/eligibility/eligibility.service'; 
import { Edit, Save, Trash2, FileText, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react';
import React from 'react';

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
  const navigate = useNavigate();
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
  
  // State for the confirmation dialog
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
      setTimeout(() => setMessage(''), 3000);
    },
  });

  // Hook for deleting the trial
  const deleteTrialMutation = trpc.trialRouter.deleteTrial.useMutation({
    onSuccess: () => {
      setMessage('Trial deleted successfully! Redirecting to dashboard...');
      // Redirect to the dashboard after a short delay
      setTimeout(() => navigate('/dashboard'), 1500);
    },
    onError: (e) => {
      console.error('Delete error:', e);
      setMessage(e.message || 'Failed to delete trial.');
      setShowDeleteConfirm(false); // Close confirmation on error
      setTimeout(() => setMessage(''), 3000);
    },
  });

  // Handler for confirmed deletion
  const handleDelete = () => {
    if (trialId) {
      // Initiate the mutation
      deleteTrialMutation.mutate({ id: trialId });
      // Note: We do NOT close the modal here. The onSuccess handler's navigate 
      // will unmount the entire page, effectively closing the modal.
    }
  };

  // This useEffect will run whenever the 'trial' data changes
  useEffect(() => {
    if (trial) {
      setInclusionCriteria(trial.inclusion_criteria.join('\n'));
      setExclusionCriteria(trial.exclusion_criteria.join('\n'));
    }
  }, [trial]);

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
    // Reset state when a new file is chosen
    setFile(file);
    setJobId(null);
    setJobStatus(null);
    setEligibilityReport(undefined);
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
      setMessage('Uploading document and starting analysis...');
      const fileBuffer = await file.arrayBuffer();
      const base64String = btoa(
        String.fromCharCode(...new Uint8Array(fileBuffer)),
      );

      const payload = {
        fileBuffer: base64String,
        fileName: file.name,
        // Send the currently active criteria (edited or fetched)
        inclusionCriteria: (isEditing ? inclusionCriteria : trial.inclusion_criteria.join('\n')).split('\n').filter(Boolean),
        exclusionCriteria: (isEditing ? exclusionCriteria : trial.exclusion_criteria.join('\n')).split('\n').filter(Boolean),
      };

      // Ensure your backend URL is correct
      const response = await axios.post<EligibilityCheckResponse>(
        'http://localhost:3000/eligibility/check',
        payload,
      );
      
      setJobId(response.data.jobId);
      setJobStatus('processing');
      setMessage('Document sent for analysis. Polling for report...');
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

  if (isLoading || deleteTrialMutation.isPending) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-xl text-indigo-400">
          {deleteTrialMutation.isPending ? 'Deleting Trial...' : 'Loading trial details...'}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-xl text-red-500">
          Error loading trial. Please ensure you are logged in.
        </div>
      </div>
    );
  }

  if (!trial) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <div className="text-xl text-gray-400">Trial not found.</div>
      </div>
    );
  }

  const reportStatusColor = eligibilityReport?.status === 'ELIGIBLE' ? 'bg-green-700 border-green-400' : 'bg-red-700 border-red-400';
  const reportStatusIcon = eligibilityReport?.status === 'ELIGIBLE' ? CheckCircle : XCircle;

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-[calc(100vh-6rem)] relative">
      
      {/* Trial Header */}
      <div className="mb-8 border-b border-gray-700 pb-4 flex justify-between items-center">
        <div>
            <h1 className="text-4xl font-extrabold text-white">{trial.title}</h1>
            <p className="mt-1 text-sm text-gray-400">
                Created: {new Date(trial.created_at).toLocaleDateString()}
            </p>
        </div>
        
        {/* DELETE BUTTON */}
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteTrialMutation.isPending || isEditing}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center bg-red-700 hover:bg-red-800 text-white disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Trial
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Trial Details & Criteria */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-indigo-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-indigo-400">Trial Criteria</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center ${
                    isEditing ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isEditing ? <XCircle className="w-4 h-4 mr-2" /> : <Edit className="w-4 h-4 mr-2" />}
                {isEditing ? 'Cancel Edit' : 'Edit Criteria'}
              </button>
            </div>
            
            <p className="text-gray-300 mb-6">{trial.description}</p>

            {isEditing ? (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inclusion Edit */}
                  <div>
                    <label htmlFor="inclusion-edit" className="block text-sm font-medium text-gray-300">
                      Inclusion Criteria (one per line)
                    </label>
                    <textarea
                      id="inclusion-edit"
                      value={inclusionCriteria}
                      onChange={(e) => setInclusionCriteria(e.target.value)}
                      rows={5}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                    ></textarea>
                  </div>
                  {/* Exclusion Edit */}
                  <div>
                    <label htmlFor="exclusion-edit" className="block text-sm font-medium text-gray-300">
                      Exclusion Criteria (one per line)
                    </label>
                    <textarea
                      id="exclusion-edit"
                      value={exclusionCriteria}
                      onChange={(e) => setExclusionCriteria(e.target.value)}
                      rows={5}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-white sm:text-sm"
                    ></textarea>
                  </div>
                </div>
                
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={updateTrialMutation.isPending}
                    className="px-6 py-2 text-sm font-bold text-gray-900 bg-green-400 rounded-lg hover:bg-green-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors flex items-center"
                  >
                    {updateTrialMutation.isPending ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
                  </button>
                </div>
              </form>
            ) : (
              // Display Mode
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-green-400 mb-2">
                    Inclusion Criteria
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 pl-4">
                    {trial.inclusion_criteria.length > 0 ? (
                      trial.inclusion_criteria.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))
                    ) : (
                      <li className="text-gray-500">No inclusion criteria specified.</li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-400 mb-2">
                    Exclusion Criteria
                  </h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-1 pl-4">
                    {trial.exclusion_criteria.length > 0 ? (
                      trial.exclusion_criteria.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                      ))
                    ) : (
                      <li className="text-gray-500">No exclusion criteria specified.</li>
                    )}
                  </ul>
                </div>
              </div>
            )}
            
            {/* Status Message Area */}
            {message && (
              <p className="mt-6 text-center text-sm font-medium text-indigo-400">
                {message}
              </p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Document Analysis */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-gray-800 rounded-xl shadow-xl p-6 border border-indigo-700">
            <h2 className="text-2xl font-semibold text-indigo-400 mb-4">
              Document Analysis
            </h2>
            
            {/* File Dropzone */}
            <div
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 mb-4 transition-colors ${
                dragActive ? 'border-green-500 bg-gray-700' : 'border-gray-600 hover:border-indigo-500'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto text-indigo-400 mb-2" />
                <p className="text-gray-400 text-sm">
                  Drag & drop patient document here, or{' '}
                  <label className="text-indigo-400 cursor-pointer font-medium hover:underline">
                    browse
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files) handleFileChange(e.target.files[0]);
                      }}
                      className="hidden"
                      accept=".pdf"
                    />
                  </label>
                </p>
              </div>
            </div>

            {/* Selected File Display */}
            {file && (
              <div className="flex items-center justify-between p-3 border border-gray-600 rounded-lg mb-4 bg-gray-700">
                <span className="text-sm text-white truncate flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-400" />
                  {file.name}
                </span>
                <button
                  onClick={() => {
                    setFile(null);
                    setJobId(null);
                    setJobStatus(null);
                    setEligibilityReport(undefined);
                    setMessage('');
                  }}
                  className="text-red-400 hover:text-red-300 text-sm p-1 rounded-full hover:bg-gray-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Analyze Button (Primary Clinical Green) */}
            <button
              onClick={handleFileUpload}
              disabled={!file || isUploading || jobStatus === 'processing'}
              className="w-full px-4 py-3 text-md font-bold text-gray-900 bg-green-400 rounded-lg hover:bg-green-500 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              {isUploading || jobStatus === 'processing' ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing Document...
                </span>
              ) : (
                'Run Eligibility Check'
              )}
            </button>
            
            {/* Status & Report Area */}
            {jobStatus === 'processing' && (
              <div className="mt-4 text-center text-sm font-semibold text-indigo-400 flex items-center justify-center">
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Analysis in progress... (Polling for results)
              </div>
            )}

            {eligibilityReport && (
              <div className={`mt-4 p-4 rounded-xl border-l-4 ${reportStatusColor} shadow-md`}>
                <div className="flex items-center mb-3">
                    {React.createElement(reportStatusIcon, { className: "w-6 h-6 mr-3 text-white" })}
                    <h3 className="font-bold text-lg text-white">
                        Final Status: {eligibilityReport.status}
                    </h3>
                </div>
                
                <ul className="list-disc list-inside text-gray-200 text-sm space-y-1 pl-4">
                  {eligibilityReport.details && eligibilityReport.details.length > 0 ? (
                    eligibilityReport.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))
                  ) : (
                    <li>No detailed report available.</li>
                  )}
                </ul>
              </div>
            )}
            
            {jobStatus === 'failed' && (
               <div className="mt-4 p-4 bg-red-900 border-l-4 border-red-500 rounded-xl text-sm text-gray-200">
                 <p className="font-semibold">Analysis Failed:</p>
                 <p>The document analysis could not be completed. Check server logs.</p>
               </div>
            )}

          </div>
        </div>
      </div>
      
      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm w-full border border-red-700">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
              <p className="text-gray-300 text-sm mb-6">
                Are you sure you want to permanently delete the trial "{trial.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-between space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 text-sm font-medium text-gray-900 bg-gray-400 rounded-lg hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                // CORRECTED: Ensure only handleDelete is called. 
                // The mutation's onSuccess handler will handle redirection.
                onClick={handleDelete}
                disabled={deleteTrialMutation.isPending}
                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleteTrialMutation.isPending ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialPage;