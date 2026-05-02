"use client";

import { type Editor } from "@tiptap/react";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  FileCode,
  CheckSquare,
  PilcrowRight,
  PilcrowLeft,
  Underline as UnderlineIcon,
  Baseline,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Superscript as SuperIcon,
  Subscript as SubIcon,
  Link as LinkIcon,
  ImageIcon,
  Video as VideoIcon,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Type,
  MoreHorizontal,
  Check,
} from "lucide-react";
import { useEditorStore } from "@/stores/editor-store";
import { useCallback, useEffect, useRef, useState } from "react";
import { ColorPalette } from "./color-palette";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "./extensions/color-highlight";
import { MediaPopover, type MediaKind } from "./media-popover";
import { EmbedPopover } from "./embed-popover";
import { LinkPopover } from "./link-popover";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

type PopoverKind =
  | null
  | { type: "color"; anchor: { top: number; left: number }; range: { from: number; to: number } }
  | { type: "highlight"; anchor: { top: number; left: number }; range: { from: number; to: number } }
  | { type: "link"; anchor: { top: number; left: number }; range: { from: number; to: number }; existing: string }
  | { type: "media"; kind: MediaKind; anchor: { top: number; left: number } }
  | { type: "embed"; anchor: { top: number; left: number } };

interface ToolButtonProps {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  onAction: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

/**
 * Plain toolbar button that preserves the editor selection via mousedown
 * preventDefault, then invokes the action on click.
 */
function ToolButton({ label, icon: Icon, active, disabled, style, onAction }: ToolButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      style={style}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
      onClick={(e) => {
        e.preventDefault();
        onAction(e);
      }}
      className={cn(
        "h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-foreground/80 hover:bg-accent transition-colors disabled:opacity-40",
        active && "bg-accent text-foreground ring-1 ring-inset ring-foreground/15"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const frontmatter = useEditorStore((s) => s.frontmatter);
  const updateFrontmatter = useEditorStore((s) => s.updateFrontmatter);
  const pagePath = useEditorStore((s) => s.currentPath);
  const isRtl = frontmatter?.dir === "rtl";

  const [popover, setPopover] = useState<PopoverKind>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Force re-render on selection/transaction changes so isActive() reflects the
  // current cursor position (the editor object reference is stable so React
  // won't re-render automatically when the internal state changes).
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!editor) return;
    const bump = () => setTick((t) => t + 1);
    editor.on("selectionUpdate", bump);
    editor.on("transaction", bump);
    return () => {
      editor.off("selectionUpdate", bump);
      editor.off("transaction", bump);
    };
  }, [editor]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    if (!editor) return;
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(updateScrollState);
    const onResize = () => updateScrollState();
    window.addEventListener("resize", onResize);
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [editor, updateScrollState]);

