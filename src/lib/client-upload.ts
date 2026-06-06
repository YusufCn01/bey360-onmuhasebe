export async function uploadImage(file: File, category: string) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("category", category);

  const response = await fetch("/api/panel/uploads/image", {
    method: "POST",
    body: formData,
  });

  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !result?.data?.url) {
    throw new Error(result?.error ?? "Görsel yüklenemedi.");
  }

  return result.data.url as string;
}
