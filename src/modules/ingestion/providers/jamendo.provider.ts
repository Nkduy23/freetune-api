// Gọi Jamendo API, map license -> commercialSafe
export interface NormalizedIngestedTrack {
  sourceId: string;
  title: string;
  artist: string | null;
  genre: string | null;
  moods: string[];
  durationSec: number;
  previewUrl: string;
  downloadUrl: string;
  thumbnailUrl: string | null;
  licenseType: string;
  licenseUrl: string | null;
  commercialSafe: boolean;
  tags: string[];
}

interface JamendoTrackResponse {
  id: string;
  name: string;
  duration: number;
  artist_name?: string;
  audio: string;
  audiodownload?: string;
  image?: string;
  license_ccurl?: string;
  musicinfo?: {
    tags?: {
      genres?: string[];
      vartags?: string[];
    };
  };
}

interface JamendoApiResponse {
  headers: {
    status: string;
    code: number;
    error_message?: string;
    results_count: number;
  };
  results: JamendoTrackResponse[];
}

const JAMENDO_BASE_URL = "https://api.jamendo.com/v3.0/tracks/";

// Jamendo trả license dưới dạng URL Creative Commons (vd .../licenses/by-nc-sa/3.0/).
// "nc" trong URL = non-commercial -> commercialSafe = false. Đây là license áp dụng cho
// NGƯỜI DÙNG CUỐI khi họ tải bài về dùng riêng — độc lập với việc web mình gọi API có phí hay không.
function computeCommercialSafe(licenseCcUrl?: string): boolean {
  if (!licenseCcUrl) return false; // Không rõ license -> mặc định an toàn (không cho là commercial-safe)
  return !licenseCcUrl.toLowerCase().includes("nc");
}

function extractLicenseType(licenseCcUrl?: string): string {
  if (!licenseCcUrl) return "unknown";
  const match = licenseCcUrl.match(/licenses\/([a-z-]+)\//i);
  return match ? `CC-${match[1].toUpperCase()}` : licenseCcUrl;
}

function normalizeTrack(
  track: JamendoTrackResponse,
  sourceTag: string,
): NormalizedIngestedTrack {
  const genres = track.musicinfo?.tags?.genres ?? [];
  const vartags = track.musicinfo?.tags?.vartags ?? [];

  return {
    sourceId: track.id,
    title: track.name,
    artist: track.artist_name ?? null,
    genre: genres[0] ?? null,
    // Luôn gồm chính tag đã dùng để tìm (sourceTag) để đảm bảo track match được station
    // tương ứng, kể cả khi Jamendo không trả vartags khớp 100% tên tag mình dùng để search.
    moods: Array.from(new Set([sourceTag, ...vartags])),
    durationSec: track.duration,
    previewUrl: track.audio,
    downloadUrl: track.audiodownload || track.audio,
    thumbnailUrl: track.image ?? null,
    licenseType: extractLicenseType(track.license_ccurl),
    licenseUrl: track.license_ccurl ?? null,
    commercialSafe: computeCommercialSafe(track.license_ccurl),
    tags: Array.from(new Set([...genres, ...vartags])),
  };
}

export async function fetchJamendoTracksByTag(
  clientId: string,
  tag: string,
  limit: number,
): Promise<NormalizedIngestedTrack[]> {
  const url = new URL(JAMENDO_BASE_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("tags", tag);
  url.searchParams.set("include", "musicinfo");
  url.searchParams.set("audioformat", "mp32");
  url.searchParams.set("order", "popularity_total");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(
      `Jamendo API trả về lỗi HTTP ${response.status} cho tag "${tag}"`,
    );
  }

  const data = (await response.json()) as JamendoApiResponse;
  if (data.headers.status !== "success") {
    throw new Error(
      `Jamendo API báo lỗi cho tag "${tag}": ${data.headers.error_message ?? "unknown"}`,
    );
  }

  return data.results.map((track) => normalizeTrack(track, tag));
}
