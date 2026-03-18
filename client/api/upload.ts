import { authFetch } from "@/api/fetchJSON";

async function uploadPdf(file: File): Promise<{
    storage_path: string;
    sha256?: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);

    const res = await authFetch("/vendors/bills/upload-pdf", {
      method: "POST",
      body: formData,
    });
  
    if (!res.ok) {
      throw new Error("Failed to upload file");
    }
  
    const data = await res.json();
  
    return {
      storage_path: data.pdf_object_key,
      sha256: data.sha256_pdf,
    };
  }

export { uploadPdf };