'use client';

import { Sandpack } from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";

// Simple regex to find code blocks
const extractCode = (markdown: string): string | null => {
  const match = markdown.match(/```(?:jsx|tsx|javascript|react)([\s\S]*?)```/);
  return match ? match[1].trim() : null;
};

export default function CodePreview({ content }: { content: string }) {
  const code = extractCode(content);

  // If no code block found, don't render anything
  if (!code) return null;

  return (
    <div className="mt-4 rounded-lg overflow-hidden border border-gray-700 shadow-2xl">
      <Sandpack
        template="react"
        theme={atomDark}
        customSetup={{
          dependencies: {
            "react": "latest",
            "react-dom": "latest",
            "react-scripts": "latest"
          },
        }}
        files={{
          "/App.js": code,
        }}
        options={{
          showNavigator: false,
          editorHeight: 300,
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          closableTabs: false,
        }}
      />
    </div>
  );
}