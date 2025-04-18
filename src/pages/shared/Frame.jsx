import { useState, useEffect } from "preact/hooks";
import Sidebar from "./Sidebar";
import { isAuthenticated } from "../../services/auth";

export default function Frame({ children }) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  // If not authenticated, just return the children without the frame
  if (!isAuthenticated.value) {
    return <div className="flex-1 overflow-auto">{children}</div>;
  }

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden md:flex-row">
      <div className="hidden md:block">
        <Sidebar isOpen={isOpen} toggleSidebar={toggleSidebar} />
      </div>
      <div className="flex-1 overflow-auto p-4">{children}</div>
      <div class="md:hidden">
        <Sidebar isOpen={false} toggleSidebar={toggleSidebar} />
      </div>
    </div>
  );
}
