import { useState } from "preact/hooks";
import "./styles.scss";

export default function Help() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    issueType: "bug",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // FAQ data organized in sections
  const faqSections = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create a new beat?",
          answer:
            "Click on 'New Dab' in the sidebar or the 'Create New Beat' button on the main page. This will open the editor with a blank pattern where you can start creating your beat.",
        },
        {
          question: "How do I play my beat?",
          answer:
            "In the editor, click the 'Play' button to start playback. The button will change to 'Stop' which you can click to stop playback. You can also adjust the BPM (beats per minute) using the slider to change the tempo.",
        },
        {
          question: "How do I save my work?",
          answer:
            "Click the 'Save' button in the top right corner of the editor. Your beat will be saved automatically and will appear in your Tab List. You can also give your beat a name by editing the title field at the top of the editor.",
        },
      ],
    },
    {
      title: "Working with Patterns",
      items: [
        {
          question: "How do I add a drum hit?",
          answer:
            "Click on any cell in the grid to activate that drum sound at that specific time. Click again to remove it. The grid runs from left to right, with each row representing a different drum sound.",
        },
        {
          question: "What do the different rows represent?",
          answer:
            "Each row corresponds to a drum sound: kick, snare, hi-hat, tom, and clap (from bottom to top). You can create patterns by activating cells in different rows at different positions.",
        },
        {
          question: "How do I change the time signature or add more bars?",
          answer:
            "Click 'Show Advanced Controls' to access the time signature settings and bar count controls. You can change the time signature (e.g., 4/4, 3/4) and add more bars to extend your pattern. Note that changing these settings will resize your pattern, but will try to preserve existing beats.",
        },
        {
          question: "What is 'Note Resolution'?",
          answer:
            "Note resolution determines how many steps each beat is divided into. 8th notes give you 2 steps per beat, 16th notes give you 4 steps per beat, and 32nd notes give you 8 steps per beat. Higher resolutions allow for more detailed patterns but may be more complex to work with.",
        },
      ],
    },
    {
      title: "Managing Your Beats",
      items: [
        {
          question: "How do I view all my saved beats?",
          answer:
            "Click on 'Tab List' in the sidebar to see all your saved beats. You can switch between grid and list views using the view toggle button.",
        },
        {
          question: "Can I delete a beat?",
          answer:
            "Yes, in the Tab List view, click the delete icon (trash can) next to any beat. You'll need to confirm deletion by clicking the icon again.",
        },
        {
          question: "Is my data backed up?",
          answer:
            "Currently, all beats are stored in your browser's local storage. This means they persist between sessions but are limited to the current browser on your current device. We recommend exporting important beats (feature coming soon) to avoid data loss.",
        },
      ],
    },
    {
      title: "Technical Issues",
      items: [
        {
          question: "What browsers are supported?",
          answer:
            "Dabber works best on modern browsers like Chrome, Firefox, Safari, and Edge. It requires Web Audio API support, which most modern browsers have.",
        },
        {
          question: "No sound is playing. What should I do?",
          answer:
            "First, check if your device's sound is on and at an audible level. If that's not the issue, try clicking anywhere on the page first (this is needed for audio to work in some browsers). If problems persist, try using a different browser or device.",
        },
        {
          question:
            "The app feels slow or lags during playback. How can I fix that?",
          answer:
            "For complex patterns or on older devices, you might experience performance issues. Try reducing the number of bars or the note resolution. Close other tabs and applications to free up system resources.",
        },
      ],
    },
  ];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Mock API call - in a real app, replace with your actual API endpoint
      // await fetch('https://api.yourdomain.com/issues', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show success message
      setSubmitSuccess(true);

      // Reset form
      setFormData({
        name: "",
        email: "",
        issueType: "bug",
        description: "",
      });

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      console.error("Error submitting issue:", error);
      setSubmitError("Failed to submit your issue. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle FAQ item
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setExpandedItems({
      ...expandedItems,
      [key]: !expandedItems[key],
    });
  };

  return (
    <div className="help-container p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Help & Support</h1>

      {/* Help intro */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">Welcome to Dabber Help</h2>
        <p className="text-gray-700 mb-4">
          Dabber is a browser-based drum machine that lets you create and save
          beat patterns. Use the sections below to find answers to common
          questions or report an issue.
        </p>

        <div className="flex flex-wrap gap-4 mt-6">
          <a
            href="#faq"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Browse FAQ
          </a>
          <a
            href="#report"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            Report an Issue
          </a>
        </div>
      </div>

      {/* FAQ Section */}
      <div
        id="faq"
        className="faq-section bg-white rounded-lg shadow-sm p-6 mb-8"
      >
        <h2 className="text-2xl font-semibold mb-6">
          Frequently Asked Questions
        </h2>

        <div className="accordion">
          {faqSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="mb-6">
              <h3 className="text-lg font-medium text-indigo-700 mb-3">
                {section.title}
              </h3>

              {section.items.map((item, itemIndex) => {
                const isExpanded =
                  expandedItems[`${sectionIndex}-${itemIndex}`];

                return (
                  <div
                    key={itemIndex}
                    className="faq-item mb-2 border border-gray-200 rounded-md overflow-hidden"
                  >
                    <button
                      className={`w-full text-left p-4 flex justify-between items-center hover:bg-gray-50 transition-colors ${isExpanded ? "bg-gray-50" : ""}`}
                      onClick={() => toggleItem(sectionIndex, itemIndex)}
                      aria-expanded={isExpanded}
                    >
                      <span className="font-medium">{item.question}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-5 w-5 transform transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    <div
                      className={`faq-answer transition-all overflow-hidden ${isExpanded ? "max-h-96 visible" : "max-h-0 invisible"}`}
                    >
                      <div className="p-4 pt-0 text-gray-700 border-t border-gray-100">
                        {item.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600">
            Can't find an answer to your question?{" "}
            <a href="#report" className="text-indigo-600 hover:underline">
              Report an issue or ask for help
            </a>
          </p>
        </div>
      </div>

      {/* Issue Report Form */}
      <div
        id="report"
        className="issue-report bg-white rounded-lg shadow-sm p-6"
      >
        <h2 className="text-2xl font-semibold mb-4">Report an Issue</h2>
        <p className="text-gray-700 mb-6">
          Encountered a bug or have a feature request? Let us know by filling
          out the form below.
        </p>

        {submitSuccess ? (
          <div className="success-message bg-green-100 text-green-700 p-4 rounded-md mb-6 flex items-start">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-medium">Thanks for your feedback!</p>
              <p>We've received your issue report and will look into it.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {submitError && (
              <div className="error-message bg-red-100 text-red-700 p-4 rounded-md">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="issueType"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Issue Type
              </label>
              <select
                id="issueType"
                name="issueType"
                value={formData.issueType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Please describe the issue in detail. For bugs, include steps to reproduce, what happened, and what you expected to happen."
                required
              ></textarea>
            </div>

            <div className="flex items-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Submitting...
                  </>
                ) : (
                  "Submit Report"
                )}
              </button>
              <p className="text-xs text-gray-500 ml-4">
                We typically respond within 1-2 business days.
              </p>
            </div>
          </form>
        )}
      </div>

      {/* Additional Resources */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Need more help? Check out these resources:</p>
        <div className="flex justify-center mt-2 space-x-4">
          <a href="#" className="text-indigo-600 hover:underline">
            Video Tutorials
          </a>
          <a href="#" className="text-indigo-600 hover:underline">
            User Guide
          </a>
          <a href="#" className="text-indigo-600 hover:underline">
            Community Forum
          </a>
        </div>
      </div>
    </div>
  );
}
