import { Badge, Modal } from "./ui/primitives";
import type { FileRecord } from "../../shared/types";
import { fileTagTone, formatLongDate } from "../lib/utils";

export default function PdfPreviewModal({ file, onClose }: { file: FileRecord | null; onClose: () => void }) {
  return (
    <Modal open={Boolean(file)} onClose={onClose} title={file?.name ?? ""} width="max-w-3xl">
      {file && (
        <>
          <div className="mb-3 flex items-center gap-2 text-xs text-slate">
            <Badge tone={fileTagTone(file.tag)}>{file.tag}</Badge>
            <span>{file.sizeLabel}</span>
            <span>·</span>
            <span>Added {formatLongDate(file.addedDate)}</span>
          </div>
          {file.type === "pdf" && file.previewUrl ? (
            <iframe
              src={file.previewUrl}
              title={file.name}
              className="h-[70vh] w-full rounded-lg border border-line"
            />
          ) : (
            <div className="grid h-64 place-items-center rounded-lg border border-dashed border-line text-sm text-muted">
              Preview not available for this file type in this demo.
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
