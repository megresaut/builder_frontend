export function getInitials(name?: string | null, fallback?: string): string {
    const source = name?.trim() || fallback?.trim();
    if (!source) return "";
  
    // If it looks like an email, fallback to first 2 chars
    if (source.includes("@")) {
      return source.slice(0, 2).toUpperCase();
    }
  
    const parts = source.split(/\s+/).filter(Boolean);
  
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  
    return (
      parts[0][0] + parts[1][0]
    ).toUpperCase();
  }
  