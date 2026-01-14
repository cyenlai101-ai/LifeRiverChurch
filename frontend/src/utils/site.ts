export const siteUuidByCode: Record<string, string> = {
  center: "11111111-1111-1111-1111-111111111111",
  guangfu: "22222222-2222-2222-2222-222222222222",
  second: "33333333-3333-3333-3333-333333333333",
  fuzhong: "44444444-4444-4444-4444-444444444444",
};

export const siteIdMap: Record<string, string> = {
  "11111111-1111-1111-1111-111111111111": "\u751f\u547d\u6cb3\u4e2d\u5fc3",
  "22222222-2222-2222-2222-222222222222": "\u5149\u5fa9\u6559\u6703",
  "33333333-3333-3333-3333-333333333333": "\u7b2c\u4e8c\u6559\u6703",
  "44444444-4444-4444-4444-444444444444": "\u5e9c\u4e2d\u6559\u6703",
};

export function resolveSiteName(siteId?: string | null) {
  if (!siteId) {
    return "\u672a\u6307\u5b9a\u5834\u5730";
  }
  return siteIdMap[siteId] || "\u5206\u7ad9\u6d3b\u52d5";
}
