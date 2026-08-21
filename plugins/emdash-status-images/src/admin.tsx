import { useEffect, useRef, useState } from "react";

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const INK = "#171716";
const PAPER = "#f7f5f0";
const MUTED = "#706e67";
const RULE = "#d6d1c7";
const PAGE_SIZE = 3;

const STATUS_IMAGES_CSS = `
	.status-images {
		box-sizing: border-box;
		max-width: 1180px;
		margin: 0 auto;
		padding: 12px 0 40px;
		color: ${INK};
	}

	.status-images *,
	.status-images *::before,
	.status-images *::after {
		box-sizing: border-box;
	}

	.status-images__header {
		margin-bottom: 28px;
	}

	.status-images__layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(280px, 390px);
		gap: 32px;
		align-items: start;
	}

	.status-images__section {
		margin-top: 28px;
	}

	.status-images__section-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 12px;
	}

	.status-images__pagination {
		display: flex;
		align-items: center;
		gap: 8px;
		white-space: nowrap;
	}

	.status-images__pagination button {
		min-height: 36px;
		padding: 7px 10px;
		border: 1px solid ${RULE};
		background: ${PAPER};
		color: ${INK};
		cursor: pointer;
		font: inherit;
	}

	.status-images__pagination button:disabled {
		cursor: not-allowed;
		opacity: 0.45;
	}

	.status-images__entry-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
		gap: 12px;
	}

	.status-images__entry-card {
		min-width: 0;
		appearance: none;
		cursor: pointer;
		text-align: left;
		padding: 0;
		overflow: hidden;
		border: 2px solid ${RULE};
		background: ${PAPER};
	}

	.status-images__entry-card[aria-pressed="true"] {
		border-color: ${INK};
	}

	.status-images__entry-image {
		position: relative;
		display: grid;
		place-items: center;
		height: 128px;
		overflow: hidden;
		background: #e5e1d8;
	}

	.status-images__entry-copy {
		padding: 12px;
	}

	.status-images__entry-title {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		color: ${INK};
		font-weight: 700;
		line-height: 1.35;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
	}

	.status-images__preview {
		width: min(100%, 390px);
	}

	.status-images__preview-frame {
		overflow: hidden;
		border: 1px solid ${RULE};
		background: ${PAPER};
		box-shadow: 0 12px 30px rgba(23, 23, 22, 0.12);
	}

	.status-images__preview-canvas {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 9 / 16;
	}

	.status-images__download {
		width: 100%;
		min-height: 48px;
		margin-top: 14px;
		padding: 13px 16px;
		cursor: pointer;
		border: 1px solid ${INK};
		background: ${INK};
		color: ${PAPER};
		font-weight: 700;
	}

	.status-images__download:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	@media (max-width: 760px) {
		.status-images {
			padding: 4px 16px 32px;
		}

		.status-images__header {
			margin-bottom: 24px;
		}

		.status-images__header h1 {
			font-size: clamp(26px, 8vw, 32px) !important;
			line-height: 1.08;
		}

		.status-images__layout {
			grid-template-columns: minmax(0, 1fr);
			gap: 28px;
		}

		.status-images__preview {
			width: min(100%, 340px);
			margin: 0 auto;
		}

		.status-images__section-header {
			align-items: flex-start;
			flex-direction: column;
			gap: 8px;
		}

		.status-images__pagination {
			width: 100%;
			justify-content: space-between;
		}

		.status-images__pagination button {
			min-height: 44px;
			padding: 10px 14px;
		}

		.status-images__entry-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 10px;
		}

		.status-images__entry-image {
			height: 104px;
		}

		.status-images__entry-copy {
			padding: 10px;
		}

		.status-images__search {
			font-size: 16px;
		}
	}

	@media (max-width: 360px) {
		.status-images {
			padding-inline: 12px;
		}

		.status-images__entry-grid {
			grid-template-columns: minmax(0, 1fr);
		}

		.status-images__entry-image {
			height: 132px;
		}
	}
`;

type StatusImageEntry = {
  id: string;
  collection: "projects" | "posts";
  slug: string | null;
  status: string;
  title: string;
  summary: string;
  body: string;
  featuredImage?: string;
};

