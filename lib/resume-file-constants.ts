export const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const SUPPORTED_RESUME_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "png",
  "jpg",
  "jpeg",
] as const;

export type SupportedResumeExtension =
  (typeof SUPPORTED_RESUME_EXTENSIONS)[number];

export const ACCEPTED_RESUME_TYPES =
  ".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg";

export const ACCEPTED_RESUME_LABEL =
  "PDF、Word、图片（PNG/JPG），含扫描版 PDF（最大 5MB）";

export function getResumeFileExtension(filename: string): string {
  return filename.toLowerCase().split(".").pop() ?? "";
}

export function isSupportedResumeFile(filename: string): boolean {
  return SUPPORTED_RESUME_EXTENSIONS.includes(
    getResumeFileExtension(filename) as SupportedResumeExtension,
  );
}

export function isImageResumeFile(filename: string): boolean {
  return ["png", "jpg", "jpeg"].includes(getResumeFileExtension(filename));
}

export function validateResumeFileMeta(file: { name: string; size: number }) {
  if (!isSupportedResumeFile(file.name)) {
    throw new Error("不支持的文件格式，请上传 PDF、Word 或图片（PNG/JPG）");
  }

  if (file.size > MAX_RESUME_FILE_SIZE) {
    throw new Error("文件大小不能超过 5MB");
  }

  if (file.size === 0) {
    throw new Error("文件为空，请重新选择");
  }
}
