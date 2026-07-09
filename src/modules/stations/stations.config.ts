// Danh sách station tĩnh: Deep Focus, Chill Shop, Lofi Sáng...
export interface StationDefinition {
  slug: string;
  name: string;
  description: string;
  moods: string[];
}

// Danh sách station tĩnh — thêm station mới chỉ cần thêm 1 object vào đây, không cần
// migration hay UI quản trị. moods phải khớp với mood thật có trong dữ liệu Jamendo đã ingest
// (xem ingestion/providers/jamendo.provider.ts để biết danh sách tag đang được đồng bộ).
export const STATIONS: StationDefinition[] = [
  {
    slug: "deep-focus",
    name: "Deep Focus",
    description:
      "Nhạc không lời, tối giản — tập trung làm việc sâu, ít xao nhãng.",
    moods: ["focus", "instrumental", "ambient"],
  },
  {
    slug: "chill-shop",
    name: "Chill Shop",
    description:
      "Nhạc nền dịu nhẹ, hợp làm nhạc nền cho cửa hàng, quán cà phê.",
    moods: ["chill", "lounge"],
  },
  {
    slug: "lofi-sang",
    name: "Lofi Sáng",
    description: "Lofi nhẹ nhàng, khởi động một ngày làm việc thư thái.",
    moods: ["lofi"],
  },
  {
    slug: "upbeat-nang-luong",
    name: "Upbeat Năng Lượng",
    description:
      "Nhịp độ nhanh, tươi sáng — hợp buổi chiều cần giữ năng lượng.",
    moods: ["upbeat", "energetic"],
  },
];

export function findStationBySlug(slug: string): StationDefinition | undefined {
  return STATIONS.find((s) => s.slug === slug);
}
