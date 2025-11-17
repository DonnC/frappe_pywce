import React from 'react';

/**
 * Parses WhatsApp formatting syntax and returns React elements
 * Supports: bold (*text*), italic (_text_), strikethrough (~text~),
 * monospace (```text```), inline code (`text`), lists, and block quotes
 */
export const parseWhatsAppFormatting = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    // Check for bulleted list
    if (line.trimStart().startsWith('- ')) {
      elements.push(
        <div key={lineIndex} className="flex gap-2">
          <span>•</span>
          <span>{parseInlineFormatting(line.trimStart().substring(2))}</span>
        </div>
      );
      return;
    }

    // Check for numbered list
    const numberedMatch = line.trimStart().match(/^(\d+)\.\s(.+)$/);
    if (numberedMatch) {
      elements.push(
        <div key={lineIndex} className="flex gap-2">
          <span>{numberedMatch[1]}.</span>
          <span>{parseInlineFormatting(numberedMatch[2])}</span>
        </div>
      );
      return;
    }

    // Check for block quote
    if (line.trimStart().startsWith('> ')) {
      elements.push(
        <div key={lineIndex} className="border-l-2 border-current pl-2 opacity-70">
          {parseInlineFormatting(line.trimStart().substring(2))}
        </div>
      );
      return;
    }

    // Regular line with inline formatting
    if (line.trim()) {
      elements.push(
        <div key={lineIndex}>{parseInlineFormatting(line)}</div>
      );
    } else {
      elements.push(<br key={lineIndex} />);
    }
  });

  return <>{elements}</>;
};

/**
 * Parses inline formatting like bold, italic, code, etc.
 */
const parseInlineFormatting = (text: string): React.ReactNode => {
  const segments: React.ReactNode[] = [];
  let currentIndex = 0;
  let segmentKey = 0;

  while (currentIndex < text.length) {
    // Try to match monospace (```text```)
    const monospaceMatch = text.substring(currentIndex).match(/^```([^`]+)```/);
    if (monospaceMatch) {
      segments.push(
        <code key={segmentKey++} className="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-sm">
          {monospaceMatch[1]}
        </code>
      );
      currentIndex += monospaceMatch[0].length;
      continue;
    }

    // Try to match inline code (`text`)
    const codeMatch = text.substring(currentIndex).match(/^`([^`]+)`/);
    if (codeMatch) {
      segments.push(
        <code key={segmentKey++} className="bg-black/10 dark:bg-white/10 px-1 rounded font-mono text-sm">
          {codeMatch[1]}
        </code>
      );
      currentIndex += codeMatch[0].length;
      continue;
    }

    // Try to match bold (*text*)
    const boldMatch = text.substring(currentIndex).match(/^\*([^*]+)\*/);
    if (boldMatch) {
      segments.push(
        <strong key={segmentKey++} className="font-bold">
          {boldMatch[1]}
        </strong>
      );
      currentIndex += boldMatch[0].length;
      continue;
    }

    // Try to match italic (_text_)
    const italicMatch = text.substring(currentIndex).match(/^_([^_]+)_/);
    if (italicMatch) {
      segments.push(
        <em key={segmentKey++} className="italic">
          {italicMatch[1]}
        </em>
      );
      currentIndex += italicMatch[0].length;
      continue;
    }

    // Try to match strikethrough (~text~)
    const strikeMatch = text.substring(currentIndex).match(/^~([^~]+)~/);
    if (strikeMatch) {
      segments.push(
        <s key={segmentKey++} className="line-through">
          {strikeMatch[1]}
        </s>
      );
      currentIndex += strikeMatch[0].length;
      continue;
    }

    // No match, add regular character
    segments.push(text[currentIndex]);
    currentIndex++;
  }

  return <>{segments}</>;
};
