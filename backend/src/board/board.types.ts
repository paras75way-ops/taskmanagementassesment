export interface BoardInput {
  name: string;
}

export interface BoardResponse {
  _id: unknown;
  name: string;
  userId: string;
  myRole?: string;
  createdAt: Date;
  updatedAt: Date;
}
