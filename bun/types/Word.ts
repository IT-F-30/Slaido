/**
 * Word - ワードクラウドに表示する単語の型定義
 */
export interface Word {
  _id?: string;
  /** 単語テキスト */
  word: string;
  /** グループ番号（小さいほど中心に近く配置される） */
  group_number: number;
  /** 重み（オプション） */
  weight?: number;
}
