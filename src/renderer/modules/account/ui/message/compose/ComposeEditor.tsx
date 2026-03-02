/**
 * ============================================================================
 * COMPOSE EDITOR COMPONENT — SUPER RICH TEXT EDITOR
 * ============================================================================
 * Features:
 *  - WYSIWYG contentEditable rich editor (HTML)
 *  - Plain-text mode (textarea)
 *  - Markdown mode (textarea + md toolbar)
 *  - Preview mode (rendered HTML)
 *  - Full toolbar: heading, bold, italic, underline, strike, color, bg-color,
 *                  align, lists, indent, blockquote, code, link, image, table,
 *                  emoji picker, undo/redo, font-size, font-family
 *  - Drag-and-drop overlay
 *  - Link insertion dialog
 *  - Emoji picker (categorized)
 *  - FIXED: Text selection no longer blocked by toolbar
 */

import React, {
  useRef, useCallback, useState, useEffect,
} from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link, Image, Smile,
  Code, Quote, Undo, Redo, Minus, Table, Type, ChevronDown,
  Indent, Outdent, Paperclip, 
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '../../../../../shared/utils/classNameUtils';
import type { EditorMode } from './composeTypes';

/* ── Emoji data ──────────────────────────────────────────────────── */
const EMOJI_CATEGORIES = [
  { name: 'Smileys', emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤧','🤮','🤠','👿','👹','👺','🤡','💩','👻','💀','☠️','👽','👾','🤖'] },
  { name: 'Gestures', emojis: ['👋','🤚','🖐️','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏'] },
  { name: 'People', emojis: ['👨','👩','🧑','👦','👧','🧒','👶','🧓','👴','👵','👨‍💼','👩‍💼','👨‍🔬','👩‍🔬','👨‍💻','👩‍💻','👨‍🎨','👩‍🎨','👨‍✈️','👩‍✈️'] },
  { name: 'Hearts', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','☮️','✝️','☪️','🕉️','✡️','🔯','🕎','☯️'] },
  { name: 'Objects', emojis: ['📧','📨','📩','📪','📫','📬','📭','📮','🗳️','✏️','✒️','🖊️','🖋️','📝','💼','📁','📂','🗂️','📊','📈','📉','📋','📌','📍','📎','🖇️','📐','📏','🗒️','📅','📆','📇','📔','📕','📖','📗','📘','📙','📚','📓','📃','📄','📑'] },
  { name: 'Symbols', emojis: ['✅','❌','⭕','🚫','💯','🔴','🟠','🟡','🟢','🔵','🟣','⚫','⚪','🟤','🔶','🔷','🔸','🔹','🔺','🔻','💠','🔘','🔲','🔳','⬜','⬛','◼️','◻️','◾','◽','▪️','▫️','🔈','🔉','🔊','🔔','🔕','🎵','🎶','⚠️','🔱','📛','🚷','🚯','🚳','🚱','🔞','📵','🚭','❗','❕','❓','❔','‼️','⁉️','🔅','🔆','🔤','🔡','🔠','🆖','🆗','🆙','🆒','🆕','🆓','🔝','🆘','🆔'] },
];

/* ── Font options ─────────────────────────────────────────────────── */
const FONT_FAMILIES = [
  'Default', 'Arial', 'Georgia', 'Times New Roman', 'Courier New',
  'Verdana', 'Trebuchet MS', 'Comic Sans MS',
];
const FONT_SIZES = ['10', '12', '14', '16', '18', '20', '24', '28', '32', '36', '48'];
const HEADING_OPTIONS = [
  { label: 'Normal', tag: 'p', value: '' },
  { label: 'Heading 1', tag: 'h1', value: 'h1' },
  { label: 'Heading 2', tag: 'h2', value: 'h2' },
  { label: 'Heading 3', tag: 'h3', value: 'h3' },
  { label: 'Heading 4', tag: 'h4', value: 'h4' },
];

const TEXT_COLORS = [
  '#000000','#434343','#666666','#999999','#b7b7b7','#cccccc','#d9d9d9','#ffffff',
  '#ff0000','#ff9900','#ffff00','#00ff00','#00ffff','#4a86e8','#0000ff','#9900ff',
  '#ff00ff','#e06666','#f6b26b','#ffd966','#93c47d','#76d7c4','#6fa8dc','#8e7cc3',
  '#c27ba0',
];

/* ── Toolbar Separator ───────────────────────────────────────────── */
const Sep: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <span
    className={cn('w-px h-5 mx-0.5 shrink-0', isDark ? 'bg-gray-700' : 'bg-gray-300')}
  />
);

/* ── Toolbar Button ──────────────────────────────────────────────── */
interface TBtnProps {
  onClick: () => void;
  title: string;
  active?: boolean;
  isDark: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}
const TBtn: React.FC<TBtnProps> = ({ onClick, title, active, isDark, disabled, children }) => (
  <button
    onClick={onClick} // Changed from onMouseDown to onClick to prevent selection blocking
    title={title}
    disabled={disabled}
    className={cn(
      'p-1.5 rounded transition-colors cursor-pointer shrink-0 select-none', // Added select-none
      disabled && 'opacity-40 cursor-not-allowed',
      active
        ? isDark
          ? 'bg-blue-600/30 text-blue-300'
          : 'bg-blue-100 text-blue-700'
        : isDark
          ? 'hover:bg-gray-700 text-gray-300 hover:text-white'
          : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900',
    )}
  >
    {children}
  </button>
);

/* ── Link Dialog ─────────────────────────────────────────────────── */
interface LinkDialogProps {
  isDark: boolean;
  onInsert: (url: string, text: string) => void;
  onClose: () => void;
}
const LinkDialog: React.FC<LinkDialogProps> = ({ isDark, onInsert, onClose }) => {
  const [url, setUrl] = useState('https://');
  const [text, setText] = useState('');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className={cn(
          'w-96 p-5 rounded-xl border-2 shadow-2xl',
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        )}
      >
        <h3 className="text-base font-semibold mb-4">Insert Link</h3>
        <div className="space-y-3">
          <div>
            <label className={cn('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
              Display text (optional)
            </label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Link label"
              autoFocus
              className={cn(
                'w-full px-3 py-2 rounded-lg border-2 text-sm outline-none',
                isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400',
              )}
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1', isDark ? 'text-gray-400' : 'text-gray-600')}>
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={cn(
                'w-full px-3 py-2 rounded-lg border-2 text-sm outline-none',
                isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' : 'bg-white border-gray-200 text-gray-900 focus:border-blue-400',
              )}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button
            onClick={onClose}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium cursor-pointer',
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
            )}
          >
            Cancel
          </button>
          <button
            onClick={() => { if (url.trim()) { onInsert(url.trim(), text); onClose(); } }}
            disabled={!url.trim() || url === 'https://'}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            Insert
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ── Color Picker Popover ─────────────────────────────────────────── */
interface ColorPickerProps {
  isDark: boolean;
  onSelect: (color: string) => void;
  onClose: () => void;
  title: string;
}
const ColorPicker: React.FC<ColorPickerProps> = ({ isDark, onSelect, onClose, title }) => (
  <div
    className={cn(
      'absolute top-full left-0 mt-1 p-3 rounded-xl border-2 shadow-xl z-50 w-52',
      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200',
    )}
  >
    <div className={cn('text-xs font-semibold mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>{title}</div>
    <div className="grid grid-cols-8 gap-1">
      {TEXT_COLORS.map(c => (
        <button
          key={c}
          onClick={() => { onSelect(c); onClose(); }} // Changed from onMouseDown to onClick
          style={{ background: c }}
          className="w-5 h-5 rounded cursor-pointer border border-gray-300/30 hover:scale-125 transition-transform"
          title={c}
        />
      ))}
    </div>
    <div className="mt-2">
      <input
        type="color"
        onChange={e => { onSelect(e.target.value); onClose(); }}
        className="w-full h-7 rounded cursor-pointer border-0"
        title="Custom color"
      />
    </div>
  </div>
);

/* ─── Main Editor ────────────────────────────────────────────────── */
export interface ComposeEditorRef {
  focus: () => void;
  getContent: () => string;
}

interface ComposeEditorProps {
  theme: 'light' | 'dark';
  body: string;
  editorMode: EditorMode;
  validationError?: string;
  dragActive?: boolean;
  onChange: (body: string) => void;
  onEditorModeChange: (mode: EditorMode) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onAttachFile?: () => void;
}

export const ComposeEditor: React.FC<ComposeEditorProps> = ({
  theme, body, editorMode, validationError, dragActive,
  onChange, onEditorModeChange,
  onDragEnter, onDragLeave, onDragOver, onDrop, onAttachFile,
}) => {
  const isDark = theme === 'dark';
  const richRef = useRef<HTMLDivElement>(null);
  const plainRef = useRef<HTMLTextAreaElement>(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [activeEmojiCat, setActiveEmojiCat] = useState(0);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showBgColor, setShowBgColor] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showHeading, setShowHeading] = useState(false);
  const savedSelection = useRef<Range | null>(null);

  /* Sync body → rich editor on mode switch and body changes */
  useEffect(() => {
    if (editorMode === 'rich' && richRef.current) {
      // Only update if content actually changed to avoid cursor jumping
      if (richRef.current.innerHTML !== body) {
        richRef.current.innerHTML = body;
      }
    }
  }, [body, editorMode]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    if (savedSelection.current && richRef.current) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(savedSelection.current);
    }
  };

  const exec = useCallback((cmd: string, value?: string) => {
    if (editorMode !== 'rich') return;
    
    // Save selection before executing command
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
    
    document.execCommand(cmd, false, value);
    
    if (richRef.current) {
      onChange(richRef.current.innerHTML);
    }
    
    // Restore focus but don't steal selection
    richRef.current?.focus();
  }, [editorMode, onChange]);

  /* ── Insert link into rich editor ─────────────────────────────── */
  const handleInsertLink = useCallback((url: string, text: string) => {
    if (editorMode === 'rich') {
      restoreSelection();
      const linkHtml = text
        ? `<a href="${url}" target="_blank" rel="noopener">${text}</a>`
        : `<a href="${url}" target="_blank" rel="noopener">${url}</a>`;
      document.execCommand('insertHTML', false, linkHtml);
      if (richRef.current) onChange(richRef.current.innerHTML);
      richRef.current?.focus();
    } else {
      const ta = plainRef.current;
      if (!ta) return;
      const s = ta.selectionStart, e = ta.selectionEnd;
      const insert = text ? `[${text}](${url})` : url;
      const newVal = ta.value.substring(0, s) + insert + ta.value.substring(e);
      onChange(newVal);
      // Restore cursor position
      setTimeout(() => {
        if (ta) {
          ta.selectionStart = ta.selectionEnd = s + insert.length;
          ta.focus();
        }
      }, 0);
    }
  }, [editorMode, onChange]);

  /* ── Insert emoji ──────────────────────────────────────────────── */
  const insertEmoji = useCallback((emoji: string) => {
    if (editorMode === 'rich') {
      restoreSelection();
      document.execCommand('insertText', false, emoji);
      if (richRef.current) onChange(richRef.current.innerHTML);
      richRef.current?.focus();
    } else {
      const ta = plainRef.current;
      if (!ta) return;
      const s = ta.selectionStart;
      const newVal = ta.value.substring(0, s) + emoji + ta.value.substring(ta.selectionEnd);
      onChange(newVal);
      setTimeout(() => { 
        if (ta) { 
          ta.selectionStart = ta.selectionEnd = s + emoji.length; 
          ta.focus(); 
        } 
      }, 0);
    }
    setShowEmojiPicker(false);
  }, [editorMode, onChange]);

  /* ── Insert markdown shortcut ──────────────────────────────────── */
  const insertMarkdown = useCallback((syntax: string, wrapSelection = true) => {
    const ta = plainRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const selected = ta.value.substring(s, e);
    const insert = wrapSelection && selected ? `${syntax}${selected}${syntax}` : syntax;
    const newVal = ta.value.substring(0, s) + insert + ta.value.substring(e);
    onChange(newVal);
    setTimeout(() => {
      if (ta) {
        const pos = s + insert.length;
        ta.selectionStart = wrapSelection && selected ? s : pos;
        ta.selectionEnd = pos;
        ta.focus();
      }
    }, 0);
  }, [onChange]);

  /* ── Markdown toolbar buttons ─────────────────────────────────── */
  const mdToolbar = [
    { title: 'Bold', icon: <Bold className="w-3.5 h-3.5" />, syntax: '**', wrap: true },
    { title: 'Italic', icon: <Italic className="w-3.5 h-3.5" />, syntax: '_', wrap: true },
    { title: 'Code', icon: <Code className="w-3.5 h-3.5" />, syntax: '`', wrap: true },
    { title: 'Quote', icon: <Quote className="w-3.5 h-3.5" />, syntax: '> ', wrap: false },
    { title: 'Bullet list', icon: <List className="w-3.5 h-3.5" />, syntax: '- ', wrap: false },
    { title: 'Ordered list', icon: <ListOrdered className="w-3.5 h-3.5" />, syntax: '1. ', wrap: false },
    { title: 'Heading', icon: <Type className="w-3.5 h-3.5" />, syntax: '## ', wrap: false },
    { title: 'Horizontal rule', icon: <Minus className="w-3.5 h-3.5" />, syntax: '\n---\n', wrap: false },
  ];

  /* ── Rendered Markdown Preview ─────────────────────────────────── */
  const renderPreview = (md: string) => {
    if (!md) return '';
    const html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^#{4} (.+)$/gm, '<h4>$1</h4>')
      .replace(/^#{3} (.+)$/gm, '<h3>$1</h3>')
      .replace(/^#{2} (.+)$/gm, '<h2>$1</h2>')
      .replace(/^#{1} (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.+?)__/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/~~(.+?)~~/g, '<del>$1</del>')
      .replace(/`([^`]+)`/g, '<code style="background:#e5e7eb;padding:2px 5px;border-radius:3px">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#2563eb">$1</a>')
      .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #9ca3af;padding-left:10px;color:#6b7280">$1</blockquote>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul style="list-style:disc;padding-left:1.5rem">${m}</ul>`)
      .replace(/\n/g, '<br/>');
    return html;
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 relative">
      {/* ── Toolbar ─────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex items-center flex-wrap gap-0.5 px-3 py-2 border-b-2 overflow-x-auto',
          isDark ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-gray-50',
        )}
      >
        {editorMode === 'rich' && (
          <>
            {/* Undo / Redo */}
            <TBtn onClick={() => exec('undo')} title="Undo" isDark={isDark}><Undo className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('redo')} title="Redo" isDark={isDark}><Redo className="w-3.5 h-3.5" /></TBtn>
            <Sep isDark={isDark} />

            {/* Heading dropdown */}
            <div className="relative">
              <button
                onClick={() => { saveSelection(); setShowHeading(s => !s); }}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors select-none',
                  isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700',
                )}
              >
                <Type className="w-3.5 h-3.5" /> <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showHeading && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={cn('absolute top-full left-0 z-50 rounded-lg border shadow-lg overflow-hidden mt-1 w-40', isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200')}
                  >
                    {HEADING_OPTIONS.map(h => (
                      <button
                        key={h.value}
                        onClick={() => { restoreSelection(); exec('formatBlock', h.tag); setShowHeading(false); }}
                        className={cn('w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700', isDark ? 'text-gray-200' : 'text-gray-700')}
                        style={{ fontSize: h.value === 'h1' ? '1.2em' : h.value === 'h2' ? '1.1em' : h.value === 'h3' ? '1em' : '0.9em' }}
                      >
                        {h.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Font family */}
            <div className="relative">
              <button
                onClick={() => { saveSelection(); setShowFontFamily(s => !s); }}
                className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors select-none', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700')}
              >
                Font <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showFontFamily && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={cn('absolute top-full left-0 z-50 rounded-lg border shadow-lg overflow-hidden mt-1 w-44', isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200')}
                  >
                    {FONT_FAMILIES.map(f => (
                      <button
                        key={f}
                        onClick={() => { restoreSelection(); exec('fontName', f === 'Default' ? 'inherit' : f); setShowFontFamily(false); }}
                        className={cn('w-full text-left px-3 py-1.5 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700', isDark ? 'text-gray-200' : 'text-gray-700')}
                        style={{ fontFamily: f === 'Default' ? 'inherit' : f }}
                      >
                        {f}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Font size */}
            <div className="relative">
              <button
                onClick={() => { saveSelection(); setShowFontSize(s => !s); }}
                className={cn('flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors select-none', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700')}
              >
                Size <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showFontSize && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className={cn('absolute top-full left-0 z-50 rounded-lg border shadow-lg overflow-hidden mt-1 w-24 max-h-52 overflow-y-auto', isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200')}
                  >
                    {FONT_SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => { restoreSelection(); exec('fontSize', '7'); setShowFontSize(false); }}
                        className={cn('w-full text-left px-3 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700', isDark ? 'text-gray-200' : 'text-gray-700')}
                      >
                        {s}px
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Sep isDark={isDark} />

            {/* Text formatting */}
            <TBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)" isDark={isDark}><Bold className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)" isDark={isDark}><Italic className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)" isDark={isDark}><Underline className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('strikeThrough')} title="Strikethrough" isDark={isDark}><Strikethrough className="w-3.5 h-3.5" /></TBtn>

            <Sep isDark={isDark} />

            {/* Text color */}
            <div className="relative">
              <button
                onClick={() => { saveSelection(); setShowTextColor(s => !s); setShowBgColor(false); }}
                title="Text Color"
                className={cn('p-1.5 rounded cursor-pointer transition-colors select-none', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600')}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="font-bold text-xs leading-none">A</span>
                  <div className="w-3.5 h-1 rounded-sm bg-red-500" />
                </div>
              </button>
              <AnimatePresence>
                {showTextColor && (
                  <ColorPicker isDark={isDark} title="Text Color" onSelect={c => exec('foreColor', c)} onClose={() => setShowTextColor(false)} />
                )}
              </AnimatePresence>
            </div>

            {/* BG color */}
            <div className="relative">
              <button
                onClick={() => { saveSelection(); setShowBgColor(s => !s); setShowTextColor(false); }}
                title="Highlight Color"
                className={cn('p-1.5 rounded cursor-pointer transition-colors select-none', isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600')}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-bold leading-none">A</span>
                  <div className="w-3.5 h-1 rounded-sm bg-yellow-400" />
                </div>
              </button>
              <AnimatePresence>
                {showBgColor && (
                  <ColorPicker isDark={isDark} title="Highlight" onSelect={c => exec('hiliteColor', c)} onClose={() => setShowBgColor(false)} />
                )}
              </AnimatePresence>
            </div>

            <Sep isDark={isDark} />

            {/* Alignment */}
            <TBtn onClick={() => exec('justifyLeft')} title="Align Left" isDark={isDark}><AlignLeft className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyCenter')} title="Center" isDark={isDark}><AlignCenter className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyRight')} title="Align Right" isDark={isDark}><AlignRight className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('justifyFull')} title="Justify" isDark={isDark}><AlignJustify className="w-3.5 h-3.5" /></TBtn>

            <Sep isDark={isDark} />

            {/* Lists */}
            <TBtn onClick={() => exec('insertUnorderedList')} title="Bullet List" isDark={isDark}><List className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('insertOrderedList')} title="Numbered List" isDark={isDark}><ListOrdered className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('outdent')} title="Outdent" isDark={isDark}><Outdent className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('indent')} title="Indent" isDark={isDark}><Indent className="w-3.5 h-3.5" /></TBtn>

            <Sep isDark={isDark} />

            {/* Block elements */}
            <TBtn onClick={() => exec('formatBlock', 'blockquote')} title="Blockquote" isDark={isDark}><Quote className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('formatBlock', 'pre')} title="Code block" isDark={isDark}><Code className="w-3.5 h-3.5" /></TBtn>
            <TBtn onClick={() => exec('insertHorizontalRule')} title="Horizontal rule" isDark={isDark}><Minus className="w-3.5 h-3.5" /></TBtn>

            <Sep isDark={isDark} />

            {/* Table */}
            <TBtn
              onClick={() => {
                const table = `<table border="1" style="border-collapse:collapse;width:100%"><tr><th style="padding:4px 8px;border:1px solid #ddd">Col 1</th><th style="padding:4px 8px;border:1px solid #ddd">Col 2</th><th style="padding:4px 8px;border:1px solid #ddd">Col 3</th></tr><tr><td style="padding:4px 8px;border:1px solid #ddd">&nbsp;</td><td style="padding:4px 8px;border:1px solid #ddd">&nbsp;</td><td style="padding:4px 8px;border:1px solid #ddd">&nbsp;</td></tr></table><p><br/></p>`;
                restoreSelection();
                exec('insertHTML', table);
              }}
              title="Insert table"
              isDark={isDark}
            >
              <Table className="w-3.5 h-3.5" />
            </TBtn>
          </>
        )}

        {editorMode === 'markdown' && mdToolbar.map(t => (
          <TBtn 
            key={t.title} 
            onClick={() => insertMarkdown(t.syntax, t.wrap)} 
            title={t.title} 
            isDark={isDark}
          >
            {t.icon}
          </TBtn>
        ))}

        {/* Link (both modes) */}
        {editorMode !== 'preview' && (
          <>
            <TBtn
              onClick={() => { saveSelection(); setShowLinkDialog(true); }}
              title="Insert link"
              isDark={isDark}
            >
              <Link className="w-3.5 h-3.5" />
            </TBtn>

            {/* Image */}
            <TBtn
              onClick={() => {
                if (editorMode === 'rich') {
                  const url = window.prompt('Image URL:');
                  if (url) exec('insertImage', url);
                } else if (onAttachFile) {
                  onAttachFile();
                }
              }}
              title="Insert image / attach"
              isDark={isDark}
            >
              <Image className="w-3.5 h-3.5" />
            </TBtn>

            {/* Emoji */}
            <div className="relative">
              <TBtn
                onClick={() => { saveSelection(); setShowEmojiPicker(s => !s); }}
                title="Insert emoji"
                isDark={isDark}
              >
                <Smile className="w-3.5 h-3.5" />
              </TBtn>

              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className={cn(
                      'absolute top-full right-0 z-50 rounded-xl border-2 shadow-2xl overflow-hidden mt-1',
                      isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200',
                    )}
                    style={{ width: 320 }}
                  >
                    {/* Category tabs */}
                    <div className={cn('flex border-b overflow-x-auto', isDark ? 'border-gray-700' : 'border-gray-100')}>
                      {EMOJI_CATEGORIES.map((cat, i) => (
                        <button
                          key={cat.name}
                          onClick={() => setActiveEmojiCat(i)}
                          className={cn(
                            'px-3 py-2 text-xs whitespace-nowrap cursor-pointer transition-colors',
                            activeEmojiCat === i
                              ? isDark ? 'bg-blue-600/20 text-blue-300 border-b-2 border-blue-500' : 'bg-blue-50 text-blue-600 border-b-2 border-blue-500'
                              : isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100',
                          )}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>

                    {/* Emojis grid */}
                    <div className="p-2 grid grid-cols-10 gap-0.5 max-h-48 overflow-y-auto">
                      {EMOJI_CATEGORIES[activeEmojiCat].emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => insertEmoji(emoji)}
                          className={cn(
                            'text-lg p-1 rounded cursor-pointer transition-transform hover:scale-125 hover:bg-gray-100 dark:hover:bg-gray-700',
                          )}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}

        {/* Mode selector */}
        <div className="ml-auto">
          <select
            value={editorMode}
            onChange={e => onEditorModeChange(e.target.value as EditorMode)}
            className={cn(
              'px-2 py-1 rounded-lg text-xs border cursor-pointer outline-none',
              isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900',
            )}
          >
            <option value="rich">Rich Text</option>
            <option value="plain">Plain Text</option>
            <option value="markdown">Markdown</option>
            <option value="preview">Preview</option>
          </select>
        </div>
      </div>

      {/* ── Editor body ─────────────────────────────────────────── */}
      <div
        className={cn(
          'relative flex-1 overflow-y-auto',
          dragActive && 'ring-2 ring-blue-500 ring-inset',
          validationError && 'ring-2 ring-red-400 ring-inset',
        )}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Drag overlay */}
        <AnimatePresence>
          {dragActive && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg m-2 pointer-events-none flex items-center justify-center z-10"
            >
              <div className={cn('p-4 rounded-xl text-center shadow-lg', isDark ? 'bg-gray-800' : 'bg-white')}>
                <Paperclip className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <p className="font-medium">Drop files to attach</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rich editor */}
        {editorMode === 'rich' && (
          <div
            ref={richRef}
            contentEditable
            suppressContentEditableWarning
            onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            data-placeholder="Write your message…"
            className={cn(
              'min-h-[280px] p-4 outline-none text-sm',
              'prose max-w-none',
              isDark ? 'text-white prose-invert [&[data-placeholder]:empty:before]:text-gray-500' : 'text-gray-900 [&[data-placeholder]:empty:before]:text-gray-400',
              '[&[data-placeholder]:empty:before]:content-[attr(data-placeholder)]',
            )}
            style={{ wordBreak: 'break-word' }}
          />
        )}

        {/* Plain textarea */}
        {(editorMode === 'plain' || editorMode === 'markdown') && (
          <textarea
            ref={plainRef}
            value={body}
            onChange={e => onChange(e.target.value)}
            onKeyUp={saveSelection}
            onMouseUp={saveSelection}
            placeholder="Write your message…"
            className={cn(
              'w-full min-h-[280px] p-4 bg-transparent outline-none resize-none text-sm font-mono',
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400',
            )}
          />
        )}

        {/* Preview */}
        {editorMode === 'preview' && (
          <div
            className={cn(
              'min-h-[280px] p-4 text-sm prose max-w-none',
              isDark ? 'prose-invert text-gray-200' : 'text-gray-900',
            )}
            dangerouslySetInnerHTML={{ __html: renderPreview(body) || '<em style="color:#9ca3af">Nothing to preview yet…</em>' }}
          />
        )}
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="px-4 pb-2 flex items-center gap-1.5 text-xs text-red-500">
          <span>⚠</span> {validationError}
        </div>
      )}

      {/* Dialogs */}
      <AnimatePresence>
        {showLinkDialog && (
          <LinkDialog
            isDark={isDark}
            onInsert={handleInsertLink}
            onClose={() => setShowLinkDialog(false)}
          />
        )}
      </AnimatePresence>

      {/* Click-away for dropdowns */}
      {(showTextColor || showBgColor || showFontFamily || showFontSize || showHeading || showEmojiPicker) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowTextColor(false);
            setShowBgColor(false);
            setShowFontFamily(false);
            setShowFontSize(false);
            setShowHeading(false);
            setShowEmojiPicker(false);
          }}
        />
      )}
    </div>
  );
};

export default ComposeEditor;