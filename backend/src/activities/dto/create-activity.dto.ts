export interface CreateActivityDto {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
  interestIds: string[];
  coverImage?: string;
}
