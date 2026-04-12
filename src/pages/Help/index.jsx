import { useState } from "preact/hooks";
import { Icon } from "../../components/Icon";

export default function Help() {
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitSuccess(true);
  };

  const faqSections = [
    {
      title: "Getting Started",
      icon: "rocket_launch",
      items: [
        {
          question: "How do I create a new beat?",
          answer:
            "Click on 'New Beat' in the bottom nav or the 'Create New Beat' button on the main page. This will open the editor with a blank pattern where you can start creating your beat.",
        },
        {
          question: "How do I play my beat?",
          answer:
            "In the editor, click the 'Play' button to start playback. The button will change to 'Stop' which you can click to stop playback. You can also adjust the BPM (beats per minute) to change the tempo. The count-in feature (available in Settings) plays a one-bar metronome click before starting your beat.",
        },
        {
          question: "How do I save my work?",
          answer:
            "Click the 'Save' button in the editor. Your beat will be saved and appear in your beat list. You can also give your beat a name by editing the title field at the top of the editor.",
        },
      ],
    },
    {
      title: "Working with Patterns",
      icon: "grid_on",
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
            "Click 'Show Advanced Controls' to access the time signature settings and bar count controls. You can change the time signature (e.g., 4/4, 3/4) and add more bars to extend your pattern.",
        },
        {
          question: "How do I duplicate or repeat bars?",
          answer:
            "Click on the bar number at the beginning of any bar to open the bar options menu. From there, you can choose to duplicate the bar or set up repetitions.",
        },
        {
          question: "How do hi-hats work in the editor?",
          answer:
            "The hi-hat track is special — clicking a cell cycles through three states: off, closed hi-hat, and open hi-hat. This allows you to create more dynamic hi-hat patterns with both closed and open sounds in a single track.",
        },
      ],
    },
    {
      title: "Managing Your Beats",
      icon: "library_music",
      items: [
        {
          question: "How do I view all my saved beats?",
          answer:
            "Tap the Home tab in the bottom nav to see all your saved beats. You can switch between grid and list views.",
        },
        {
          question: "Can I delete a beat?",
          answer:
            "Yes, in the beat list, tap the delete icon next to any beat. You'll need to confirm deletion by tapping again.",
        },
        {
          question: "Is my data backed up?",
          answer:
            "Your beats are stored in your account when you're logged in. You can access them from any device by logging in.",
        },
      ],
    },
    {
      title: "Troubleshooting",
      icon: "build",
      items: [
        {
          question: "No sound is playing. What should I do?",
          answer:
            "First, check if your device's sound is on. If that's not the issue, try tapping anywhere on the page first (this is needed for audio to work in some browsers). If problems persist, try a different browser.",
        },
        {
          question: "The app feels slow during playback.",
          answer:
            "For complex patterns, try reducing the number of bars or closing other tabs/apps to free up resources.",
        },
      ],
    },
  ];

  const toggleItem = (sectionIndex, itemIndex) => {
    const key = `${sectionIndex}-${itemIndex}`;
    setExpandedItems({
      ...expandedItems,
      [key]: !expandedItems[key],
    });
  };

  return (
    <div className="px-4 pt-6 pb-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-on-surface mb-6">Help & Support</h1>

      {/* Quick Start */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3">Quick Start</h2>
        <p className="text-sm text-on-surface-dim mb-3">
          Drum Dabber is a browser-based drum machine for creating and saving beat patterns.
        </p>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
          <ul className="space-y-1.5 text-sm text-on-surface">
            <li className="flex items-start gap-2">
              <Icon name="touch_app" size="text-base" className="text-primary mt-0.5 shrink-0" />
              Tap cells in the grid to add drum sounds
            </li>
            <li className="flex items-start gap-2">
              <Icon name="play_arrow" size="text-base" className="text-primary mt-0.5 shrink-0" />
              Use the Play button to hear your beat
            </li>
            <li className="flex items-start gap-2">
              <Icon name="save" size="text-base" className="text-primary mt-0.5 shrink-0" />
              Save your work with the Save button
            </li>
            <li className="flex items-start gap-2">
              <Icon name="settings" size="text-base" className="text-primary mt-0.5 shrink-0" />
              Customize your kit in Settings
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ Sections */}
      {faqSections.map((section, sectionIndex) => (
        <section key={sectionIndex} className="bg-surface rounded-xl p-4 mb-4">
          <h2 className="text-base font-semibold text-on-surface mb-3 flex items-center gap-2">
            <Icon name={section.icon} size="text-lg" className="text-primary" />
            {section.title}
          </h2>

          <div className="space-y-1">
            {section.items.map((item, itemIndex) => {
              const isExpanded = expandedItems[`${sectionIndex}-${itemIndex}`];

              return (
                <div key={itemIndex} className="border border-white/5 rounded-lg overflow-hidden">
                  <button
                    className={`w-full text-left px-3 py-3 flex justify-between items-center text-sm ${
                      isExpanded ? "bg-surface-light" : "hover:bg-surface-light/50"
                    } transition-colors`}
                    onClick={() => toggleItem(sectionIndex, itemIndex)}
                    aria-expanded={isExpanded}
                  >
                    <span className="text-on-surface font-medium pr-2">{item.question}</span>
                    <Icon
                      name="expand_more"
                      size="text-lg"
                      class={`text-on-surface-dim shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 text-sm text-on-surface-dim leading-relaxed border-t border-white/5">
                      <div className="pt-2">{item.answer}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {/* Issue Report Form */}
      <section className="bg-surface rounded-xl p-4 mb-4">
        <h2 className="text-lg font-semibold text-on-surface mb-3 flex items-center gap-2">
          <Icon name="bug_report" size="text-xl" className="text-primary" />
          Report an Issue
        </h2>

        {submitSuccess ? (
          <div className="bg-success/10 border border-success/20 text-success p-3 rounded-lg text-sm flex items-start gap-2">
            <Icon name="check_circle" size="text-lg" className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Thanks for your feedback!</p>
              <p className="text-success/80">We've received your report and will look into it.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className="block text-xs text-on-surface-dim mb-1">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs text-on-surface-dim mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="issueType" className="block text-xs text-on-surface-dim mb-1">Issue Type</label>
              <select
                id="issueType"
                name="issueType"
                className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="question">Question</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs text-on-surface-dim mb-1">Description</label>
              <textarea
                id="description"
                name="description"
                rows="4"
                className="w-full px-3 py-2 bg-surface-light border border-white/10 rounded-lg text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Describe the issue in detail..."
                required
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium active:scale-95 transition-transform"
            >
              Submit Report
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