type EntriesResponse = {
  entries: StatusImageEntry[];
};

type ApiResponse = {
  data: EntriesResponse;
};

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }

    if (line) {
      lines.push(line);
    }
    line = word;

    if (lines.length === maxLines) {
      break;
    }
  }

  if (line && lines.length < maxLines) {
    lines.push(line);
  }

  if (lines.length === maxLines && words.join(" ") !== lines.join(" ")) {
    const lastLine = lines.at(-1) ?? "";
    lines[lines.length - 1] = `${lastLine.replace(/[.]+$/, "")}...`;
  }

  return lines;
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("The featured image could not be loaded."));
    image.src = source;
  });
}

function drawCoverImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const sourceRatio = image.naturalWidth / image.naturalHeight;
  const targetRatio = width / height;
  const sourceWidth =
    sourceRatio > targetRatio
      ? image.naturalHeight * targetRatio
      : image.naturalWidth;
  const sourceHeight =
    sourceRatio > targetRatio
      ? image.naturalHeight
      : image.naturalWidth / targetRatio;
  const sourceX = (image.naturalWidth - sourceWidth) / 2;
  const sourceY = (image.naturalHeight - sourceHeight) / 2;

  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  );
}

function drawFooter(context: CanvasRenderingContext2D): void {
  context.fillStyle = INK;
  context.font = "600 26px Inter, Arial, sans-serif";
  context.letterSpacing = "2px";
  context.fillText("MALIN DHAMSARA", 72, STORY_HEIGHT - 84);
  context.letterSpacing = "0px";
}

function drawMetadataRule(
  context: CanvasRenderingContext2D,
  ruleY: number,
): void {
  context.strokeStyle = RULE;
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(72, ruleY);
  context.lineTo(STORY_WIDTH - 72, ruleY);
  context.stroke();
}

function drawLabel(
  context: CanvasRenderingContext2D,
  entry: StatusImageEntry,
  labelY: number,
): void {
  const label = entry.collection === "projects" ? "PROJECT" : "BLOG";
  context.fillStyle = MUTED;
  context.font = "600 28px Inter, Arial, sans-serif";
  context.letterSpacing = "5px";
  context.fillText(label, 72, labelY);
  context.letterSpacing = "0px";
}

function drawCoverStoryContent(
  context: CanvasRenderingContext2D,
  entry: StatusImageEntry,
  imageHeight: number,
): void {
  context.fillStyle = PAPER;
  context.fillRect(0, imageHeight, STORY_WIDTH, STORY_HEIGHT - imageHeight);
  drawMetadataRule(context, imageHeight + 92);
  drawLabel(context, entry, imageHeight + 154);

  context.fillStyle = INK;
  context.font = "700 76px Inter, Arial, sans-serif";
  const titleLines = wrapText(context, entry.title, STORY_WIDTH - 144, 4);
  let textY = imageHeight + 264;
  for (const line of titleLines) {
    context.fillText(line, 72, textY);
    textY += 88;
  }

  if (entry.summary) {
    context.fillStyle = MUTED;
    context.font = "italic 42px Georgia, serif";
    const summaryLines = wrapText(context, entry.summary, STORY_WIDTH - 144, 3);
    textY += 28;
    for (const line of summaryLines) {
      context.fillText(line, 72, textY);
      textY += 56;
    }
  }

  drawFooter(context);
}

function drawTextOnlyStory(
  context: CanvasRenderingContext2D,
  entry: StatusImageEntry,
): void {
  drawMetadataRule(context, 140);
  drawLabel(context, entry, 204);

  context.fillStyle = INK;
  context.font = "700 96px Inter, Arial, sans-serif";
  const titleLines = wrapText(context, entry.title, STORY_WIDTH - 144, 6);
  let textY = 392;
  for (const line of titleLines) {
    context.fillText(line, 72, textY);
    textY += 112;
  }

  if (entry.body || entry.summary) {
    context.fillStyle = MUTED;
    context.font = "italic 48px Georgia, serif";
    const bodyText = entry.body || entry.summary;
    const summaryLines = wrapText(context, bodyText, STORY_WIDTH - 144, 12);
    textY += 72;
    for (const line of summaryLines) {
      context.fillText(line, 72, textY);
      textY += 68;
    }
  }

  drawFooter(context);
}

