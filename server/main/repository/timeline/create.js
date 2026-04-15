import { db } from "../client.js";

const insertTimelineItem = ({
  sourceApp,
  sourceRef = null,
  kind = "event",
  title = null,
  content,
  metadata = null
}) => {
  const trimmedContent = String(content || "").trim();
  const normalizedSource = String(sourceApp || "").trim();
  if (!normalizedSource) throw new Error("sourceApp is required");
  if (!trimmedContent) throw new Error("content is required");

  const serializedMetadata =
    metadata == null ? null : typeof metadata === "string" ? metadata : JSON.stringify(metadata);

  const row = db
    .prepare(
      `INSERT INTO timeline (source_app, source_ref, kind, title, content, metadata)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`
    )
    .get(
      normalizedSource,
      sourceRef == null ? null : String(sourceRef),
      String(kind || "event"),
      title == null ? null : String(title),
      trimmedContent,
      serializedMetadata
    );
  return { id: row.id };
};

export { insertTimelineItem };
