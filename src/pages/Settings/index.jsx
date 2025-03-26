import { useState } from "preact/hooks";
import { signOut } from "../../services/auth";
import { tabStorage } from "../../services/storage";
import "./styles.scss";
import { useLocation } from "preact-iso";

export default function Settings() {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleteStep, setDeleteStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);
  const { route } = useLocation();

  const openDeleteModal = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setConfirmText("");
    setError(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };

  const proceedToFinalConfirmation = () => {
    if (confirmText.toLowerCase() !== "delete") {
      setError("Please type 'delete' to confirm");
      return;
    }

    setError(null);
    setDeleteStep(2);
    setConfirmText("");
  };

  const handleDeleteAccount = async () => {
    if (confirmText.toLowerCase() !== "confirm delete") {
      setError("Please type 'confirm delete' to proceed");
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      // First clear all local data
      localStorage.clear();

      // Then sign out the user
      await signOut();

      // Redirect to login page
      route("/login");
    } catch (error) {
      setError("Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-container p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Account Management Section */}
      <div className="settings-section bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2 text-indigo-600"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          Account
        </h2>

        <div className="bg-red-50 rounded-md p-4 mt-6 border border-red-100">
          <h3 className="text-lg font-medium text-red-700 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600 mb-4">
            Once you delete your account, there is no going back. This is a
            permanent action.
          </p>
          <button
            onClick={openDeleteModal}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-red-600 mb-4">
              {deleteStep === 1 ? "Delete Account" : "Final Confirmation"}
            </h3>

            {deleteStep === 1 ? (
              <>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to delete your account? This action is
                  permanent and cannot be undone. All your beats and settings
                  will be lost.
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Type "delete" to confirm:
                </p>
              </>
            ) : (
              <>
                <p className="mb-6 text-gray-700">
                  <strong className="text-red-600">Final warning:</strong> You
                  are about to permanently delete your account and all
                  associated data. This action cannot be reversed.
                </p>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  Type "confirm delete" to permanently delete your account:
                </p>
              </>
            )}

            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500 mb-4"
              placeholder={
                deleteStep === 1 ? "Type 'delete'" : "Type 'confirm delete'"
              }
              disabled={isDeleting}
            />

            {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>

              {deleteStep === 1 ? (
                <button
                  onClick={proceedToFinalConfirmation}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center"
                >
                  {isDeleting ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    "Delete My Account"
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