async function drawStory(
  canvas: HTMLCanvasElement,
  entry: StatusImageEntry,
): Promise<void> {
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  context.fillStyle = PAPER;
  context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const imageHeight = 1120;
  if (!entry.featuredImage) {
    drawTextOnlyStory(context, entry);
    return;
  }

  try {
    const image = await loadImage(entry.featuredImage);
    drawCoverImage(context, image, STORY_WIDTH, imageHeight);
  } catch {
    drawTextOnlyStory(context, entry);
    return;
  }

  const overlay = context.createLinearGradient(
    0,
    imageHeight - 250,
    0,
    imageHeight,
  );
  overlay.addColorStop(0, "rgba(23, 23, 22, 0)");
  overlay.addColorStop(1, "rgba(23, 23, 22, 0.34)");
  context.fillStyle = overlay;
  context.fillRect(0, imageHeight - 250, STORY_WIDTH, 250);
  drawCoverStoryContent(context, entry, imageHeight);
}

type EntrySectionProps = {
  title: string;
  entries: StatusImageEntry[];
  selected?: StatusImageEntry;
  onSelect: (entry: StatusImageEntry) => void;
};

function EntrySection({
  title,
  entries,
  selected,
  onSelect,
}: EntrySectionProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleEntries = entries.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE,
  );

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(pageCount - 1);
    }
  }, [page, pageCount]);

  return (
    <section className="status-images__section">
      <div className="status-images__section-header">
        <h3 style={{ color: INK, fontSize: 16, margin: 0 }}>
          {title}{" "}
          <span style={{ color: MUTED, fontWeight: 400 }}>
            ({entries.length})
          </span>
        </h3>
        {entries.length > PAGE_SIZE && (
          <div className="status-images__pagination">
            <button
              type="button"
              onClick={() => setPage((value) => Math.max(0, value - 1))}
              disabled={currentPage === 0}
              aria-label={`Previous ${title} page`}
            >
              Previous
            </button>
            <span style={{ color: MUTED, fontSize: 12 }}>
              {currentPage + 1} / {pageCount}
            </span>
            <button
              type="button"
              onClick={() =>
                setPage((value) => Math.min(pageCount - 1, value + 1))
              }
              disabled={currentPage === pageCount - 1}
              aria-label={`Next ${title} page`}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {entries.length === 0 ? (
        <p style={{ color: MUTED, margin: 0 }}>
          No matching {title.toLowerCase()}.
        </p>
      ) : (
        <div className="status-images__entry-grid">
          {visibleEntries.map((entry) => {
            const isSelected =
              selected?.id === entry.id &&
              selected.collection === entry.collection;
            return (
              <button
                key={`${entry.collection}-${entry.id}`}
                type="button"
                onClick={() => onSelect(entry)}
                aria-pressed={isSelected}
                className="status-images__entry-card"
              >
                <div className="status-images__entry-image">
                  {entry.featuredImage ? (
                    <img
                      src={entry.featuredImage}
                      alt=""
                      onError={(event) => event.currentTarget.remove()}
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "block",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}
                    >
                      NO FEATURED IMAGE
                    </span>
                  )}
                </div>
                <div className="status-images__entry-copy">
                  <p
                    style={{
                      margin: "0 0 6px",
                      color: MUTED,
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {entry.status.toUpperCase()}
                  </p>
                  <p className="status-images__entry-title">{entry.title}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function StatusImagesPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [entries, setEntries] = useState<StatusImageEntry[]>([]);
  const [selected, setSelected] = useState<StatusImageEntry>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [downloading, setDownloading] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/_emdash/api/plugins/portfolio-status-images/entries", {
      credentials: "same-origin",
      headers: {
        "X-EmDash-Request": "1",
      },
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Content request failed with ${response.status}.`);
        }

        return (await response.json()) as ApiResponse;
      })
      .then(({ data: { entries: loadedEntries } }) => {
        if (!active) return;
        setEntries(loadedEntries);
        setSelected(loadedEntries[0]);
      })
      .catch(() => {
        if (active) {
          setError(
            "The content list could not be loaded. Refresh and try again.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !selected) {
      return;
    }

    void drawStory(canvasRef.current, selected);
  }, [selected]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected) {
      return;
    }

    setDownloading(true);
    canvas.toBlob(
      (blob: Blob | null) => {
        if (!blob) {
          setDownloading(false);
          setError(
            "The image could not be generated. Try another featured image.",
          );
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${selected.collection}-${selected.slug ?? selected.id}-status.jpg`;
        anchor.click();
        URL.revokeObjectURL(url);
        setDownloading(false);
      },
      "image/jpeg",
      0.92,
    );
  };

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visibleEntries = normalizedSearch
    ? entries.filter((entry) =>
        `${entry.title} ${entry.summary}`
          .toLocaleLowerCase()
          .includes(normalizedSearch),
      )
    : entries;
  const projects = visibleEntries.filter(
    (entry) => entry.collection === "projects",
  );
  const posts = visibleEntries.filter((entry) => entry.collection === "posts");

  return (
    <section className="status-images">
      <style>{STATUS_IMAGES_CSS}</style>
      <header className="status-images__header">
        <p
          style={{
            margin: "0 0 8px",
            color: MUTED,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
          }}
        >
          SOCIAL IMAGE STUDIO
        </p>
        <h1 style={{ margin: 0, color: INK, fontSize: 32 }}>
          Status image generator
        </h1>
        <p style={{ color: MUTED, maxWidth: 640 }}>
          Create a 1080 × 1920 image for Instagram Stories, Facebook Stories,
          and WhatsApp Status. A featured image is used as the cover when
          available; otherwise, the entry’s text fills the portrait.
        </p>
      </header>

      {error && (
        <p
          role="alert"
          style={{
            marginBottom: 20,
            padding: 14,
            border: `1px solid ${RULE}`,
            color: INK,
            background: PAPER,
          }}
        >
          {error}
        </p>
      )}

      <div className="status-images__layout">
        <div>
          <h2 style={{ color: INK, fontSize: 16, margin: "0 0 14px" }}>
            Choose content
          </h2>
          <label
            style={{
              display: "block",
              color: MUTED,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            SEARCH PROJECTS & BLOG POSTS
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by title or summary"
              className="status-images__search"
              style={{
                boxSizing: "border-box",
                display: "block",
                width: "100%",
                marginTop: 8,
                padding: "11px 12px",
                border: `1px solid ${RULE}`,
                background: PAPER,
                color: INK,
              }}
            />
          </label>
          {loading ? (
            <p style={{ color: MUTED }}>Loading content…</p>
          ) : entries.length === 0 ? (
            <p style={{ color: MUTED }}>
              No projects or posts are available yet.
            </p>
          ) : (
            <>
              <EntrySection
                title="Projects"
                entries={projects}
                selected={selected}
                onSelect={setSelected}
              />
              <EntrySection
                title="Blog posts"
                entries={posts}
                selected={selected}
                onSelect={setSelected}
              />
            </>
          )}
        </div>

        <aside className="status-images__preview">
          <h2 style={{ color: INK, fontSize: 16, margin: "0 0 14px" }}>
            Preview
          </h2>
          <div className="status-images__preview-frame">
            <canvas
              ref={canvasRef}
              aria-label="Generated 9 by 16 social status image preview"
              className="status-images__preview-canvas"
            />
          </div>
          <button
            type="button"
            onClick={download}
            disabled={!selected || downloading}
            className="status-images__download"
          >
            {downloading ? "Preparing download…" : "Download 1080 × 1920 JPEG"}
          </button>
          <p style={{ color: MUTED, fontSize: 12, lineHeight: 1.5 }}>
            The file downloads through your browser to its configured Downloads
            location.
          </p>
        </aside>
      </div>
    </section>
  );
}

export const pages = {
  "/status-images": StatusImagesPage,
};