  // Translate vertical wheel to horizontal scroll
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only intercept vertical deltas; respect native horizontal wheel devices
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
    }
  };

  const scrollBy = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(160, el.clientWidth * 0.6), behavior: "smooth" });
  };

  if (!editor) return null;

  const currentColor = editor.getAttributes("textStyle")?.color ?? null;
  const currentHighlight = editor.getAttributes("highlight")?.color ?? null;

  const captureRange = () => {
    const { from, to } = editor.state.selection;
    return { from, to };
  };

  const applyToRange = (range: { from: number; to: number }, run: () => void) => {
    editor.chain().focus().setTextSelection(range).run();
    run();
  };

  const openPopoverFromButton = (
    e: React.MouseEvent<HTMLElement>,
    build: (anchor: { top: number; left: number }, range: { from: number; to: number }) => PopoverKind
  ) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const anchor = { top: btn.bottom + 6, left: btn.left };
    const range = captureRange();
    setPopover(build(anchor, range));
  };

  const toggleLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    const existing = editor.getAttributes("link")?.href ?? "";
    openPopoverFromButton(e, (anchor, range) => ({
      type: "link",
      anchor,
      range,
      existing,
    }));
  };

  const applyColor = (v: string | null) => {
    if (popover?.type !== "color") return;
    applyToRange(popover.range, () => {
      if (v == null) editor.chain().focus().unsetColor().run();
      else editor.chain().focus().setColor(v).run();
    });
    setPopover(null);
  };

  const applyHighlight = (v: string | null) => {
    if (popover?.type !== "highlight") return;
    applyToRange(popover.range, () => {
      if (v == null) editor.chain().focus().unsetHighlight().run();
      else editor.chain().focus().setHighlight({ color: v }).run();
    });
    setPopover(null);
  };

  const applyLink = (url: string) => {
    if (popover?.type !== "link") return;
    applyToRange(popover.range, () => {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    });
    setPopover(null);
  };

  const removeLink = () => {
    if (popover?.type !== "link") return;
    applyToRange(popover.range, () => {
      editor.chain().focus().unsetLink().run();
    });
    setPopover(null);
  };

  const insertMedia = (
    kind: MediaKind,
    payload: { url: string; alt?: string; mimeType?: string }
  ) => {
    const { url, alt, mimeType } = payload;
    const type = mimeType ?? "";
    const isImage = kind === "image" || type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(url);
    const isVideo = kind === "video" || type.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(url);
    if (isImage) {
      editor.chain().focus().setImage({ src: url, alt: alt ?? "" }).run();
    } else if (isVideo) {
      editor.chain().focus().insertContent({
        type: "embed",
        attrs: { provider: "video", src: url, originalUrl: url },
      }).run();
    } else {
      editor.chain().focus().insertContent(`<a href="${url}">${alt ?? url}</a>`).run();
    }
    setPopover(null);
  };

  const insertEmbed = (url: string) => {
    editor.commands.setEmbed({ url });
    setPopover(null);
  };

  type ButtonSpec =
    | { separator: true }
    | {
        icon: React.ComponentType<{ className?: string }>;
        action: (e: React.MouseEvent<HTMLButtonElement>) => void;
        isActive: boolean;
        label: string;
        style?: React.CSSProperties;
      };

  // Audit #012: this row used to render ~30 icon buttons in one scroll.
  // Headings collapsed into a single "Aa ▾" dropdown; alignment, sup/sub,
  // divider, embed, video, and RTL moved behind a "More ▾" overflow at the
  // tail. The visible row is now ~13 buttons — scannable. Inline marks (B I
  // U S, link, code, color, highlight) also surface via the BubbleMenu on
  // selection, so the persistent toolbar is mostly block-level + media.

  // Primary items — always visible in the toolbar
  const primaryItems: ButtonSpec[] = [
    { icon: Bold, action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive("bold"), label: "Bold" },
    { icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive("italic"), label: "Italic" },
    { icon: UnderlineIcon, action: () => editor.chain().focus().toggleUnderline().run(), isActive: editor.isActive("underline"), label: "Underline" },
    { icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), isActive: editor.isActive("strike"), label: "Strikethrough" },
    { icon: Code, action: () => editor.chain().focus().toggleCode().run(), isActive: editor.isActive("code"), label: "Inline code" },
    { icon: LinkIcon, action: toggleLink, isActive: editor.isActive("link"), label: "Link" },
    {
      icon: Baseline,
      action: (e) =>
        openPopoverFromButton(e, (anchor, range) => ({ type: "color", anchor, range })),
      isActive: currentColor != null,
      label: "Text color",
      style: currentColor ? { color: currentColor } : undefined,
    },
    {
      icon: Highlighter,
      action: (e) =>
        openPopoverFromButton(e, (anchor, range) => ({ type: "highlight", anchor, range })),
      isActive: currentHighlight != null || editor.isActive("highlight"),
      label: "Highlight",
      style: currentHighlight ? { backgroundColor: currentHighlight } : undefined,
    },
    { separator: true },
    { icon: List, action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive("bulletList"), label: "Bullet list" },
    { icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), isActive: editor.isActive("orderedList"), label: "Ordered list" },
    { icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive("blockquote"), label: "Blockquote" },
    { icon: CheckSquare, action: () => editor.chain().focus().toggleTaskList().run(), isActive: editor.isActive("taskList"), label: "Checklist" },
    { icon: FileCode, action: () => editor.chain().focus().toggleCodeBlock().run(), isActive: editor.isActive("codeBlock"), label: "Code block" },
    { separator: true },
    {
      icon: ImageIcon,
      action: (e) => openPopoverFromButton(e, (anchor) => ({ type: "media", kind: "image", anchor })),
      isActive: false,
      label: "Insert image",
    },
    { separator: true },
    { icon: Undo, action: () => editor.chain().focus().undo().run(), isActive: false, label: "Undo" },
    { icon: Redo, action: () => editor.chain().focus().redo().run(), isActive: false, label: "Redo" },
  ];

  type HeadingLevel = 1 | 2 | 3;
  const HEADING_OPTIONS: Array<{
    level: HeadingLevel | null;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { level: null, label: "Body", icon: Type },
    { level: 1, label: "Heading 1", icon: Heading1 },
    { level: 2, label: "Heading 2", icon: Heading2 },
    { level: 3, label: "Heading 3", icon: Heading3 },
  ];
  const activeHeading: HeadingLevel | null =
    editor.isActive("heading", { level: 1 })
      ? 1
      : editor.isActive("heading", { level: 2 })
      ? 2
      : editor.isActive("heading", { level: 3 })
      ? 3
      : null;
  const activeHeadingOption =
    HEADING_OPTIONS.find((opt) => opt.level === activeHeading) ??
    HEADING_OPTIONS[0];
  const setHeading = (level: HeadingLevel | null) => {
    if (level == null) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor.chain().focus().toggleHeading({ level }).run();
    }
  };

  // Overflow ("More") items — kept off the persistent row to cut visual noise
  type OverflowItem = {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    isActive: boolean;
    action: (e: React.MouseEvent) => void;
  };
  const overflowItems: OverflowItem[] = [
    {
      icon: VideoIcon,
      label: "Insert video",
      isActive: false,
      action: (e) => openPopoverFromButton(e as React.MouseEvent<HTMLElement>, (anchor) => ({ type: "media", kind: "video", anchor })),
    },
    {
      icon: Sparkles,
      label: "Embed",
      isActive: false,
      action: (e) => openPopoverFromButton(e as React.MouseEvent<HTMLElement>, (anchor) => ({ type: "embed", anchor })),
    },
    {
      icon: Minus,
      label: "Divider",
      isActive: false,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      icon: AlignLeft,
      label: "Align left",
      isActive: editor.isActive({ textAlign: "left" }),
      action: () => editor.chain().focus().setTextAlign("left").run(),
    },
    {
      icon: AlignCenter,
      label: "Align center",
      isActive: editor.isActive({ textAlign: "center" }),
      action: () => editor.chain().focus().setTextAlign("center").run(),
    },
    {
      icon: AlignRight,
      label: "Align right",
      isActive: editor.isActive({ textAlign: "right" }),
      action: () => editor.chain().focus().setTextAlign("right").run(),
    },
    {
      icon: AlignJustify,
      label: "Justify",
      isActive: editor.isActive({ textAlign: "justify" }),
      action: () => editor.chain().focus().setTextAlign("justify").run(),
    },
    {
      icon: SuperIcon,
      label: "Superscript",
      isActive: editor.isActive("superscript"),
      action: () => editor.chain().focus().toggleSuperscript().run(),
    },
    {
      icon: SubIcon,
      label: "Subscript",
      isActive: editor.isActive("subscript"),
      action: () => editor.chain().focus().toggleSubscript().run(),
    },
    {
      icon: isRtl ? PilcrowLeft : PilcrowRight,
      label: isRtl ? "Switch to LTR" : "Switch to RTL",
      isActive: isRtl,
      action: () => updateFrontmatter({ dir: isRtl ? undefined : "rtl" }),
    },
  ];

  return (
    <>
      <div className="relative border-b border-border bg-background/50">
        {/* Scroll indicator arrows */}
        {canScrollLeft && (
          <button
            type="button"
            aria-label="Scroll toolbar left"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scrollBy(-1)}
            className="absolute left-0 top-0 bottom-0 w-6 z-10 flex items-center justify-start pl-0.5 bg-gradient-to-r from-background via-background/80 to-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            type="button"
            aria-label="Scroll toolbar right"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => scrollBy(1)}
            className="absolute right-0 top-0 bottom-0 w-6 z-10 flex items-center justify-end pr-0.5 bg-gradient-to-l from-background via-background/80 to-transparent text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
        <div
          ref={scrollRef}
          onWheel={onWheel}
          className="flex items-center gap-0.5 px-2 pt-1 pb-1.5 overflow-x-scroll overflow-y-hidden editor-toolbar-scroll"
        >
          {/* Heading dropdown — collapses H1/H2/H3/Body into one trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "h-8 shrink-0 inline-flex items-center gap-1 rounded-md px-2 text-foreground/80 hover:bg-accent transition-colors data-[popup-open]:bg-accent",
                activeHeading != null && "bg-accent text-foreground ring-1 ring-inset ring-foreground/15"
              )}
              title="Text style"
              aria-label="Text style"
              onMouseDown={(e) => e.preventDefault()}
            >
              <activeHeadingOption.icon className="h-4 w-4" />
              <span className="text-xs font-medium">
                {activeHeadingOption.level == null ? "Body" : `H${activeHeadingOption.level}`}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-[180px]">
              {HEADING_OPTIONS.map((opt) => {
                const active = opt.level === activeHeading;
                return (
                  <DropdownMenuItem
                    key={String(opt.level ?? "body")}
                    onClick={() => setHeading(opt.level)}
                    className="flex items-center justify-between gap-3 py-1.5"
                  >
                    <span className="flex items-center gap-2">
                      <opt.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-[12.5px]">{opt.label}</span>
                    </span>
                    {active && <Check className="h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

          {primaryItems.map((item, i) => {
            if ("separator" in item) {
              return (
                <Separator key={i} orientation="vertical" className="mx-1 h-6 shrink-0" />
              );
            }
            return (
              <ToolButton
                key={i}
                label={item.label}
                icon={item.icon}
                active={item.isActive}
                style={item.style}
                onAction={item.action}
              />
            );
          })}

          <Separator orientation="vertical" className="mx-1 h-6 shrink-0" />

          {/* More dropdown — overflow for less-frequently-used controls */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="h-8 w-8 shrink-0 inline-flex items-center justify-center rounded-md text-foreground/80 hover:bg-accent transition-colors data-[popup-open]:bg-accent"
              title="More formatting"
              aria-label="More formatting"
              onMouseDown={(e) => e.preventDefault()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[200px]">
              {overflowItems.map((item, i) => (
                <DropdownMenuItem
                  key={i}
                  onClick={(e) => item.action(e as unknown as React.MouseEvent)}
                  className={cn(
                    "flex items-center justify-between gap-3 py-1.5",
                    item.isActive && "bg-accent/60"
                  )}
                >
                  <span className="flex items-center gap-2">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[12.5px]">{item.label}</span>
                  </span>
                  {item.isActive && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {popover && (popover.type === "color" || popover.type === "highlight") && (
        <div
          data-editor-popover="true"
          style={{ position: "fixed", top: popover.anchor.top, left: popover.anchor.left, zIndex: 60 }}
        >
          <div className="bg-popover border border-border rounded-md shadow-lg">
            {popover.type === "color" ? (
              <ColorPalette
                title="Text color"
                palette={TEXT_COLORS}
                current={currentColor}
                swatchType="text"
                onSelect={applyColor}
              />
            ) : (
              <ColorPalette
                title="Background"
                palette={HIGHLIGHT_COLORS}
                current={currentHighlight}
                swatchType="background"
                onSelect={applyHighlight}
              />
            )}
          </div>
        </div>
      )}

      {popover?.type === "link" && (
        <div
          data-editor-popover="true"
          style={{ position: "fixed", top: popover.anchor.top, left: popover.anchor.left, zIndex: 60 }}
        >
          <LinkPopover
            anchor={{ top: 0, left: 0 }}
            initialUrl={popover.existing}
            onCancel={() => setPopover(null)}
            onApply={applyLink}
            onRemove={popover.existing ? removeLink : undefined}
          />
        </div>
      )}

      {popover?.type === "media" && pagePath && (
        <div
          data-editor-popover="true"
          style={{ position: "fixed", top: popover.anchor.top, left: popover.anchor.left, zIndex: 60 }}
        >
          <MediaPopover
            kind={popover.kind}
            pagePath={pagePath}
            anchor={{ top: 0, left: 0 }}
            onCancel={() => setPopover(null)}
            onInsert={(payload) => insertMedia(popover.kind, payload)}
          />
        </div>
      )}

      {popover?.type === "embed" && (
        <div
          data-editor-popover="true"
          style={{ position: "fixed", top: popover.anchor.top, left: popover.anchor.left, zIndex: 60 }}
        >
          <EmbedPopover
            anchor={{ top: 0, left: 0 }}
            onCancel={() => setPopover(null)}
            onInsert={insertEmbed}
          />
        </div>
      )}

      {popover && <ClickOutsideClose onClose={() => setPopover(null)} />}
    </>
  );
}

function ClickOutsideClose({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    // Give the opening click a tick to settle before listening.
    const mount = window.setTimeout(() => {
      const handle = (e: MouseEvent) => {
        const target = e.target as HTMLElement | null;
        if (target?.closest('[data-editor-popover="true"]')) return;
        onClose();
      };
      window.addEventListener("mousedown", handle);
      // Return cleanup via outer closure: store it on element
      (window as unknown as { __cabinetPopClose?: () => void }).__cabinetPopClose = () =>
        window.removeEventListener("mousedown", handle);
    }, 10);
    return () => {
      window.clearTimeout(mount);
      const w = window as unknown as { __cabinetPopClose?: () => void };
      if (w.__cabinetPopClose) {
        w.__cabinetPopClose();
        w.__cabinetPopClose = undefined;
      }
    };
  }, [onClose]);
  return null;
}
