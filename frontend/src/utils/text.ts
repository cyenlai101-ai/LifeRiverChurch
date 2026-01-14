export const eventStatusLabelMap: Record<string, string> = {
  Draft: "\u8349\u7a3f",
  Published: "\u5df2\u767c\u5e03",
  Closed: "\u5df2\u7d50\u675f",
};

export const roleLabelMap: Record<string, string> = {
  Admin: "\u7cfb\u7d71\u7ba1\u7406",
  CenterStaff: "\u4e2d\u5fc3\u540c\u5de5",
  BranchStaff: "\u5206\u7ad9\u540c\u5de5",
  Leader: "\u5c0f\u7d44\u9577",
  Member: "\u6703\u54e1",
};

export function publicEventStatusLabel(status: string) {
  if (status === "Published") {
    return "\u5df2\u958b\u653e\u5831\u540d";
  }
  if (status === "Closed") {
    return "\u5df2\u7d50\u675f";
  }
  return "\u5c1a\u672a\u958b\u653e";
}
