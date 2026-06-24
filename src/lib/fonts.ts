export type FontFamilyOption = 'songti' | 'fangsong' | 'heiti'

export function getFontFamilyCss(option: FontFamilyOption): string {
  switch (option) {
    case 'songti':
      return "'SimSun', '宋体', 'STSong', 'Songti SC', serif"
    case 'fangsong':
      return "'FangSong', '仿宋', 'STFangsong', 'FangSong_GB2312', serif"
    case 'heiti':
    default:
      return "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif"
  }
}
