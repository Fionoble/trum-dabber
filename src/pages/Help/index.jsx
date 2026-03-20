import { useState } from "preact/hooks";
import QuestionMarkIcon from "../../assets/icons/QuestionMark.svg.jsx";
import AlertIcon from "../../assets/icons/AlertIcon.svg.jsx";
import SuccessIcon from "../../assets/icons/Success.svg.jsx";
import ChevronDown2Icon from "../../assets/icons/ChevronDown2.svg.jsx";
import "./styles.scss";

export default function Help() {
  // const [formData, setFormData] = useState({
  //   name: "",
  //   email: "",
  //   issueType: "bug",
  //   description: "",
  // });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitSuccess(true);
  };

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
            "In the editor, click the 'Play' button to start playback. The button will change to 'Stop' which you can click to stop playback. You can also adjust the BPM (beats per minute) to change the tempo. The count-in feature (available in Settings) plays a one-bar metronome click before starting your beat.",
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
            "Each row corresponds to a different drum sound like kick, snare, hi-hat, tom, etc. The instrument icon at the beginning of each row indicates which sound it controls. You can customize your drum kit in the Settings page.",
        },
        {
          question: "How do I change the time signature or add more bars?",
          answer:
            "Click 'Show Advanced Controls' to access the time signature settings and bar count controls. You can change the time signature (e.g., 4/4, 3/4) and add more bars to extend your pattern. Note that changing these settings will resize your pattern, but will try to preserve existing beats.",
        },
        {
          question: "How do I duplicate or repeat bars?",
          answer:
            "Click on the bar number at the beginning of any bar to open the bar options menu. From there, you can choose to duplicate the bar (which adds a copy right after it) or set up repetitions. When setting repetitions, you can specify how many times to play the bar and which bars to include in the repeat.",
        },
        {
          question: "How do I work with tracks and instruments?",
          answer:
            "Click on an instrument icon at the beginning of a row to access track options. You can hide specific tracks, solo a track (hide all others), or show all tracks. This is useful when working with complex patterns to focus on specific instruments.",
        },
      ],
    },
    {
      title: "Advanced Features",
      items: [
        {
          question: "What are the playback settings?",
          answer:
            "In the Settings page under the Playback section, you can customize how your beats play back. The Count-in setting plays a one-bar metronome click before starting the actual pattern. The Loop Playback setting determines whether your beat will loop continuously or stop after playing through once.",
        },
        {
          question: "How do I customize my drum kit?",
          answer:
            "Go to the Settings page and look for the Drum Kit section. Here you can add, remove, and reorder instruments by dragging them. Your customized kit will be used for all new beats you create.",
        },
        {
          question:
            "Can I create complex patterns with different time signatures?",
          answer:
            "Yes! Use the Advanced Controls section in the editor to change the time signature. You can create patterns in common time signatures like 4/4 and 3/4, or experiment with more unusual ones like 5/4 or 7/8.",
        },
        {
          question: "How do hi-hats work in the editor?",
          answer:
            "The hi-hat track is special - clicking a cell cycles through three states: off, closed hi-hat, and open hi-hat. This allows you to create more dynamic hi-hat patterns with both closed and open sounds in a single track.",
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
            "Your beats are stored in your Supabase account when you're logged in. This means you can access them from any device by logging into your account. Always save your work to ensure it's properly stored in the cloud.",
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
          Dabber is a browser-based drum machine that lets you create,
          customize, and save beat patterns. Use the sections below to find
          answers to common questions or report an issue.
        </p>

        <div className="bg-indigo-50 border border-indigo-100 rounded-md p-4 mb-4">
          <h3 className="text-md font-medium text-indigo-800 mb-2">
            Quick Start Guide
          </h3>
          <ul className="list-disc list-inside text-indigo-700 space-y-1 text-sm">
            <li>Click cells in the grid to add drum sounds</li>
            <li>Use the Play button to hear your beat</li>
            <li>Click bar numbers to duplicate or repeat bars</li>
            <li>Click instrument icons to show/hide tracks</li>
            <li>
              Check the Settings page for playback options and custom drum kits
            </li>
            <li>Save your work with the Save button in the editor</li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-4 mt-6">
          <a
            href="#faq"
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors flex items-center gap-2"
          >
            <QuestionMarkIcon />
            Browse FAQ
          </a>
          <a
            href="#report"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <AlertIcon />
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
                      <span
                        className={`transform transition-transform ${isExpanded ? "rotate-180" : ""} inline-block`}
                      >
                        <ChevronDown2Icon />
                      </span>
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
            <SuccessIcon />
            <div>
              <p className="font-medium">Thanks for your feedback!</p>
              <p>We've received your issue report and will look into it.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" netlify>
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
                rows="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Please describe the issue in detail. For bugs, include steps to reproduce, what happened, and what you expected to happen."
                required
              ></textarea>
            </div>

            <div className="flex items-center">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              >
                Submit Report
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
